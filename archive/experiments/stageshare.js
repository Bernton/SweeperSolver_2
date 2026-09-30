const fs = require("fs"), vm = require("vm");
const { mulberry32 } = require("/home/user/SweeperSolver_2/bench/sandbox");
const [w, h, b, n] = process.argv.slice(2).map(Number);
const m = Object.create(Math); m.seedrandom = function (s) { return mulberry32(s); };
const ctx = { console, performance, setTimeout, Math: m, document: { addEventListener() {} } }; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync("/home/user/SweeperSolver_2/sweeper.js", "utf8"), ctx);
const cfg = { width: w, height: h, bombAmount: b }, stats = {};
let total = 0;
for (let seed = 1; seed <= n; seed++) {
  ctx.setWindowSeedRng(); ctx.setSeed(seed); ctx.restartVirtualGame(cfg);
  while (true) {
    const t0 = performance.now();
    const r = ctx.sweepPage(true, false, { isVirtualMode: true, virtualGameConfig: cfg });
    const dt = performance.now() - t0; total += dt;
    const key = r.solver || r.state;
    stats[key] = stats[key] || { steps: 0, ms: 0 }; stats[key].steps++; stats[key].ms += dt;
    if (r.state === "solved" || r.state === "death") break;
    ctx.executeInteractions(r.interactions, true, true);
  }
}
console.log(`${w}x${h}/${b}: sweep time ${(total / n).toFixed(2)} ms/game`);
Object.entries(stats).sort((a, b) => b[1].ms - a[1].ms).forEach(([k, v]) => console.log(`  [${k}] ${(v.steps / n).toFixed(1)} steps/game, ${(v.ms / v.steps).toFixed(3)} ms/step, ${(100 * v.ms / total).toFixed(1)}% of time`));
