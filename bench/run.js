// Headless benchmark for sweeper.js (Node.js, no dependencies).
// Loads sweeper.js unchanged into sandboxes and plays seeded virtual games on all CPU cores.
//
// Usage: node bench/run.js [suite] [options]
//   suite                  expert (default) | sizes | stress | all        (see bench/presets.js)
//   --scale <factor>       multiply the games of every preset (e.g. 0.1 for a quick run)
//   --games <n>            play exactly n games per preset
//   --seed <n>             first seed (default 1)
//   --only <text>          only presets whose name contains text
//   --compare <rev|path>   also run sweeper.js from a git revision (e.g. HEAD, HEAD~2) or a file, as reference
//   --set <key>=<json>     override a solverConfig value for the current version (repeatable)
//   --ablate               also run every alternative value of every feature in bench/features.js
//   --ablate-key <key>     same, for one feature only
//   --threads <n>          worker threads (default: number of CPU cores)
//
// A value set by --set or an ablation applies to all boards: it also replaces that key in solverConfig.boardSettings.
// Win differences are paired (same seeds = same boards), which removes most of the noise: the current version against
// the reference (--compare), each ablation against the current version.

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");

const MAX_GAME_TIME = 60000; // ms; a game taking longer counts as hung (its worker is restarted)
const SLOW_STEP_TIME = 2000; // ms; the robustness gate fails on any slower single step
// Games of the current version with a step over SLOW_STEP_TIME are played again alone (no other threads running), so
// machine load does not fail the gate; more slow games than this fail it without replaying
const MAX_REPLAYED_SLOW_GAMES = 20;
// The website keeps the first click's 3x3 area free of bombs if there is room outside it; with more bombs its placement
// is not uniform, and the forced win chance (which assumes all configurations equally likely) does not apply
const FIRST_CLICK_AREA_CELLS = 9;
// Work per worker task, in board cells times games: small enough to balance the threads and to detect a hung game
// early, large enough to keep the message overhead low
const CELLS_PER_TASK = 50000;

if (isMainThread) {
    main().catch((e) => {
        console.error("Error: " + e.message);
        process.exitCode = 2;
    });
} else {
    runWorker();
}

function runWorker() {
    const { createSolver } = require("./sandbox");
    let solvers = workerData.variants.map((variant) => createSolver(variant.source, variant.config));

    // One message per game, so a hung game is detected after MAX_GAME_TIME and the finished games are kept
    parentPort.on("message", (task) => {
        for (let i = 0; i < task.count; i++) {
            parentPort.postMessage({ taskId: task.taskId, result: solvers[task.variantIndex].playGame(task.board, task.firstSeed + i) });
        }

        parentPort.postMessage({ taskId: task.taskId, isDone: true });
    });
}

async function main() {
    const { suites } = require("./presets");
    const { createSolver } = require("./sandbox");
    const features = require("./features");
    const repoRoot = path.join(__dirname, "..");

    let options = parseArgs(process.argv.slice(2));
    let presets = suites[options.suite];

    if (!presets) {
        throw new Error("Unknown suite " + options.suite + ", choose one of: " + Object.keys(suites).join(", "));
    }

    if (options.only) {
        presets = presets.filter((preset) => preset.name.includes(options.only));
    }

    presets = presets.map((preset) => ({ ...preset, games: options.games ?? Math.max(1, Math.round(preset.games * options.scale)) }));

    let currentSource = fs.readFileSync(path.join(repoRoot, "sweeper.js"), "utf8");
    let defaultConfig = createSolver(currentSource).getConfig();
    let currentOverrides = applyToAllBoards(options.set, defaultConfig);
    let variants = [];

    if (options.compare) {
        variants.push({ label: "reference " + options.compare, source: loadSource(options.compare, repoRoot), config: {}, baseIndex: null });
    }

    let currentIndex = variants.length;
    variants.push({ label: "current" + formatConfig(options.set), source: currentSource, config: currentOverrides, isCurrent: true, baseIndex: options.compare ? 0 : null });

    if (options.ablate) {
        let currentConfig = createSolver(currentSource, currentOverrides).getConfig();
        let ablatedFeatures = features.filter((feature) => !options.ablateKey || feature.key === options.ablateKey);

        if (ablatedFeatures.length === 0) {
            throw new Error("No feature " + options.ablateKey + " in bench/features.js");
        }

        ablatedFeatures.forEach((feature) => {
            // With board-specific values the current value differs per board, so no value can be skipped
            let hasBoardValues = Object.values(currentConfig.boardSettings ?? {}).some((values) => feature.key in values);

            feature.values.forEach((value) => {
                if (hasBoardValues || JSON.stringify(value) !== JSON.stringify(currentConfig[feature.key])) {
                    let config = applyToAllBoards({ ...options.set, [feature.key]: value }, defaultConfig);
                    variants.push({ label: "current with " + feature.key + "=" + JSON.stringify(value), source: currentSource, config: config, baseIndex: currentIndex });
                }
            });
        });
    }

    printHeader(options, presets, variants, repoRoot);

    let t0 = Date.now();
    let results = await runAll(variants, presets, options);
    let replayNotes = replaySlowGames(variants[currentIndex], presets, results[currentIndex], options);
    let gatePassed = printResults(variants, presets, results, replayNotes);
    console.log("\nTotal time: " + ((Date.now() - t0) / 1000).toFixed(0) + " s");

    process.exitCode = gatePassed ? 0 : 1;
}

