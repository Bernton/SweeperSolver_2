const fs = require("fs");
const { createSolver } = require("/home/user/SweeperSolver_2/bench/sandbox");
const src = fs.readFileSync("/home/user/SweeperSolver_2/sweeper.js", "utf8");
const base = createSolver(src, { guessLookaheadCandidates: 0 });
const la = createSolver(src, { guessLookaheadCandidates: 3 });
const board = { width: 9, height: 9, bombs: 75 };
let shown = 0;
for (let seed = 1; seed <= 200 && shown < 1; seed++) {
  const a = base.playGame(board, seed), b = la.playGame(board, seed);
  if (a.won && !b.won) { console.log("seed", seed, a, b); shown++; }
}
