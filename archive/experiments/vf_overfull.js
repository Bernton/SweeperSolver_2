// Checks the forced-position rule used by the benchmark's expected win (bench/sandbox.js, getForcedWinChance) and
// measures how far the solver is from optimal play in small endgames.
//
// For endgame positions of real games it computes exactly, over all bomb configurations:
// - the optimal win probability (search over all adaptive strategies),
// - the solver's win probability from that position (played once against every configuration).
// Forced positions (no unknown cell can give information) must have 1 / number of configurations as optimum, and the
// solver must reach it. For the other positions the gap is what an exact endgame search could gain.
//
// Usage: node bench/verify-forced.js [games=1500]

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { mulberry32 } = require("/home/user/SweeperSolver_2/bench/sandbox");

const DEFAULT_GAMES = 1500;
// The exact search is exponential in the unknown cells; beyond about this many it takes too long
const MAX_SEARCHED_UNKNOWNS = 12;

const games = Number(process.argv[2] || DEFAULT_GAMES);
const board = { width: 9, height: 9, bombs: 75 };
const gameConfig = { width: board.width, height: board.height, bombAmount: board.bombs };
const config = { isVirtualMode: true, virtualGameConfig: gameConfig };

let sandboxMath = Object.create(Math);
sandboxMath.seedrandom = function (seed) {
    return mulberry32(seed);
};
let context = { console, performance, setTimeout, Math: sandboxMath, document: { addEventListener() {} } };
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync("/home/user/SweeperSolver_2/sweeper.js", "utf8"), context);

let forced = [];
let other = [];
let forcedMismatches = 0;

for (let seed = 1; seed <= games; seed++) {
    context.setWindowSeedRng();
    context.setSeed(seed);
    context.restartVirtualGame(gameConfig);

    while (true) {
        let sweepResult = context.sweepPage(true, false, config);

        if (sweepResult.state === "solved" || sweepResult.state === "death") {
            break;
        }

        let field = context.virtualGame.field;

        if (context.isGuessingSolver(sweepResult.solver) && field.flat().filter((cell) => cell.isUnknown).length <= MAX_SEARCHED_UNKNOWNS) {
            let snapshot = field.map((row) => row.map((cell) => ({ ...cell, neighbors: undefined })));
            let position = analyzePosition(field);
            let solverWins = position.configurations.reduce((a, configuration) => a + playFrom(snapshot, position.unknowns, configuration), 0);
            let entry = { optimal: position.optimalWins / position.configurations.length, solver: solverWins / position.configurations.length };

            if (position.isForced) {
                forced.push(entry);
                forcedMismatches += position.optimalWins === 1 && solverWins === 1 ? 0 : 1;
            } else {
                other.push(entry);
            }

            restore(snapshot);
        }

        context.executeInteractions(sweepResult.interactions, true, true);
    }
}

report("Forced positions", forced);
report("Other positions", other);
console.log("Forced positions where the optimum or the solver is not exactly one configuration: " + forcedMismatches + (forcedMismatches === 0 ? " (PASS)" : " (FAIL)"));
process.exitCode = forcedMismatches === 0 ? 0 : 1;

function report(name, entries) {
    let sum = (f) => entries.reduce((a, entry) => a + f(entry), 0);
    let below = entries.filter((entry) => entry.optimal - entry.solver > 0);
    console.log(
        name + ": " + entries.length + " positions, mean optimal " + percent(sum((e) => e.optimal) / entries.length) + ", mean solver " + percent(sum((e) => e.solver) / entries.length) +
            ", solver below optimal in " + below.length + " (" + sum((e) => e.optimal - e.solver).toFixed(2) + " wins in " + games + " games)"
    );
}

function percent(value) {
    return (value * 100).toFixed(2) + "%";
}

