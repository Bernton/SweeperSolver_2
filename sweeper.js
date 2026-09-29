let sweepStates = {
    start: "start",
    solving: "solving",
    stuck: "stuck",
    solved: "solved",
    death: "death"
};

let autoSweepConfig = {
    doLog: false,
    isAutoSweepEnabled: false,
    isRiddleFinderMode: false,
    isRecordingStepStats: false,
    isVirtualMode: false,
    virtualGameConfig: { width: 30, height: 16, bombAmount: 99 },
    virtualBatchSize: 1000,
    baseIdleTime: 0,
    gameFinishedIdleTime: 0,
    state: { gameIndex: 0, lastSweepResult: { state: null, solver: null } }
};

// Solver features; bench/features.js lists the alternatives that bench/run.js --ablate re-evaluates
let solverConfig = {
    firstClickCornerOffset: 2, // null: first click in the center, n: n cells in from the top left corner (at most the center)
    guessLookaheadCandidates: 3, // 0: guess the safest cell, n: of the n safest cells guess the one most likely to survive the next move too
    guessLookaheadBudget: 20000, // max bomb combinations the look-ahead enumerates per guess, keeps large boards fast (null: no limit)
    endgameSearchMaxUnknowns: 28, // exact search for the guess with the best win chance when at most this many unknown cells are left (0: off)
    endgameSearchBudget: 20000 // max bomb configurations plus search states per guess; above it the look-ahead decides
};

// The endgame search keeps bomb configurations as bit masks of 32 bit integers, which safely hold this many cells
const ENDGAME_MAX_MASK_BITS = 30;

let autoSweepStats = { gameStats: [] };

disableEndOfGamePrompt();
setKeyDownHandler();

function disableEndOfGamePrompt() {
    prompt = () => "cancel";
}

function setKeyDownHandler() {
    if (!window.sweepKeyDown) {
        sweepKeyDown = keyDownHandler;
        document.addEventListener("keydown", keyDownHandler);
    }

    function keyDownHandler(e) {
        switch (e.key) {
            case "w":
                sweepStepGuessing();
                break;
            case "W":
                sweepStepGuessing(false);
                break;
            case "e":
                sweepStepCertain();
                break;
            case "E":
                sweepStepCertain(false);
                break;
            case "s":
                startAutoSweep(autoSweepConfig, autoSweepStats);
                break;
            case "d":
                stopAutoSweep(autoSweepConfig);
                break;
            case "i":
                formatLogGameStats();
                break;
            case "o":
                formatLogGameStatsWithRaw();
                break;
            case "k":
                resetGameStats();
                break;
            case "l":
                toggleDoLog(autoSweepConfig);
                break;
        }
    }
}

function sweepStepCertain(withBoardInteraction = true) {
    sweepStep(withBoardInteraction, false, "lastForSweepStepCertain" + withBoardInteraction);
}

function sweepStepGuessing(withBoardInteraction = true) {
    sweepStep(withBoardInteraction, true, "lastForSweepStepGuessing" + withBoardInteraction);
}

function sweepStep(withBoardInteraction, withGuessing, lastStatePropName) {
    let boardState = getBoardState();

    if (window[lastStatePropName] !== boardState) {
        let sweepResult = sweepPage(withGuessing, true);
        executeInteractions(sweepResult.interactions, withBoardInteraction);
        window[lastStatePropName] = boardState;
    }

    function getBoardState() {
        let boardState = "";
        let squares = document.getElementsByClassName("square");

        for (let i = 0; i < squares.length; i++) {
            if (squares[i].style.display !== "none") {
                boardState += squares[i].className;
            }
        }

        return boardState;
    }
}

function startAutoSweep(config, stats) {
    config.isAutoSweepEnabled = true;
    setTimeout(() => autoSweep(config, stats), 0);
}

function stopAutoSweep(config) {
    config.isAutoSweepEnabled = false;
}

function formatLogGameStats(gamesIncluded = null) {
    formatLogStats(autoSweepStats, gamesIncluded);
}

function formatLogGameStatsWithRaw(gamesIncluded = null) {
    formatLogStats(autoSweepStats, gamesIncluded, true);
}

function formatLogStats(stats, gamesIncluded = null, logRaw = false) {
    let gameStats = stats.gameStats.slice(0);

    if (gamesIncluded !== null && gamesIncluded > 0) {
        gameStats = gameStats.filter((c) => c.index < gamesIncluded);
    }

    gameStats = gameStats.filter((c) => c.finishState);

    if (gameStats.length === 0) {
        return;
    }

    console.log("Stats for first " + gameStats.length + " games");
    logWinningPercentage();
    logGuessesPerGame();
    logTimePerGame();
    logTimePerStep();

    if (logRaw) {
        console.log("Raw data: ", gameStats);
    }

    function logGuessesPerGame() {
        let guessesPerGame = gameStats.map((g) => g.guesses);
        let guessStats = mapStats(guessesPerGame);
        logStat("Average/Max guesses", guessStats.average.toFixed(2) + " / " + guessStats.max.toFixed(0));
    }

    function logTimePerGame() {
        let timePerGame = gameStats.map((g) => g.time);
        let timeStats = mapStats(timePerGame);
        logStat("Average/Max time", timeStats.average.toFixed(2) + " / " + timeStats.max.toFixed(2) + " ms");
    }

    function logTimePerStep() {
        let stepTimeStatsMax = gameStats.reduce((a, b) => Math.max(a, b.mostTimeStep), 0);
        logStat("Highest step time", stepTimeStatsMax.toFixed(2) + " ms");

        let stepTimeStatsMax3 = gameStats.reduce((a, b) => Math.max(a, b.mostTime3Step), 0);
        logStat("Highest [3] time", stepTimeStatsMax3.toFixed(2) + " ms");
    }

    function logWinningPercentage() {
        let wins = gameStats.reduce((a, b) => a + (b.finishState === sweepStates.solved ? 1 : 0), 0);
        let winPercentage = (wins / gameStats.length) * 100.0;
        logStat("Winning percentage", winPercentage.toFixed(2) + "% (" + wins + "/" + gameStats.length + ")");
    }

    function logStat(title, formatStat) {
        console.log("-> " + title + ":\t\t" + formatStat);
    }

    function mapStats(values) {
        return {
            min: min(values),
            max: max(values),
            average: average(values),
            median: median(values),
            sum: sum(values),
            values: values
        };
    }

    function sum(values) {
        return values.reduce((a, b) => a + b);
    }

    function min(values) {
        return values.reduce((a, b) => Math.min(a, b));
    }

    function max(values) {
        return values.reduce((a, b) => Math.max(a, b));
    }

    function average(values) {
        return sum(values) / values.length;
    }

    function median(values) {
        let sortedValues = values.slice(0).sort((a, b) => a - b);
        let half = Math.floor(sortedValues.length / 2);
        return values.length % 2 ? values[half] : (values[half - 1] + values[half]) / 2.0;
    }
}

function resetGameStats(stats = autoSweepStats) {
    if (stats.gameStats && stats.gameStats.length > 0) {
        stats.gameStats = stats.gameStats.filter((c) => !c.finishState);
    } else {
        stats.gameStats = [];
    }
}

function toggleDoLog(config) {
    config.doLog = !config.doLog;
}

function startNewGameForAutoSweep(config = autoSweepConfig) {
    config.state.lastSweepResult.state = null;
    config.state.lastSweepResult.solver = null;
    config.state.gameIndex += 1;

    if (config.isVirtualMode) {
        restartVirtualGame(config.virtualGameConfig);
    } else {
        simulate(document.getElementById("face"), "mousedown");
        simulate(document.getElementById("face"), "mouseup");
    }
}

function isGuessingSolver(solver) {
    return solver !== null && solver.includes("g");
}

function autoSweep(config, stats) {
    let iterations = config.virtualBatchSize;

    do {
        if (!config.isAutoSweepEnabled) {
            return;
        }

        let idleTime;
        let restartNeeded = lastWasNewGameState(config);

        if (restartNeeded) {
            if (config.state.lastSweepResult.state === "death" && !isGuessingSolver(config.state.lastSweepResult.solver)) {
                throw new Error("Died while not guessing!");
            }

            startNewGameForAutoSweep(config);
            idleTime = 0;
        } else {
            idleTime = executeSweepCycle(config, stats);
        }

        iterations -= 1;

        if (!(iterations > 0 && config.isVirtualMode)) {
            continueAutoSweep(config, stats, idleTime);
        }
    } while (iterations > 0 && config.isVirtualMode);

    function continueAutoSweep(config, stats, idleTime) {
        if (config.isAutoSweepEnabled) {
            let timeOutTime = idleTime + config.baseIdleTime;
            setTimeout(() => autoSweep(config, stats), timeOutTime);
        }
    }

    function executeSweepCycle(config, stats) {
        let idleTime = 0;
        let sweepResult = sweepPage(true, config.doLog, config, stats);
        let isRiddle = !config.isVirtualMode && config.isRiddleFinderMode && sweepResult.solver === "3";

        if (isRiddle) {
            config.isAutoSweepEnabled = false;
        } else {
            idleTime = isNewGameState(sweepResult.state) ? config.gameFinishedIdleTime : 0;

            if (!sweepResult.solver) {
                sweepResult.solver = config.state.lastSweepResult.solver;
            }

            config.state.lastSweepResult = sweepResult;
        }

        if (config.isAutoSweepEnabled || isRiddle) {
            executeInteractions(sweepResult.interactions, !isRiddle, config.isVirtualMode);
        }

        return idleTime;
    }

    function lastWasNewGameState(config) {
        return isNewGameState(config.state.lastSweepResult.state);
    }
}

function getBombArray(field) {
    return field.reduce((rowA, rowB) => rowA.concat(rowB.reduce((cellA, cellB) => cellA.concat(cellB.isBomb ? true : false), [])), []);
}

function isNewGameState(state) {
    return state === sweepStates.solved || state === sweepStates.death;
}

function executeInteractions(interactions, withBoardInteraction, isVirtualMode) {
    if (isVirtualMode) {
        executeVirtualInteractions(interactions);
    } else {
        if (withBoardInteraction) {
            executeInterationsOnBoard(interactions);
        } else {
            formatLogInteractions(interactions);
        }
    }

    function executeInterationsOnBoard(interactions) {
        interactions.forEach((action) => {
            if (action.isFlag) {
                if (action.cell.div.classList.value !== "square bombflagged") {
                    simulate(action.cell.div, "mousedown", 2);
                    simulate(action.cell.div, "mouseup", 2);
                }
            } else {
                simulate(action.cell.div, "mouseup");
            }
        });
    }

    function formatLogInteractions(interactions) {
        console.log("Interactions:");

        if (interactions.length > 0) {
            interactions.forEach((action) => {
                console.log("-> " + (action.isFlag ? "Flag" : "Reveal") + ":", action.cell.div);
            });
        } else {
            console.log("-> None");
        }
    }
}

