const fs = require("fs"), vm = require("vm");
const { mulberry32 } = require("/home/user/SweeperSolver_2/bench/sandbox");
const [file, w, h, b, n] = [process.argv[2], ...process.argv.slice(3).map(Number)];
const m = Object.create(Math); m.seedrandom = function (s) { return mulberry32(s); };
const ctx = { console, performance, setTimeout, Math: m, document: { addEventListener() {} } }; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(file, "utf8"), ctx);
const cfg = { width: w, height: h, bombAmount: b };
let wins = 0, guesses = [], fatal = [];
for (let seed = 1; seed <= n; seed++) {
  ctx.setWindowSeedRng(); ctx.setSeed(seed); ctx.restartVirtualGame(cfg);
  let last = null, idx = 0;
  while (true) {
    ctx.__guess = null;
    const r = ctx.sweepPage(true, false, { isVirtualMode: true, virtualGameConfig: cfg });
    if (r.state === "solved") { wins++; break; }
    if (r.state === "death") { fatal.push({ ...last, index: idx }); break; }
    if (ctx.__guess) { last = ctx.__guess; idx++; guesses.push({ ...last, index: idx }); }
    ctx.executeInteractions(r.interactions, true, true);
  }
}
const pct = (x) => (100 * x).toFixed(1) + "%";
const lost = n - wins;
console.log(`${w}x${h}/${b}: ${n} games, won ${pct(wins / n)}, ${guesses.length} guesses (${(guesses.length / n).toFixed(2)}/game)`);
const bucket = (arr, f, edges) => edges.map((e, i) => { const lo = i ? edges[i - 1] : -1; return [`${lo < 0 ? 0 : lo}-${e}`, arr.filter((g) => f(g) > lo && f(g) <= e).length]; });
console.log("Losses (" + lost + ") by bomb probability of the fatal guess:", bucket(fatal, (g) => g.fraction, [0.1, 0.2, 0.3, 0.4, 0.49, 0.51, 1]).map(([k, v]) => `${k}: ${pct(v / lost)}`).join(", "));
console.log("Losses by guess number:", [1, 2, 3, 4, 5].map((i) => `#${i}${i === 5 ? "+" : ""}: ${pct(fatal.filter((g) => (i === 5 ? g.index >= 5 : g.index === i)).length / lost)}`).join(", "));
console.log("Losses by unknown cells left at the fatal guess:", bucket(fatal, (g) => g.unknowns, [8, 16, 30, 60, 1000]).map(([k, v]) => `${k}: ${pct(v / lost)}`).join(", "));
console.log("Loss mass: expected deaths from all guesses = " + guesses.reduce((a, g) => a + g.fraction, 0).toFixed(0) + " (actual " + lost + ")");
const byP = (lo, hi) => guesses.filter((g) => g.fraction > lo && g.fraction <= hi);
console.log("Expected deaths from 50/50-ish guesses (45-55%): " + byP(0.45, 0.55).reduce((a, g) => a + g.fraction, 0).toFixed(0) + ", from endgame guesses (<=16 unknowns): " + guesses.filter((g) => g.unknowns <= 16).reduce((a, g) => a + g.fraction, 0).toFixed(0));
console.log("Guesses with more than 3 cells tied at the lowest bomb probability: " + pct(guesses.filter((g) => g.tied > 3).length / guesses.length) + "; outsider guesses: " + pct(guesses.filter((g) => g.isOutsider).length / guesses.length) + "; first guesses (index 1) mean bomb prob " + pct(guesses.filter((g) => g.index === 1).reduce((a, g) => a + g.fraction, 0) / guesses.filter((g) => g.index === 1).length));
