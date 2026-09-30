const fs = require("fs"); const { createSolver } = require("/home/user/SweeperSolver_2/bench/sandbox.js");
let [w, h, b, games, seed] = process.argv.slice(2).map(Number);
let s = createSolver(fs.readFileSync("proto-comb.js", "utf8")); let maxStep = 0;
for (let i = 0; i < games; i++) { let r = s.playGame({ width: w, height: h, bombs: b }, (seed || 1) + i); maxStep = Math.max(maxStep, r.maxStepTime); }
console.log(`${w}x${h}/${b}: max valid combinations in one grouping ${console.__maxComb} (${console.__maxCombCands} candidates, analysis=${console.__maxCombAnalysis}), max step ${maxStep.toFixed(0)} ms`);
