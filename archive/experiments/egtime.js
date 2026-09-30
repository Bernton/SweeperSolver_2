const fs = require("fs");
const { createSolver } = require("/home/user/SweeperSolver_2/bench/sandbox");
const [n, reps] = process.argv.slice(2).map(Number);
const variants = [
  ["no search", "/home/user/SweeperSolver_2/sweeper.js", { endgameSearchMaxUnknowns: 0 }],
  ...[12, 16, 20].flatMap((max) => [
    ["max " + max + " without pruning", process.env.NOPRUNE, { endgameSearchMaxUnknowns: max }],
    ["max " + max + " with pruning", "/home/user/SweeperSolver_2/sweeper.js", { endgameSearchMaxUnknowns: max }]
  ])
];
const solvers = variants.map(([, file, cfg]) => createSolver(fs.readFileSync(file, "utf8"), cfg));
const totals = variants.map(() => 0), wins = variants.map(() => 0);
for (let r = 0; r < reps; r++) variants.forEach((v, i) => { const t0 = performance.now(); for (let s = 1; s <= n; s++) wins[i] += solvers[i].playGame({ width: 30, height: 16, bombs: 99 }, s).won; totals[i] += performance.now() - t0; });
variants.forEach(([name], i) => console.log(name.padEnd(26), (totals[i] / n / reps).toFixed(2), "ms/game, wins", wins[i] / reps));
