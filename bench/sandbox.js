// Loads a sweeper.js source unchanged into an isolated vm context and plays seeded virtual games with it.

const vm = require("vm");

function mulberry32(seed) {
    return function () {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function createSolver(source, configOverrides = {}) {
    let sandboxMath = Object.create(Math);
    sandboxMath.seedrandom = function (seed) {
        return mulberry32(seed);
    };

    let context = { console, performance, setTimeout, Math: sandboxMath, document: { addEventListener() {} } };
    context.window = context;
    vm.createContext(context);
    vm.runInContext(source, context, { filename: "sweeper.js" });

    if (Object.keys(configOverrides).length > 0) {
        context.__configOverrides = configOverrides;
        vm.runInContext(
            'if (typeof solverConfig === "undefined") { throw new Error("This sweeper.js has no solverConfig"); }\n' +
                "for (let key in __configOverrides) {\n" +
                '    if (!(key in solverConfig)) { throw new Error("Unknown solverConfig key: " + key); }\n' +
                "    solverConfig[key] = __configOverrides[key];\n" +
                "}",
            context
        );
    }

    return {
        playGame: (board, seed) => playGame(context, board, seed),
        getConfig: () => vm.runInContext('typeof solverConfig === "undefined" ? {} : JSON.parse(JSON.stringify(solverConfig))', context)
    };
}

function playGame(context, board, seed) {
    let gameConfig = { width: board.width, height: board.height, bombAmount: board.bombs };
    let config = { isVirtualMode: true, virtualGameConfig: gameConfig };
    let result = { won: false, guesses: 0, steps: 0, time: 0, maxStepTime: 0, error: null, forcedWinChance: null };

    try {
        context.setWindowSeedRng();
        context.setSeed(seed);
        context.restartVirtualGame(gameConfig);

        while (true) {
            let t0 = performance.now();
            let sweepResult = context.sweepPage(true, false, config);
            let stepTime = performance.now() - t0;
            result.time += stepTime;
            result.maxStepTime = Math.max(result.maxStepTime, stepTime);

            if (sweepResult.state === "solved") {
                result.won = true;
                break;
            }

            if (sweepResult.state === "death") {
                break;
            }

            if (sweepResult.interactions.length === 0) {
                throw new Error("Stalled: no interactions in state " + sweepResult.state);
            }

            if (context.isGuessingSolver(sweepResult.solver)) {
                result.guesses += 1;

                if (result.forcedWinChance === null) {
                    result.forcedWinChance = getForcedWinChance(context, board.bombs);
                }
            }

            context.executeInteractions(sweepResult.interactions, true, true);
            result.steps += 1;
        }
    } catch (e) {
        result.error = e.message;
    }

    return result;
}

// A position is forced when no unknown cell can give information: each would show the same number in every bomb
// configuration where it is safe. Nothing can be learned anymore, so any play wins at most one configuration, and
// revealing the safe cells of one wins with 1 / number of configurations, which is optimal (the solver reaches it,
// bench/RESULTS.md entry 13). Returns that win chance, or null if the position is not forced.
function getForcedWinChance(context, bombs) {
    let field = context.virtualGame.field;
    let unknowns = field.flat().filter((cell) => cell.isUnknown);

    if (unknowns.length === 0) {
        return null;
    }

    for (let cell of unknowns) {
        let flaggedNeighbors = cell.neighbors.filter((neighbor) => neighbor.isFlagged).length;
        let hiddenNeighbors = cell.neighbors.filter((neighbor) => neighbor.isFlagged || neighbor.isUnknown).length;
        let possibleValues = 0;

        for (let value = flaggedNeighbors; value <= hiddenNeighbors; value++) {
            let hypotheticalField = field.map((row) => row.slice(0));
            hypotheticalField[cell.y][cell.x] = { x: cell.x, y: cell.y, value: value, isDigit: true, isHidden: false, isUnknown: false, isFlagged: false, isRevealedBomb: false };

            if (context.sweep(hypotheticalField, bombs, false, false, true).analysis.logWeight > -Infinity) {
                possibleValues += 1;

                if (possibleValues > 1) {
                    return null;
                }
            }
        }
    }

    return Math.exp(-context.sweep(field, bombs, false, false, true).analysis.logWeight);
}

module.exports = { createSolver, mulberry32, getForcedWinChance };
