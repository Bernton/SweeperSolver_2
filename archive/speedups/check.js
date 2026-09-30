// Strict identity check: plays games with two sweeper.js versions and compares the full interaction sequences.
// usage: node check.js <a.js> <b.js> <w> <h> <bombs> <games> [firstSeed]
const fs = require("fs"), vm = require("vm");
const { mulberry32 } = require("/home/user/SweeperSolver_2/bench/sandbox.js");
function load(file) {
  let M = Object.create(Math); M.seedrandom = function (s) { return mulberry32(s); };
  let ctx = { console, performance, setTimeout, Math: M, document: { addEventListener() {} } }; ctx.window = ctx;
  vm.createContext(ctx); vm.runInContext(fs.readFileSync(file, "utf8"), ctx, { filename: "sweeper.js" }); return ctx;
}
function play(ctx, board, seed) {
  let gc = { width: board[0], height: board[1], bombAmount: board[2] }, cfg = { isVirtualMode: true, virtualGameConfig: gc };
  ctx.setWindowSeedRng(); ctx.setSeed(seed); ctx.restartVirtualGame(gc);
  let trace = [], time = 0, max = 0;
  for (;;) {
    let c0 = process.cpuUsage(); let r = ctx.sweepPage(true, false, cfg); let c1 = process.cpuUsage(c0); let t = (c1.user + c1.system) / 1000; time += t; max = Math.max(max, t);
    trace.push(r.state + r.solver + ":" + r.interactions.map(i => (i.isFlag ? "f" : "r") + i.cell.x + "," + i.cell.y).join(";"));
    if (r.state === "solved" || r.state === "death" || r.interactions.length === 0) break;
    ctx.executeInteractions(r.interactions, true, true);
  }
  return { trace: trace.join("|"), time, max };
}
let [a, b, w, h, n, games, seed] = process.argv.slice(2);
let board = [+w, +h, +n]; games = +games; seed = +(seed || 1);
let A = load(a), B = load(b), diff = 0, ta = 0, tb = 0, ma = 0, mb = 0;
for (let i = 0; i < games; i++) {
  // alternate order to spread JIT/thermal effects
  let ra, rb;
  if (i % 2) { ra = play(A, board, seed + i); rb = play(B, board, seed + i); } else { rb = play(B, board, seed + i); ra = play(A, board, seed + i); }
  if (ra.trace !== rb.trace) diff++;
  ta += ra.time; tb += rb.time; ma = Math.max(ma, ra.max); mb = Math.max(mb, rb.max);
}
console.log(`${w}x${h}/${n} games ${games}: differing ${diff}; A ${(ta / games).toFixed(2)} ms/game (max step ${ma.toFixed(0)}), B ${(tb / games).toFixed(2)} ms/game (max step ${mb.toFixed(0)}), B/A ${(tb / ta).toFixed(3)}`);
