const a = JSON.parse(require("fs").readFileSync(process.argv[2])), b = JSON.parse(require("fs").readFileSync(process.argv[3]));
let diffs = [];
a.forEach((v, vi) => v.forEach((p, pi) => p.forEach((g, i) => { if (JSON.stringify(g) !== JSON.stringify(b[vi][pi][i])) diffs.push(`v${vi} p${pi} i${i} seed${i+1}: ${JSON.stringify(g)} -> ${JSON.stringify(b[vi][pi][i])}`); })));
console.log(diffs.length + " diffs"); diffs.slice(0, 20).forEach((d) => console.log(d));
