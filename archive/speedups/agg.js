// aggregate self time by function from a .cpuprofile
const fs = require("fs");
let p = JSON.parse(fs.readFileSync(process.argv[2]));
let self = new Map(), byId = new Map();
p.nodes.forEach(n => byId.set(n.id, n));
let dt = new Map();
for (let i = 0; i < p.samples.length; i++) dt.set(p.samples[i], (dt.get(p.samples[i]) || 0) + (p.timeDeltas[i] || 0));
let total = 0;
p.nodes.forEach(n => { let t = dt.get(n.id) || 0; total += t; let k = n.callFrame.functionName + " " + (n.callFrame.url.split("/").pop()) + ":" + (n.callFrame.lineNumber + 1); self.set(k, (self.get(k) || 0) + t); });
// inclusive
let parent = new Map(); p.nodes.forEach(n => (n.children || []).forEach(c => parent.set(c, n.id)));
let incl = new Map();
p.nodes.forEach(n => { let t = dt.get(n.id) || 0; if (!t) return; let seen = new Set(); let id = n.id; while (id !== undefined) { let m = byId.get(id); let k = m.callFrame.functionName + " " + (m.callFrame.url.split("/").pop()) + ":" + (m.callFrame.lineNumber + 1); if (!seen.has(k)) { seen.add(k); incl.set(k, (incl.get(k) || 0) + t); } id = parent.get(id); } });
let top = +(process.argv[3] || 30);
console.log("total ms", (total / 1000).toFixed(0));
console.log("--- self");
[...self].sort((a, b) => b[1] - a[1]).slice(0, top).forEach(([k, v]) => console.log((100 * v / total).toFixed(1).padStart(5) + "%  " + k));
console.log("--- inclusive");
[...incl].sort((a, b) => b[1] - a[1]).slice(0, top).forEach(([k, v]) => console.log((100 * v / total).toFixed(1).padStart(5) + "%  " + k));
