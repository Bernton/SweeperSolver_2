const fs = require("fs");
let src = fs.readFileSync("proto-all.js", "utf8");
let [w, h, b, games] = process.argv.slice(2).map(Number);
let res = {};
for (let sb of ["./sandbox1.js", "./sandbox2.js"]) {
  let s = require(sb).createSolver(src); let out = []; let t0 = performance.now();
  for (let i = 1; i <= games; i++) { let r = s.playGame({ width: w, height: h, bombs: b }, i); out.push(r.forcedWinChance); }
  res[sb] = { out: JSON.stringify(out), sweeps: s.ctx.__forcedSweeps, ms: performance.now() - t0 };
}
console.log(`${w}x${h}/${b}: identical forced results ${res["./sandbox1.js"].out === res["./sandbox2.js"].out}; forced-check sweeps ${res["./sandbox1.js"].sweeps} -> ${res["./sandbox2.js"].sweeps}; wall ${res["./sandbox1.js"].ms.toFixed(0)} -> ${res["./sandbox2.js"].ms.toFixed(0)} ms`);
