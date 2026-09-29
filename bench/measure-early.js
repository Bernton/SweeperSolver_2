// Measures how much better early guesses could be (research tool, see ROADMAP.md).
//
// For the first early guess of each game (more than EARLY_MIN_UNKNOWN_CELLS unknown cells), the solver's choice and
// the cells with the lowest bomb probability are each played out by the current solver against the same bomb
// configurations, sampled uniformly from all configurations that fit the board (rollouts). The candidate with the most
// wins is then compared with the solver's choice on fresh samples (choosing the best of noisy estimates overstates it).
// The difference is a lower bound on what better early guesses can gain (one-step improvement of the current solver).
// A rollout that reaches a position decided by the exact endgame search stops there with that search's win chance
// (the solver plays exactly that from there): same expected value, shorter and less noisy.
//
// Usage: node bench/measure-early.js [positions=200] [firstSeed=1] [rawResultsFile]

const fs = require("fs");
const os = require("os");
const path = require("path");
const vm = require("vm");
const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");
const { mulberry32 } = require("./sandbox");

// Early game as in the loss analysis (ROADMAP.md): more unknown cells than this at the guess
const EARLY_MIN_UNKNOWN_CELLS = 60;
// Candidates per position: the solver's choice plus the cells with the lowest bomb probability
const CANDIDATE_AMOUNT = 6;
// Bomb configurations played per candidate to choose the best one, and fresh ones to compare it with the solver's choice
const SELECTION_SAMPLES = 150;
const CONFIRMATION_SAMPLES = 300;
// Positions whose digit groups have more configurations are skipped (enumeration too slow); reported as skipped
const MAX_GROUP_CONFIGURATIONS = 200000;
const DEFAULT_POSITIONS = 200;

const board = { width: 30, height: 16, bombs: 99 };
const gameConfig = { width: board.width, height: board.height, bombAmount: board.bombs };
const sweepConfig = { isVirtualMode: true, virtualGameConfig: gameConfig };
const source = fs.readFileSync(path.join(__dirname, "..", "sweeper.js"), "utf8");

function createContext() {
    let sandboxMath = Object.create(Math);
    sandboxMath.seedrandom = function (seed) {
        return mulberry32(seed);
    };
    let context = { console, performance, setTimeout, Math: sandboxMath, document: { addEventListener() {} } };
    context.window = context;
    vm.createContext(context);
    vm.runInContext(source, context);
    return context;
}

if (isMainThread) {
    main();
} else {
    runWorker();
}

async function main() {
    let positionAmount = Number(process.argv[2] || DEFAULT_POSITIONS);
    let firstSeed = Number(process.argv[3] || 1);
    let context = createContext();
    let positions = [];
    let games = 0;
    let gamesWithEarlyGuess = 0;

    for (let seed = firstSeed; positions.length < positionAmount; seed++) {
        let position = findFirstEarlyGuess(context, seed);
        games += 1;

        if (position) {
            gamesWithEarlyGuess += 1;
            positions.push(position);
        }
    }

    let results = await runOnWorkers(positions);
    report(results, games, gamesWithEarlyGuess);

    if (process.argv[4]) {
        fs.writeFileSync(process.argv[4], JSON.stringify(results));
    }
}

// Plays a game until its first early guess; returns the position (board state, candidates) or null
function findFirstEarlyGuess(context, seed) {
    context.setWindowSeedRng();
    context.setSeed(seed);
    context.restartVirtualGame(gameConfig);

    while (true) {
        let sweepResult = context.sweepPage(true, false, sweepConfig);

        if (sweepResult.state === "solved" || sweepResult.state === "death") {
            return null;
        }

        let field = context.virtualGame.field;
        let unknownAmount = field.flat().filter((cell) => cell.isUnknown).length;

        if (sweepResult.guessCandidates && unknownAmount > EARLY_MIN_UNKNOWN_CELLS) {
            let sorted = sweepResult.guessCandidates.slice(0).sort((a, b) => a.bombProbability - b.bombProbability);
            let guess = sorted.find((candidate) => candidate.isGuess);
            let candidates = [guess].concat(sorted.filter((candidate) => !candidate.isGuess).slice(0, CANDIDATE_AMOUNT - 1));

            return {
                seed: seed,
                cells: field.map((row) => row.map((cell) => ({ isHidden: cell.isHidden, isUnknown: cell.isUnknown, isFlagged: cell.isFlagged, isDigit: cell.isDigit, value: cell.value }))),
                candidates: candidates,
                allCandidates: sweepResult.guessCandidates
            };
        }

        context.executeInteractions(sweepResult.interactions, true, true);
    }
}

