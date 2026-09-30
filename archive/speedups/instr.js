// Instrumented run: wraps searchEndgame and sweep to measure time by outcome
const fs = require("fs");
const { createSolver } = require("/home/user/SweeperSolver_2/bench/sandbox.js");
let [w, h, b, games] = process.argv.slice(2).map(Number);
let src = fs.readFileSync("/home/user/SweeperSolver_2/sweeper.js", "utf8") + `
console.__stats = globalThis.__stats = { harnessCalls: 0, harnessMs: 0, topMs: 0, guessTopMs: 0, egCalls: 0, egNull: 0, egNullMs: 0, egOkMs: 0, egOkMax: 0, egNullMax: 0, egByUnknowns: {}, anaCalls: 0, anaMs: 0, stepMs: 0 };
(function () {
  let orig = searchEndgame;
  searchEndgame = function (n, ...rest) {
    let t0 = performance.now(); let r = orig(n, ...rest); let t = performance.now() - t0;
    let s = __stats; s.egCalls++;
    let k = s.egByUnknowns[n] = s.egByUnknowns[n] || { calls: 0, nul: 0, ms: 0, nullMs: 0 };
    k.calls++; k.ms += t;
    if (r === null) { s.egNull++; s.egNullMs += t; s.egNullMax = Math.max(s.egNullMax, t); k.nul++; k.nullMs += t; } else { s.egOkMs += t; s.egOkMax = Math.max(s.egOkMax, t); }
    return r;
  };
  let origSweep = sweep;
  sweep = function (f, b, g, l, isAnalysis) {
    let t0 = performance.now(); let r = origSweep(f, b, g, l, isAnalysis); let t = performance.now() - t0;
    if (isAnalysis && sweepDepth > 0) { __stats.anaCalls++; __stats.anaMs += t; } else if (isAnalysis) { __stats.harnessCalls++; __stats.harnessMs += t; } else { __stats.topMs += t; if (r.solver && r.solver.length > 1 && 'gi'.includes(r.solver[r.solver.length-1])) __stats.guessTopMs += t; }
    return r;
  };
})();
`;
// need context access: re-implement minimal createSolver to reach __stats
const vm = require("vm");
let solver = createSolver(src);
let board = { width: w, height: h, bombs: b };
let t0 = performance.now(), tot = 0;
for (let i = 0; i < games; i++) { let r = solver.playGame(board, i + 1); tot += r.time; }
let S = console.__stats; S.egByUnknowns = Object.entries(S.egByUnknowns).map(([k, v]) => k + ":" + v.calls + "/" + v.nul + "null/" + v.ms.toFixed(0) + "ms/" + v.nullMs.toFixed(0) + "nullms").join(" "); console.log(JSON.stringify(S, (k, v) => typeof v === "number" ? +v.toFixed(1) : v));
console.log("wall ms/game", ((performance.now() - t0) / games).toFixed(2), "sweep ms/game", (tot / games).toFixed(2));
