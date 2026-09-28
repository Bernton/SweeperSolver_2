// Checks that the virtual game in sweeper.js places bombs exactly like minesweeperonline.com.
// siteBombs() is a line-by-line port of the website's Minesweeper class (bomb planting in l(),
// first click handling in t()). Both are fed the same random numbers, so boards must be identical.
//
// Usage: node bench/verify-website.js [boardsPerCase=300]

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { mulberry32 } = require("./sandbox");

const boardsPerCase = Number(process.argv[2] || 300);

// Port of the website code: 1-based grid with a hidden border ring, bomb <=> value < 0
function siteBombs(random, B, a, m, Y, ae) {
    let value = Array.from({ length: B + 2 }, () => Array(a + 2).fill(0));
    let isHidden = (r, c) => r < 1 || r > B || c < 1 || c > a;
    let isMine = ([r, c]) => value[r][c] < 0;
    let addAround = ([r, c], d) => {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr || dc) {
                    value[r + dr][c + dc] += d;
                }
            }
        }
    };
    let plantMine = (cell) => {
        value[cell[0]][cell[1]] -= 10;
        addAround(cell, 1);
    };
    let unplantMine = (cell) => {
        value[cell[0]][cell[1]] += 10;
        addAround(cell, -1);
    };

    // l()
    let M = [];
    for (let r = 0; r <= B + 1; r++) {
        for (let c = 0; c <= a + 1; c++) {
            if (!isHidden(r, c)) {
                M.push([r, c]);
            }
        }
    }
    for (let z = 0; z < m; z++) {
        plantMine(M.splice(Math.floor(random() * M.length), 1)[0]);
    }

    // t()
    let ag = [Y, ae];
    if (isMine(ag)) {
        plantMine(M.splice(Math.floor(random() * M.length), 1)[0]);
        unplantMine(ag);
        M.push(ag);
    }
    let af = M.filter(([r, c]) => r < Y - 1 || r > Y + 1 || c < ae - 1 || c > ae + 1);
    for (let ad = -1; ad <= 1; ad++) {
        for (let Z = -1; Z <= 1; Z++) {
            let ac = [Y + ad, ae + Z];
            if (isMine(ac) && af.length > 0) {
                plantMine(af.splice(Math.floor(random() * af.length), 1)[0]);
                unplantMine(ac);
            }
        }
    }

    return Array.from({ length: B }, (_, r) => Array.from({ length: a }, (_, c) => isMine([r + 1, c + 1])));
}

let sandboxMath = Object.create(Math);
sandboxMath.seedrandom = function (seed) {
    return mulberry32(seed);
};
let context = { console, performance, setTimeout, Math: sandboxMath, document: { addEventListener() {} } };
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "sweeper.js"), "utf8"), context);

function virtualBombs(seed, width, height, bombs, x, y) {
    context.setWindowSeedRng();
    context.setSeed(seed);
    context.restartVirtualGame({ width: width, height: height, bombAmount: bombs });
    let field = context.virtualGame.field;
    context.executeInteractions([{ cell: field[y][x], isFlag: false }], true, true);
    return field.map((row) => row.map((cell) => !!cell.isBomb));
}

let cases = [
    { width: 30, height: 16, bombs: 99 },
    { width: 9, height: 9, bombs: 10 },
    { width: 16, height: 16, bombs: 40 },
    { width: 9, height: 9, bombs: 72 },
    { width: 9, height: 9, bombs: 76 },
    { width: 9, height: 9, bombs: 80 },
    { width: 30, height: 1, bombs: 20 },
    { width: 2, height: 2, bombs: 3 },
    { width: 99, height: 99, bombs: 9795 }
];

let failures = 0;

cases.forEach((board) => {
    let clicks = [
        [Math.floor(board.width / 2), Math.floor(board.height / 2)],
        [0, 0],
        [board.width - 1, board.height - 1],
        [Math.min(2, board.width - 1), Math.min(2, board.height - 1)],
        [Math.floor(board.width / 2), 0]
    ];
    let boards = board.width * board.height > 2000 ? Math.ceil(boardsPerCase / 20) : boardsPerCase;
    let mismatches = 0;

    clicks.forEach(([x, y]) => {
        for (let seed = 1; seed <= boards; seed++) {
            let expected = siteBombs(mulberry32(seed), board.height, board.width, board.bombs, y + 1, x + 1);
            let actual;

            try {
                actual = virtualBombs(seed, board.width, board.height, board.bombs, x, y);
            } catch (e) {
                actual = e.message;
            }

            if (JSON.stringify(expected) !== JSON.stringify(actual)) {
                mismatches += 1;
            }
        }
    });

    failures += mismatches;
    console.log(board.width + "x" + board.height + "/" + board.bombs + ": " + boards * clicks.length + " boards, " + mismatches + " mismatches");
});

console.log(failures === 0 ? "PASS: virtual game places bombs exactly like the website" : "FAIL: " + failures + " mismatching boards");
process.exitCode = failures === 0 ? 0 : 1;
