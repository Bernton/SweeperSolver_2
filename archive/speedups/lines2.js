const fs = require("fs");
let p = JSON.parse(fs.readFileSync(process.argv[2])); let file = process.argv[3];
let lines = new Map(); let all = p.samples.length;
p.nodes.forEach(n => { if (!n.callFrame.url.endsWith(file)) return; (n.positionTicks || []).forEach(t => lines.set(t.line, (lines.get(t.line) || 0) + t.ticks)); });
let sum = [...lines.values()].reduce((a, b) => a + b, 0);
console.log(file, "total", (100 * sum / all).toFixed(1) + "%");
[...lines].sort((a, b) => b[1] - a[1]).slice(0, +(process.argv[4] || 15)).forEach(([l, t]) => console.log((100 * t / all).toFixed(1).padStart(5) + "% " + l));
