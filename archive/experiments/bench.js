const fs = require('fs'); const vm = require('vm');
const src = fs.readFileSync(process.argv[2], 'utf8');
const N = Number(process.argv[3] || 2000);
const W = Number(process.argv[4] || 30), H = Number(process.argv[5] || 16), B = Number(process.argv[6] || 99);
// simple seeded rng (mulberry32)
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const ctx = { console, performance, setTimeout, document: { addEventListener(){} }, Math: Object.create(Math) };
ctx.window = ctx; ctx.Math.seedrandom = function(s){ return mulberry32(s); };
vm.createContext(ctx);
const harness = `
;(function(){
  const cfg = { width: ${W}, height: ${H}, bombAmount: ${B} };
  let wins = 0, guesses = 0, deaths = 0, errors = 0, maxStep = 0;
  const t0 = performance.now();
  for (let g = 0; g < ${N}; g++) {
    setWindowSeedRng(); window.setSeed(g + 1);
    restartVirtualGame(cfg);
    let steps = 0;
    try {
      while (true) {
        const s0 = performance.now();
        const r = sweepPage(true, false, { isVirtualMode: true, virtualGameConfig: cfg }, null);
        maxStep = Math.max(maxStep, performance.now() - s0);
        if (r.state === 'solved') { wins++; break; }
        if (r.state === 'death') { deaths++; break; }
        if (r.solver && r.solver.includes('g')) guesses++;
        executeInteractions(r.interactions, true, true);
        if (++steps > 5000) throw new Error('loop');
      }
    } catch (e) { errors++; if (errors < 4) console.log('game', g, e.message); }
  }
  const t = performance.now() - t0;
  console.log(JSON.stringify({ games: ${N}, wins, winRate: (100*wins/${N}).toFixed(2)+'%', avgGuesses: (guesses/${N}).toFixed(2), errors, msPerGame: (t/${N}).toFixed(1), maxStepMs: maxStep.toFixed(0) }));
})();`;
vm.runInContext(src + harness, ctx);
