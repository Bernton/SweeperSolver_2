const vm = require("vm"); const fs = require("fs");
const src = fs.readFileSync("/home/user/SweeperSolver_2/sweeper.js", "utf8");
let m = Object.create(Math); m.seedrandom = () => Math.random;
let c = { console, performance, setTimeout, Math: m, document: { addEventListener() {} } }; c.window = c; vm.createContext(c); vm.runInContext(src, c);
const R = (s) => vm.runInContext(s, c); const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  R("autoSweepConfig.isVirtualMode = true; autoSweepConfig.virtualBatchSize = 1; autoSweepConfig.virtualGameConfig = {width:30,height:16,bombAmount:99}; startAutoSweep(autoSweepConfig, autoSweepStats);");
  await sleep(30); R("stopAutoSweep(autoSweepConfig)"); const gi = R("autoSweepConfig.state.gameIndex");
  await sleep(2000);
  R("startAutoSweep(autoSweepConfig, autoSweepStats)");
  await sleep(1500); R("stopAutoSweep(autoSweepConfig)");
  console.log(JSON.stringify(R(`autoSweepStats.gameStats.filter(g=>g&&g.finishState).map(g=>({i:g.index, wall:Math.round(g.wallTime), solver:Math.round(g.time)}))`)), "paused game index", gi);
})();
