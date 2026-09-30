const fs = require("fs");
const R = [0,1,2,3].flatMap((i) => JSON.parse(fs.readFileSync(`repog-${i}.json`)));
const J = JSON.parse(fs.readFileSync("jsbench/res-base-boards-1-10000.json"));
const buckets = {};
const add = (k, dj, dr, extra) => { let b = (buckets[k] = buckets[k] || { games: 0, jsOnly: 0, repoOnly: 0, jsProbLower: 0, jsProbHigher: 0, same: 0 }); b.games++; if (dj && !dr) b.jsOnly++; if (dr && !dj) b.repoOnly++; if (extra) b[extra]++; };
let identical = 0, idDiff = 0;
const repoProb = new Map();
for (let i = 0; i < R.length; i++) {
  const r = R[i], j = J[i]; const rg = r.guesses, jg = j.glist;
  let k = 0; while (k < rg.length && k < jg.length && rg[k][0] === jg[k][0] && rg[k][1] === jg[k][1]) k++;
  if (k === rg.length && k === jg.length) { identical++; if (r.won !== (j.won ? 1 : 0)) idDiff++; continue; }
  // phase by unknown count at divergence (use whichever side guessed)
  let unk = k < rg.length ? rg[k][2] : jg[k][2];
  let phase = k === 0 ? "1st guess" : "later";
  let u = unk > 60 ? ">60" : unk > 28 ? "29-60" : "<=28";
  let how = k >= rg.length ? "JS guessed, repo no guess" : k >= jg.length ? "repo guessed, JS no guess" : "different cell";
  add(u + " | " + how, j.won, r.won);
  add("ALL " + u, j.won, r.won);
  add("guess# " + phase, j.won, r.won);
}
console.log("identical guess sequences:", identical, "(outcome differs:", idDiff + ")");
for (const [k, b] of Object.entries(buckets).sort()) console.log(k.padEnd(45), JSON.stringify({ games: b.games, net_js_minus_repo: b.jsOnly - b.repoOnly, jsOnly: b.jsOnly, repoOnly: b.repoOnly }));
