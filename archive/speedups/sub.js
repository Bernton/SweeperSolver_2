// inclusive time of functions within stacks containing a given ancestor function name
const fs = require("fs");
let p = JSON.parse(fs.readFileSync(process.argv[2])); let anc = process.argv[3];
let byId = new Map(); p.nodes.forEach(n => byId.set(n.id, n));
let parent = new Map(); p.nodes.forEach(n => (n.children || []).forEach(c => parent.set(c, n.id)));
let dt = new Map(); let total = 0;
for (let i = 0; i < p.samples.length; i++) { dt.set(p.samples[i], (dt.get(p.samples[i]) || 0) + (p.timeDeltas[i] || 0)); total += p.timeDeltas[i] || 0; }
let incl = new Map(), sub = 0;
p.nodes.forEach(n => { let t = dt.get(n.id) || 0; if (!t) return; let chain = []; let id = n.id; while (id !== undefined) { chain.push(byId.get(id).callFrame.functionName + ":" + (byId.get(id).callFrame.lineNumber + 1)); id = parent.get(id); }
  let ai = chain.findIndex(c => c.startsWith(anc + ":")); if (ai < 0) return; sub += t; new Set(chain.slice(0, ai)).forEach(k => incl.set(k, (incl.get(k) || 0) + t)); });
console.log(anc, "=", (100 * sub / total).toFixed(1) + "% of total");
[...incl].sort((a, b) => b[1] - a[1]).slice(0, +(process.argv[4] || 20)).forEach(([k, v]) => console.log((100 * v / sub).toFixed(1).padStart(5) + "% of subtree  " + k));
