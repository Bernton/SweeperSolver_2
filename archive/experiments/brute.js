// Brute-force check of the look-ahead analysis: for positions at guess steps on small boards, compare
// the analysis (configuration count per revealed value, best safety) with full enumeration.
const fs = require("fs"), vm = require("vm");
const { mulberry32 } = require("/home/user/SweeperSolver_2/bench/sandbox");
const [W, H, B, games] = process.argv.slice(2).map(Number);
const m = Object.create(Math); m.seedrandom = function (s) { return mulberry32(s); };
const ctx = { console, performance, setTimeout, Math: m, document: { addEventListener() {} } }; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(process.argv[6] || "/home/user/SweeperSolver_2/sweeper.js", "utf8"), ctx);
vm.runInContext("solverConfig.guessLookaheadCandidates = 0", ctx);
const cfg = { width: W, height: H, bombAmount: B };
const nb = (x, y) => { const r = []; for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { const a = x + dx, b = y + dy; if ((dx || dy) && a >= 0 && a < W && b >= 0 && b < H) r.push([a, b]); } return r; };
function* subsets(arr, k, start = 0, acc = []) { if (acc.length === k) { yield acc; return; } for (let i = start; i <= arr.length - (k - acc.length); i++) { acc.push(arr[i]); yield* subsets(arr, k, i + 1, acc); acc.pop(); } }
function brute(field, flagsLeft) {
  const unknown = [], digits = [];
  field.forEach((row) => row.forEach((c) => { if (c.isUnknown) unknown.push(c); else if (!c.isHidden && !c.isRevealedBomb) digits.push(c); }));
  if (flagsLeft < 0 || flagsLeft > unknown.length) return { configs: [], unknown };
  const configs = [];
  for (const sub of subsets(unknown.map((c, i) => i), flagsLeft)) {
    const mine = new Set(sub.map((i) => unknown[i]));
    let ok = true;
    for (const d of digits) { let n = 0; for (const [a, b] of nb(d.x, d.y)) { const c = field[b][a]; if (c.isFlagged || mine.has(c)) n++; } if (n !== d.value) { ok = false; break; } }
    if (ok) configs.push(mine);
  }
  return { configs, unknown };
}
let checked = 0, bad = 0;
for (let seed = 1; seed <= games; seed++) {
  ctx.setWindowSeedRng(); ctx.setSeed(seed); ctx.restartVirtualGame(cfg);
  for (let step = 0; step < 200; step++) {
    const r = ctx.sweepPage(true, false, { isVirtualMode: true, virtualGameConfig: cfg });
    if (r.state === "solved" || r.state === "death") break;
    const field = ctx.virtualGame.field;
    const unknownCount = field.flat().filter((c) => c.isUnknown).length;
    if (r.solver && r.solver.includes("g") && unknownCount <= 22) {
      const flags = field.flat().filter((c) => c.isFlagged).length;
      const base = brute(field, B - flags);
      for (const c of base.unknown) {
        const safeConfigs = base.configs.filter((cf) => !cf.has(c));
        if (safeConfigs.length === 0) continue;
        const byValue = new Map();
        for (const cf of safeConfigs) { let v = 0; for (const [a, b] of nb(c.x, c.y)) { const n = field[b][a]; if (n.isFlagged || cf.has(n)) v++; } if (!byValue.has(v)) byValue.set(v, []); byValue.get(v).push(cf); }
        for (let v = 0; v <= 8; v++) {
          const hyp = field.map((row) => row.slice());
          hyp[c.y][c.x] = { x: c.x, y: c.y, value: v, isDigit: true, isHidden: false, isUnknown: false, isFlagged: false, isRevealedBomb: false };
          if (nb(c.x, c.y).filter(([a, b]) => field[b][a].isFlagged).length > v) continue;
          if (nb(c.x, c.y).filter(([a, b]) => field[b][a].isFlagged || field[b][a].isUnknown).length < v) continue;
          const a = ctx.sweep(hyp, B, false, false, true).analysis;
          const cfs = byValue.get(v) || [];
          const expCount = cfs.length;
          let expSafety = 0;
          if (expCount > 0) {
            const others = base.unknown.filter((u) => u !== c);
            let minFrac = 1;
            for (const u of others) { const f = cfs.filter((cf) => cf.has(u)).length / expCount; minFrac = Math.min(minFrac, f); }
            const won = others.every((u) => cfs.every((cf) => cf.has(u)));
            expSafety = won || others.length === 0 ? 1 : 1 - minFrac;
          }
          const gotCount = Math.exp(a.logWeight);
          const countOk = Math.abs(gotCount - expCount) <= 1e-6 * Math.max(1, expCount);
          const safetyOk = expCount === 0 || Math.abs(a.bestSafety - expSafety) < 1e-9;
          checked++;
          if (!countOk || !safetyOk) { bad++; if (bad <= 5) console.log("MISMATCH seed", seed, "cell", c.x, c.y, "v", v, "count got", gotCount, "expected", expCount, "safety got", a.bestSafety, "expected", expSafety); }
        }
      }
    }
    ctx.executeInteractions(r.interactions, true, true);
  }
}
console.log("checked", checked, "hypothetical positions,", bad, "mismatches");
