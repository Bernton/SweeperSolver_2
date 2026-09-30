const fs = require("fs"), vm = require("vm");
const { mulberry32 } = require("/home/user/SweeperSolver_2/bench/sandbox");
const m = Object.create(Math); m.seedrandom = function (s) { return mulberry32(s); };
const ctx = { console, performance, setTimeout, Math: m, document: { addEventListener() {} } }; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync("/home/user/SweeperSolver_2/sweeper.js", "utf8"), ctx);
const cfg = { width: 9, height: 9, bombAmount: 75 }, n = 20000, counts = {};
for (let s = 1; s <= n; s++) {
  ctx.setWindowSeedRng(); ctx.setSeed(s); ctx.restartVirtualGame(cfg);
  const f = ctx.virtualGame.field;
  ctx.executeInteractions([{ cell: f[2][2], isFlag: false }], true, true);
  for (let y = 1; y <= 3; y++) for (let x = 1; x <= 3; x++) if (f[y][x].isBomb) counts[y + "," + x] = (counts[y + "," + x] || 0) + 1;
}
console.log("Bomb frequency in the 3x3 around the first click (row,col), 9x9/75, uniform would be 3/8 = 37.5% for each neighbor:");
for (let y = 1; y <= 3; y++) console.log("  " + [1, 2, 3].map((x) => ((100 * (counts[y + "," + x] || 0)) / n).toFixed(1).padStart(5) + "%").join(" "));
