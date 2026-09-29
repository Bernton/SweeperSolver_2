// Checks the look-ahead analysis of hypothetical boards against brute force.
// Plays small boards until a guess, then reveals each unknown cell hypothetically with each possible value and
// compares the analysis (number of bomb configurations, best safety of the next move) with full enumeration.
//
// Usage: node bench/verify-analysis.js [games per board=100]

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { mulberry32 } = require("./sandbox");

const DEFAULT_GAMES_PER_BOARD = 100;
// Brute force enumerates all bomb placements on the unknown cells; beyond about this many it takes too long
const MAX_BRUTE_FORCE_UNKNOWNS = 22;
// The analysis counts configurations in log space, so the count comes back with rounding errors
const COUNT_RELATIVE_TOLERANCE = 1e-6;
const SAFETY_TOLERANCE = 1e-9;

const games = Number(process.argv[2] || DEFAULT_GAMES_PER_BOARD);
const boards = [
    { width: 6, height: 6, bombs: 7 },
    { width: 8, height: 5, bombs: 8 },
    { width: 7, height: 7, bombs: 10 }
];

let sandboxMath = Object.create(Math);
sandboxMath.seedrandom = function (seed) {
    return mulberry32(seed);
};
let context = { console, performance, setTimeout, Math: sandboxMath, document: { addEventListener() {} } };
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "sweeper.js"), "utf8"), context);
vm.runInContext("solverConfig.guessLookaheadCandidates = 0", context);

let checked = 0;
let mismatches = 0;

boards.forEach((board) => {
    let gameConfig = { width: board.width, height: board.height, bombAmount: board.bombs };

    for (let seed = 1; seed <= games; seed++) {
        context.setWindowSeedRng();
        context.setSeed(seed);
        context.restartVirtualGame(gameConfig);

        while (true) {
            let sweepResult = context.sweepPage(true, false, { isVirtualMode: true, virtualGameConfig: gameConfig });

            if (sweepResult.state === "solved" || sweepResult.state === "death") {
                break;
            }

            let field = context.virtualGame.field;
            let unknowns = field.flat().filter((cell) => cell.isUnknown);

            if (context.isGuessingSolver(sweepResult.solver) && unknowns.length <= MAX_BRUTE_FORCE_UNKNOWNS) {
                checkPosition(field, board, unknowns, seed);
            }

            context.executeInteractions(sweepResult.interactions, true, true);
        }
    }
});

console.log("Checked " + checked + " hypothetical boards: " + (mismatches === 0 ? "PASS" : "FAIL, " + mismatches + " mismatches"));
process.exitCode = mismatches === 0 ? 0 : 1;

function checkPosition(field, board, unknowns, seed) {
    let flagAmount = field.flat().filter((cell) => cell.isFlagged).length;
    let configurations = enumerateConfigurations(field, unknowns, board.bombs - flagAmount);

    unknowns.forEach((cell) => {
        let neighbors = getNeighbors(field, cell);
        let flaggedNeighbors = neighbors.filter((neighbor) => neighbor.isFlagged).length;
        let hiddenNeighbors = neighbors.filter((neighbor) => neighbor.isFlagged || neighbor.isUnknown).length;
        let others = unknowns.filter((unknown) => unknown !== cell);

        for (let value = flaggedNeighbors; value <= hiddenNeighbors; value++) {
            let matching = configurations.filter((bombs) => !bombs.has(cell) && flaggedNeighbors + neighbors.filter((neighbor) => bombs.has(neighbor)).length === value);
            let expectedSafety = 0;

            if (matching.length > 0) {
                let isWon = others.every((other) => matching.every((bombs) => bombs.has(other)));
                let lowestFraction = Math.min(...others.map((other) => matching.filter((bombs) => bombs.has(other)).length / matching.length));
                expectedSafety = isWon || others.length === 0 ? 1 : 1 - lowestFraction;
            }

            let hypotheticalField = field.map((row) => row.slice(0));
            hypotheticalField[cell.y][cell.x] = { x: cell.x, y: cell.y, value: value, isDigit: true, isHidden: false, isUnknown: false, isFlagged: false, isRevealedBomb: false };
            let analysis = context.sweep(hypotheticalField, board.bombs, false, false, true).analysis;

            let count = Math.exp(analysis.logWeight);
            let isCountOk = Math.abs(count - matching.length) <= COUNT_RELATIVE_TOLERANCE * Math.max(1, matching.length);
            let isSafetyOk = matching.length === 0 || Math.abs(analysis.bestSafety - expectedSafety) < SAFETY_TOLERANCE;
            checked += 1;

            if (!isCountOk || !isSafetyOk) {
                mismatches += 1;

                if (mismatches <= 5) {
                    console.log("Mismatch: " + board.width + "x" + board.height + "/" + board.bombs + " seed " + seed + ", cell " + cell.x + "," + cell.y + " = " + value +
                        ": configurations " + count + " (expected " + matching.length + "), safety " + analysis.bestSafety + " (expected " + expectedSafety + ")");
                }
            }
        }
    });
}

function enumerateConfigurations(field, unknowns, bombAmount) {
    let digits = field.flat().filter((cell) => !cell.isHidden && !cell.isRevealedBomb);
    let configurations = [];

    forEachSubset(unknowns, bombAmount, (bombs) => {
        let isValid = digits.every((digit) => getNeighbors(field, digit).filter((neighbor) => neighbor.isFlagged || bombs.has(neighbor)).length === digit.value);

        if (isValid) {
            configurations.push(new Set(bombs));
        }
    });

    return configurations;
}

function forEachSubset(cells, size, action, start = 0, chosen = new Set()) {
    if (chosen.size === size) {
        action(chosen);
        return;
    }

    for (let i = start; i <= cells.length - (size - chosen.size); i++) {
        chosen.add(cells[i]);
        forEachSubset(cells, size, action, i + 1, chosen);
        chosen.delete(cells[i]);
    }
}

function getNeighbors(field, cell) {
    let neighbors = [];

    for (let y = cell.y - 1; y <= cell.y + 1; y++) {
        for (let x = cell.x - 1; x <= cell.x + 1; x++) {
            if ((x !== cell.x || y !== cell.y) && field[y] && field[y][x]) {
                neighbors.push(field[y][x]);
            }
        }
    }

    return neighbors;
}
