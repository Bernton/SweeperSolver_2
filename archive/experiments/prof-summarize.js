const p = JSON.parse(require("fs").readFileSync(process.argv[2], "utf8"));
const self = {}; const dt = p.timeDeltas; const byId = {}; p.nodes.forEach((n) => (byId[n.id] = n));
const counts = {}; p.samples.forEach((id, i) => (counts[id] = (counts[id] || 0) + (dt[i] || 0)));
let total = 0;
for (const id in counts) { const n = byId[id]; const name = (n.callFrame.functionName || "(anon)") + " :" + (n.callFrame.lineNumber + 1) + " " + n.callFrame.url.split("/").pop(); self[name] = (self[name] || 0) + counts[id]; total += counts[id]; }
Object.entries(self).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => console.log((100 * v / total).toFixed(1).padStart(5) + "%  " + k));
