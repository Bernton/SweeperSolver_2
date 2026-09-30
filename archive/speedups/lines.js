// line-level self ticks for sweeper.js functions
const fs = require("fs");
let p = JSON.parse(fs.readFileSync(process.argv[2]));
let lines = new Map(); let total = 0;
p.nodes.forEach(n => { (n.positionTicks || []).forEach(t => { total += t.ticks; if (n.callFrame.url.endsWith("sweeper.js")) { let k = t.line; lines.set(k, (lines.get(k) || 0) + t.ticks); } }); });
let all = p.samples.length;
[...lines].sort((a, b) => b[1] - a[1]).slice(0, +(process.argv[3] || 25)).forEach(([l, t]) => console.log((100 * t / all).toFixed(1).padStart(5) + "%  line " + l));
