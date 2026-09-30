// Compare the virtual game in sweeper.js against a faithful port of minesweeperonline.com's
// mine placement (functions l() and t() of the site's Minesweeper class).
// Usage: node verify.js <sweeper.js> dist <boards>   |   node verify.js <sweeper.js> play <games> <site|virtual>
const fs = require("fs");
const vm = require("vm");

const [file, mode, countArg, source = "site"] = process.argv.slice(2);
const count = Number(countArg);
const ROWS = 16, COLS = 30, MINES = 99;

function mulberry32(seed) {
    return function () {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ---- Port of the site's code: 1-based grid with a hidden border ring, mine = value < 0 ----
function siteMines(rng, B, a, m, Y, ae) {
    const val = Array.from({ length: B + 2 }, () => Array(a + 2).fill(0));
    const hidden = (r, c) => r < 1 || r > B || c < 1 || c > a;
    const isMine = (r, c) => val[r][c] < 0;
    const addAround = (r, c, d) => {
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (dr || dc) val[r + dr][c + dc] += d;
    };
    const plant = ([r, c]) => { val[r][c] -= 10; addAround(r, c, 1); };
    const unplant = ([r, c]) => { val[r][c] += 10; addAround(r, c, -1); };

    // l(): M = all visible cells, splice m random ones out and plant them
    let M = [];
    for (let r = 0; r <= B + 1; r++) for (let c = 0; c <= a + 1; c++) if (!hidden(r, c)) M.push([r, c]);
    for (let z = 0; z < m; z++) plant(M.splice(Math.floor(rng() * M.length), 1)[0]);

    // t(): first click at (Y, ae)
    if (isMine(Y, ae)) {
        plant(M.splice(Math.floor(rng() * M.length), 1)[0]);
        unplant([Y, ae]);
        M.push([Y, ae]);
    }
    let af = M.filter(([r, c]) => r < Y - 1 || r > Y + 1 || c < ae - 1 || c > ae + 1);
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (isMine(Y + dr, ae + dc) && af.length > 0) {
                plant(af.splice(Math.floor(rng() * af.length), 1)[0]);
                unplant([Y + dr, ae + dc]);
            }
        }
    }

    // return 0-based boolean grid
    return Array.from({ length: B }, (_, r) => Array.from({ length: a }, (_, c) => isMine(r + 1, c + 1)));
}

// ---- Load sweeper.js ----
let sandboxMath = Object.create(Math);
sandboxMath.seedrandom = function (seed) { return mulberry32(seed); };
let sb = { console, performance, setTimeout, Math: sandboxMath, document: { addEventListener() {} } };
sb.window = sb;
vm.createContext(sb);
vm.runInContext(fs.readFileSync(file, "utf8"), sb);
const cfg = { width: COLS, height: ROWS, bombAmount: MINES };
const clickY = Math.floor(ROWS / 2), clickX = Math.floor(COLS / 2); // solver's revealFirst (0-based)

function virtualMines(seed) {
    sb.setWindowSeedRng();
    sb.setSeed(seed);
    sb.restartVirtualGame(cfg);
    const field = sb.virtualGame.field;
    sb.executeInteractions([{ cell: field[clickY][clickX], isFlag: false }], true, true);
    return field.map((row) => row.map((c) => !!c.isBomb));
}

function siteMinesSeeded(seed) {
    return siteMines(mulberry32(seed * 7919 + 13), ROWS, COLS, MINES, clickY + 1, clickX + 1);
}

if (mode === "dist") {
    for (const [name, gen] of [["site", siteMinesSeeded], ["virtual", virtualMines]]) {
        const freq = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        let badCount = 0, inOpening = 0, openingSizeSum = 0;
        for (let i = 0; i < count; i++) {
            const g = gen(i + 1);
            let n = 0;
            g.forEach((row, r) => row.forEach((mine, c) => {
                if (mine) { n++; freq[r][c]++; if (Math.abs(r - clickY) <= 1 && Math.abs(c - clickX) <= 1) inOpening++; }
            }));
            if (n !== MINES) badCount++;
        }
        const p = MINES / (ROWS * COLS - 9);
        let maxZ = 0, chi = 0, cells = 0;
        freq.forEach((row, r) => row.forEach((f, c) => {
            if (Math.abs(r - clickY) <= 1 && Math.abs(c - clickX) <= 1) return;
            const e = count * p, z = (f - e) / Math.sqrt(count * p * (1 - p));
            maxZ = Math.max(maxZ, Math.abs(z)); chi += z * z; cells++;
        }));
        console.log(JSON.stringify({ gen: name, boards: count, wrongMineCount: badCount, minesIn3x3: inOpening, cells, expectedP: p.toFixed(4), maxAbsZ: maxZ.toFixed(2), chiSq: chi.toFixed(0), df: cells - 1 }));
    }
} else {
    let wins = 0, guesses = 0;
    for (let i = 0; i < count; i++) {
        const seed = i + 1;
        sb.setWindowSeedRng();
        sb.setSeed(seed);
        sb.restartVirtualGame(cfg);
        if (source === "site") {
            const mines = siteMinesSeeded(seed);
            const field = sb.virtualGame.field;
            field.forEach((row, r) => row.forEach((cell, c) => (cell.isBomb = mines[r][c])));
            field.forEach((row) => row.forEach((cell) => {
                if (!cell.isBomb) cell.bombValue = cell.neighbors.reduce((s, n) => s + (n.isBomb ? 1 : 0), 0);
            }));
            sb.virtualGame.hasStarted = true;
        }
        const conf = { isVirtualMode: true, virtualGameConfig: cfg };
        while (true) {
            const res = sb.sweepPage(true, false, conf);
            if (res.state === "solved") { wins++; break; }
            if (res.state === "death") break;
            if (sb.isGuessingSolver(res.solver)) guesses++;
            sb.executeInteractions(res.interactions, true, true);
        }
    }
    const w = wins / count;
    console.log(JSON.stringify({ source, games: count, winRate: (100 * w).toFixed(2) + "% ± " + (100 * Math.sqrt(w * (1 - w) / count)).toFixed(2), avgGuesses: (guesses / count).toFixed(3) }));
}
