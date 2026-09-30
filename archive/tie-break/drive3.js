// Plays the repo solver on seeds [first, first+games) and records win + bomb positions per seed
const fs = require("fs"), vm = require("vm");
const { mulberry32 } = require("/home/user/SweeperSolver_2/bench/sandbox.js");
const [file, first, games, out] = [process.argv[2], Number(process.argv[3]), Number(process.argv[4]), process.argv[5]];
let m = Object.create(Math); m.seedrandom = function (s) { return mulberry32(s); };
let ctx = { console, performance, setTimeout, Math: m, document: { addEventListener() {} } }; ctx.window = ctx;
vm.createContext(ctx); vm.runInContext(fs.readFileSync(file, "utf8"), ctx);
let res = [];
for (let seed = first; seed < first + games; seed++) {
  let gc = { width: 30, height: 16, bombAmount: 99 };
  ctx.setWindowSeedRng(); ctx.setSeed(seed); ctx.restartVirtualGame(gc);
  let won = 0, guesses = [];
  while (true) {
    let r = ctx.sweepPage(true, false, { isVirtualMode: true, virtualGameConfig: gc });
    if (r.state !== "solved" && r.state !== "death" && ctx.isGuessingSolver(r.solver)) {
      let f = ctx.virtualGame.field; let unk = 0; f.forEach((row) => row.forEach((c) => { if (c.isUnknown) unk++; }));
      let c = r.interactions[0].cell; guesses.push([c.x, c.y, unk]);
    }
    if (r.state === "solved") { won = 1; break; }
    if (r.state === "death") break;
    ctx.executeInteractions(r.interactions, true, true);
  }
  let mines = [];
  ctx.virtualGame.field.forEach((row, y) => row.forEach((c, x) => { if (c.isBomb) mines.push(x, y); }));
  if (mines.length !== 198) throw new Error("bad mines " + mines.length);
  res.push({ seed, won, guesses });
}
fs.writeFileSync(out, JSON.stringify(res));
