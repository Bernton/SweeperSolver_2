// usage: node play.js <sweeper.js path> <w> <h> <bombs> <games> [firstSeed]
const fs = require("fs");
const { createSolver } = require("/home/user/SweeperSolver_2/bench/sandbox.js");
let [src, w, h, b, games, seed] = process.argv.slice(2);
w = +w; h = +h; b = +b; games = +games; seed = +(seed || 1);
let solver = createSolver(fs.readFileSync(src, "utf8"));
let board = { width: w, height: h, bombs: b };
let t0 = performance.now(), wins = 0, maxStep = 0, steps = 0, guesses = 0, stime = 0;
for (let i = 0; i < games; i++) {
  let r = solver.playGame(board, seed + i);
  if (r.error) console.log("error", r.error);
  wins += r.won; maxStep = Math.max(maxStep, r.maxStepTime); steps += r.steps; guesses += r.guesses; stime += r.time;
}
let t = performance.now() - t0;
console.log(JSON.stringify({ board: `${w}x${h}/${b}`, games, wins, steps, guesses, msPerGame: +(t / games).toFixed(2), sweepMsPerGame: +(stime/games).toFixed(2), maxStep: +maxStep.toFixed(1) }));
