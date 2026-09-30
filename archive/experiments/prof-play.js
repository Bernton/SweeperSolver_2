const fs = require("fs");
const { createSolver } = require("/home/user/SweeperSolver_2/bench/sandbox");
const [w, h, b, n] = process.argv.slice(2).map(Number);
const solver = createSolver(fs.readFileSync("/home/user/SweeperSolver_2/sweeper.js", "utf8"));
let t0 = Date.now(), steps = 0, guesses = 0;
for (let s = 1; s <= n; s++) { const r = solver.playGame({ width: w, height: h, bombs: b }, s); steps += r.steps; guesses += r.guesses; }
console.log(`${w}x${h}/${b}: ${n} games, ${(Date.now() - t0) / n} ms/game, ${steps / n} steps/game, ${guesses / n} guesses/game`);