function runOnWorkers(positions) {
    return new Promise((resolve, reject) => {
        let results = new Array(positions.length);
        let next = 0;
        let done = 0;
        let threads = Math.min(os.cpus().length, positions.length);

        for (let t = 0; t < threads; t++) {
            let worker = new Worker(__filename);
            let send = () => {
                if (next < positions.length) {
                    worker.postMessage({ index: next, position: positions[next] });
                    next += 1;
                } else {
                    worker.terminate();
                }
            };

            worker.on("message", (message) => {
                results[message.index] = message.result;
                done += 1;

                if (process.stderr.isTTY) {
                    process.stderr.write("\r" + done + "/" + positions.length + " positions" + (done === positions.length ? "\n" : ""));
                }

                if (done === positions.length) {
                    resolve(results);
                }

                send();
            });

            worker.on("error", reject);
            send();
        }
    });
}

function runWorker() {
    let context = createContext();

    parentPort.on("message", ({ index, position }) => {
        parentPort.postMessage({ index: index, result: measurePosition(context, position) });
    });
}

function measurePosition(context, position) {
    let sampler = createSampler(position.cells);

    if (!sampler) {
        return { isSkipped: true };
    }

    let random = mulberry32(position.seed * 7919 + 1);
    let selectionSamples = Array.from({ length: SELECTION_SAMPLES }, () => sampler(random));
    let selectionWins = position.candidates.map((candidate) => selectionSamples.reduce((a, bombs) => a + playOut(context, position.cells, bombs, candidate), 0));
    let bestIndex = selectionWins.indexOf(Math.max(...selectionWins));

    let confirmationSamples = Array.from({ length: CONFIRMATION_SAMPLES }, () => sampler(random));
    let solverWins = confirmationSamples.reduce((a, bombs) => a + playOut(context, position.cells, bombs, position.candidates[0]), 0);
    let bestWins = bestIndex === 0 ? solverWins : confirmationSamples.reduce((a, bombs) => a + playOut(context, position.cells, bombs, position.candidates[bestIndex]), 0);

    // Sanity check: mine frequency of the samples vs the solver's exact bomb probabilities, as squared deviations in
    // units of the expected sampling error (a correct sampler averages about 1)
    let samples = selectionSamples.concat(confirmationSamples);
    let squaredDeviations = position.allCandidates
        .filter((candidate) => candidate.bombProbability > 0 && candidate.bombProbability < 1)
        .map((candidate) => {
            let frequency = samples.filter((bombs) => bombs.has(candidate.y * board.width + candidate.x)).length / samples.length;
            return (frequency - candidate.bombProbability) ** 2 / ((candidate.bombProbability * (1 - candidate.bombProbability)) / samples.length);
        });

    return {
        isSkipped: false,
        candidates: position.candidates,
        bestIndex: bestIndex,
        selectionWins: selectionWins,
        solverWins: solverWins,
        bestWins: bestWins,
        best: position.candidates[bestIndex],
        solver: position.candidates[0],
        squaredDeviations: squaredDeviations
    };
}

// Plays the rest of the game with the current solver after revealing the candidate, the given bombs being the truth
function playOut(context, cells, bombs, candidate) {
    if (bombs.has(candidate.y * board.width + candidate.x)) {
        return 0;
    }

    context.restartVirtualGame(gameConfig);
    let field = context.virtualGame.field;
    field.forEach((row) => row.forEach((cell) => Object.assign(cell, cells[cell.y][cell.x], { isBomb: cells[cell.y][cell.x].isFlagged || bombs.has(cell.y * board.width + cell.x) })));
    field.flat().forEach((cell) => (cell.bombValue = cell.neighbors.filter((neighbor) => neighbor.isBomb).length));
    context.virtualGame.hasStarted = true;
    context.executeInteractions([{ cell: field[candidate.y][candidate.x], isFlag: false }], true, true);

    while (true) {
        let sweepResult = context.sweepPage(true, false, sweepConfig);

        if (sweepResult.state === "solved" || sweepResult.state === "death") {
            return sweepResult.state === "solved" ? 1 : 0;
        }

        // Once the exact endgame search decides, its win chance is the solver's exact chance from here on
        let guess = sweepResult.guessCandidates && sweepResult.guessCandidates.find((candidate) => candidate.isGuess);

        if (guess && guess.winChance !== undefined) {
            return guess.winChance;
        }

        context.executeInteractions(sweepResult.interactions, true, true);
    }
}

