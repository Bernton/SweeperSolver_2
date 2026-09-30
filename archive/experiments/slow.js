const fs = require("fs"), vm = require("vm");
const { mulberry32 } = require("/home/user/SweeperSolver_2/bench/sandbox");
const m = Object.create(Math); m.seedrandom = function (s) { return mulberry32(s); };
const ctx = { console, performance, setTimeout, Math: m, document: { addEventListener() {} } }; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(process.argv[2], "utf8"), ctx);
const cfg = { width: 50, height: 50, bombAmount: 500 };
for (let seed = 1; seed <= 200; seed++) {
  ctx.setWindowSeedRng(); ctx.setSeed(seed); ctx.restartVirtualGame(cfg);
  while (true) {
    ctx.__hyp = [];
    const t0 = performance.now();
    const r = ctx.sweepPage(true, false, { isVirtualMode: true, virtualGameConfig: cfg });
    const dt = performance.now() - t0;
    if (dt > 1500) {
      console.log("seed", seed, "step ms", dt.toFixed(0), "hypotheticals", ctx.__hyp.length, "outer groupings >1ms", JSON.stringify(ctx.__hyp[0] && ctx.__hyp[0].outer));
      ctx.__hyp.sort((a, b) => b.ms - a.ms).slice(0, 5).forEach((h) => console.log("  ", h.ms.toFixed(0), "ms", h.x, h.y, "v=" + h.value, "outsider=" + h.isOutsider, JSON.stringify(h.info)));
      process.exit(0);
    }
    if (r.state === "solved" || r.state === "death") break;
    ctx.executeInteractions(r.interactions, true, true);
  }
}
