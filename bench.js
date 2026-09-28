// Headless benchmark for sweeper.js (Node.js, no dependencies).
// Loads sweeper.js unchanged into a sandbox and plays seeded games in virtual mode.
//
// Usage: node bench.js [games=1000] [width=30] [height=16] [bombs=99] [firstSeed=1]

const fs = require("fs");
const path = require("path");
const vm = require("vm");

let [games = 1000, width = 30, height = 16, bombAmount = 99, firstSeed = 1] = process.argv.slice(2).map(Number);

function mulberry32(seed) {
    return function () {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

let sandboxMath = Object.create(Math);
sandboxMath.seedrandom = function (seed) {
    return mulberry32(seed);
};

let sandbox = { console, performance, setTimeout, Math: sandboxMath, document: { addEventListener() {} } };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, "sweeper.js"), "utf8"), sandbox, { filename: "sweeper.js" });

let config = { isVirtualMode: true, virtualGameConfig: { width, height, bombAmount } };
let result = { wins: 0, guesses: 0, errors: 0, time: 0, maxStepTime: 0 };

for (let i = 0; i < games; i++) {
    let seed = firstSeed + i;
    sandbox.setWindowSeedRng();
    sandbox.setSeed(seed);
    sandbox.restartVirtualGame(config.virtualGameConfig);

    try {
        while (true) {
            let t0 = performance.now();
            let sweepResult = sandbox.sweepPage(true, false, config);
            let stepTime = performance.now() - t0;
            result.time += stepTime;
            result.maxStepTime = Math.max(result.maxStepTime, stepTime);

            if (sweepResult.state === "solved") {
                result.wins += 1;
                break;
            }

            if (sweepResult.state === "death") {
                break;
            }

            if (sandbox.isGuessingSolver(sweepResult.solver)) {
                result.guesses += 1;
            }

            sandbox.executeInteractions(sweepResult.interactions, true, true);
        }
    } catch (e) {
        result.errors += 1;
        console.log("Error in game with seed " + seed + ": " + e.message);
    }
}

let winRate = result.wins / games;
let standardError = Math.sqrt((winRate * (1 - winRate)) / games);

console.log("Board: " + width + "x" + height + " / " + bombAmount + " bombs, seeds " + firstSeed + "-" + (firstSeed + games - 1));
console.log("-> Winning percentage:\t" + (winRate * 100).toFixed(2) + "% ± " + (standardError * 100).toFixed(2) + " (" + result.wins + "/" + games + ")");
console.log("-> Average guesses:\t" + (result.guesses / games).toFixed(2));
console.log("-> Average/Max time:\t" + (result.time / games).toFixed(2) + " ms per game / " + result.maxStepTime.toFixed(2) + " ms per step");
console.log("-> Errors:\t\t" + result.errors);