function getBombAmount() {
    let optionsForm = $("#options-form");
    let checkedBox = optionsForm.find('input[name="field"]:checked');
    let optionsRow = checkedBox.parent().parent().parent();
    let amountBombsCell = optionsRow.find("td").last();
    let bombAmount = Number(amountBombsCell.html());

    if (isNaN(bombAmount)) {
        bombAmount = Number(amountBombsCell.children()[0].value);
    }

    return bombAmount;
}

function executeVirtualInteractions(interactions) {
    if (!window.virtualGame) {
        return;
    }

    let game = window.virtualGame;
    let field = window.virtualGame.field;

    if (game.hasStarted) {
        interactions.forEach((action) => {
            if (action.isFlag) {
                action.cell.isFlagged = true;
                action.cell.isUnknown = false;
            } else {
                revealCell(action.cell);
            }
        });
    } else {
        let firstCell = interactions[0].cell;
        let cells = field.flat();
        placeBombsLikeWebsite(cells, firstCell, game.bombAmount);
        setDigits(cells);
        revealCell(firstCell);
        game.hasStarted = true;
    }

    // Same algorithm and order of random calls as minesweeperonline.com: bombs are placed uniformly,
    // then moved off the first clicked cell and out of its 3x3 area, as far as there is room outside.
    function placeBombsLikeWebsite(cells, firstCell, bombAmount) {
        let nonBombs = cells.slice(0);

        for (let i = 0; i < bombAmount && nonBombs.length > 0; i++) {
            takeRandom(nonBombs).isBomb = true;
        }

        if (firstCell.isBomb && nonBombs.length > 0) {
            takeRandom(nonBombs).isBomb = true;
            firstCell.isBomb = false;
            nonBombs.push(firstCell);
        }

        let isInFirstArea = (cell) => Math.abs(cell.x - firstCell.x) <= 1 && Math.abs(cell.y - firstCell.y) <= 1;
        let outsideNonBombs = nonBombs.filter((cell) => !isInFirstArea(cell));

        for (let y = firstCell.y - 1; y <= firstCell.y + 1; y++) {
            for (let x = firstCell.x - 1; x <= firstCell.x + 1; x++) {
                let cell = field[y] && field[y][x];

                if (cell && cell.isBomb && outsideNonBombs.length > 0) {
                    takeRandom(outsideNonBombs).isBomb = true;
                    cell.isBomb = false;
                }
            }
        }
    }

    function takeRandom(cells) {
        return cells.splice(getRandomInt(cells.length), 1)[0];
    }

    function revealCell(cellToReveal) {
        let revealCells = [cellToReveal];

        while (revealCells.length > 0) {
            let cell = revealCells.pop();

            if (cell.isHidden) {
                cell.isHidden = false;
                cell.isUnknown = false;
                cell.isFlagged = false;

                if (cell.isBomb) {
                    cell.isRevealedBomb = true;
                    cell.value = -1;
                } else {
                    cell.value = cell.bombValue;
                    cell.isDigit = cell.value > 0;
                }

                if (cell.value === 0) {
                    cell.neighbors.forEach((neighborCell) => {
                        if (neighborCell.isHidden) {
                            revealCells.push(neighborCell);
                        }
                    });
                }
            }
        }
    }

    function setDigits(cells) {
        cells.forEach((cell) => {
            if (!cell.isBomb) {
                let bombNeighborAmount = cell.neighbors.reduce((a, b) => a + (b.isBomb ? 1 : 0), 0);
                cell.bombValue = bombNeighborAmount;
            }
        });
    }

    function getRandomInt(max) {
        return Math.floor(window.getRandom() * Math.floor(max));
    }
}

function setWindowSeedRng() {
    if (!window.seedRng) {
        window.seedRng = null;
        window.setSeed = (seed) => (window.seedRng = seed ? new Math.seedrandom(seed) : null);
        window.getRandom = () => (window.seedRng ? window.seedRng() : Math.random());
    }
}

function restartVirtualGame(config) {
    setWindowSeedRng();

    window.virtualGame = createVirtualGame(config.width, config.height, config.bombAmount);
    window.virtualGame.field = createVirtualField(window.virtualGame);

    function createVirtualGame(width, height, bombAmout) {
        return { width: width, height: height, bombAmount: bombAmout, hasStarted: false };
    }

    function createVirtualField(virtualGame) {
        let field = [];
        let createVirtualCell = (x, y) => {
            // All properties up front, so every cell has the same shape (faster property access)
            return {
                x: x,
                y: y,
                isHidden: true,
                isUnknown: true,
                isFlagged: false,
                isDigit: false,
                isRevealedBomb: false,
                isBomb: false,
                bombValue: 0,
                value: -1,
                neighbors: null
            };
        };

        for (let y = 0; y < virtualGame.height; y++) {
            let row = [];

            for (let x = 0; x < virtualGame.width; x++) {
                row.push(createVirtualCell(x, y));
            }

            field.push(row);
        }

        applyToCells(field, (cell) => {
            let neighbors = [];
            applyToNeighbors(field, cell, (neighborCell) => neighbors.push(neighborCell));
            cell.neighbors = neighbors;
        });

        return field;
    }
}

function getVirtualGame(config) {
    if (!window.virtualGame) {
        restartVirtualGame(config);
    }

    return {
        field: window.virtualGame.field,
        bombAmount: window.virtualGame.bombAmount
    };
}

function sweepPage(withGuessing = true, doLog = true, config = null, stats = null) {
    let field;
    let bombAmount;
    let isVirtualMode = config ? config.isVirtualMode : false;

    if (isVirtualMode) {
        let virtualGame = getVirtualGame(config.virtualGameConfig);
        field = virtualGame.field;
        bombAmount = virtualGame.bombAmount;
    } else {
        field = initializeField();
        bombAmount = getBombAmount();
    }

    if (config && stats) {
        let sweepT0 = performance.now();
        let sweepResult = sweep(field, bombAmount, withGuessing, doLog);
        recordGameStats(config, stats, field, sweepResult, sweepT0);
        return sweepResult;
    } else {
        return sweep(field, bombAmount, withGuessing, doLog);
    }

    function recordGameStats(config, stats, field, sweepResult, sweepT0) {
        let sweepT1 = performance.now();
        let sweepTime = sweepT1 - sweepT0;
        let gameIndex = config.state.gameIndex;

        if (!stats.gameStats[gameIndex]) {
            stats.gameStats[gameIndex] = { index: gameIndex };
            stats.gameStats[gameIndex].stepStats = [];
        }

        let gameStats = stats.gameStats[gameIndex];

        if (!gameStats.finishState) {
            gameStats.stepStats.push({
                result: { state: sweepResult.state, solver: sweepResult.solver },
                time: sweepTime
            });

            if (isNewGameState(sweepResult.state)) {
                gameStats.finishState = sweepResult.state;
                gameStats.bombArray = getBombArray(field);

                let stepStats = gameStats.stepStats;
                let wasGuessStep = (step) => step.result.state === sweepStates.solving && isGuessingSolver(step.result.solver);
                let was3Step = (step) => step.result.state === sweepStates.solving && step.result.solver === "3";
                gameStats.guesses = stepStats.reduce((a, b) => a + Number(wasGuessStep(b)), 0);
                gameStats.time = stepStats.reduce((a, b) => a + b.time, 0);
                gameStats.mostTimeStep = stepStats.reduce((a, b) => Math.max(a, b.time), 0);
                gameStats.mostTime3Step = stepStats.reduce((a, b) => Math.max(a, was3Step(b) ? b.time : 0), 0);

                if (!config.isRecordingStepStats) {
                    delete gameStats.stepStats;
                }
            }
        }
    }

    function initializeField() {
        const openClass = "square open";
        const flagClass = "square bombflagged";
        const bombRevealedClass = "square bombrevealed";
        const bombDeathClass = "square bombdeath";

        let field = [];
        let y = 0;
        let x = 0;

        while (true) {
            let row = [];

            while (true) {
                // The website hides the squares around the board with an inline style
                let div = document.getElementById(y + 1 + "_" + (x + 1));

                if (!div || div.style.display === "none") {
                    break;
                }

                let divClass = div.className;
                let cell = { div: div, x: x, y: y };

                if (divClass.substr(0, openClass.length) === openClass) {
                    let number = divClass.substr(openClass.length);
                    cell.value = Number(number);
                    cell.isDigit = cell.value > 0;
                } else if (divClass === bombRevealedClass || divClass === bombDeathClass) {
                    cell.isRevealedBomb = true;
                } else {
                    cell.isHidden = true;
                    cell.value = -1;

                    if (divClass === flagClass) {
                        cell.isFlagged = true;
                    } else {
                        cell.isUnknown = true;
                    }
                }

                row.push(cell);
                x += 1;
            }

            if (row.length < 1) {
                break;
            }

            y += 1;
            x = 0;
            field.push(row);
        }

        return field;
    }
}

// The solver's copies of the board with their neighbor lists, reused between steps while the board size stays the same.
// One per nesting depth, as the guess look-ahead analyzes hypothetical boards while the real one is in use.
let solverFields = [];
let sweepDepth = 0;