// Bomb configurations as bit masks over the unknown cells (all equally likely), forcedness and the optimal play
function analyzePosition(field) {
    let unknowns = field.flat().filter((cell) => cell.isUnknown);
    let bitOf = new Map(unknowns.map((cell, i) => [cell, 1 << i]));
    let allBits = (1 << unknowns.length) - 1;
    let bombsLeft = board.bombs - field.flat().filter((cell) => cell.isFlagged).length;
    let unknownMask = (cell) => cell.neighbors.reduce((mask, neighbor) => mask | (bitOf.get(neighbor) || 0), 0);
    let flaggedAround = (cell) => cell.neighbors.filter((neighbor) => neighbor.isFlagged).length;
    let digits = field.flat().filter((cell) => cell.isDigit && !cell.isHidden).map((cell) => ({ mask: unknownMask(cell), bombs: cell.value - flaggedAround(cell) }));

    let configurations = [];

    for (let mask = 0; mask <= allBits; mask++) {
        if (bitCount(mask) === bombsLeft && digits.every((digit) => bitCount(mask & digit.mask) === digit.bombs)) {
            configurations.push(mask);
        }
    }

    let masks = unknowns.map(unknownMask);
    let flagged = unknowns.map(flaggedAround);
    let valueOf = (i, configuration) => flagged[i] + bitCount(configuration & masks[i]);
    let isSafe = (i, configuration) => !(configuration & (1 << i));
    let isForced = unknowns.every((cell, i) => new Set(configurations.filter((c) => isSafe(i, c)).map((c) => valueOf(i, c))).size <= 1);

    // Number of configurations won by optimal play; the game is won when all safe cells are revealed
    let memo = new Map();
    let isWon = (configuration, revealed) => (~configuration & allBits & ~revealed) === 0;
    let optimalWins = (candidates, revealed) => {
        if (candidates.length === 0) {
            return 0;
        }

        let key = revealed + "|" + candidates.join(",");

        if (!memo.has(key)) {
            let best = 0;

            unknowns.forEach((cell, i) => {
                let survivors = candidates.filter((c) => isSafe(i, c));

                if (revealed & (1 << i) || survivors.length === 0) {
                    return;
                }

                let nextRevealed = revealed | (1 << i);
                let byValue = new Map();
                survivors.forEach((c) => byValue.set(valueOf(i, c), (byValue.get(valueOf(i, c)) || []).concat(c)));

                let wins = 0;
                byValue.forEach((group) => {
                    wins += group.filter((c) => isWon(c, nextRevealed)).length + optimalWins(group.filter((c) => !isWon(c, nextRevealed)), nextRevealed);
                });

                best = Math.max(best, wins);
            });

            memo.set(key, best);
        }

        return memo.get(key);
    };

    return { unknowns: unknowns, configurations: configurations, isForced: isForced, optimalWins: optimalWins(configurations, 0) };
}

function bitCount(value) {
    let count = 0;

    while (value) {
        value &= value - 1;
        count += 1;
    }

    return count;
}

// The solver's result from the snapshot position when the given configuration is the true one
function playFrom(snapshot, unknowns, configuration) {
    restore(snapshot);
    let field = context.virtualGame.field;
    unknowns.forEach((cell, i) => (field[cell.y][cell.x].isBomb = !!(configuration & (1 << i))));
    field.flat().forEach((cell) => (cell.bombValue = cell.neighbors.filter((neighbor) => neighbor.isBomb).length));

    while (true) {
        let sweepResult = context.sweepPage(true, false, config);

        if (sweepResult.state === "solved" || sweepResult.state === "death") {
            return sweepResult.state === "solved" ? 1 : 0;
        }

        context.executeInteractions(sweepResult.interactions, true, true);
    }
}

function restore(snapshot) {
    context.virtualGame.field.forEach((row) => row.forEach((cell) => Object.assign(cell, snapshot[cell.y][cell.x], { neighbors: cell.neighbors })));
    context.virtualGame.hasStarted = true;
}
