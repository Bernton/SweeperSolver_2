const fs = require("fs");
const R = [0,1,2,3].flatMap((i) => JSON.parse(fs.readFileSync(`repoi-${i}.json`)));
const J = JSON.parse(fs.readFileSync("jsbench/res-base-boards-1-10000.json"));
const cats = {};
const add = (k, j, r) => { let c = (cats[k] = cats[k] || { games: 0, jsOnly: 0, repoOnly: 0 }); c.games++; if (j && !r) c.jsOnly++; if (r && !j) c.repoOnly++; };
const hist = {};
for (let i = 0; i < R.length; i++) {
  const r = R[i], j = J[i];
  if (!r.guesses.length || !j.glist.length) continue;
  const rg = r.guesses[0], jg = j.glist[0];
  if (rg[0] === jg[0] && rg[1] === jg[1]) continue;
  const info = rg[3]; if (!info) continue;
  const jsP = 1 - jg[3], rc = info.chosen;
  const d = jsP - rc.f;
  if (d > 1e-6) { let b = jsP >= 0.49 && jsP <= 0.51 ? "JS 50%" : jsP > 0.3 ? "JS >30%" : "JS <=30%"; add("riskier: " + b, j.won, r.won); hist[b] = (hist[b] || 0) + 1;
     // did JS guess while the repo still had unknown count higher (i.e. JS guessed earlier, with safe cells pending)?
     add("riskier: unknowns JS " + (jg[2] > rg[2] ? ">" : jg[2] < rg[2] ? "<" : "=") + " repo", j.won, r.won);
  }
  if (Math.abs(d) < 1e-6) {
    let jc = info.list.find((c) => c.x === jg[0] && c.y === jg[1]);
    let evaluated = jc && jc.ev !== undefined;
    let tiedCount = info.list.filter((c) => Math.abs(c.f - rc.f) < 1e-9).length;
    add("tie: JS cell " + (evaluated ? "evaluated by repo look-ahead" : "NOT evaluated (outside top 3)"), j.won, r.won);
    add("tie: tied cells " + (tiedCount <= 3 ? "<=3" : tiedCount <= 6 ? "4-6" : ">6"), j.won, r.won);
    if (evaluated) add("tie evaluated: repo ev(JS cell) " + (jc.ev < info.list.find((c) => c.x === rc.x && c.y === rc.y).ev - 1e-9 ? "< repo choice" : "= repo choice"), j.won, r.won);
  }
}
for (const [k, c] of Object.entries(cats).sort()) console.log(k.padEnd(60), c.games, "net", c.jsOnly - c.repoOnly, "(js", c.jsOnly, "repo", c.repoOnly + ")");
