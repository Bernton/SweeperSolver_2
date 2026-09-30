// Records the inputs of every searchEndgame call during real games (JSON lines)
const fs = require("fs");
const { createSolver } = require("/home/user/SweeperSolver_2/bench/sandbox.js");
let [w, h, b, games, out] = process.argv.slice(2);
let src = fs.readFileSync("base.js", "utf8") + `
(function () { let orig = searchEndgame; console.__eg = []; searchEndgame = function (...args) { console.__eg.push(JSON.stringify(args)); return orig(...args); }; })();`;
let solver = createSolver(src);
for (let i = 0; i < +games; i++) solver.playGame({ width: +w, height: +h, bombs: +b }, i + 1);
fs.writeFileSync(out, console.__eg.join("\n"));
console.log(out, console.__eg.length);
