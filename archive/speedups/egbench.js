// Replays captured searchEndgame inputs on two implementations, alternating, CPU time; checks identical results
const fs = require("fs"), vm = require("vm");
function load(file, name) { let ctx = { console, performance, setTimeout, Math, document: { addEventListener() {} } }; ctx.window = ctx; vm.createContext(ctx); vm.runInContext(fs.readFileSync(file, "utf8"), ctx, { filename: name }); return ctx; }
let [a, b, data, reps] = process.argv.slice(2); reps = +(reps || 3);
let A = load(a, "A.js"), B = load(b, "B.js");
let cases = fs.readFileSync(data, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
let cpu = () => { let u = process.cpuUsage(); return (u.user + u.system) / 1000; };
let ta = 0, tb = 0, mism = 0, nulls = 0, taNull = 0, tbNull = 0;
for (let r = 0; r < reps; r++) {
  cases.forEach((args, k) => {
    let order = (k + r) % 2 ? [[A, "a"], [B, "b"]] : [[B, "b"], [A, "a"]]; let res = {};
    for (let [ctx, name] of order) { let t0 = cpu(); res[name] = ctx.searchEndgame(...args); let t = cpu() - t0; if (name === "a") ta += t; else tb += t; res[name + "t"] = t; }
    if (JSON.stringify(res.a) !== JSON.stringify(res.b)) mism++;
    if (res.a === null) { nulls++; taNull += res.at; tbNull += res.bt; }
  });
}
console.log(`cases ${cases.length} x ${reps}: mismatches ${mism}; A ${ta.toFixed(0)} ms, B ${tb.toFixed(0)} ms, B/A ${(tb / ta).toFixed(3)}; budget-exceeded cases ${nulls / reps}: A ${taNull.toFixed(0)} ms B ${tbNull.toFixed(0)} ms`);
