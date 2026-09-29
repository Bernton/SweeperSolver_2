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
//   --threads <n>          worker threads (default: number of CPU cores)
//
// Win differences between variants are paired (same seeds = same boards), which removes most of the noise.

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");

const MAX_GAME_TIME = 60000; // ms; a game taking longer counts as hung (its worker is restarted)
const SLOW_STEP_TIME = 2000; // ms; the robustness gate fails on any slower single step
// Work per worker task, in board cells times games: small enough to balance the threads and to detect a hung game
// early, large enough to keep the message overhead low
const CELLS_PER_TASK = 50000;

if (isMainThread) {
    main();
} else {
    runWorker();
}

function runWorker() {
    const { createSolver } = require("./sandbox");
    let solvers = workerData.variants.map((variant) => createSolver(variant.source, variant.config));

    parentPort.on("message", (task) => {
        let results = [];

        for (let i = 0; i < task.count; i++) {
            results.push(solvers[task.variantIndex].playGame(task.board, task.firstSeed + i));
        }

        parentPort.postMessage({ taskId: task.taskId, results: results });
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
    let variants = [];

    if (options.compare) {
        variants.push({ label: "reference " + options.compare, source: loadSource(options.compare, repoRoot), config: {} });
    }

    variants.push({ label: "current" + formatConfig(options.set), source: currentSource, config: options.set, isCurrent: true });

    if (options.ablate) {
        let currentConfig = createSolver(currentSource, options.set).getConfig();

        features.forEach((feature) => {
            feature.values.forEach((value) => {
                if (JSON.stringify(value) !== JSON.stringify(currentConfig[feature.key])) {
                    let config = { ...options.set, [feature.key]: value };
                    variants.push({ label: "current with " + feature.key + "=" + JSON.stringify(value), source: currentSource, config: config });
                }
            });
        });
    }

    printHeader(options, presets, variants, repoRoot);

    let t0 = Date.now();
    let results = await runAll(variants, presets, options);
    let gatePassed = printResults(variants, presets, results);
    console.log("\nTotal time: " + ((Date.now() - t0) / 1000).toFixed(0) + " s");

    process.exitCode = gatePassed ? 0 : 1;
}

function parseArgs(args) {
    let options = { suite: "expert", scale: 1, games: null, seed: 1, only: null, compare: null, set: {}, ablate: false, threads: os.cpus().length };

    for (let i = 0; i < args.length; i++) {
        let arg = args[i];

        if (arg === "--scale") {
            options.scale = Number(args[++i]);
        } else if (arg === "--games") {
            options.games = Number(args[++i]);
        } else if (arg === "--seed") {
            options.seed = Number(args[++i]);
        } else if (arg === "--only") {
            options.only = args[++i];
        } else if (arg === "--compare") {
            options.compare = args[++i];
        } else if (arg === "--set") {
            let [key, ...value] = args[++i].split("=");
            options.set[key] = JSON.parse(value.join("="));
        } else if (arg === "--ablate") {
            options.ablate = true;
        } else if (arg === "--threads") {
            options.threads = Number(args[++i]);
        } else if (!arg.startsWith("--")) {
            options.suite = arg;
        } else {
            throw new Error("Unknown option " + arg);
        }
    }

    return options;
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
        commit = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).trim();
        let isDirty = execFileSync("git", ["status", "--porcelain", "sweeper.js"], { cwd: repoRoot, encoding: "utf8" }).trim() !== "";
        commit += isDirty ? " + uncommitted sweeper.js changes" : "";
    } catch (e) {}

    console.log("## Suite " + options.suite + " — " + new Date().toISOString().slice(0, 10) + " — " + commit);
    console.log("Seeds from " + options.seed + ", " + options.threads + " threads, " + presets.reduce((a, b) => a + b.games, 0) + " games per variant");
    variants.forEach((variant, i) => console.log("- Variant " + i + ": " + variant.label));
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
            let timer = null;

            let next = () => {
                currentTask = queue.shift();

                if (!currentTask) {
                    worker.terminate();
                    return;
                }

                timer = setTimeout(() => {
                    let timeoutResult = { won: false, guesses: 0, steps: 0, time: MAX_GAME_TIME, maxStepTime: MAX_GAME_TIME, error: "Timeout (game over " + MAX_GAME_TIME / 1000 + " s)" };
                    finish(currentTask, new Array(currentTask.count).fill(timeoutResult));
                    currentTask = null;
                    worker.removeAllListeners();
                    worker.terminate();
                    startWorker();
                }, MAX_GAME_TIME * currentTask.count);

                worker.postMessage(currentTask);
            };

            worker.on("message", (message) => {
                clearTimeout(timer);
                finish(currentTask, message.results);
                next();
            });

            worker.on("error", reject);
            next();
        };

        let finish = (task, taskResults) => {
            taskResults.forEach((result, i) => (results[task.variantIndex][task.presetIndex][task.offset + i] = result));
            completed += 1;
            let progress = "\r" + completed + "/" + tasks.length + " tasks" + (--pending === 0 ? "\n" : "");

            if (process.stderr.isTTY) {
                process.stderr.write(progress);
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

function printResults(variants, presets, results) {
    let referenceIndex = 0;
    let currentIndex = variants.findIndex((variant) => variant.isCurrent);
    let gatePassed = true;
    let errorLines = [];

    console.log("\n| Preset | Variant | Win % | Δ win vs variant " + referenceIndex + " (paired) | Expected win % | Δ expected (paired) | Forced games | Games played differently | Guesses/game | ms/game | Slowest step ms | Errors |");
    console.log("|---|---|---|---|---|---|---|---|---|---|---|---|");

    presets.forEach((preset, presetIndex) => {
        variants.forEach((variant, variantIndex) => {
            let games = results[variantIndex][presetIndex];
            let n = games.length;
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

            if (variantIndex !== referenceIndex) {
                let referenceGames = results[referenceIndex][presetIndex];
                delta = formatPairedDelta(referenceGames, games);
                expectedDelta = formatPairedMeanDelta(referenceGames.map(getExpectedWin), expectedWins);
                playedDifferently = count(games, (g, i) => g.won !== referenceGames[i].won || g.guesses !== referenceGames[i].guesses || g.steps !== referenceGames[i].steps);
            }

            if (variantIndex === currentIndex && (errors.length > 0 || slowestStep > SLOW_STEP_TIME)) {
                gatePassed = false;
            }

            console.log(
                "| " + (variantIndex === 0 ? preset.name : "") +
                " | " + variantIndex +
                " | " + (winRate * 100).toFixed(2) + " ± " + (winSe * 100).toFixed(2) +
                " | " + delta +
                " | " + (expectedWinRate * 100).toFixed(2) + " ± " + (expectedWinSe * 100).toFixed(2) +
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