// Uniform sampler over all bomb configurations of the unknown cells that fit the digits. Groups of frontier cells
// (connected by digits) are enumerated exactly; the bomb counts of the groups and of the cells away from the digits
// are combined by dynamic programming. Returns null when a group has too many configurations.
function createSampler(cells) {
    let index = (x, y) => y * board.width + x;
    let neighborsOf = (x, y) => {
        let neighbors = [];

        for (let ny = y - 1; ny <= y + 1; ny++) {
            for (let nx = x - 1; nx <= x + 1; nx++) {
                if ((nx !== x || ny !== y) && nx >= 0 && nx < board.width && ny >= 0 && ny < board.height) {
                    neighbors.push([nx, ny]);
                }
            }
        }

        return neighbors;
    };

    let flagAmount = cells.flat().filter((cell) => cell.isFlagged).length;
    let bombsLeft = board.bombs - flagAmount;
    let digits = [];
    let frontier = new Map();

    cells.forEach((row, y) =>
        row.forEach((cell, x) => {
            if (cell.isHidden || !(cell.value > 0)) {
                return;
            }

            let unknownNeighbors = neighborsOf(x, y).filter(([nx, ny]) => cells[ny][nx].isUnknown).map(([nx, ny]) => index(nx, ny));

            if (unknownNeighbors.length > 0) {
                let flagged = neighborsOf(x, y).filter(([nx, ny]) => cells[ny][nx].isFlagged).length;
                let digit = { cells: unknownNeighbors, bombs: cell.value - flagged };
                digits.push(digit);
                unknownNeighbors.forEach((i) => frontier.set(i, (frontier.get(i) || []).concat(digit)));
            }
        })
    );

    let outside = [];
    cells.forEach((row, y) => row.forEach((cell, x) => cell.isUnknown && !frontier.has(index(x, y)) && outside.push(index(x, y))));

    // Groups of frontier cells connected through digits
    let groups = [];
    let seen = new Set();

    frontier.forEach((_, start) => {
        if (seen.has(start)) {
            return;
        }

        let group = [];
        let stack = [start];
        seen.add(start);

        while (stack.length > 0) {
            let i = stack.pop();
            group.push(i);
            frontier.get(i).forEach((digit) => digit.cells.forEach((j) => !seen.has(j) && (seen.add(j), stack.push(j))));
        }

        groups.push(group);
    });

    // Per group: configurations (lists of bomb cells) by bomb count
    let groupConfigurations = [];

    for (let group of groups) {
        let groupDigits = digits.filter((digit) => group.includes(digit.cells[0]));
        let need = groupDigits.map((digit) => digit.bombs);
        let open = groupDigits.map((digit) => digit.cells.length);
        let digitsOfCell = group.map((i) => groupDigits.map((digit, d) => (digit.cells.includes(i) ? d : -1)).filter((d) => d >= 0));
        let byCount = [];
        let amount = 0;
        let chosen = [];

        let assign = (k) => {
            if (amount > MAX_GROUP_CONFIGURATIONS) {
                return;
            }

            if (k === group.length) {
                (byCount[chosen.length] = byCount[chosen.length] || []).push(chosen.slice(0));
                amount += 1;
                return;
            }

            [false, true].forEach((isBomb) => {
                let fits = true;

                digitsOfCell[k].forEach((d) => {
                    open[d] -= 1;
                    need[d] -= isBomb ? 1 : 0;
                    fits = fits && need[d] >= 0 && need[d] <= open[d];
                });

                if (fits) {
                    isBomb && chosen.push(group[k]);
                    assign(k + 1);
                    isBomb && chosen.pop();
                }

                digitsOfCell[k].forEach((d) => {
                    open[d] += 1;
                    need[d] += isBomb ? 1 : 0;
                });
            });
        };

        assign(0);

        if (amount > MAX_GROUP_CONFIGURATIONS) {
            return null;
        }

        groupConfigurations.push(byCount);
    }

    // ways[g][s]: configurations of groups 0..g-1 with s bombs in total
    let ways = [[1]];

    groupConfigurations.forEach((byCount, g) => {
        let next = [];
        ways[g].forEach((w, s) => byCount.forEach((list, k) => list && (next[s + k] = (next[s + k] || 0) + w * list.length)));
        ways.push(next);
    });

    let logChoose = (n, k) => {
        let sum = 0;

        for (let i = 0; i < k; i++) {
            sum += Math.log(n - i) - Math.log(i + 1);
        }

        return sum;
    };

    let totals = ways[groups.length].map((w, s) => (w && bombsLeft - s >= 0 && bombsLeft - s <= outside.length ? { s: s, logWeight: Math.log(w) + logChoose(outside.length, bombsLeft - s) } : null)).filter(Boolean);
    let maxLog = Math.max(...totals.map((t) => t.logWeight));
    totals.forEach((t) => (t.weight = Math.exp(t.logWeight - maxLog)));

    let pick = (random, items, weightOf) => {
        let total = items.reduce((a, item) => a + weightOf(item), 0);
        let r = random() * total;

        for (let item of items) {
            r -= weightOf(item);

            if (r < 0) {
                return item;
            }
        }

        return items[items.length - 1];
    };

    return (random) => {
        let s = pick(random, totals, (t) => t.weight).s;
        let bombs = new Set();

        for (let g = groups.length - 1; g >= 0; g--) {
            let options = groupConfigurations[g].map((list, k) => ({ k: k, list: list })).filter((o) => o.list && s - o.k >= 0 && ways[g][s - o.k]);
            let option = pick(random, options, (o) => o.list.length * ways[g][s - o.k]);
            option.list[Math.floor(random() * option.list.length)].forEach((i) => bombs.add(i));
            s -= option.k;
        }

        let rest = outside.slice(0);
        let outsideBombs = board.bombs - flagAmount - [...bombs].length;

        for (let i = 0; i < outsideBombs; i++) {
            let j = i + Math.floor(random() * (rest.length - i));
            [rest[i], rest[j]] = [rest[j], rest[i]];
            bombs.add(rest[i]);
        }

        return bombs;
    };
}

