// Slowest steps (CPU ms) with their solver stage; usage: node steps.js <file> w h bombs games
const fs = require("fs"), vm = require("vm");
const { mulberry32 } = require("/home/user/SweeperSolver_2/bench/sandbox.js");
let [file, w, h, n, games] = process.argv.slice(2);
let M = Object.create(Math); M.seedrandom = function (s) { return mulberry32(s); };
let ctx = { console, performance, setTimeout, Math: M, document: { addEventListener() {} } }; ctx.window = ctx;
vm.createContext(ctx); vm.runInContext(fs.readFileSync(file, "utf8") + `
(function(){ let o = searchEndgame; searchEndgame = function(...a){ let t0=performance.now(); let r=o(...a); console.__eg = (console.__eg||0) + performance.now()-t0; return r; };
 let s = sweep; sweep = function(f,b,g,l,a){ if (a && sweepDepth>0) console.__la=(console.__la||0)+1; return s(f,b,g,l,a); }; })();`, ctx);
let gc = { width: +w, height: +h, bombAmount: +n }, cfg = { isVirtualMode: true, virtualGameConfig: gc };
let steps = [], byStage = {};
for (let g = 1; g <= +games; g++) {
  ctx.setWindowSeedRng(); ctx.setSeed(g); ctx.restartVirtualGame(gc);
  for (let k = 0; ; k++) {
    console.__eg = 0; console.__la = 0;
    let c0 = process.cpuUsage(); let r = ctx.sweepPage(true, false, cfg); let c = process.cpuUsage(c0); let t = (c.user + c.system) / 1000;
    let st = r.solver || r.state; byStage[st] = byStage[st] || { n: 0, ms: 0 }; byStage[st].n++; byStage[st].ms += t;
    steps.push({ g, k, st, t: +t.toFixed(1), eg: +console.__eg.toFixed(1), hyp: console.__la, unknown: ctx.virtualGame.field.flat().filter(c => c.isUnknown).length });
    if (r.state === "solved" || r.state === "death" || !r.interactions.length) break;
    ctx.executeInteractions(r.interactions, true, true);
  }
}
steps.sort((a, b) => b.t - a.t); console.log(file, w + "x" + h + "/" + n, "slowest:", JSON.stringify(steps.slice(0, 6)));
console.log("by stage:", JSON.stringify(Object.fromEntries(Object.entries(byStage).map(([k, v]) => [k, v.n + " steps " + v.ms.toFixed(0) + " ms"]))));