function parseArgs(args) {
    let options = { suite: "expert", scale: 1, games: null, seed: 1, only: null, compare: null, set: {}, ablate: false, ablateKey: null, threads: os.cpus().length };

    for (let i = 0; i < args.length; i++) {
        let arg = args[i];
        let value = () => {
            if (i + 1 >= args.length) {
                throw new Error("Missing value for " + arg);
            }

            return args[++i];
        };

        if (arg === "--scale") {
            options.scale = parseNumber(arg, value(), (n) => n > 0, "a number above 0");
        } else if (arg === "--games") {
            options.games = parseNumber(arg, value(), (n) => Number.isInteger(n) && n >= 1, "a whole number of at least 1");
        } else if (arg === "--seed") {
            // Seed 0 would play an unseeded game (setSeed treats it as "no seed"), different in every variant
            options.seed = parseNumber(arg, value(), (n) => Number.isInteger(n) && n >= 1, "a whole number of at least 1");
        } else if (arg === "--only") {
            options.only = value();
        } else if (arg === "--compare") {
            options.compare = value();
        } else if (arg === "--set") {
            let text = value();
            let separator = text.indexOf("=");

            if (separator < 1) {
                throw new Error("--set needs key=value with a JSON value, e.g. --set guessLookaheadCandidates=6, got: " + text);
            }

            try {
                options.set[text.slice(0, separator)] = JSON.parse(text.slice(separator + 1));
            } catch (e) {
                throw new Error("--set " + text + ": the value is not valid JSON (strings need quotes, e.g. '\"text\"')");
            }
        } else if (arg === "--ablate") {
            options.ablate = true;
        } else if (arg === "--ablate-key") {
            options.ablate = true;
            options.ablateKey = value();
        } else if (arg === "--threads") {
            options.threads = parseNumber(arg, value(), (n) => Number.isInteger(n) && n >= 1, "a whole number of at least 1");
        } else if (!arg.startsWith("--")) {
            options.suite = arg;
        } else {
            throw new Error("Unknown option " + arg);
        }
    }

    return options;
}

function parseNumber(option, text, isValid, description) {
    let number = Number(text);

    if (text.trim() === "" || !isValid(number)) {
        throw new Error(option + " needs " + description + ", got: " + text);
    }

    return number;
}

// A key set for all boards also replaces the board-specific values of that key (solverConfig.boardSettings), which
// would otherwise hide it on those boards
function applyToAllBoards(overrides, defaultConfig) {
    let keys = Object.keys(overrides).filter((key) => key !== "boardSettings");

    if (keys.length === 0 || !defaultConfig.boardSettings) {
        return overrides;
    }

    let boardSettings = {};

    Object.entries(overrides.boardSettings ?? defaultConfig.boardSettings).forEach(([board, values]) => {
        let remaining = Object.fromEntries(Object.entries(values).filter(([key]) => !keys.includes(key)));

        if (Object.keys(remaining).length > 0) {
            boardSettings[board] = remaining;
        }
    });

    return { ...overrides, boardSettings: boardSettings };
}