// isAnalysis: only analyze the position (see analyzePosition), used by the guess look-ahead
function sweep(fieldToSweep, bombAmount, withGuessing = true, doLog = true, isAnalysis = false) {
    let interactions = [];
    let revealedCells = new Set();
    let flaggedCells = new Set();
    let cellCounts = { cells: 0, hidden: 0, flagged: 0, revealedBombs: 0 };
    let depth = sweepDepth;
    let checkResult;

    sweepDepth += 1;

    try {
        checkResult = checkForAndAddInteractions();
    } finally {
        sweepDepth -= 1;
    }

    let sweepResult = {
        interactions: interactions,
        state: checkResult.state,
        solver: checkResult.solver,
        analysis: checkResult.analysis
    };

    return sweepResult;

    function checkForAndAddInteractions() {
        let field = copyAndInitializeField(fieldToSweep);

        if (isAnalysis) {
            return analyzePosition(field);
        }

        if (checkBombDeath()) {
            return onBombDeath();
        }

        if (checkStart()) {
            return onStart(field);
        }

        if (checkSolved()) {
            return onSolved();
        }

        if (checkTrivialFlags(field) || checkTrivialReveals(field)) {
            return onStandardSolving("0", "[0] Trivial cases");
        }

        let borderCells = getBorderCells(field);

        if (checkSuffocations(borderCells)) {
            return onStandardSolving("1", "[1] Suffocations");
        }

        let borderCellGroupings = getBorderCellGroupings(field);
        let outsideUnknowns = getOutsideUnknowns(field);
        let flagsLeft = getFlagsLeft(field);

        if (checkIsolatedUnknowns(borderCellGroupings)) {
            return onIsolatedUnknowns(outsideUnknowns, flagsLeft);
        }

        return checkCombinatorially(field, borderCellGroupings, outsideUnknowns, flagsLeft);
    }

    // How many bomb configurations fit the position (log) and how safe its safest cell is (1 if the game is won
    // or a certain safe cell exists). Skips the simple solvers, as the full check covers them.
    function analyzePosition(field) {
        let borderCellGroupings = getBorderCellGroupings(field);
        let outsideUnknowns = getOutsideUnknowns(field);
        let flagsLeft = getFlagsLeft(field);
        let analysis;

        if (borderCellGroupings.length === 0) {
            let isPossible = flagsLeft >= 0 && flagsLeft <= outsideUnknowns.length;
            analysis = {
                logWeight: isPossible ? logBinomialCoefficient(outsideUnknowns.length, flagsLeft) : -Infinity,
                bestSafety: outsideUnknowns.length > 0 ? 1 - flagsLeft / outsideUnknowns.length : 1,
                combinationAmount: 0
            };
        } else {
            analysis = checkAllValidCombinations(field, borderCellGroupings, outsideUnknowns, flagsLeft).analysis;
        }

        if (checkSolved()) {
            analysis.bestSafety = 1;
        }

        return { state: sweepStates.stuck, solver: null, analysis: analysis };
    }

    function checkCombinatorially(field, borderCellGroupings, outsideUnknowns, flagsLeft) {
        let resultInfo = checkAllValidCombinations(field, borderCellGroupings, outsideUnknowns, flagsLeft);

        if (resultInfo.certainResultFound) {
            return onCheckCombinatorially(resultInfo, null, sweepStates.solving);
        }

        if (withGuessing) {
            return onCheckCombinatorially(resultInfo, "guessing", sweepStates.solving);
        }

        return onCheckCombinatorially(resultInfo, "stuck", sweepStates.stuck);
    }

    function checkIsolatedUnknowns(borderCellGroupings) {
        return borderCellGroupings.length === 0;
    }

    function onIsolatedUnknowns(outsideUnknowns, flagsLeft) {
        let subMessages = [];
        let state = sweepStates.solving;
        let mode = null;

        if (flagsLeft === 0) {
            outsideUnknowns.forEach((outsideUnknown) => revealCell(outsideUnknown));
            subMessages.push("Reveals found - no bombs left");
        } else {
            let cell = outsideUnknowns[0];
            let percentage = ((flagsLeft / outsideUnknowns.length) * 100).toFixed(2) + "%";
            let cellInfo = "(" + (cell.y + 1) + "_" + (cell.x + 1) + ") bomb probability " + percentage + ", same for every unknown cell";
            let element = cell.referenceCell.div ? cell.referenceCell.div : cell.referenceCell;

            if (withGuessing) {
                revealCell(cell);
                subMessages.push(["Reveal " + cellInfo, element]);
                mode = "guessing";
            } else {
                subMessages.push("No certain cell found");
                subMessages.push(["Suggested guess: " + cellInfo, element]);
                state = sweepStates.stuck;
                mode = "stuck";
            }
        }

        let message = "Check isolated unknowns";
        return onTriState(message, "i", subMessages, mode, state);
    }

    function getOutsideUnknowns(field) {
        let outsideUnknowns = [];

        applyToCells(field, (cell) => {
            if (cell.isUnknown && !cell.isBorderCell) {
                cell.borderCellNeighborAmount = 0;

                cell.neighbors.forEach((neighbor) => {
                    if (neighbor.isBorderCell) {
                        cell.borderCellNeighborAmount += 1;
                    }
                });

                outsideUnknowns.push(cell);
            }
        });

        return outsideUnknowns;
    }

    function getBorderCellGroupings(field) {
        let allBorderCells = getBorderCells(field);
        let borderCellGroupings = splitToBorderCellGroupingsAndSort(allBorderCells);
        return borderCellGroupings;
    }

    function splitToBorderCellGroupingsAndSort(borderCellLists) {
        let unknownsGroupings = findUnknownsGroupings(borderCellLists);
        let groupingCellLists = createCellLists(unknownsGroupings);
        sortCellListsUnknowns(groupingCellLists);
        sortCellLists(groupingCellLists);
        return groupingCellLists;

        function findUnknownsGroupings(borderCellLists) {
            let borderCells = borderCellLists.digits.concat(borderCellLists.unknowns);
            borderCells.forEach((cell) => (cell.groupingIndex = null));
            let getFirstWithoutIndex = () => borderCells.find((borderCell) => borderCell.groupingIndex === null);

            let unknownsGroupings = [];
            let startCell = getFirstWithoutIndex();

            while (startCell) {
                let unknownsGrouping = [];
                let index = unknownsGroupings.length;

                let addToGrouping = (cell) => {
                    if (cell.groupingIndex === null) {
                        cell.groupingIndex = index;
                        unknownsGrouping.push(cell);
                        cell.neighbors.forEach((neighbor) => addToGrouping(neighbor));
                    }
                };

                addToGrouping(startCell);
                unknownsGrouping = unknownsGrouping.filter((cell) => !cell.isDigit);

                if (unknownsGrouping.length > 0) {
                    unknownsGroupings.push(unknownsGrouping);
                }

                startCell = getFirstWithoutIndex();
            }

            return unknownsGroupings;
        }

        function addDigitsToGroupings(groupings) {
            groupings.forEach((grouping) => {
                grouping.forEach((unknown) => {
                    unknown.neighbors.forEach((digitNeighbor) => {
                        if (!grouping.includes(digitNeighbor)) {
                            grouping.push(digitNeighbor);
                        }
                    });
                });
            });
        }

        function createCellLists(unknownsGroupings) {
            addDigitsToGroupings(unknownsGroupings);
            let cellLists = [];

            unknownsGroupings.forEach((grouping) => {
                cellLists.push({
                    digits: grouping.filter((c) => c.isDigit),
                    unknowns: grouping.filter((c) => !c.isDigit)
                });
            });

            return cellLists;
        }

        function sortCellListsUnknowns(cellLists) {
            for (let i = 0; i < cellLists.length; i++) {
                let unknowns = cellLists[i].unknowns;
                let digits = cellLists[i].digits;
                unknowns.forEach((unknown) => (unknown.sortScore = null));

                digits.forEach((digit) => {
                    let flagsLeft = digit.value - digit.flaggedNeighborAmount;
                    digit.valueForUnknowns = 1 / binomialCoefficient(digit.unknownNeighborAmount, flagsLeft);
                });

                let digitsSorted = digits.sort((a, b) => -(a.valueForUnknowns - b.valueForUnknowns));
                let sortScore = 0;

                digitsSorted.forEach((digit) => {
                    digit.neighbors.forEach((unknown) => {
                        if (unknowns.includes(unknown) && unknown.sortScore === null) {
                            unknown.sortScore = sortScore;
                        }
                    });

                    sortScore += 1;
                });

                cellLists[i].unknowns = unknowns.sort((a, b) => a.sortScore - b.sortScore);
            }
        }

        function sortCellLists(cellLists) {
            cellLists = cellLists.sort((a, b) => {
                let primary = a.unknowns.length - b.unknowns.length;
                return primary !== 0 ? primary : -(a.digits.length - b.digits.length);
            });
        }
    }

    function createCheckResult(state, solver = null) {
        return { state: state, solver: solver };
    }

    function onBombDeath() {
        log("[x] Bomb death");
        return createCheckResult(sweepStates.death);
    }

    function log() {
        if (doLog) {
            console.log.apply(console, arguments);
        }
    }

    function onCheckCombinatorially(resultInfo, mode, resultState) {
        let message = "Check combinatorially";
        let solver = "3";
        return onTriState(message, solver, resultInfo.messages, mode, resultState);
    }

    function onTriState(message, solver, messages, mode, resultState) {
        if (mode !== null) {
            message += " - " + mode;
            solver += mode[0];
        }

        let formatSolver = "[" + solver + "]";
        log(formatSolver, message);
        // A message is a text or an array of text and a board element (logged on one line)
        messages.forEach((c) => {
            log("->", formatSolver, ...[].concat(c));
        });
        return createCheckResult(resultState, solver);
    }

    function onStandardSolving(solver, message) {
        log(message);
        return createCheckResult(sweepStates.solving, solver);
    }

    function onStart(field) {
        log("[s]", sweepStates.start);
        if (withGuessing) {
            revealFirst(field);
        }
        return createCheckResult(sweepStates.start);
    }

    function revealFirst(field) {
        let width = field[0].length;
        let height = field.length;
        let x = Math.floor(width / 2);
        let y = Math.floor(height / 2);
        let offset = solverConfig.firstClickCornerOffset;

        if (offset !== null) {
            x = Math.min(offset, x);
            y = Math.min(offset, y);
        }

        revealCell(field[y][x]);
    }

    function onSolved() {
        log("[o]", sweepStates.solved);
        return createCheckResult(sweepStates.solved);
    }

    function checkTrivialReveals(field) {
        let revealsFound = false;

        applyToCells(field, (cell) => {
            if (cell.isDigit && cell.flaggedNeighborAmount === cell.value) {
                cell.neighbors.forEach((neighbor) => {
                    if (neighbor.isUnknown) {
                        revealCell(neighbor);
                        revealsFound = true;
                    }
                });
            }
        });

        return revealsFound;
    }

    // Copies the cell states into the reused solver field, resets what a step may have set on its cells
    // and counts the cell states needed for the game state checks
    function copyAndInitializeField(fieldToSweep) {
        let field = getSolverField(fieldToSweep);
        cellCounts = { cells: 0, hidden: 0, flagged: 0, revealedBombs: 0 };

        for (let y = 0; y < field.length; y++) {
            let rowToSweep = fieldToSweep[y];
            let row = field[y];

            for (let x = 0; x < row.length; x++) {
                let cellToSweep = rowToSweep[x];
                let cell = row[x];
                cell.referenceCell = cellToSweep.referenceCell ?? cellToSweep;
                cell.value = cellToSweep.value;
                cell.isDigit = cellToSweep.isDigit;
                cell.isRevealedBomb = cellToSweep.isRevealedBomb;
                cell.isHidden = cellToSweep.isHidden;
                cell.isFlagged = cellToSweep.isFlagged;
                cell.isUnknown = cellToSweep.isUnknown;
                cell.isBorderCell = false;

                cellCounts.cells += 1;
                cellCounts.hidden += cell.isHidden ? 1 : 0;
                cellCounts.flagged += cell.isFlagged ? 1 : 0;
                cellCounts.revealedBombs += cell.isRevealedBomb ? 1 : 0;
            }
        }

        setCellNeighborCounts(field);
        return field;
    }

    function getSolverField(fieldToSweep) {
        let height = fieldToSweep.length;
        let width = height > 0 ? fieldToSweep[0].length : 0;
        let solverField = solverFields[depth];

        if (!solverField || solverField.length !== height || (height > 0 && solverField[0].length !== width)) {
            solverField = createSolverField(fieldToSweep, width, height);
            solverFields[depth] = solverField;
        }

        return solverField;
    }

    // Neighbor order is the same as in applyToNeighbors (x offset outer, y offset inner)
    function createSolverField(fieldToSweep, width, height) {
        // All properties up front, so every cell has the same shape (faster property access)
        let field = fieldToSweep.map((row) =>
            row.map((cell) => ({
                x: cell.x,
                y: cell.y,
                referenceCell: null,
                value: -1,
                isDigit: false,
                isRevealedBomb: false,
                isHidden: false,
                isFlagged: false,
                isUnknown: false,
                isBorderCell: false,
                neighbors: null,
                neighborAmount: 0,
                unknownNeighborAmount: 0,
                flaggedNeighborAmount: 0,
                hiddenNeighborAmount: 0,
                borderCellNeighborAmount: 0,
                probabilityOfZero: 0
            }))
        );

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let neighbors = [];

                for (let neighborX = x - 1; neighborX <= x + 1; neighborX++) {
                    for (let neighborY = y - 1; neighborY <= y + 1; neighborY++) {
                        let isInside = neighborX >= 0 && neighborX < width && neighborY >= 0 && neighborY < height;

                        if (isInside && !(neighborX === x && neighborY === y)) {
                            neighbors.push(field[neighborY][neighborX]);
                        }
                    }
                }

                field[y][x].neighbors = neighbors;
                field[y][x].neighborAmount = neighbors.length;
            }
        }

        return field;
    }

    function setCellNeighborCounts(field) {
        for (let y = 0; y < field.length; y++) {
            let row = field[y];

            for (let x = 0; x < row.length; x++) {
                let cell = row[x];
                let neighbors = cell.neighbors;
                let unknownNeighborAmount = 0;
                let flaggedNeighborAmount = 0;

                for (let i = 0; i < neighbors.length; i++) {
                    if (neighbors[i].isUnknown) {
                        unknownNeighborAmount += 1;
                    } else if (neighbors[i].isFlagged) {
                        flaggedNeighborAmount += 1;
                    }
                }

                cell.unknownNeighborAmount = unknownNeighborAmount;
                cell.flaggedNeighborAmount = flaggedNeighborAmount;
                cell.hiddenNeighborAmount = unknownNeighborAmount + flaggedNeighborAmount;
            }
        }
    }

    function checkAllValidCombinations(field, borderCellGroupings, outsideUnknowns, totalFlagsLeft) {
        let resultInfo = {
            certainResultFound: false,
            messages: []
        };

        let candidateAmount = borderCellGroupings.reduce((a, b) => a + b.unknowns.length, 0);
        resultInfo.messages.push("Candidate amount: " + candidateAmount);

        let groupingCheckResults = [];
        let leastBombsCount = 0;
        let endgameConfigurationAmount = null; // set when the endgame search chose the guess

        let checkAllCombinationsT0 = performance.now();

        for (let i = 0; i < borderCellGroupings.length; i++) {
            let groupingFlagsLeft = totalFlagsLeft - leastBombsCount;
            let searchResult = checkGrouping(borderCellGroupings[i], groupingFlagsLeft);

            if (searchResult.certainResultFound && !isAnalysis) {
                resultInfo.certainResultFound = true;
                break;
            }

            leastBombsCount += searchResult.leastBombs ? searchResult.leastBombs : 0;
            groupingCheckResults.push(searchResult);
        }

        if (!resultInfo.certainResultFound) {
            let combinedCheckResult = mergeGroupingsCombinationsAndCheck(groupingCheckResults);

            if (isAnalysis) {
                resultInfo.analysis = analyzeCombinations(combinedCheckResult);
                resultInfo.analysis.combinationAmount = groupingCheckResults.reduce((a, b) => a + b.validCombinations.length, 0);
            } else if (combinedCheckResult.certainResultFound) {
                resultInfo.certainResultFound = true;
            } else {
                handleNoCertainResultFound(combinedCheckResult);
            }
        }

        let checkAllCombinationsT1 = performance.now();
        let checkAllCombinationsTime = checkAllCombinationsT1 - checkAllCombinationsT0;

        resultInfo.messages.push("Check of all combinations took " + checkAllCombinationsTime.toFixed(4) + " milliseconds");
        return resultInfo;

        function clusterCandidates(candidates) {
            let clusteredCandidateGroups = findClusteredGroups(candidates);
            let clusteredCandidates = createClusteredCandidates(clusteredCandidateGroups);
            return clusteredCandidates;

            function findClusteredGroups(cells) {
                let clusteredGroups = [];

                cells.forEach((cell) => {
                    let belongsToCluster = false;

                    clusteredGroups.forEach((cluster) => {
                        let toCompare = cluster[0];
                        let isEqual = toCompare.neighbors.length === cell.neighbors.length;

                        if (isEqual) {
                            toCompare.neighbors.forEach((toCompareNeighbor) => {
                                if (!cell.neighbors.includes(toCompareNeighbor)) {
                                    isEqual = false;
                                }
                            });
                        }

                        if (isEqual) {
                            belongsToCluster = true;
                            cluster.push(cell);
                        }
                    });

                    if (!belongsToCluster) {
                        clusteredGroups.push([cell]);
                    }
                });

                return clusteredGroups;
            }

            function createClusteredCandidates(clusteredCandidateGroups) {
                let clusteredCandidates = [];

                clusteredCandidateGroups.forEach((candidateGroup) => {
                    let clusteredCandidate = candidateGroup[candidateGroup.length - 1];
                    clusteredCandidate.clusterGroup = candidateGroup;

                    clusteredCandidate.clusterGroup.forEach((clusterCell) => {
                        clusterCell.clusterSize = candidateGroup.length;
                    });

                    clusteredCandidates.push(clusteredCandidate);
                });

                return clusteredCandidates;
            }
        }

        function clusterDigitNeighbors(digits) {
            digits.forEach((digit) => (digit.neighbors = digit.neighbors.filter((c) => c.clusterGroup)));
        }

        function setupCandidatesForConditions(candidates) {
            candidates.forEach((candidate, i) => {
                candidate.assignIndex = i;
                candidate.conditions = [];
                candidate.conditionedPeers = [];
                candidate.conditionAmount = 0;
                candidate.conditionValue = 0;
            });
        }

        function addCandidateConditions(candidates, digits) {
            clusterDigitNeighbors(digits);
            setupCandidatesForConditions(candidates);

            digits.forEach((digit) => {
                let flagsLeft = digit.value - digit.flaggedNeighborAmount;
                let neighbors = digit.neighbors;

                neighbors.forEach((neighbor) => {
                    // Each unassigned cluster can still take any bomb amount from 0 to its size, so the digit can be
                    // completed exactly if its bombs left lie between the assigned sum and that sum plus their sizes
                    let condition = (assignment) => {
                        let assignedSum = 0;
                        let unassignedMax = 0;

                        for (let j = 0; j < neighbors.length; j++) {
                            let value = assignment[neighbors[j].assignIndex];

                            if (value === null) {
                                unassignedMax += neighbors[j].clusterSize;
                            } else {
                                assignedSum += value;
                            }
                        }

                        return assignedSum <= flagsLeft && flagsLeft <= assignedSum + unassignedMax;
                    };

                    addConditionedPeers(neighbor, neighbors);
                    neighbor.conditions.push(condition);
                    neighbor.conditionAmount += 1;
                    neighbor.conditionValue += neighbors.reduce((a, b) => a + (b.clusterSize - 1) / (2 + a), 0);
                });
            });
        }

        function addConditionedPeers(candidate, peers) {
            peers.forEach((peer) => {
                if (peer !== candidate && !candidate.conditionedPeers.includes(peer)) {
                    candidate.conditionedPeers.push(peer);
                }
            });
        }

        function checkGrouping(grouping, groupingFlagsLeft) {
            let candidates = clusterCandidates(grouping.unknowns);
            addCandidateConditions(candidates, grouping.digits);
            let validCombinations = searchValidCombinations(candidates, groupingFlagsLeft);
            return searchCertainResult(candidates, validCombinations, groupingFlagsLeft);
        }

        function createRootAssignmentNode(candidates) {
            let rootAssignment = Array(candidates.length).fill(null);
            let rootLegalValues = Array(candidates.length).fill(null);

            for (let assignIndex = 0; assignIndex < rootAssignment.length; assignIndex++) {
                let legalValues = [];

                for (let assignValue = 0; assignValue <= candidates[assignIndex].clusterSize; assignValue++) {
                    if (isValidAssignmentValue(rootAssignment, candidates, assignIndex, assignValue)) {
                        legalValues.push(assignValue);
                    }
                }

                rootLegalValues[assignIndex] = legalValues;
            }

            return { assignment: rootAssignment, legalValues: rootLegalValues, flagAmount: 0 };
        }

        function searchValidCombinations(candidates, flagsLeft) {
            let validAssignNodes = [createRootAssignmentNode(candidates)];
            let validCombinations = [];

            while (validAssignNodes.length > 0) {
                let assignNode = validAssignNodes.pop();
                let newNodesAreLeafs = getUnassignedAmount(assignNode.assignment) === 1;
                let newNodes = searchAssignNode(candidates, assignNode, flagsLeft, newNodesAreLeafs);
                let associatedArray = newNodesAreLeafs ? validCombinations : validAssignNodes;
                newNodes.forEach((newNode) => associatedArray.push(newNode));
            }

            return validCombinations;
        }

        function searchAssignNode(candidates, sourceNode, flagsLeft, newNodesAreLeafs) {
            let newNodes = [];
            let nextValueToSet = findBestValueToSet(candidates, sourceNode);

            nextValueToSet.legalValues.forEach((legalValue) => {
                let newAssignment = createArrayWithAssignment(sourceNode.assignment, nextValueToSet.index, legalValue);
                let newFlagAmount = sourceNode.flagAmount + legalValue;

                if (newFlagAmount <= flagsLeft) {
                    if (newNodesAreLeafs) {
                        newNodes.push({ values: newAssignment, flagAmount: newFlagAmount });
                    } else {
                        let validChildNode = findValidChildNode(candidates, sourceNode, newAssignment, newFlagAmount, nextValueToSet);

                        if (validChildNode) {
                            newNodes.push(validChildNode);
                        }
                    }
                }
            });

            return newNodes;
        }

        function getNewLegalValues(candidates, sourceNode, assignment, valueToSet) {
            let conditionedPeers = candidates[valueToSet.index].conditionedPeers;
            let newLegalValues = createArrayWithAssignment(sourceNode.legalValues, valueToSet.index, null);

            for (let peerI = 0; peerI < conditionedPeers.length; peerI++) {
                let peerIndex = conditionedPeers[peerI].assignIndex;

                if (newLegalValues[peerIndex] !== null) {
                    let previousLegalValues = newLegalValues[peerIndex];
                    let legalValues = [];

                    previousLegalValues.forEach((value) => {
                        if (isValidAssignmentValue(assignment, candidates, peerIndex, value)) {
                            legalValues.push(value);
                        }
                    });

                    if (legalValues.length > 0) {
                        newLegalValues[peerIndex] = legalValues;
                    } else {
                        return null;
                    }
                }
            }

            return newLegalValues;
        }

        function findValidChildNode(candidates, sourceNode, assignment, flagAmount, valueToSet) {
            let newLegalValues = getNewLegalValues(candidates, sourceNode, assignment, valueToSet);

            if (newLegalValues) {
                return createAssignNode(assignment, newLegalValues, flagAmount);
            }
        }

        function findBestValueToSet(candidates, sourceNode) {
            let indexOfBest;
            let legalValuesOfBest = null;

            for (let i = 0; i < sourceNode.assignment.length; i++) {
                if (sourceNode.assignment[i] === null) {
                    let legalValues = sourceNode.legalValues[i];

                    if (legalValuesOfBest === null || isBetterValueToSet(legalValues, candidates[i], legalValuesOfBest, candidates[indexOfBest])) {
                        legalValuesOfBest = legalValues;
                        indexOfBest = i;
                    }
                }
            }

            return { index: indexOfBest, legalValues: legalValuesOfBest };
        }

        function isBetterValueToSet(legalValues, candidate, bestLegalValues, bestCandidate) {
            if (legalValues.length < bestLegalValues.length) {
                return true;
            }

            if (legalValues.length === bestLegalValues.length) {
                if (candidate.conditionAmount > bestCandidate.conditionAmount) {
                    return true;
                }

                if (candidate.conditionAmount === bestCandidate.conditionAmount) {
                    if (candidate.conditionValue < bestCandidate.conditionValue) {
                        return true;
                    }
                }
            }

            return false;
        }

        function createAssignNode(assignment, legalValues, flagAmount = 0) {
            return {
                assignment: assignment,
                legalValues: legalValues,
                flagAmount: flagAmount
            };
        }

        function createArrayWithAssignment(assignment, index, value) {
            let createdArray = assignment.slice(0);
            createdArray[index] = value;
            return createdArray;
        }

        // Tests the value in place (restored afterwards) instead of on a copy of the assignment
        function isValidAssignmentValue(assignment, candidates, index, value) {
            let previousValue = assignment[index];
            assignment[index] = value;
            let isValid = isValidAssignmentChange(assignment, candidates, index);
            assignment[index] = previousValue;
            return isValid;
        }

        function getUnassignedAmount(assignment) {
            return assignment.reduce((a, b) => a + (b === null ? 1 : 0), 0);
        }

        function isValidAssignmentChange(assignment, candidates, changedIndex) {
            let isValid = true;
            let conditions = candidates[changedIndex].conditions;

            for (let i = 0; i < conditions.length; i++) {
                let condition = conditions[i];

                if (!condition(assignment)) {
                    isValid = false;
                    break;
                }
            }

            return isValid;
        }

        function getLeastFlagAmount(validCombinations) {
            let leastFlags = Number.MAX_VALUE;
            validCombinations.forEach((c) => (leastFlags = c.flagAmount < leastFlags ? c.flagAmount : leastFlags));
            return leastFlags;
        }

        function searchCertainResult(candidates, validCombinations, groupingFlagsLeft) {
            let leastBombs = getLeastFlagAmount(validCombinations);
            let noBombsLeftForRest = searchNoBombsLeftForRest(leastBombs, groupingFlagsLeft);

            candidates.forEach((candidate, candidateI) => {
                candidate.isCertainReveal = true;
                candidate.isCertainFlag = true;

                for (let i = 0; i < validCombinations.length; i++) {
                    let value = validCombinations[i].values[candidateI];

                    if (value !== 0) {
                        candidate.isCertainReveal = false;
                    }

                    if (value !== candidate.clusterSize) {
                        candidate.isCertainFlag = false;
                    }

                    if (!candidate.isCertainReveal && !candidate.isCertainFlag) {
                        break;
                    }
                }
            });

            let anyInteraction = searchCertainInteraction(candidates);
            let certainResultFound = noBombsLeftForRest || anyInteraction;

            return {
                certainResultFound: certainResultFound,
                validCombinations: validCombinations,
                candidates: candidates,
                leastBombs: leastBombs
            };
        }

        function searchCertainResultForSummaries(candidates, mergedSummaries) {
            let totalSummary = { values: Array(candidates.length).fill(0), mergedCount: 0 };
            let leastBombs = Number.MAX_VALUE;
            let mostBombs = 0;

            mergedSummaries.forEach((summary) => {
                summary.values.forEach((value, i) => (totalSummary.values[i] += value));
                totalSummary.mergedCount += summary.mergedCount;
                leastBombs = summary.flagAmount < leastBombs ? summary.flagAmount : leastBombs;
                mostBombs = summary.flagAmount > mostBombs ? summary.flagAmount : mostBombs;
            });

            let noBombsLeftForRest = searchNoBombsLeftForRest(leastBombs, totalFlagsLeft);
            let allBombsOnRest = searchAllBombsOnRest(mostBombs, totalFlagsLeft);

            candidates.forEach((candidate, candidateI) => {
                let value = totalSummary.values[candidateI];
                candidate.isCertainReveal = value === 0;
                candidate.isCertainFlag = value === totalSummary.mergedCount * candidate.clusterSize;
            });

            let anyInteraction = searchCertainInteraction(candidates);
            let certainResultFound = noBombsLeftForRest || anyInteraction || allBombsOnRest;

            return {
                certainResultFound: certainResultFound,
                mergedSummaries: mergedSummaries,
                candidates: candidates,
                leastBombs: leastBombs
            };
        }

        function searchCertainInteraction(candidates) {
            let anyCertainReveal = false;
            let anyCertainFlag = false;

            candidates.forEach((candidate) => {
                if (candidate.isCertainReveal) {
                    if (!anyCertainReveal) {
                        resultInfo.messages.push("Reveals found - no bomb in any valid combination");
                        anyCertainReveal = true;
                    }

                    candidate.clusterGroup.forEach((clusterCell) => revealCell(clusterCell));
                } else if (candidate.isCertainFlag) {
                    if (!anyCertainFlag) {
                        resultInfo.messages.push("Flags found - bomb in every valid combination");
                        anyCertainFlag = true;
                    }

                    candidate.clusterGroup.forEach((clusterCell) => flagCell(clusterCell));
                }
            });

            return anyCertainReveal || anyCertainFlag;
        }

        function searchNoBombsLeftForRest(leastBombs, flagsLeft) {
            let noBombsLeftForRest = leastBombs === flagsLeft && outsideUnknowns.length > 0;

            if (noBombsLeftForRest) {
                resultInfo.messages.push("Reveals found - no bombs left for non candidates");

                applyToCells(field, (cell) => {
                    if (cell.isHidden && !cell.isFlagged && !cell.isBorderCell) {
                        revealCell(cell);
                    }
                });
            }

            return noBombsLeftForRest;
        }

        function searchAllBombsOnRest(mostBombs, flagsLeft) {
            let remainingBombs = flagsLeft - mostBombs;
            let allBombsOnRest = outsideUnknowns.length > 0 && outsideUnknowns.length === remainingBombs;

            if (allBombsOnRest) {
                resultInfo.messages.push("Flags found - all bombs are on outside unknowns");

                applyToCells(field, (cell) => {
                    if (cell.isHidden && !cell.isFlagged && !cell.isBorderCell) {
                        flagCell(cell);
                    }
                });
            }

            return allBombsOnRest;
        }

        function setCheckResultSummaries(groupingCheckResults) {
            groupingCheckResults.forEach((checkResult) => {
                let summaries = {};
                let summaryList = [];

                checkResult.validCombinations.forEach((comb) => {
                    let summary;

                    if (summaries.hasOwnProperty(comb.flagAmount)) {
                        summary = summaries[comb.flagAmount];
                    } else {
                        summary = { values: Array(comb.values.length).fill(0), flagAmount: comb.flagAmount, mergedCount: 0 };
                        summaries[comb.flagAmount] = summary;
                        summaryList.push(summary);
                    }

                    let occurenceCount = 1;
                    comb.values.forEach((value, i) => (occurenceCount *= binomialCoefficient(checkResult.candidates[i].clusterSize, value)));

                    summary.mergedCount += occurenceCount;
                    comb.values.forEach((value, i) => (summary.values[i] += value * occurenceCount));
                });

                checkResult.summaries = summaryList;
            });
        }

        function mergeGroupingsCombinationsAndCheck(groupingCheckResults) {
            setCheckResultSummaries(groupingCheckResults);
            let mergedSummaries = [];

            groupingCheckResults.forEach((checkResult) => {
                if (mergedSummaries.length > 0) {
                    let newSummaries = {};
                    let newSummaryList = [];

                    mergedSummaries.forEach((rootSummary) => {
                        checkResult.summaries.forEach((leafSummary) => {
                            let newFlagAmount = rootSummary.flagAmount + leafSummary.flagAmount;

                            if (newFlagAmount <= totalFlagsLeft) {
                                let rootValues = rootSummary.values.slice(0);

                                for (let i = 0; i < rootValues.length; i++) {
                                    rootValues[i] *= leafSummary.mergedCount;
                                }

                                let leafValues = leafSummary.values.slice(0);

                                for (let i = 0; i < leafValues.length; i++) {
                                    leafValues[i] *= rootSummary.mergedCount;
                                }

                                let newValues = rootValues.concat(leafValues);
                                let newMergedCount = rootSummary.mergedCount * leafSummary.mergedCount;
                                let newSummary = { values: newValues, flagAmount: newFlagAmount, mergedCount: newMergedCount };

                                if (newSummaries.hasOwnProperty(newFlagAmount)) {
                                    let baseSummary = newSummaries[newFlagAmount];
                                    baseSummary.mergedCount += newSummary.mergedCount;
                                    newSummary.values.forEach((value, i) => (baseSummary.values[i] += value));
                                } else {
                                    newSummaries[newFlagAmount] = newSummary;
                                    newSummaryList.push(newSummary);
                                }
                            }
                        });
                    });

                    mergedSummaries = newSummaryList;
                } else {
                    mergedSummaries = checkResult.summaries;
                }
            });

            mergedSummaries = mergedSummaries.filter((summary) => summary.flagAmount + outsideUnknowns.length >= totalFlagsLeft);

            let mergedCandidates = [];
            groupingCheckResults.forEach((checkResult) => (mergedCandidates = mergedCandidates.concat(checkResult.candidates)));

            return searchCertainResultForSummaries(mergedCandidates, mergedSummaries, totalFlagsLeft);
        }

        function calculateCandidateCellProbs(checkResult) {
            let candidates = checkResult.candidates;
            let combinationProbs = checkResult.mergedSummaries;

            // Each candidate combination with k bombs leaves C(outside unknowns, flags left - k) ways to place the rest.
            // Computed in log space, as these numbers overflow on large boards.
            combinationProbs.forEach((prob) => {
                prob.logWeight = Math.log(prob.mergedCount) + logBinomialCoefficient(outsideUnknowns.length, totalFlagsLeft - prob.flagAmount);

                for (let i = 0; i < prob.values.length; i++) {
                    prob.values[i] /= prob.mergedCount * candidates[i].clusterSize;
                }
            });

            let maxLogWeight = combinationProbs.reduce((a, b) => Math.max(a, b.logWeight), -Infinity);
            combinationProbs.forEach((prob) => (prob.weight = Math.exp(prob.logWeight - maxLogWeight)));

            let candidateValues = calculateCandidateValues(combinationProbs, candidates);
            let cellProbs = convertToCellProbs(candidateValues, candidates);
            return cellProbs;
        }

        function convertToCellProbs(candidateValues, candidates) {
            let cellProbs = [];

            candidateValues.forEach((value, i) => {
                candidates[i].clusterGroup.forEach((groupCell) => {
                    cellProbs.push({
                        percentage: (value * 100).toFixed(2) + "%",
                        fraction: value,
                        candidate: groupCell,
                        clusterRoot: candidates[i]
                    });
                });
            });

            return cellProbs;
        }

        function calculateCandidateValues(combinationProbs, candidates) {
            let totalWeight = 0;
            combinationProbs = combinationProbs.sort((a, b) => a.weight - b.weight);
            combinationProbs.forEach((prob) => (totalWeight += prob.weight));
            let candidateValues = new Array(candidates.length).fill(0);

            combinationProbs.forEach((prob) => {
                prob.values.forEach((value, i) => (candidateValues[i] += value * (prob.weight / totalWeight)));
            });

            return candidateValues;
        }

        function calculateOutsiderCellProb(cellProbs) {
            if (outsideUnknowns.length === 0) {
                return null;
            }

            let averageFlagsInBorder = 0;
            cellProbs.forEach((cellProb) => (averageFlagsInBorder += cellProb.fraction));
            let averageFlagsLeftOutside = totalFlagsLeft - averageFlagsInBorder;
            let outsideUnknownsFraction = averageFlagsLeftOutside / outsideUnknowns.length;
            let outsideUnknownSet = new Set(outsideUnknowns);
            let candidateFractions = new Map();

            cellProbs.forEach((cellProb) => {
                let key = cellProb.candidate.x + "-" + cellProb.candidate.y;

                if (!candidateFractions.has(key)) {
                    candidateFractions.set(key, cellProb.fraction);
                }
            });

            outsideUnknowns.forEach((outsider) => {
                let probabilityOfZero = 1;

                outsider.neighbors.forEach((neighbor) => {
                    let probabilityOfBomb;

                    if (neighbor.isBorderCell && neighbor.isUnknown) {
                        probabilityOfBomb = candidateFractions.get(neighbor.x + "-" + neighbor.y);
                    } else if (neighbor.isFlagged) {
                        probabilityOfBomb = 1;
                    } else if (outsideUnknownSet.has(neighbor)) {
                        probabilityOfBomb = outsideUnknownsFraction;
                    }

                    probabilityOfZero *= 1 - probabilityOfBomb;
                });

                outsider.probabilityOfZero = probabilityOfZero;
            });

            outsideUnknowns = outsideUnknowns.sort((a, b) => -(a.probabilityOfZero - b.probabilityOfZero));
            let outsiderCandidate = outsideUnknowns[0];

            return {
                percentage: (outsideUnknownsFraction * 100).toFixed(2) + "%",
                fraction: outsideUnknownsFraction,
                candidate: outsiderCandidate,
                isOutsider: true
            };
        }

        function analyzeCombinations(checkResult) {
            if (checkResult.mergedSummaries.length === 0) {
                return { logWeight: -Infinity, bestSafety: 0 };
            }

            let cellProbs = calculateCandidateCellProbs(checkResult);
            let bestFraction = cellProbs.reduce((a, b) => Math.min(a, b.fraction), 1);

            // Only the outsider fraction matters here, not which outsider would be picked (calculateOutsiderCellProb)
            if (outsideUnknowns.length > 0) {
                let averageFlagsInBorder = 0;
                cellProbs.forEach((cellProb) => (averageFlagsInBorder += cellProb.fraction));
                bestFraction = Math.min(bestFraction, (totalFlagsLeft - averageFlagsInBorder) / outsideUnknowns.length);
            }

            return {
                logWeight: logSumExp(checkResult.mergedSummaries.map((summary) => summary.logWeight)),
                bestSafety: Math.min(1, 1 - bestFraction)
            };
        }

        // Of the given guesses, picks the one most likely to survive both itself and the safest next move.
        // isPruned: skip cells that can not beat the best one so far (same choice, less work).
        function chooseGuessByLookahead(cellProbs, isPruned) {
            let bestCellProb = cellProbs[0];
            let bestScore = -1;
            let budget = { combinationsLeft: solverConfig.guessLookaheadBudget ?? Infinity };

            for (let i = 0; i < cellProbs.length; i++) {
                let cellProb = cellProbs[i];

                // Sorted by safety, and a score can not exceed the safety: no later cell can score better
                if (isPruned && 1 - cellProb.fraction <= bestScore) {
                    break;
                }

                let expectedNextSafety = getExpectedNextSafety(cellProb.candidate, budget);

                if (expectedNextSafety === null) {
                    break;
                }

                cellProb.survivalWithNextMove = (1 - cellProb.fraction) * expectedNextSafety;
                cellProb.evaluation = cellProb.survivalWithNextMove;

                if (cellProb.evaluation > bestScore) {
                    bestCellProb = cellProb;
                    bestScore = cellProb.evaluation;
                }
            }

            return bestCellProb;
        }

        // Safety of the next move, averaged over the values the cell can show if it is safe.
        // null when the budget runs out (counted in bomb combinations, so results do not depend on timing).
        function getExpectedNextSafety(cell, budget) {
            let fieldCell = field[cell.y][cell.x];
            let outcomes = [];

            for (let value = fieldCell.flaggedNeighborAmount; value <= fieldCell.hiddenNeighborAmount; value++) {
                if (budget.combinationsLeft < 0) {
                    return null;
                }

                let hypotheticalField = createFieldWithRevealedCell(cell, value);
                let analysis = sweep(hypotheticalField, bombAmount, false, false, true).analysis;
                budget.combinationsLeft -= analysis.combinationAmount;
                outcomes.push(analysis);
            }

            let maxLogWeight = outcomes.reduce((a, b) => Math.max(a, b.logWeight), -Infinity);

            if (maxLogWeight === -Infinity) {
                return 0;
            }

            let totalWeight = 0;
            let expectedSafety = 0;

            outcomes.forEach((outcome) => {
                let weight = Math.exp(outcome.logWeight - maxLogWeight);
                totalWeight += weight;
                expectedSafety += weight * outcome.bestSafety;
            });

            return expectedSafety / totalWeight;
        }

        function createFieldWithRevealedCell(cell, value) {
            let hypotheticalField = fieldToSweep.slice(0);
            let row = fieldToSweep[cell.y].slice(0);
            let cellToSweep = row[cell.x];

            row[cell.x] = {
                referenceCell: cellToSweep.referenceCell ?? cellToSweep,
                x: cell.x,
                y: cell.y,
                value: value,
                isDigit: true,
                isRevealedBomb: false,
                isHidden: false,
                isFlagged: false,
                isUnknown: false
            };

            hypotheticalField[cell.y] = row;
            return hypotheticalField;
        }

        function handleNoCertainResultFound(checkResult) {
            let cellProbs = calculateCandidateCellProbs(checkResult);
            let outsider = calculateOutsiderCellProb(cellProbs);
            evaluateCellProbs(cellProbs, outsider);
        }

        function setCellProbScoresAndSort(cellProbs) {
            cellProbs.forEach((c) => (c.score = c.fraction));
            let sorted = cellProbs.sort((a, b) => a.score - b.score);
            return sorted;
        }

        function validateCellProbs(cellProbs) {
            cellProbs.forEach((cellProb) => {
                if (!(cellProb.fraction > 0 && cellProb.fraction < 1)) {
                    throw new Error("Impossible fraction found in uncertain mode!");
                }
            });
        }

        function evaluateCellProbs(candidateCellProbs, outsider) {
            let cellProbs = createCellProbsWithOutsider(candidateCellProbs, outsider);
            validateCellProbs(cellProbs);
            cellProbs = setCellProbScoresAndSort(cellProbs);

            if (cellProbs.length === 0) {
                resultInfo.messages.push("No certain cell found");
                return;
            }

            // When only suggesting, all look-ahead candidates are evaluated for the list (same choice as with pruning)
            let guess = chooseGuess(cellProbs, withGuessing);

            if (withGuessing) {
                let message = "Reveal " + formatCellProb(guess);

                if (guess.fraction > cellProbs[0].fraction) {
                    message += " instead of the lowest bomb probability cell " + formatCellProb(cellProbs[0]);
                }

                resultInfo.messages.push([message, getCellElement(guess)]);
                resultInfo.messages.push("Evaluation: " + getEvaluationDescription(cellProbs));
                revealCell(guess.candidate);
            } else {
                resultInfo.messages.push("No certain cell found");
                resultInfo.messages.push(["Suggested guess: " + formatCellProb(guess), getCellElement(guess)]);
                resultInfo.messages.push("Evaluation: " + getEvaluationDescription(cellProbs));
                resultInfo.messages.push("Candidates by bomb probability:");

                let counter = 1;
                let placing = 1;
                let lastCellProb = null;

                cellProbs.forEach((cellProb) => {
                    if (lastCellProb && cellProb.fraction > lastCellProb.fraction) {
                        placing = counter;
                    }

                    cellProb.placing = placing;
                    lastCellProb = cellProb;
                    counter += 1;
                });

                cellProbs.forEach((cellProb) => {
                    let message = "#" + cellProb.placing + " " + formatCellProb(cellProb) + (cellProb === guess ? "  <- suggested" : "");
                    resultInfo.messages.push([message, getCellElement(cellProb)]);
                });
            }
        }

        // Sets cellProb.evaluation (higher is better) for the cells the guess logic evaluates and returns the guess.
        // The evaluation changes with the guess logic (keep getEvaluationDescription in line with it); the statistics
        // it is based on (bomb probability, survivalWithNextMove, ...) keep their meaning and are shown on their own.
        function chooseGuess(cellProbs, isPruned) {
            let endgame = searchEndgameOfPosition();

            if (endgame) {
                endgameConfigurationAmount = endgame.configurationAmount;

                if (endgame.isForced) {
                    resultInfo.messages.push("Forced: no unknown cell can give information anymore, the outcome is pure chance whatever is played");
                }

                return chooseGuessByEndgame(cellProbs, endgame);
            }

            if (solverConfig.guessLookaheadCandidates > 1) {
                return chooseGuessByLookahead(cellProbs.slice(0, solverConfig.guessLookaheadCandidates), isPruned);
            }

            cellProbs.forEach((cellProb) => (cellProb.evaluation = 1 - cellProb.fraction));
            return cellProbs[0];
        }

        // Exact endgame search on this position (see searchEndgame), or null when it is too large
        function searchEndgameOfPosition() {
            let unknownAmount = cellCounts.hidden - cellCounts.flagged;

            if (unknownAmount > Math.min(solverConfig.endgameSearchMaxUnknowns, ENDGAME_MAX_MASK_BITS)) {
                return null;
            }

            let unknowns = [];
            let indexOf = new Map();
            applyToCells(field, (cell) => {
                if (cell.isUnknown) {
                    indexOf.set(cell, unknowns.length);
                    unknowns.push(cell);
                }
            });

            let maskOf = (cell) => cell.neighbors.reduce((mask, neighbor) => (indexOf.has(neighbor) ? mask | (1 << indexOf.get(neighbor)) : mask), 0);
            let digits = [];
            let digitsOfCells = unknowns.map(() => []);

            applyToCells(field, (cell) => {
                if (cell.isDigit && cell.unknownNeighborAmount > 0) {
                    cell.neighbors.forEach((neighbor) => {
                        if (indexOf.has(neighbor)) {
                            digitsOfCells[indexOf.get(neighbor)].push(digits.length);
                        }
                    });

                    digits.push({ mask: maskOf(cell), bombs: cell.value - cell.flaggedNeighborAmount });
                }
            });

            let neighborMasks = unknowns.map(maskOf);
            let flaggedNeighbors = unknowns.map((cell) => cell.flaggedNeighborAmount);
            let result = searchEndgame(unknowns.length, totalFlagsLeft, digits, digitsOfCells, neighborMasks, flaggedNeighbors, solverConfig.endgameSearchBudget);
            return result ? Object.assign(result, { unknowns: unknowns }) : null;
        }

        // Guesses the cell with the best win chance; ties go to the lower bomb probability. Cells away from the digits
        // that are not candidates yet (only one outsider is) are added to the candidates when chosen.
        function chooseGuessByEndgame(cellProbs, endgame) {
            let options = endgame.unknowns.map((cell, i) => {
                let cellProb = cellProbs.find((c) => c.candidate.x === cell.x && c.candidate.y === cell.y);
                let fraction = endgame.bombCounts[i] / endgame.configurationAmount;
                let winChance = endgame.winCounts[i] / endgame.configurationAmount;

                if (cellProb) {
                    cellProb.winChance = winChance;
                    cellProb.evaluation = winChance;
                }

                return { cell: cell, cellProb: cellProb, fraction: fraction, winChance: winChance };
            });

            options.sort((a, b) => a.fraction - b.fraction);
            let best = options.reduce((a, b) => (b.winChance > a.winChance ? b : a));

            if (!best.cellProb) {
                best.cellProb = {
                    percentage: (best.fraction * 100).toFixed(2) + "%",
                    fraction: best.fraction,
                    candidate: best.cell,
                    isOutsider: true,
                    winChance: best.winChance,
                    evaluation: best.winChance
                };

                cellProbs.push(best.cellProb);
                cellProbs.sort((a, b) => a.fraction - b.fraction);
            }

            return best.cellProb;
        }

        function getEvaluationDescription(cellProbs) {
            if (endgameConfigurationAmount !== null) {
                return "chance to win the game with best play, exact search over all " + endgameConfigurationAmount + " bomb configurations (higher is better)";
            }

            if (solverConfig.guessLookaheadCandidates > 1) {
                let amount = Math.min(solverConfig.guessLookaheadCandidates, cellProbs.length);
                return "chance to survive the guess and the next move, for the " + amount + " cells with the lowest bomb probability (higher is better)";
            }

            return "chance to survive the guess (higher is better)";
        }

        // (row_column) as in the ids of the website's squares
        function formatCellProb(cellProb) {
            let cell = cellProb.candidate;
            let message = "(" + (cell.y + 1) + "_" + (cell.x + 1) + ") bomb probability " + cellProb.percentage;

            if (cellProb.survivalWithNextMove !== undefined) {
                message += ", survive it and next move " + (cellProb.survivalWithNextMove * 100).toFixed(2) + "%";
            }

            if (cellProb.winChance !== undefined) {
                message += ", win chance with best play " + (cellProb.winChance * 100).toFixed(2) + "%";
            }

            if (cellProb.evaluation !== undefined) {
                message += ", evaluation " + (cellProb.evaluation * 100).toFixed(2) + "%";
            }

            if (cellProb.isOutsider) {
                message += " - Outsider";
            } else if (cellProb.candidate.clusterSize > 1) {
                message += " - Cluster";
            }

            return message;
        }

        function getCellElement(cellProb) {
            let referenceCell = cellProb.candidate.referenceCell;
            return referenceCell.div ? referenceCell.div : referenceCell;
        }

        function createCellProbsWithOutsider(candidateCellProbs, outsider) {
            let allCellProbs = candidateCellProbs.slice(0);
            if (outsider) {
                allCellProbs.push(outsider);
            }
            return allCellProbs;
        }
    }

    function getFlagsLeft(field) {
        let flagsAmount = getFlagsAmount();
        let flagsLeft = bombAmount - flagsAmount;
        return flagsLeft;
    }

    function getFlagsAmount() {
        return cellCounts.flagged;
    }

    function checkBombDeath() {
        return cellCounts.revealedBombs > 0;
    }

    function checkStart() {
        return cellCounts.hidden === cellCounts.cells;
    }

    function checkSolved() {
        return cellCounts.hidden === bombAmount;
    }

    function getBorderCells(field) {
        let fieldBorderDigits = [];
        let borderDigits = [];

        applyToCells(field, (cell) => {
            if (cell.isDigit && cell.unknownNeighborAmount > 0) {
                cell.isBorderCell = true;
                fieldBorderDigits.push(cell);
                borderDigits.push(createBorderDigit(cell));
            }
        });

        let borderUnknownsByFieldCell = new Map();
        let borderUnknowns = [];

        fieldBorderDigits.forEach((fieldDigitBorderCell, i) => {
            fieldDigitBorderCell.neighbors.forEach((neighbor) => {
                if (neighbor.isUnknown) {
                    let borderUnknown = borderUnknownsByFieldCell.get(neighbor);

                    if (!borderUnknown) {
                        neighbor.isBorderCell = true;
                        borderUnknown = createBorderUnknown(neighbor);
                        borderUnknownsByFieldCell.set(neighbor, borderUnknown);
                        borderUnknowns.push(borderUnknown);
                    }

                    borderDigits[i].neighbors.push(borderUnknown);
                    borderUnknown.neighbors.push(borderDigits[i]);
                }
            });
        });

        return { digits: borderDigits, unknowns: borderUnknowns };
    }

    function createBorderUnknown(fieldBorderUnknown) {
        let borderCell = createBorderCell(fieldBorderUnknown);
        borderCell.isHidden = true;
        borderCell.isUnknown = true;
        borderCell.value = -1;
        return borderCell;
    }

    function createBorderDigit(fieldBorderDigit) {
        let borderCell = createBorderCell(fieldBorderDigit);
        borderCell.isDigit = true;
        borderCell.value = fieldBorderDigit.value;
        return borderCell;
    }

    function createBorderCell(fieldBorderCell) {
        return {
            referenceCell: fieldBorderCell.referenceCell,
            x: fieldBorderCell.x,
            y: fieldBorderCell.y,
            unknownNeighborAmount: fieldBorderCell.unknownNeighborAmount,
            flaggedNeighborAmount: fieldBorderCell.flaggedNeighborAmount,
            neighbors: []
        };
    }

    function checkSuffocations(borderCells) {
        let suffocationsFound = false;
        let unknowns = borderCells.unknowns;

        unknowns.forEach((assumedFlag) => {
            let filledDigits = [];

            assumedFlag.neighbors.forEach((digitNeighbor) => {
                if (digitNeighbor.flaggedNeighborAmount + 1 === digitNeighbor.value) {
                    filledDigits.push(digitNeighbor);
                }
            });

            if (filledDigits.length === 0) {
                return;
            }

            let filledDigitsUnknownNeighbors = [];

            filledDigits.forEach((filledDigit) => {
                filledDigit.neighbors.forEach((unknownNeighbor) => {
                    if (unknownNeighbor !== assumedFlag && !filledDigitsUnknownNeighbors.includes(unknownNeighbor)) {
                        filledDigitsUnknownNeighbors.push(unknownNeighbor);
                    }
                });
            });

            if (filledDigitsUnknownNeighbors.length === 0) {
                return;
            }

            let suffocationFound = false;
            let suffocateCounts = {};

            filledDigitsUnknownNeighbors.forEach((unknownNeighbor) => {
                unknownNeighbor.neighbors.forEach((digitToSuffocate) => {
                    if (!suffocationFound && !filledDigits.includes(digitToSuffocate)) {
                        let flagsLeft = digitToSuffocate.value - digitToSuffocate.flaggedNeighborAmount;

                        if (flagsLeft > digitToSuffocate.unknownNeighborAmount - 1) {
                            suffocationFound = true;
                        } else {
                            let index = getCellCoords(digitToSuffocate);

                            if (suffocateCounts.hasOwnProperty(index)) {
                                suffocateCounts[index] += 1;

                                if (flagsLeft > digitToSuffocate.unknownNeighborAmount - suffocateCounts[index]) {
                                    suffocationFound = true;
                                }
                            } else {
                                suffocateCounts[index] = 1;
                            }
                        }
                    }
                });
            });

            if (suffocationFound) {
                revealCell(assumedFlag);
                suffocationsFound = true;
            }
        });

        return suffocationsFound;
    }

    function getCellCoords(cell) {
        return cell.x + "-" + cell.y;
    }

    function checkTrivialFlags(field) {
        let flagsFound = false;

        applyToCells(field, (cell) => {
            if (cell.isDigit && cell.hiddenNeighborAmount === cell.value && cell.flaggedNeighborAmount !== cell.value) {
                cell.neighbors.forEach((neighborCell) => {
                    if (neighborCell.isUnknown) {
                        flagCell(neighborCell);
                        flagsFound = true;
                    }
                });
            }
        });

        return flagsFound;
    }

    function revealCell(cell) {
        addInteraction(cell.referenceCell, false);
    }
    function flagCell(cell) {
        addInteraction(cell.referenceCell, true);
    }

    function addInteraction(referenceCell, isFlag) {
        let interactedCells = isFlag ? flaggedCells : revealedCells;

        if (!interactedCells.has(referenceCell)) {
            interactedCells.add(referenceCell);
            interactions.push({ cell: referenceCell, isFlag: isFlag });
        }
    }
}

