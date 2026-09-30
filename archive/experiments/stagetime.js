const fs = require("fs");
const { createSolver } = require("/home/user/SweeperSolver_2/bench/sandbox");
const dir = process.argv[2], [w, h, b, n, reps] = process.argv.slice(3).map(Number);
const names = (process.env.NAMES || "current,no0,no1,no2,no12,none").split(",");
const solvers = names.map((name) => createSolver(fs.readFileSync(dir + "/" + name + ".js", "utf8")));
const totals = names.map(() => 0), steps = names.map(() => 0);
for (let r = 0; r < reps; r++) {
  names.forEach((name, i) => {
    const t0 = performance.now();
    for (let s = 1; s <= n; s++) steps[i] += solvers[i].playGame({ width: w, height: h, bombs: b }, s).steps;
    totals[i] += performance.now() - t0;
  });
}
console.log(`${w}x${h}/${b}, ${n} games x ${reps}: ` + names.map((name, i) => `${name} ${(totals[i] / n / reps).toFixed(2)} ms (${(steps[i] / n / reps).toFixed(0)} steps)`).join(" | "));
