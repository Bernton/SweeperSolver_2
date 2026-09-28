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
    let result = { won: false, guesses: 0, steps: 0, time: 0, maxStepTime: 0, error: null };

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
            }

            context.executeInteractions(sweepResult.interactions, true, true);
            result.steps += 1;
        }
    } catch (e) {
        result.error = e.message;
    }

    return result;
}

module.exports = { createSolver, mulberry32 };
