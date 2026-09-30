const fs = require("fs"), vm = require("vm");
const { mulberry32 } = require("/home/user/SweeperSolver_2/bench/sandbox");
const [W, H, B, seed, la] = process.argv.slice(2).map(Number);
const m = Object.create(Math); m.seedrandom = function (s) { return mulberry32(s); };
const logs = [];
const ctx = { console: { log: (...a) => logs.push(a.map(String).join(" ")) }, performance, setTimeout, Math: m, document: { addEventListener() {} } };
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync("/home/user/SweeperSolver_2/sweeper.js", "utf8"), ctx);
vm.runInContext("solverConfig.guessLookaheadCandidates = " + la, ctx);
const cfg = { width: W, height: H, bombAmount: B };
ctx.setWindowSeedRng(); ctx.setSeed(seed); ctx.restartVirtualGame(cfg);
const show = () => ctx.virtualGame.field.map(r => r.map(c => c.isFlagged ? "F" : c.isHidden ? (c.isBomb ? "*" : ".") : c.isRevealedBomb ? "X" : String(c.value)).join("")).join("\n");
for (let i = 0; i < 30; i++) {
  logs.length = 0;
  const r = ctx.sweepPage(true, true, { isVirtualMode: true, virtualGameConfig: cfg });
  console.log("--- step", i, r.state, r.solver, "->", r.interactions.map(a => (a.isFlag ? "F" : "R") + "(" + a.cell.x + "," + a.cell.y + ")").join(" "));
  if (r.solver && r.solver.includes("g")) console.log(logs.join("\n"));
  if (r.state === "solved" || r.state === "death") break;
  ctx.executeInteractions(r.interactions, true, true);
  console.log(show());
}