function applyToNeighbors(matrix, cell, action) {
    for (let yOffset = -1; yOffset <= 1; yOffset++) {
        for (let xOffset = -1; xOffset <= 1; xOffset++) {
            if (yOffset === 0 && xOffset === 0) {
                continue;
            }

            let y = cell.y + xOffset;
            let x = cell.x + yOffset;

            if (y >= 0 && y < matrix.length && x >= 0 && x < matrix[cell.y].length) {
                let isBreak = action(matrix[y][x]) === "break";
                if (isBreak) {
                    return;
                }
            }
        }
    }
}

function applyToCells(matrix, action) {
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            let isBreak = action(matrix[y][x]) === "break";
            if (isBreak) {
                return;
            }
        }
    }
}

function simulate(element, eventName, mouseButton) {
    let eventMatchers = {
        HTMLEvents: /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
        MouseEvents: /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
    };

    let defaultOptions = {
        pointerX: 0,
        pointerY: 0,
        button: mouseButton ? mouseButton : 0,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
        bubbles: true,
        cancelable: true
    };

    let options = extend(defaultOptions, arguments[2] || {});
    let oEvent,
        eventType = null;

    for (let name in eventMatchers) {
        if (eventMatchers[name].test(eventName)) {
            eventType = name;
            break;
        }
    }

    if (!eventType) {
        throw new SyntaxError("Only HTMLEvents and MouseEvents interfaces are supported");
    }

    if (document.createEvent) {
        oEvent = document.createEvent(eventType);

        if (eventType === "HTMLEvents") {
            oEvent.initEvent(eventName, options.bubbles, options.cancelable);
        } else {
            oEvent.initMouseEvent(
                eventName,
                options.bubbles,
                options.cancelable,
                document.defaultView,
                options.button,
                options.pointerX,
                options.pointerY,
                options.pointerX,
                options.pointerY,
                options.ctrlKey,
                options.altKey,
                options.shiftKey,
                options.metaKey,
                options.button,
                element
            );
        }

        element.dispatchEvent(oEvent);
    } else {
        options.clientX = options.pointerX;
        options.clientY = options.pointerY;
        let evt = document.createEventObject();
        oEvent = extend(evt, options);
        element.fireEvent("on" + eventName, oEvent);
    }

    return element;

    function extend(destination, source) {
        for (let property in source) {
            destination[property] = source[property];
        }

        return destination;
    }
}

