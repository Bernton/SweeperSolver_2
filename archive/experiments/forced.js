// Classifies guesses: "forced" when no unknown cell can give information (every unknown cell would show the same
// number in all bomb configurations where it is safe), so nothing can be optimized anymore.
const fs = require("fs"), vm = require("vm");
const { mulberry32 } = require("/home/user/SweeperSolver_2/bench/sandbox");
const [file, w, h, b, n] = [process.argv[2], ...process.argv.slice(3).map(Number)];
const m = Object.create(Math); m.seedrandom = function (s) { return mulberry32(s); };
const ctx = { console, performance, setTimeout, Math: m, document: { addEventListener() {} } }; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(file, "utf8"), ctx);
const cfg = { width: w, height: h, bombAmount: b };
const nb = (f, c) => { const r = []; for (let y = c.y - 1; y <= c.y + 1; y++) for (let x = c.x - 1; x <= c.x + 1; x++) if ((x !== c.x || y !== c.y) && f[y] && f[y][x]) r.push(f[y][x]); return r; };
function isForced(field) {
  const unknowns = field.flat().filter((c) => c.isUnknown);
  if (unknowns.length > 30) return false;
  for (const c of unknowns) {
    const neighbors = nb(field, c);
    const flagged = neighbors.filter((x) => x.isFlagged).length, hidden = neighbors.filter((x) => x.isFlagged || x.isUnknown).length;
    let possible = 0;
    for (let v = flagged; v <= hidden; v++) {
      const hyp = field.map((row) => row.slice());
      hyp[c.y][c.x] = { x: c.x, y: c.y, value: v, isDigit: true, isHidden: false, isUnknown: false, isFlagged: false, isRevealedBomb: false };
      if (ctx.sweep(hyp, b, false, false, true).analysis.logWeight > -Infinity && ++possible > 1) return false;
    }
  }
  return true;
}
let wins = 0; const guesses = []; const fatal = [];
for (let seed = 1; seed <= n; seed++) {
  ctx.setWindowSeedRng(); ctx.setSeed(seed); ctx.restartVirtualGame(cfg);
  let last = null;
  while (true) {
    ctx.__guess = null;
    const r = ctx.sweepPage(true, false, { isVirtualMode: true, virtualGameConfig: cfg });
    if (r.state === "solved") { wins++; break; }
    if (r.state === "death") { fatal.push(last); break; }
    if (ctx.__guess) { last = { ...ctx.__guess, forced: isForced(ctx.virtualGame.field), index: guesses.filter((g) => g.seed === seed).length + 1, seed: seed }; guesses.push(last); }
    ctx.executeInteractions(r.interactions, true, true);
  }
}
const lost = n - wins, pct = (x) => (100 * x).toFixed(1) + "%", mass = (arr) => arr.reduce((a, g) => a + g.fraction, 0);
const forcedLosses = fatal.filter((g) => g.forced), forcedGuesses = guesses.filter((g) => g.forced);
console.log(`${w}x${h}/${b}: ${n} games, won ${pct(wins / n)}, lost ${lost}`);
console.log(`Forced guesses: ${forcedGuesses.length} of ${guesses.length} (${pct(forcedGuesses.length / guesses.length)}), expected deaths ${mass(forcedGuesses).toFixed(0)} of ${mass(guesses).toFixed(0)} (${pct(mass(forcedGuesses) / mass(guesses))})`);
console.log(`Losses on forced guesses: ${forcedLosses.length} (${pct(forcedLosses.length / lost)} of losses); of those at 49-51%: ${pct(forcedLosses.filter((g) => g.fraction > 0.49 && g.fraction < 0.51).length / Math.max(1, forcedLosses.length))}`);
const avoidable = fatal.filter((g) => !g.forced);
console.log(`Losses on non-forced guesses: ${avoidable.length}; of those with <= 16 unknowns: ${avoidable.filter((g) => g.unknowns <= 16).length}, at 49-51%: ${avoidable.filter((g) => g.fraction > 0.49 && g.fraction < 0.51).length}`);
console.log(`Win rate if forced guesses were free: ${pct((wins + forcedLosses.length) / n)} (upper bound for what could be gained elsewhere: ${pct((n - wins - forcedLosses.length) / n)} of games)`);
const nf = guesses.filter((g) => !g.forced), nfl = avoidable;
const row = (label, f) => console.log(`  ${label}: losses ${f(nfl).length} (${pct(f(nfl).length / n)} of games), expected deaths ${mass(f(nf)).toFixed(0)} from ${f(nf).length} guesses (avg bomb prob ${pct(mass(f(nf)) / Math.max(1, f(nf).length))})`);
console.log("Non-forced guesses by guess number:");
[1, 2, 3].forEach((i) => row("#" + i, (a) => a.filter((g) => g.index === i)));
row("#4+", (a) => a.filter((g) => g.index >= 4));
console.log("Non-forced guesses by unknown cells left:");
row("<=16", (a) => a.filter((g) => g.unknowns <= 16));
row("17-60", (a) => a.filter((g) => g.unknowns > 16 && g.unknowns <= 60));
row(">60", (a) => a.filter((g) => g.unknowns > 60));
row("outsider guesses", (a) => a.filter((g) => g.isOutsider));
