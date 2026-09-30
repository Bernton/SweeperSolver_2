const fs = require("fs");
const repo = [0,1,2,3].flatMap((i) => JSON.parse(fs.readFileSync(`../repo-${i}.json`))).map((g) => g.won);
const js = JSON.parse(fs.readFileSync(process.argv[2]));
const n = Math.min(repo.length, js.length);
let d = []; for (let i = 0; i < n; i++) d.push(js[i] - repo[i]);
const mean = d.reduce((s, x) => s + x, 0) / n, v = d.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1);
console.log(`n=${n} repo=${(100*repo.slice(0,n).reduce((s,x)=>s+x,0)/n).toFixed(2)} js=${(100*js.slice(0,n).reduce((s,x)=>s+x,0)/n).toFixed(2)} js-repo=${(100*mean).toFixed(2)} ± ${(100*Math.sqrt(v/n)).toFixed(2)} (1 SE); js-only wins ${d.filter(x=>x>0).length}, repo-only wins ${d.filter(x=>x<0).length}`);