function report(results, games, gamesWithEarlyGuess) {
    let measured = results.filter((result) => !result.isSkipped);
    let differences = measured.map((result) => (result.bestWins - result.solverWins) / CONFIRMATION_SAMPLES);
    let mean = differences.reduce((a, d) => a + d, 0) / differences.length;
    let se = Math.sqrt(differences.reduce((a, d) => a + (d - mean) ** 2, 0) / (differences.length - 1) / differences.length);
    let solverWinRate = measured.reduce((a, r) => a + r.solverWins, 0) / (measured.length * CONFIRMATION_SAMPLES);
    let changed = measured.filter((result) => result.bestIndex !== 0);
    let percent = (value) => (value * 100).toFixed(2) + "%";

    console.log("First early guesses (more than " + EARLY_MIN_UNKNOWN_CELLS + " unknown cells) of " + games + " expert games: " + gamesWithEarlyGuess + " positions, " + (results.length - measured.length) + " skipped (MAX_GROUP_CONFIGURATIONS)");
    let squaredDeviations = measured.flatMap((result) => result.squaredDeviations);
    console.log("Sampler check: mean squared deviation of sampled mine frequencies from the exact bomb probabilities, in units of the sampling error: " + (squaredDeviations.reduce((a, v) => a + v, 0) / squaredDeviations.length).toFixed(2) + " (about 1 expected, " + squaredDeviations.length + " cells)");
    console.log("Win chance after the solver's choice: " + percent(solverWinRate) + " (" + CONFIRMATION_SAMPLES + " fresh samples per position)");
    console.log("Rollout-best candidate differs from the solver's choice in " + changed.length + " of " + measured.length + " positions");
    console.log("Gain of the rollout-best candidate on fresh samples: " + percent(mean) + " ± " + percent(se) + " per position (" + (mean / se).toFixed(1) + "σ)");
    console.log("Implied win rate gain from this decision alone: about " + percent((mean * gamesWithEarlyGuess) / games) + " of all games");

    let average = (values) => values.reduce((a, v) => a + v, 0) / Math.max(1, values.length);
    let formatMean = (diffs) => {
        let m = average(diffs);
        let error = Math.sqrt(diffs.reduce((a, d) => a + (d - m) ** 2, 0) / (diffs.length - 1) / diffs.length);
        return percent(m) + " ± " + percent(error) + " (" + (m / error).toFixed(1) + "σ)";
    };

    // Fixed rules do not look at the samples, so their comparison on the selection samples is unbiased
    console.log("Fixed rules instead of the solver's choice (same samples, per position):");
    let safest = (result) => result.candidates.reduce((best, c, i) => (c.bombProbability < result.candidates[best].bombProbability ? i : best), 0);
    console.log("- lowest bomb probability: " + formatMean(measured.map((r) => (r.selectionWins[safest(r)] - r.selectionWins[0]) / SELECTION_SAMPLES)));

    for (let rank = 1; rank < CANDIDATE_AMOUNT; rank++) {
        let withRank = measured.filter((r) => r.selectionWins.length > rank);
        console.log("- candidate " + (rank + 1) + " by bomb probability: " + formatMean(withRank.map((r) => (r.selectionWins[rank] - r.selectionWins[0]) / SELECTION_SAMPLES)));
    }

    let changedDifferences = changed.map((result) => (result.bestWins - result.solverWins) / CONFIRMATION_SAMPLES);
    console.log("Where a different candidate won the selection: gain on fresh samples " + percent(average(changedDifferences)) + " per position, its bomb probability " + percent(average(changed.map((r) => r.best.bombProbability))) + " vs " + percent(average(changed.map((r) => r.solver.bombProbability))) + " for the solver's choice");
}