// Exact endgame search: for every unknown cell the number of bomb configurations won when revealing it and playing
// on optimally (search over all adaptive strategies; all configurations are equally likely). Cells are bit indices;
// digits: { mask of unknown neighbors, bombs they still need }. A game is won once all safe cells are revealed.
// Returns null when configurations plus search states exceed the budget.
function searchEndgame(unknownAmount, bombsLeft, digits, digitsOfCells, neighborMasks, flaggedNeighbors, budget) {
    let configurations = enumerateEndgameConfigurations(unknownAmount, bombsLeft, digits, digitsOfCells, budget);

    if (!configurations) {
        return null;
    }

    let allCells = unknownAmount === 0 ? 0 : 2 ** unknownAmount - 1;
    let workLeft = budget - configurations.length;
    let memo = new Map();
    let isWon = (configuration, revealed) => (~configuration & allCells & ~revealed) === 0;
    let valueOf = (i, configuration) => flaggedNeighbors[i] + bitCount(configuration & neighborMasks[i]);

    let winsWhenRevealing = (i, candidates, revealed) => {
        let nextRevealed = revealed | (1 << i);
        let groups = new Map();
        let wins = 0;

        candidates.forEach((configuration) => {
            if (!(configuration & (1 << i))) {
                let value = valueOf(i, configuration);
                groups.has(value) ? groups.get(value).push(configuration) : groups.set(value, [configuration]);
            }
        });

        groups.forEach((group) => {
            let remaining = group.filter((configuration) => !isWon(configuration, nextRevealed));
            wins += group.length - remaining.length + winsFrom(remaining, nextRevealed);
        });

        return wins;
    };

    let winsFrom = (candidates, revealed) => {
        if (candidates.length === 0) {
            return 0;
        }

        let key = revealed + "|" + candidates.join(",");

        if (!memo.has(key)) {
            if (--workLeft < 0) {
                throw endgameBudgetExceeded;
            }

            // A cell that is safe in every configuration costs nothing and only adds information, so revealing it
            // first is optimal: then only that cell needs to be searched
            let bombCells = candidates.reduce((a, b) => a | b, 0);
            let certainSafe = allCells & ~revealed & ~bombCells;
            let best = 0;

            if (certainSafe) {
                best = winsWhenRevealing(31 - Math.clz32(certainSafe & -certainSafe), candidates, revealed);
            } else {
                for (let i = 0; i < unknownAmount; i++) {
                    if (!(revealed & (1 << i)) && candidates.some((configuration) => !(configuration & (1 << i)))) {
                        best = Math.max(best, winsWhenRevealing(i, candidates, revealed));
                    }
                }
            }

            memo.set(key, best);
        }

        return memo.get(key);
    };

    try {
        let winCounts = [];
        let bombCounts = [];
        let isForced = true;

        for (let i = 0; i < unknownAmount; i++) {
            winCounts.push(winsWhenRevealing(i, configurations, 0));
            bombCounts.push(configurations.filter((configuration) => configuration & (1 << i)).length);
            let values = new Set(configurations.filter((configuration) => !(configuration & (1 << i))).map((configuration) => valueOf(i, configuration)));
            isForced = isForced && values.size <= 1;
        }

        // Forced: no cell can give information anymore, so the outcome is pure chance whatever is played
        return { configurationAmount: configurations.length, winCounts: winCounts, bombCounts: bombCounts, isForced: isForced };
    } catch (e) {
        if (e === endgameBudgetExceeded) {
            return null;
        }

        throw e;
    }
}

