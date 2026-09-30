const fs = require("fs");
const R = [0,1,2,3].flatMap((i) => JSON.parse(fs.readFileSync(`repoi-${i}.json`)));
const J = JSON.parse(fs.readFileSync("jsbench/res-base-boards-1-10000.json"));
console.log("repo wins", R.reduce((s, g) => s + g.won, 0));
const cats = {};
const add = (k, j, r, extra) => { let c = (cats[k] = cats[k] || { games: 0, jsOnly: 0, repoOnly: 0, dF: 0 }); c.games++; if (j && !r) c.jsOnly++; if (r && !j) c.repoOnly++; c.dF += extra; };
let jsRiskSum = 0, repoRiskSum = 0, nDiv = 0;
for (let i = 0; i < R.length; i++) {
  const r = R[i], j = J[i];
  if (!r.guesses.length || !j.glist.length) continue;
  const rg = r.guesses[0], jg = j.glist[0];
  if (rg[0] === jg[0] && rg[1] === jg[1]) continue;
  const info = rg[3];
  if (!info) { add("no info", j.won, r.won, 0); continue; }
  const rc = info.chosen;
  let jc = info.list.find((c) => c.x === jg[0] && c.y === jg[1]);
  let jsOut = false, jf;
  if (jc) { jf = jc.f; jsOut = jc.out; } else { jf = 1 - jg[3]; jsOut = "offlist"; }
  const jsProbMine = 1 - jg[3];
  nDiv++; jsRiskSum += jsProbMine; repoRiskSum += rc.f;
  const d = jsProbMine - rc.f;
  let rank = info.list.filter((c) => c.f < jsProbMine - 1e-9).length; // number of repo candidates strictly safer than JS's cell
  let type = Math.abs(d) < 1e-6 ? "same bomb prob (tie)" : d > 0 ? "JS riskier cell" : "JS safer cell";
  let where = (rc.out ? "repo off-edge" : "repo on-edge") + " / " + (jsOut === "offlist" ? "JS off-edge (not repo's outsider)" : jsOut ? "JS = repo's outsider" : "JS on-edge");
  add(type, j.won, r.won, d);
  add(type + " | " + where, j.won, r.won, d);
  if (type !== "same bomb prob (tie)") add(type + " | JS cell rank among repo list " + (rank < 3 ? "top3" : ">3"), j.won, r.won, d);
}
console.log("first-guess divergences", nDiv, "mean mine prob JS", (jsRiskSum / nDiv).toFixed(4), "repo", (repoRiskSum / nDiv).toFixed(4));
for (const [k, c] of Object.entries(cats).sort()) console.log(k.padEnd(95), c.games, "net", c.jsOnly - c.repoOnly, "(js", c.jsOnly, "repo", c.repoOnly + ")", "mean dP", (c.dF / c.games).toFixed(4));
