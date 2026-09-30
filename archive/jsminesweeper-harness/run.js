// Headless bulk run of DavidNHill/JSMinesweeper solver (modern rules: zero start at index 93 = (3,3) on 30x16/99)
// Usage: node run.js <firstGame> <games> <threads> <variant>
// variant: base | noLTR | noEarly5050 | noAdv
const fs = require("fs"), path = require("path"), vm = require("vm");
const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");
const DIR = path.join(__dirname, "..", "JSMinesweeper", "Minesweeper");
const FILES = ["client/Board.js", "client/Tile.js", "client/solver_main.js", "client/solver_probability_engine.js", "client/Brute_force.js",
  "client/BruteForceAnalysis.js", "client/MinesweeperGame.js", "client/SolutionCounter.js", "client/EfficiencyHelper.js",
  "client/FiftyFiftyHelper.js", "client/LongTermRiskHelper.js", "Utility/PrimeSieve.js", "Utility/Binomial.js"];

function makeContext(variant) {
  const ctx = { console: { log() {}, error() {}, warn() {} }, crypto: globalThis.crypto, BigUint64Array, BigInt64Array, Uint32Array, setTimeout, Promise, BigInt, Math, Date, performance };
  ctx.window = ctx;
  vm.createContext(ctx);
  let src = FILES.map((f) => fs.readFileSync(path.join(DIR, f), "utf8")).join("\n;\n");
  src += `
    const BOMB = 9, HIDDEN = 10, FLAGGED = 11, FLAGGED_WRONG = 12, EXPLODED = 13, SKULL = 14, START = 15, MINUS = 10;
    var oldrng = false; var analysisMode = false; var analysing = false;
    function showMessage() {}
    async function sleep() {}
    const MAX_BINOMIAL_N = 65000;
    var binomialCache = new BinomialCache(5000, 1000, new Binomial(MAX_BINOMIAL_N, 1000));
    var __variant = ${JSON.stringify(variant)};
    if (__variant === "noLTR") SolverGlobal.CALCULATE_LONG_TERM_SAFETY = false;
    if (__variant === "noEarly5050") SolverGlobal.EARLY_FIFTY_FIFTY_CHECKING = false;
    async function playOne(gameSeed, mines) {
      const options = { playStyle: PLAY_STYLE_NOFLAGS, verbose: false, advancedGuessing: __variant !== "noAdv", fullProbability: true, hardcore: false, guessPruning: true };
      const startIndex = 93;
      const game = new ServerGame(0, 30, 16, 99, startIndex, gameSeed, "zero");
      if (mines) { game.resetMinesUsingArray([30, 16, 99, ...mines]); game.startIndex = startIndex; }
      const board = new Board(0, 30, 16, 99, gameSeed, "zero");
      let tile = game.getTile(startIndex);
      let revealedTiles = game.clickTile(tile);
      applyResults(board, revealedTiles);
      let guesses = 0, loopCheck = 0, glist = [];
      while (revealedTiles.header.status == IN_PLAY && loopCheck++ < 10000) {
        const reply = await solver(board, options);
        const actions = reply.actions;
        for (let i = 0; i < actions.length; i++) {
          const action = actions[i];
          if (action.action == ACTION_CHORD || action.action == ACTION_FLAG) continue;
          if (i == 0 || action.prob == 1) {
            if (action.prob != 1) { guesses++; let unk = 0; for (const t of board.tiles) if (t.isCovered() && !t.isSolverFoundBomb()) unk++; glist.push([action.x, action.y, unk, action.prob]); }
            tile = game.getTile(board.xy_to_index(action.x, action.y));
            revealedTiles = game.clickTile(tile);
            if (revealedTiles.header.status != IN_PLAY) break;
            applyResults(board, revealedTiles);
          }
          if (action.prob != 1) break;
        }
      }
      return { won: revealedTiles.header.status == WON, guesses, glist };
    }
    solver(null);
    this.playOne = playOne;
  `;
  vm.runInContext(src, ctx);
  return ctx;
}

if (isMainThread) {
  const [first, games, threads, variant] = [Number(process.argv[2] || 1), Number(process.argv[3] || 100), Number(process.argv[4] || 4), process.argv[5] || "base"];
  let results = new Array(games), done = 0, t0 = Date.now();
  const per = Math.ceil(games / threads);
  for (let t = 0; t < threads; t++) {
    const from = t * per, to = Math.min(games, from + per);
    if (from >= to) continue;
    const w = new Worker(__filename, { workerData: { first, from, to, variant } });
    w.on("message", (m) => { results[m.i] = m.r; done++; if (done === games) finish(); });
    w.on("error", (e) => { console.error(e); process.exit(1); });
  }
  function finish() {
    const won = results.filter((r) => r.won).length;
    const p = won / games;
    fs.writeFileSync(path.join(__dirname, `res-${variant}${process.env.BOARDS ? "-boards" : ""}-${first}-${games}.json`), JSON.stringify(process.env.GLIST ? results : results.map((r) => (r.won ? 1 : 0))));
    console.log(`${variant}: won ${won}/${games} = ${(100 * p).toFixed(2)}% ± ${(100 * Math.sqrt(p * (1 - p) / games)).toFixed(2)} (1 SE), guesses/game ${(results.reduce((a, r) => a + r.guesses, 0) / games).toFixed(2)}, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
} else {
  const ctx = makeContext(workerData.variant);
  const boards = process.env.BOARDS ? process.env.BOARDS.split(",").flatMap((f) => JSON.parse(fs.readFileSync(f, "utf8"))) : null;
  (async () => {
    for (let i = workerData.from; i < workerData.to; i++) {
      // game seed derived from index, same for all variants
      const seed = (workerData.first + i) * 2654435761 % 9007199254740881;
      const r = await ctx.playOne(seed, boards ? boards[workerData.first - 1 + i].mines : null);
      parentPort.postMessage({ i, r });
    }
  })();
}
