const vm = require("vm"); const fs = require("fs");
const src = fs.readFileSync("/home/user/SweeperSolver_2/sweeper.js", "utf8");
function mk(shared) {
  let m = Object.create(Math); m.seedrandom = () => Math.random;
  let c = { console, performance, setTimeout, Math: m, document: { addEventListener() {}, removeEventListener() {} } };
  c.window = c; Object.assign(c, shared); vm.createContext(c); vm.runInContext(src, c); return c;
}
function run(c, ms) {
  vm.runInContext("autoSweepConfig.isVirtualMode = true; autoSweepConfig.virtualBatchSize = 50; autoSweepConfig.virtualGameConfig = {width:9,height:9,bombAmount:10}; startAutoSweep(autoSweepConfig, autoSweepStats);", c);
  return new Promise(r => setTimeout(() => { vm.runInContext("stopAutoSweep(autoSweepConfig)", c); r(); }, ms));
}
(async () => {
  let a = mk({});
  await run(a, 300);
  let fin = (c) => c.sweeperAutoSweepStats.gameStats.filter(g => g && g.finishState).length;
  console.log("paste1: gameIndex", vm.runInContext("autoSweepConfig.state.gameIndex", a), "finished recorded", fin(a));
  let b = mk({ sweeperAutoSweepStats: a.sweeperAutoSweepStats, autoSweepRunId: a.autoSweepRunId, sweepKeyDown: a.sweepKeyDown });
  let before = fin(b);
  await run(b, 100);
  console.log("paste2: gameIndex", vm.runInContext("autoSweepConfig.state.gameIndex", b), "finished recorded", fin(b), "(new:", fin(b) - before, ")");
})();
