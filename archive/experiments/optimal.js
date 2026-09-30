// Empirical test of "forced = unoptimizable": for endgame positions from real games, compare
// (a) the exact optimal win probability (search over all adaptive strategies, all bomb configurations),
// (b) the solver's exact win probability from that position (played once against every configuration),
// (c) 1 / number of configurations (the claimed optimum of forced positions).
const fs = require("fs"), vm = require("vm");
const { mulberry32 } = require("/home/user/SweeperSolver_2/bench/sandbox");
const [w, h, b, games, maxUnknowns] = process.argv.slice(2).map(Number);
const m = Object.create(Math); m.seedrandom = function (s) { return mulberry32(s); };
const ctx = { console, performance, setTimeout, Math: m, document: { addEventListener() {} } }; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync("/home/user/SweeperSolver_2/sweeper.js", "utf8"), ctx);
const cfg = { width: w, height: h, bombAmount: b }, config = { isVirtualMode: true, virtualGameConfig: cfg };
const inside = (x, y) => x >= 0 && x < w && y >= 0 && y < h;
const neighborsOf = (x, y) => { const r = []; for (let yy = y - 1; yy <= y + 1; yy++) for (let xx = x - 1; xx <= x + 1; xx++) if ((xx !== x || yy !== y) && inside(xx, yy)) r.push([xx, yy]); return r; };
const popcount = (v) => { let c = 0; while (v) { v &= v - 1; c++; } return c; };

function analyzePosition(field) {
  const unknowns = [], index = new Map();
  field.forEach((row) => row.forEach((c) => { if (c.isUnknown) { index.set(c, unknowns.length); unknowns.push(c); } }));
  const flags = field.flat().filter((c) => c.isFlagged).length, bombsLeft = b - flags;
  const maskOf = (c) => neighborsOf(c.x, c.y).reduce((mask, [x, y]) => (index.has(field[y][x]) ? mask | (1 << index.get(field[y][x])) : mask), 0);
  const flaggedAround = (c) => neighborsOf(c.x, c.y).filter(([x, y]) => field[y][x].isFlagged).length;
  const digits = field.flat().filter((c) => !c.isHidden && c.value > 0 && neighborsOf(c.x, c.y).some(([x, y]) => field[y][x].isUnknown)).map((c) => ({ mask: maskOf(c), need: c.value - flaggedAround(c) }));
  const configs = [];
  const all = (1 << unknowns.length) - 1;
  for (let mask = 0; mask <= all; mask++) if (popcount(mask) === bombsLeft && digits.every((d) => popcount(mask & d.mask) === d.need)) configs.push(mask);
  const cellMask = unknowns.map(maskOf), cellFlagged = unknowns.map(flaggedAround);
  const valueOf = (i, conf) => cellFlagged[i] + popcount(conf & cellMask[i]);
  // Forced: every unknown shows the same value in all configurations where it is safe
  const isForced = unknowns.every((c, i) => new Set(configs.filter((conf) => !(conf & (1 << i))).map((conf) => valueOf(i, conf))).size <= 1);
  // Optimal adaptive play: number of configurations won (uniform weights). A game ends with a win as soon as all
  // safe cells of the true configuration are revealed.
  const memo = new Map();
  const wins = (set, revealed) => {
    if (set.length === 0) return 0;
    const key = revealed + "|" + set.join(",");
    if (memo.has(key)) return memo.get(key);
    let best = 0;
    for (let i = 0; i < unknowns.length; i++) {
      if (revealed & (1 << i)) continue;
      const safe = set.filter((conf) => !(conf & (1 << i)));
      if (safe.length === 0) continue;
      const byValue = new Map();
      safe.forEach((conf) => { const v = valueOf(i, conf); if (!byValue.has(v)) byValue.set(v, []); byValue.get(v).push(conf); });
      const nextRevealed = revealed | (1 << i);
      let total = 0;
      byValue.forEach((sub) => {
        const won = sub.filter((conf) => ((~conf & all) & ~nextRevealed) === 0);
        total += won.length + wins(sub.filter((conf) => ((~conf & all) & ~nextRevealed) !== 0), nextRevealed);
      });
      if (total > best) best = total;
    }
    memo.set(key, best);
    return best;
  };
  const optimalWins = wins(configs, 0);
  return { unknowns, configs, isForced, optimalWins };
}

// The solver's result from the position with a given true configuration
function playFrom(snapshot, unknowns, conf) {
  ctx.restartVirtualGame(cfg);
  const field = ctx.virtualGame.field;
  field.forEach((row) => row.forEach((c) => Object.assign(c, snapshot[c.y][c.x])));
  unknowns.forEach((u, i) => (field[u.y][u.x].isBomb = !!(conf & (1 << i))));
  field.forEach((row) => row.forEach((c) => (c.bombValue = c.isBomb ? 0 : c.neighbors.filter((nb) => nb.isBomb).length)));
  ctx.virtualGame.hasStarted = true;
  for (let step = 0; step < 500; step++) {
    const r = ctx.sweepPage(true, false, config);
    if (r.state === "solved") return 1;
    if (r.state === "death") return 0;
    ctx.executeInteractions(r.interactions, true, true);
  }
  throw new Error("no end");
}

const stats = { forced: [], open: [] };
let mismatches = 0;
for (let seed = 1; seed <= games; seed++) {
  ctx.setWindowSeedRng(); ctx.setSeed(seed); ctx.restartVirtualGame(cfg);
  while (true) {
    const r = ctx.sweepPage(true, false, config);
    if (r.state === "solved" || r.state === "death") break;
    const field = ctx.virtualGame.field;
    if (r.guess && field.flat().filter((c) => c.isUnknown).length <= maxUnknowns) {
      const snapshot = field.map((row) => row.map((c) => ({ isHidden: c.isHidden, isUnknown: c.isUnknown, isFlagged: c.isFlagged, isDigit: c.isDigit, isRevealedBomb: c.isRevealedBomb, value: c.value, isBomb: c.isBomb, bombValue: c.bombValue })));
      const a = analyzePosition(field);
      const policyWins = a.configs.reduce((s, conf) => s + playFrom(snapshot, a.unknowns, conf), 0);
      const entry = { configs: a.configs.length, optimal: a.optimalWins / a.configs.length, policy: policyWins / a.configs.length };
      (a.isForced ? stats.forced : stats.open).push(entry);
      if (a.isForced && a.optimalWins !== 1) mismatches++;
      // restore the real game at this position
      field.forEach((row) => row.forEach((c) => Object.assign(c, snapshot[c.y][c.x])));
      ctx.virtualGame.hasStarted = true;
    }
    ctx.executeInteractions(r.interactions, true, true);
  }
}
const sum = (arr, f) => arr.reduce((a, e) => a + f(e), 0), pct = (x) => (100 * x).toFixed(2) + "%";
const report = (name, arr) => {
  const gap = arr.filter((e) => e.optimal - e.policy > 1e-9);
  console.log(`${name}: ${arr.length} positions, mean optimal ${pct(sum(arr, (e) => e.optimal) / arr.length)}, mean solver ${pct(sum(arr, (e) => e.policy) / arr.length)}, positions where the solver is below optimal: ${gap.length}, total gap ${sum(gap, (e) => e.optimal - e.policy).toFixed(2)} wins`);
};
report("Forced positions", stats.forced);
console.log(`Forced positions whose optimum is not exactly one configuration (1/configs): ${mismatches}`);
report("Other positions", stats.open);
