const fs = require("fs"), vm = require("vm");
const { mulberry32 } = require("/home/user/SweeperSolver_2/bench/sandbox.js");
const [file, first, games] = [process.argv[2], Number(process.argv[3]), Number(process.argv[4])];
let m = Object.create(Math); m.seedrandom = function (s) { return mulberry32(s); };
let ctx = { console, performance, setTimeout, Math: m, document: { addEventListener() {} } }; ctx.window = ctx;
vm.createContext(ctx); vm.runInContext(fs.readFileSync(file, "utf8"), ctx);
let won = 0;
for (let seed = first; seed < first + games; seed++) {
  let gc = { width: 30, height: 16, bombAmount: 99 };
  ctx.setWindowSeedRng(); ctx.setSeed(seed); ctx.restartVirtualGame(gc);
  while (true) {
    let r = ctx.sweepPage(true, false, { isVirtualMode: true, virtualGameConfig: gc });
    if (r.state === "solved") { won++; break; }
    if (r.state === "death") break;
    ctx.executeInteractions(r.interactions, true, true);
  }
}
console.log(JSON.stringify({ games, won, stats: ctx.__stats }));