const endgameBudgetExceeded = new Error("Endgame search budget exceeded");

// All bomb placements on the unknown cells that fit the digits, as bit masks (null above the budget)
function enumerateEndgameConfigurations(unknownAmount, bombsLeft, digits, digitsOfCells, budget) {
    let configurations = [];
    let bombsNeeded = digits.map((digit) => digit.bombs);
    let cellsOpen = digits.map((digit) => bitCount(digit.mask));

    let assign = (i, configuration, bombs) => {
        if (configurations.length > budget) {
            return;
        }

        if (i === unknownAmount) {
            configurations.push(configuration);
            return;
        }

        [false, true].forEach((isBomb) => {
            let newBombs = bombs + (isBomb ? 1 : 0);

            if (newBombs > bombsLeft || bombsLeft - newBombs > unknownAmount - i - 1) {
                return;
            }

            let fits = true;

            digitsOfCells[i].forEach((digit) => {
                cellsOpen[digit] -= 1;
                bombsNeeded[digit] -= isBomb ? 1 : 0;
                fits = fits && bombsNeeded[digit] >= 0 && bombsNeeded[digit] <= cellsOpen[digit];
            });

            if (fits) {
                assign(i + 1, isBomb ? configuration | (1 << i) : configuration, newBombs);
            }

            digitsOfCells[i].forEach((digit) => {
                cellsOpen[digit] += 1;
                bombsNeeded[digit] += isBomb ? 1 : 0;
            });
        });
    };

    assign(0, 0, 0);
    return configurations.length > budget ? null : configurations;
}

function bitCount(value) {
    let count = 0;

    while (value) {
        value &= value - 1;
        count += 1;
    }

    return count;
}

function logSumExp(values) {
    let max = values.reduce((a, b) => Math.max(a, b), -Infinity);
    return max === -Infinity ? max : max + Math.log(values.reduce((a, b) => a + Math.exp(b - max), 0));
}

function logBinomialCoefficient(n, k) {
    return logFactorial(n) - logFactorial(k) - logFactorial(n - k);
}

function logFactorial(n) {
    let table = (logFactorial.table = logFactorial.table || [0]);

    while (table.length <= n) {
        table.push(table[table.length - 1] + Math.log(table.length));
    }

    return table[n];
}

function binomialCoefficient(n, k) {
    let coefficient = 1;

    if (k > n - k) {
        k = n - k;
    }

    for (let i = 0; i < k; ++i) {
        coefficient *= n - i;
        coefficient /= i + 1;
    }

    return coefficient;
}
