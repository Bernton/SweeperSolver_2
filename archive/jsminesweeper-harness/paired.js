const fs = require("fs");
const [a, b] = process.argv.slice(2).map((f) => JSON.parse(fs.readFileSync(f)));
const n = a.length; let d = a.map((x, i) => b[i] - x);
const mean = d.reduce((s, x) => s + x, 0) / n;
const v = d.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1);
const disc = d.filter((x) => x !== 0).length;
console.log(`n=${n} A=${(100*a.reduce((s,x)=>s+x,0)/n).toFixed(2)} B=${(100*b.reduce((s,x)=>s+x,0)/n).toFixed(2)} B-A=${(100*mean).toFixed(2)} ± ${(100*Math.sqrt(v/n)).toFixed(2)} (1 SE), discordant ${disc}`);