function loadSource(revisionOrPath, repoRoot) {
    if (fs.existsSync(revisionOrPath)) {
        return fs.readFileSync(revisionOrPath, "utf8");
    }

    return execFileSync("git", ["show", revisionOrPath + ":sweeper.js"], { cwd: repoRoot, encoding: "utf8" });
}

function formatConfig(config) {
    let entries = Object.entries(config);
    return entries.length > 0 ? " (" + entries.map(([key, value]) => key + "=" + JSON.stringify(value)).join(", ") + ")" : "";
}

function printHeader(options, presets, variants, repoRoot) {
    let commit = "unknown";

    try {
        commit = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
        let isDirty = execFileSync("git", ["status", "--porcelain", "sweeper.js"], { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() !== "";
        commit += isDirty ? " + uncommitted sweeper.js changes" : "";
    } catch (e) {}

    console.log("## Suite " + options.suite + " — " + new Date().toISOString().slice(0, 10) + " — " + commit);
    console.log("Seeds from " + options.seed + ", " + options.threads + " threads, " + presets.reduce((a, b) => a + b.games, 0) + " games per variant");
    variants.forEach((variant, i) => console.log("- Variant " + i + ": " + variant.label + (variant.baseIndex !== null ? " (Δ against variant " + variant.baseIndex + ")" : "")));
}

function runAll(variants, presets, options) {
    let tasks = [];
    let results = variants.map(() => presets.map((preset) => new Array(preset.games)));

    variants.forEach((variant, variantIndex) => {
        presets.forEach((preset, presetIndex) => {
            let chunkSize = Math.max(1, Math.floor(CELLS_PER_TASK / (preset.width * preset.height)));

            for (let offset = 0; offset < preset.games; offset += chunkSize) {
                tasks.push({
                    taskId: tasks.length,
                    variantIndex: variantIndex,
                    presetIndex: presetIndex,
                    offset: offset,
                    board: { width: preset.width, height: preset.height, bombs: preset.bombs },
                    firstSeed: options.seed + offset,
                    count: Math.min(chunkSize, preset.games - offset)
                });
            }
        });
    });

    // Slowest presets first, so the pool does not end on a single long task
    tasks.sort((a, b) => b.board.width * b.board.height * b.count - a.board.width * a.board.height * a.count);

    let workerVariants = variants.map((variant) => ({ source: variant.source, config: variant.config }));
    let queue = tasks.slice(0);
    let pending = tasks.length;
    let completed = 0;

    return new Promise((resolve, reject) => {
        let startWorker = () => {
            let worker = new Worker(__filename, { workerData: { variants: workerVariants } });
            let currentTask = null;
            let finishedGames = 0;
            let timer = null;

            let startTimer = () => {
                clearTimeout(timer);
                timer = setTimeout(onHungGame, MAX_GAME_TIME);
            };

            // The hung game counts as an error; the task's remaining games go back to the queue for a new worker
            let onHungGame = () => {
                let hungGame = currentTask.offset + finishedGames;
                let remaining = currentTask.count - finishedGames - 1;
                storeResult(currentTask, finishedGames, {
                    won: false,
                    guesses: 0,
                    steps: 0,
                    time: MAX_GAME_TIME,
                    maxStepTime: MAX_GAME_TIME,
                    error: "Timeout (game over " + MAX_GAME_TIME / 1000 + " s)",
                    forcedWinChance: null
                });

                if (remaining > 0) {
                    let skipped = finishedGames + 1;
                    queue.unshift({ ...currentTask, offset: hungGame + 1, firstSeed: currentTask.firstSeed + skipped, count: remaining });
                    pending += 1;
                }

                finishTask();
                worker.removeAllListeners();
                worker.terminate();
                startWorker();
            };

            let next = () => {
                currentTask = queue.shift();
                finishedGames = 0;

                if (!currentTask) {
                    worker.terminate();
                    return;
                }

                startTimer();
                worker.postMessage(currentTask);
            };

            worker.on("message", (message) => {
                if (message.isDone) {
                    clearTimeout(timer);
                    finishTask();
                    next();
                } else {
                    storeResult(currentTask, finishedGames, message.result);
                    finishedGames += 1;
                    startTimer();
                }
            });

            worker.on("error", reject);
            next();
        };

        let storeResult = (task, index, result) => {
            results[task.variantIndex][task.presetIndex][task.offset + index] = result;
        };

        let finishTask = () => {
            completed += 1;
            pending -= 1;

            if (process.stderr.isTTY) {
                process.stderr.write("\r" + completed + "/" + (completed + pending) + " tasks" + (pending === 0 ? "\n" : ""));
            }

            if (pending === 0) {
                resolve(results);
            }
        };

        for (let i = 0; i < Math.min(options.threads, tasks.length); i++) {
            startWorker();
        }
    });
}

// Replays the current version's games with a step over SLOW_STEP_TIME in this thread while no workers run, and keeps
// the replayed step time: the gate then measures the solver, not the machine load
function replaySlowGames(variant, presets, variantResults, options) {
    const { createSolver } = require("./sandbox");
    let slowGames = [];

    presets.forEach((preset, presetIndex) => {
        variantResults[presetIndex].forEach((game, i) => {
            if (!game.error && game.maxStepTime > SLOW_STEP_TIME) {
                slowGames.push({ preset: preset, game: game, seed: options.seed + i });
            }
        });
    });

    if (slowGames.length === 0 || slowGames.length > MAX_REPLAYED_SLOW_GAMES) {
        return slowGames.length > 0 ? ["- " + slowGames.length + " games with a step over SLOW_STEP_TIME: more than MAX_REPLAYED_SLOW_GAMES = " + MAX_REPLAYED_SLOW_GAMES + ", not replayed"] : [];
    }

    let solver = createSolver(variant.source, variant.config);

    return slowGames.map(({ preset, game, seed }) => {
        let board = { width: preset.width, height: preset.height, bombs: preset.bombs };
        let measured = game.maxStepTime;
        game.maxStepTime = solver.playGame(board, seed).maxStepTime;
        return "- " + preset.name + ", seed " + seed + ": slowest step " + measured.toFixed(0) + " ms in the run, " + game.maxStepTime.toFixed(0) + " ms replayed alone";
    });
}

function printResults(variants, presets, results, replayNotes) {
    let currentIndex = variants.findIndex((variant) => variant.isCurrent);
    let gatePassed = true;
    let errorLines = [];

    console.log("\n| Preset | Variant | Win % | Δ win vs base (paired) | Expected win % | Δ expected (paired) | Forced games | Games played differently | Guesses/game | ms/game | Slowest step ms | Errors |");
    console.log("|---|---|---|---|---|---|---|---|---|---|---|---|");

    presets.forEach((preset, presetIndex) => {
        variants.forEach((variant, variantIndex) => {
            let games = results[variantIndex][presetIndex];
            let n = games.length;
            let isOverfull = preset.bombs > preset.width * preset.height - FIRST_CLICK_AREA_CELLS;
            let wins = count(games, (g) => g.won);
            let winRate = wins / n;
            let winSe = Math.sqrt((winRate * (1 - winRate)) / n);
            let errors = games.filter((g) => g.error);
            let slowestStep = Math.max(...games.map((g) => g.maxStepTime));
            let expectedWins = games.map(getExpectedWin);
            let expectedWinRate = sum(expectedWins, (e) => e) / n;
            let expectedWinSe = Math.sqrt(sum(expectedWins, (e) => (e - expectedWinRate) ** 2) / Math.max(1, n - 1) / n);
            let forcedGames = count(games, (g) => g.forcedWinChance !== null);
            let delta = "";
            let expectedDelta = "";
            let playedDifferently = "";

            if (variant.baseIndex !== null) {
                let baseGames = results[variant.baseIndex][presetIndex];
                delta = formatPairedDelta(baseGames, games);
                expectedDelta = isOverfull ? "n/a" : formatPairedMeanDelta(baseGames.map(getExpectedWin), expectedWins);
                playedDifferently = count(games, (g, i) => g.won !== baseGames[i].won || g.guesses !== baseGames[i].guesses || g.steps !== baseGames[i].steps);
            }

            if (variantIndex === currentIndex && (errors.length > 0 || slowestStep > SLOW_STEP_TIME)) {
                gatePassed = false;
            }

            console.log(
                "| " + (variantIndex === 0 ? preset.name : "") +
                " | " + variantIndex +
                " | " + (winRate * 100).toFixed(2) + " ± " + (winSe * 100).toFixed(2) +
                " | " + delta +
                " | " + (isOverfull ? "n/a" : (expectedWinRate * 100).toFixed(2) + " ± " + (expectedWinSe * 100).toFixed(2)) +
                " | " + expectedDelta +
                " | " + ((forcedGames / n) * 100).toFixed(1) + "%" +
                " | " + playedDifferently +
                " | " + (sum(games, (g) => g.guesses) / n).toFixed(2) +
                " | " + (sum(games, (g) => g.time) / n).toFixed(1) +
                " | " + slowestStep.toFixed(0) + (slowestStep > SLOW_STEP_TIME ? " ⚠" : "") +
                " | " + (errors.length > 0 ? errors.length + " ⚠" : "0") + " |"
            );

            if (errors.length > 0) {
                let messages = {};
                errors.forEach((g) => (messages[g.error] = (messages[g.error] || 0) + 1));
                Object.entries(messages).forEach(([message, amount]) => errorLines.push("- " + preset.name + ", variant " + variantIndex + ": " + amount + "x " + message));
            }
        });
    });

    if (errorLines.length > 0) {
        console.log("\nErrors:\n" + errorLines.join("\n"));
    }

    if (replayNotes.length > 0) {
        console.log("\nSteps over SLOW_STEP_TIME in the current version (the gate uses the replayed time):\n" + replayNotes.join("\n"));
    }

    if (presets.some((preset) => preset.bombs > preset.width * preset.height - FIRST_CLICK_AREA_CELLS)) {
        console.log("\nExpected win n/a: more bombs than cells outside the first click's area, the website's placement is not uniform there");
    }

    console.log("\nRobustness gate (current version: no errors, no step over SLOW_STEP_TIME = " + SLOW_STEP_TIME + " ms): " + (gatePassed ? "PASS" : "FAIL"));
    return gatePassed;
}

// Paired comparison on identical boards: only games won by exactly one of the two variants carry information.
function formatPairedDelta(referenceGames, games) {
    let n = games.length;
    let onlyVariant = 0;
    let onlyReference = 0;

    games.forEach((game, i) => {
        if (game.won && !referenceGames[i].won) {
            onlyVariant += 1;
        } else if (!game.won && referenceGames[i].won) {
            onlyReference += 1;
        }
    });

    let delta = (onlyVariant - onlyReference) / n;
    let se = Math.sqrt(Math.max(0, onlyVariant + onlyReference - (onlyVariant - onlyReference) ** 2 / n)) / n;
    let sigma = se > 0 ? delta / se : 0;
    return (delta >= 0 ? "+" : "") + (delta * 100).toFixed(2) + " ± " + (se * 100).toFixed(2) + " (" + sigma.toFixed(1) + "σ)";
}

// Expected win: a game that reached a forced position (no information possible anymore) counts with that position's
// exact win chance instead of the outcome of its coin flips. Same expected value as the win rate, less noise.
function getExpectedWin(game) {
    return game.forcedWinChance !== null ? game.forcedWinChance : game.won ? 1 : 0;
}

function formatPairedMeanDelta(referenceValues, values) {
    let n = values.length;
    let differences = values.map((value, i) => value - referenceValues[i]);
    let delta = sum(differences, (d) => d) / n;
    let se = Math.sqrt(sum(differences, (d) => (d - delta) ** 2) / Math.max(1, n - 1) / n);
    let sigma = se > 0 ? delta / se : 0;
    return (delta >= 0 ? "+" : "") + (delta * 100).toFixed(2) + " ± " + (se * 100).toFixed(2) + " (" + sigma.toFixed(1) + "σ)";
}

function count(values, predicate) {
    return values.reduce((a, b, i) => a + (predicate(b, i) ? 1 : 0), 0);
}

function sum(values, selector) {
    return values.reduce((a, b) => a + selector(b), 0);
}
