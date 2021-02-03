let SweepStates = { start: "start", solving: "solving", stuck: "stuck", solved: "solved", death: "death" };

let AutoSweepConfig = {
    doLog: false,
    isAutoSweepEnabled: false,
    isRiddleFinderMode: false,
    isRecordingStepStats: false,
    isVirtualMode: false,
    virtualGameConfig: null,
    batchSizeForVirtual: 1000,
    baseIdleTime: 0,
    solvingIdleTime: 0,
    newGameStateIdleTime: 0,
    restDefaultIdleTime: 0,
    gameIndex: 0,
    lastSweepResult: { state: null, solver: null }
};

let AutoSweepStats = { gameStats: [] };

disableEndOfGamePrompt();
setKeyDownHandler();



function disableEndOfGamePrompt() { prompt = () => "cancel"; }

function setKeyDownHandler() {
    if (!window.sweepKeyDown) {
        sweepKeyDown = keyDownHandler;
        document.addEventListener('keydown', keyDownHandler);
    }

    function keyDownHandler(e) {
        switch (e.key) {
            case "w": sweepStepGuessing(true); break;
            case "W": sweepStepGuessing(false); break;
            case "e": sweepStepCertain(true); break;
            case "E": sweepStepCertain(false); break;
            case "s": startAutoSweep(AutoSweepConfig, AutoSweepStats); break;
            case "d": stopAutoSweep(AutoSweepConfig); break;
            case "i": formatLogGameStats(); break;
            case "o": formatLogGameStatsWithRaw(); break;
            case "k": resetGameStats(); break;
            case "l": toggleDoLog(); break;
        }
    }
}

function sweepStepCertain(withBoardInteraction) {
    sweepStep(withBoardInteraction, false, ("lastForSweepStepCertain" + withBoardInteraction));
}

function sweepStepGuessing(withBoardInteraction) {
    sweepStep(withBoardInteraction, true, ("lastForSweepStepGuessing" + withBoardInteraction));
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
        let squares = document.getElementsByClassName('square');

        for (let i = 0; i < squares.length; i++) {
            if (squares[i].style.display !== 'none') {
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

function stopAutoSweep(config) { config.isAutoSweepEnabled = false; }

function formatLogGameStatsWithRaw() {
    formatLogGameStats(null, AutoSweepStats, true);
}

function formatLogGameStats(gamesIncluded = null, stats = AutoSweepStats, logRaw = false) {
    let gameStats = stats.gameStats.slice(0);

    if (gamesIncluded !== null && gamesIncluded > 0) {
        gameStats = gameStats.filter(c => c.index < gamesIncluded);
    }

    gameStats = gameStats.filter(c => c.finishState);

    console.log("Stats for first " + gameStats.length + " games");
    logWinningPercentage();

    logGuessesPerGame();
    logTimePerGame();
    logTimePerStep();

    if (logRaw) { console.log("Raw data: ", gameStats); }

    function logGuessesPerGame() {
        let guessesPerGame = gameStats.map(g => g.guesses);
        let guessStats = mapStats(guessesPerGame);
        logStat("Average/Max guesses", guessStats.average.toFixed(2) + " / " + guessStats.max.toFixed(0));
    }

    function logTimePerGame() {
        let timePerGame = gameStats.map(g => g.time);
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
        let wins = gameStats.reduce((a, b) => a + (b.finishState === SweepStates.solved ? 1 : 0), 0);
        let winPercentage = wins / gameStats.length * 100.0;
        logStat("Winning percentage", winPercentage.toFixed(2) + "% (" + wins + "/" + gameStats.length + ")");
    }

    function logStat(title, formatStat) { console.log("-> " + title + ":\t\t" + formatStat); }

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

    function sum(values) { return values.reduce((a, b) => a + b); }
    function min(values) { return values.reduce((a, b) => Math.min(a, b)); }
    function max(values) { return values.reduce((a, b) => Math.max(a, b)); }
    function average(values) { return sum(values) / values.length; }

    function median(values) {
        let sortedValues = values.slice(0).sort((a, b) => a - b);
        let half = Math.floor(sortedValues.length / 2);
        return (values.length % 2) ? values[half] : ((values[half - 1] + values[half]) / 2.0);
    }
}

function resetGameStats(stats = AutoSweepStats) { stats.gameStats = []; }

function toggleDoLog(config = AutoSweepConfig) { config.doLog = !config.doLog; }

function startNewGameForAutoSweep(config = AutoSweepConfig) {
    config.lastSweepResult.state = null;
    config.lastSweepResult.solver = null;
    config.gameIndex += 1;

    if (config.isVirtualMode) {
        restartVirtualGame(config.virtualGameConfig);
    } else {
        simulate(document.getElementById('face'), "mousedown");
        simulate(document.getElementById('face'), "mouseup");
    }
}

function autoSweep(config, stats) {
    let iterations = config.batchSizeForVirtual;

    do {
        if (!config.isAutoSweepEnabled) { return; }

        let idleTime;
        let restartNeeded = lastWasNewGameState(config);

        if (restartNeeded) {
            if (config.lastSweepResult.state === "death" && config.lastSweepResult.solver !== "3g") {
                throw new Error("Died while not guessing!");
            }

            startNewGameForAutoSweep(config);
            idleTime = 0;
        }
        else {
            idleTime = executeSweepCycle(config, stats);
        }

        iterations -= 1;

        if (!(iterations > 0 && config.isVirtualMode)) {
            continueAutoSweep(config, stats, idleTime);
        }
    } while (iterations > 0 && config.isVirtualMode);

    function continueAutoSweep(config, stats, idleTime) {
        if (config.isAutoSweepEnabled) {
            let timeOutTime = (idleTime + config.baseIdleTime);
            setTimeout(() => autoSweep(config, stats), timeOutTime);
        }
    }

    function executeSweepCycle(config, stats) {
        let idleTime;
        let sweepResult = sweepPage(true, config.doLog, config, stats);
        let interactions = sweepResult.interactions;
        let isRiddle = config.isRiddleFinderMode && sweepResult.solver === "3";

        if (isRiddle) {
            config.isAutoSweepEnabled = false;
            idleTime = 0;
        }
        else {
            let state = sweepResult.state;
            idleTime = getIdleTimeForState(config, state);

            if (!sweepResult.solver) {
                sweepResult.solver = config.lastSweepResult.solver;
            }

            config.lastSweepResult = sweepResult;
        }

        if (config.isAutoSweepEnabled || isRiddle) {
            executeInteractions(interactions, !isRiddle, config.isVirtualMode);
        }

        return idleTime;
    }

    function getIdleTimeForState(config, state) {
        let stateIdleTime = 0;

        if (state === SweepStates.solving) {
            stateIdleTime = config.solvingIdleTime;
        } else if (isNewGameState(state)) {
            stateIdleTime = config.newGameStateIdleTime;
        } else {
            stateIdleTime = config.restDefaultIdleTime;
        }

        return stateIdleTime;
    }

    function lastWasNewGameState(config) {
        return isNewGameState(config.lastSweepResult.state);
    }
}

function getBombArray(field) {
    return field.reduce((A, B) => A.concat(B.reduce((a, b) => a.concat(b.isBomb ? true : false), [])), []);
}

function isNewGameState(state) {
    return state === SweepStates.solved || state === SweepStates.death;
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
        interactions.forEach(action => {
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
        console.log("Interations:");

        if (interactions.length > 0) {
            interactions.forEach(action => {
                console.log("-> " + (action.isFlag ? "Flag" : "Reveal") + ":", action.cell.div);
            });
        } else {
            console.log("-> None");
        }
    }
}

function getBombAmount() {
    let optionsForm = $('#options-form');
    let checkedBox = optionsForm.find('input[name="field"]:checked');
    let optionsRow = checkedBox.parent().parent().parent();
    let amountBombsCell = optionsRow.find('td').last();
    let bombAmount = Number(amountBombsCell.html());

    if (isNaN(bombAmount)) {
        bombAmount = Number(amountBombsCell.children()[0].value);
    }

    return bombAmount;
}

function executeVirtualInteractions(interactions) {
    if (!window.virtualGame) { return; }

    let game = window.virtualGame;
    let field = window.virtualGame.field;
    let cells = getCellsFromField(field);

    if (game.hasStarted) {
        interactions.forEach(action => {
            if (action.isFlag) {
                action.cell.isFlagged = true;
                action.cell.isUnknown = false;
            } else {
                revealCell(action.cell);
            }
        });
    } else {
        revealFirstCell(cells, interactions[0].cell, window.virtualGame.bombAmount);
        game.hasStarted = true;
    }

    function revealFirstCell(cells, cell, bombAmount) {
        let viableBombCells = getViableBombCells(cells, cell);
        setBombs(viableBombCells, bombAmount);
        setDigits(cells);
        revealCell(cell);
    }

    function setBombs(viableBombCells, bombAmount) {
        for (let i = 0; i < bombAmount; i++) {
            let bombsLeft = bombAmount - i;
            let nonBombs = viableBombCells.filter(c => !c.isBomb);
            setBomb(nonBombs, bombsLeft);
        }
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
                    cell.isDigit = (cell.value > 0);
                }

                if (cell.value === 0) {
                    cell.neighbors.forEach(neighborCell => {
                        if (neighborCell.isHidden) {
                            revealCells.push(neighborCell);
                        }
                    });
                }
            }
        }
    }

    function setDigits(cells) {
        cells.forEach(cell => {
            if (!cell.isBomb) {
                let bombNeighborAmount = cell.neighbors.reduce((a, b) => a + (b.isBomb ? 1 : 0), 0);
                cell.bombValue = bombNeighborAmount;
            }
        });
    }

    function setBomb(cells, bombAmount) {
        if (bombAmount < 1) { return; }
        let chosenIndex = getRandomInt(cells.length);
        let chosenCell = cells[chosenIndex];
        chosenCell.isBomb = true;
    }

    function getRandomInt(max) {
        return Math.floor(window.getRandom() * Math.floor(max));
    }

    function getViableBombCells(cells, cell) {
        return cells.filter(c => !((c === cell) || cell.neighbors.includes(c)));
    }

    function getCellsFromField(field) {
        return field.reduce((a, b) => a.concat(b.reduce((a, b) => a.concat(b), []), []));
    }
}

function setWindowSeedRng() {
    if (!window.seedRng) {
        window.seedRng = null;
        window.setSeed = (seed) => window.seedRng = seed ? new Math.seedrandom(seed) : null;
        window.getRandom = () => window.seedRng ? window.seedRng() : Math.random();
    }
}

function restartVirtualGame(config) {
    setWindowSeedRng();
    setVirtualGame();

    window.virtualGame.field = createVirtualField(window.virtualGame);

    function createVirtualField(virtualGame) {
        let field = [];
        let createVirtualCell = (x, y) => {
            return {
                x: x,
                y: y,
                isHidden: true,
                isUnknown: true,
                isRevealedBomb: false,
                value: -1
            };
        };

        for (let y = 0; y < virtualGame.height; y++) {
            let row = [];

            for (let x = 0; x < virtualGame.width; x++) {
                row.push(createVirtualCell(x, y));
            }

            field.push(row);
        }

        applyToCells(field, cell => {
            let neighbors = [];
            applyToNeighbors(field, cell, neighborCell => neighbors.push(neighborCell));
            cell.neighbors = neighbors;
        });

        return field;
    }

    function setVirtualGame() {
        window.virtualGame = config ? createGameFromConfig(config) : createExpertGame();
    }

    function createGameFromConfig(config) {
        return createVirtualGame(config.width, config.height, config.bombAmount);
    }

    function createVirtualGame(width, height, bombAmout) {
        return { width: width, height: height, bombAmount: bombAmout, hasStarted: false };
    }

    function createExpertGame() { return createVirtualGame(30, 16, 99); }
}

function getVirtualGame(config) {
    if (!window.virtualGame) { restartVirtualGame(config); }

    return {
        field: window.virtualGame.field,
        bombAmount: window.virtualGame.bombAmount
    };
}

function sweepPage(withGuessing = true, doLog = true, config = null, stats = null) {
    let isVirtualMode = config ? config.isVirtualMode : false;

    let field;
    let bombAmount;

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
        let sweepTime = (sweepT1 - sweepT0);
        let gameIndex = config.gameIndex;

        if (!stats.gameStats[gameIndex]) {
            stats.gameStats[gameIndex] = {
                index: gameIndex
            };

            stats.gameStats[gameIndex].stepStats = [];
        }

        let gameStats = stats.gameStats[gameIndex];

        if (!gameStats.finishState) {
            gameStats.stepStats.push({
                result: {
                    state: sweepResult.state,
                    solver: sweepResult.solver
                }, time: sweepTime
            });

            if (isNewGameState(sweepResult.state)) {
                gameStats.finishState = sweepResult.state;
                gameStats.bombArray = getBombArray(field);

                let stepStats = gameStats.stepStats;

                let wasGuessStep = (step) => step.result.state === SweepStates.solving && step.result.solver === "3g";
                let was3Step = (step) => step.result.state === SweepStates.solving && step.result.solver === "3";
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
                let jDiv = $('#' + (y + 1) + '_' + (x + 1));

                if (jDiv.length < 1 || jDiv.css('display') === "none") { break; }

                let jDivClass = jDiv.attr('class');
                let cell = { div: jDiv[0], x: x, y: y };

                if (jDivClass.substr(0, openClass.length) === openClass) {
                    let number = jDivClass.substr(openClass.length);
                    cell.value = Number(number);
                    cell.isDigit = cell.value > 0;
                } else if (jDivClass === bombRevealedClass || jDivClass === bombDeathClass) {
                    cell.isRevealedBomb = true;
                }
                else {
                    cell.isHidden = true;
                    cell.value = -1;

                    if (jDivClass === flagClass) {
                        cell.isFlagged = true;
                    } else {
                        cell.isUnknown = true;
                    }
                }

                row.push(cell);
                x += 1;
            }

            if (row.length < 1) { break; }

            y += 1;
            x = 0;
            field.push(row);
        }

        return field;
    }
}

function sweep(fieldToSweep, bombAmount, withGuessing = true, doLog = true) {
    let interactions = [];
    let checkResult = checkForAndAddInteractions();

    let sweepResult = {
        interactions: interactions,
        state: checkResult.state,
        solver: checkResult.solver
    };

    return sweepResult;

    function checkForAndAddInteractions() {
        let field = copyAndInitializeField(fieldToSweep);

        if (checkBombDeath(field)) {
            return onBombDeath();
        }

        if (checkStart(field)) {
            return onStart(field);
        }

        if (checkSolved(field)) {
            return onSolved();
        }


        if (checkTrivialFlags(field) || checkTrivialReveals(field)) {
            return onStandardSolving("0", "[0] Trivial cases");
        }

        let borderCells = getBorderCells(field);

        if (checkSuffocations(borderCells)) {
            return onStandardSolving("1", "[1] Suffocations");
        }

        if (checkDigitsFlagCombinations(borderCells)) {
            return onStandardSolving("2", "[2] Check digits flag combinations");
        }

        return checkCombinatorially(field);
    }

    function checkCombinatorially(field) {
        let resultInfo = checkAllValidCombinations(field);

        if (resultInfo.certainResultFound) {
            return onCheckCombinatorially(resultInfo, null, SweepStates.solving);
        }

        if (withGuessing) {
            return onCheckCombinatorially(resultInfo, "guessing", SweepStates.solving);
        }

        return onCheckCombinatorially(resultInfo, "stuck", SweepStates.stuck);
    }

    function createCheckResult(state, solver = null) {
        return { state: state, solver: solver };
    }

    function onBombDeath() {
        log("[x] Bomb death");
        return createCheckResult(SweepStates.death);
    }

    function log() {
        if (doLog) { console.log.apply(console, arguments); }
    }

    function onCheckCombinatorially(resultInfo, mode, resultState) {
        let message = "Check combinatorially";
        let solver = "3";

        if (mode !== null) {
            message += " - " + mode;
            solver += mode[0];
        }

        let formatSolver = "[" + solver + "]";
        log(formatSolver, message);
        resultInfo.messages.forEach(c => { log("->", formatSolver, c); });
        return createCheckResult(resultState, solver);
    }

    function onStandardSolving(solver, message) {
        log(message);
        return createCheckResult(SweepStates.solving, solver);
    }

    function onStart(field) {
        log("[s]", SweepStates.start);
        if (withGuessing) { revealFirst(field); }
        return createCheckResult(SweepStates.start);
    }

    function revealFirst(field) {
        let width = field[0].length;
        let height = field.length;
        let x = Math.floor(width / 2);
        let y = Math.floor(height / 2);
        revealCell(field[y][x]);
    }

    function onSolved() {
        log("[o]", SweepStates.solved);
        return createCheckResult(SweepStates.solved);
    }

    function checkTrivialReveals(field) {
        let revealsFound = false;

        applyToCells(field, cell => {
            if (cell.isDigit && cell.flaggedNeighborAmount === cell.value) {
                cell.neighbors.forEach(neighbor => {
                    if (neighbor.isUnknown) {
                        revealCell(neighbor);
                        revealsFound = true;
                    }
                });
            }
        });

        return revealsFound;
    }

    function copyAndInitializeField(fieldToSweep) {
        let field = fieldToSweep.map(rowToSweep => {
            let row = rowToSweep.map(cellToSweep => {
                return {
                    referenceCell: cellToSweep,
                    x: cellToSweep.x,
                    y: cellToSweep.y,
                    value: cellToSweep.value,
                    isDigit: cellToSweep.isDigit,
                    isRevealedBomb: cellToSweep.isRevealedBomb,
                    isHidden: cellToSweep.isHidden,
                    isFlagged: cellToSweep.isFlagged,
                    isUnknown: cellToSweep.isUnknown
                };
            });

            return row;
        });

        setCellNeighborInfo(field);
        return field;

        function setCellNeighborInfo(field) {
            applyToCells(field, cell => {
                cell.neighbors = [];
                cell.unknownNeighborAmount = 0;
                cell.flaggedNeighborAmount = 0;

                applyToNeighbors(field, cell, neighborCell => {
                    if (neighborCell.isUnknown) {
                        cell.unknownNeighborAmount += 1;
                    } else if (neighborCell.isFlagged) {
                        cell.flaggedNeighborAmount += 1;
                    }

                    cell.neighbors.push(neighborCell);
                });

                cell.hiddenNeighborAmount = cell.unknownNeighborAmount + cell.flaggedNeighborAmount;
                cell.neighborAmount = cell.neighbors.length;
            });
        }
    }

    function checkAllValidCombinations(field) {
        let resultInfo = {
            certainResultFound: false,
            messages: []
        };

        let totalFlagsLeft = getFlagsLeft(field);
        let borderCellGroupings = getBorderCellGroupings();
        let outsideUnknowns = getOutsideUnknowns();

        if (borderCellGroupings.length > 0) {
            let groupingCheckResults = [];
            let leastBombsCount = 0;

            let checkAllCombinationsT0 = performance.now();

            for (let i = 0; i < borderCellGroupings.length; i++) {
                let groupingFlagsLeft = totalFlagsLeft - leastBombsCount;
                let searchResult = checkGrouping(borderCellGroupings[i], groupingFlagsLeft);

                if (searchResult.certainResultFound) {
                    resultInfo.certainResultFound = true;
                    break;
                }

                leastBombsCount += (searchResult.leastBombs ? searchResult.leastBombs : 0);
                groupingCheckResults.push(searchResult);
            }

            if (!resultInfo.certainResultFound) {
                let combinedCheckResult = mergeGroupingsCombinationsAndCheck(groupingCheckResults);

                if (combinedCheckResult.certainResultFound) {
                    resultInfo.certainResultFound = true;
                } else {
                    handleNoCertainResultFound(combinedCheckResult);
                }
            }

            let checkAllCombinationsT1 = performance.now();
            let checkAllCombinationsTime = (checkAllCombinationsT1 - checkAllCombinationsT0);

            resultInfo.messages.push("Check of all combinations took " + checkAllCombinationsTime.toFixed(4) + " milliseconds");
        } else {
            checkIsolatedUnknowns();
        }

        return resultInfo;

        function getBorderCellGroupings() {
            let allBorderCells = getBorderCells(field);
            let borderCellGroupings = splitToBorderCellGroupingsAndSort(allBorderCells);
            resultInfo.messages.push("Candidate amount: " + allBorderCells.unknowns.length);
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
                borderCells.forEach(cell => cell.groupingIndex = null);
                let getFirstWithoutIndex = () => borderCells.find(borderCell => borderCell.groupingIndex === null);

                let unknownsGroupings = [];
                let startCell = getFirstWithoutIndex();

                while (startCell) {
                    let unknownsGrouping = [];
                    let index = unknownsGroupings.length;

                    let addToGrouping = cell => {
                        if (cell.groupingIndex === null) {
                            cell.groupingIndex = index;
                            unknownsGrouping.push(cell);
                            cell.neighbors.forEach(neighbor => {
                                addToGrouping(neighbor);
                            });
                        }
                    };

                    addToGrouping(startCell);
                    unknownsGrouping = unknownsGrouping.filter(cell => !cell.isDigit);

                    if (unknownsGrouping.length > 0) {
                        unknownsGroupings.push(unknownsGrouping);
                    }

                    startCell = getFirstWithoutIndex();
                }

                return unknownsGroupings;
            }

            function addDigitsToGroupings(groupings) {
                groupings.forEach(grouping => {
                    grouping.forEach(unknown => {
                        unknown.neighbors.forEach(digitNeighbor => {
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

                unknownsGroupings.forEach(grouping => {
                    cellLists.push({
                        digits: grouping.filter(c => c.isDigit),
                        unknowns: grouping.filter(c => !c.isDigit)
                    });
                });

                return cellLists;
            }

            function sortCellListsUnknowns(cellLists) {
                for (let i = 0; i < cellLists.length; i++) {
                    let unknowns = cellLists[i].unknowns;
                    let digits = cellLists[i].digits;

                    unknowns.forEach(unknown => {
                        unknown.sortScore = null;
                    });

                    digits.forEach(digit => {
                        digit.valueForUnknowns = 1 / binomialCoefficient(digit.unknownNeighborAmount, digit.value - digit.flaggedNeighborAmount);
                    });

                    let digitsSorted = digits.sort((a, b) => -(a.valueForUnknowns - b.valueForUnknowns));
                    let sortScore = 0;

                    digitsSorted.forEach(digit => {
                        digit.neighbors.forEach(unknown => {
                            if (unknowns.includes(unknown)) {
                                if (unknown.sortScore === null) {
                                    unknown.sortScore = sortScore;
                                }
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

        function clusterCandidates(candidates) {
            let clusteredCandidateGroups = findClusteredGroups(candidates);
            let clusteredCandidates = createClusteredCandidates(clusteredCandidateGroups);
            return clusteredCandidates;

            function findClusteredGroups(cells) {
                let clusteredGroups = [];

                cells.forEach(cell => {
                    let belongsToCluster = false;

                    clusteredGroups.forEach(cluster => {
                        let toCompare = cluster[0];
                        let isEqual = (toCompare.neighbors.length === cell.neighbors.length);

                        if (isEqual) {
                            toCompare.neighbors.forEach(toCompareNeighbor => {
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

                    if (!belongsToCluster) { clusteredGroups.push([cell]); }
                });

                return clusteredGroups;
            }

            function createClusteredCandidates(clusteredCandidateGroups) {
                let clusteredCandidates = [];

                clusteredCandidateGroups.forEach(candidateGroup => {
                    let clusteredCandidate = candidateGroup[candidateGroup.length - 1];
                    clusteredCandidate.clusterGroup = candidateGroup;

                    clusteredCandidate.clusterGroup.forEach(clusterCell => {
                        clusterCell.clusterSize = candidateGroup.length;
                    });

                    clusteredCandidates.push(clusteredCandidate);
                });

                return clusteredCandidates;
            }
        }

        function clusterDigitNeighbors(digits) {
            digits.forEach(digit => digit.neighbors = digit.neighbors.filter(c => c.clusterGroup));
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

        function getValidCombinationsForNeighbors(neighbors, flagsLeft) {
            let validCombinations = [];
            let combination = Array(neighbors.length).fill(0);
            let lastI = combination.length - 1;

            while (true) {
                combination[0] += 1;

                for (let i = 0; i < lastI; i++) {
                    if (combination[i] > neighbors[i].clusterSize) {
                        combination[i] = 0;
                        combination[i + 1] += 1;
                    } else { break; }
                }

                if (combination[lastI] > neighbors[lastI].clusterSize) { break; }

                if (combination.reduce((a, b) => a + b, 0) === flagsLeft) {
                    validCombinations.push(combination.slice(0));
                }
            }

            return validCombinations;
        }

        function addCandidateConditions(candidates, digits) {
            clusterDigitNeighbors(digits);
            setupCandidatesForConditions(candidates);

            digits.forEach(digit => {
                let flagsLeft = digit.value - digit.flaggedNeighborAmount;
                let neighbors = digit.neighbors;
                let validCombinations = getValidCombinationsForNeighbors(neighbors, flagsLeft);

                neighbors.forEach(neighbor => {

                    let condition = (assignment) => {
                        for (let i = 0; i < validCombinations.length; i++) {
                            let validCombination = validCombinations[i];
                            let contraintMet = true;

                            for (let j = 0; j < validCombination.length; j++) {
                                let value = assignment[neighbors[j].assignIndex];

                                if (value !== null && value !== validCombination[j]) {
                                    contraintMet = false;
                                    break;
                                }
                            }

                            if (contraintMet) {
                                return true;
                            }
                        }

                        return false;
                    };

                    addConditionedPeers(neighbor, neighbors);
                    neighbor.conditions.push(condition);
                    neighbor.conditionAmount += 1;
                    neighbor.conditionValue += neighbors.reduce((a, b) => a + (b.clusterSize - 1) / (2 + a), 0);
                });
            });
        }

        function addConditionedPeers(candidate, peers) {
            peers.forEach(peer => {
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

            // let iterationCount = 0;
            // console.time("Iterations");

            while (validAssignNodes.length > 0) {
                // iterationCount += 1;

                let assignNode = validAssignNodes.pop();
                let newNodesAreLeafs = getUnassignedAmount(assignNode.assignment) === 1;
                let newNodes = searchAssignNode(candidates, assignNode, flagsLeft, newNodesAreLeafs);
                let associatedArray = (newNodesAreLeafs ? validCombinations : validAssignNodes);
                newNodes.forEach(newNode => associatedArray.push(newNode));
            }

            // console.timeEnd("Iterations");
            // console.log("iterationCount:", iterationCount);
            // console.log("validAssignments:", validCombinations);

            return validCombinations;
        }

        function searchAssignNode(candidates, sourceNode, flagsLeft, newNodesAreLeafs) {
            let newNodes = [];
            let nextValueToSet = findBestValueToSet(candidates, sourceNode);

            nextValueToSet.legalValues.forEach(legalValue => {
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

                    previousLegalValues.forEach(value => {
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

                    if (legalValuesOfBest === null ||
                        isBetterValueToSet(legalValues, candidates[i], legalValuesOfBest, candidates[indexOfBest])) {
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

        function isValidAssignmentValue(assignment, candidates, index, value) {
            let testAssignment = createArrayWithAssignment(assignment, index, value);
            return isValidAssignmentChange(testAssignment, candidates, index);
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
            validCombinations.forEach(c => leastFlags = (c.flagAmount < leastFlags) ? c.flagAmount : leastFlags);
            return leastFlags;
        }

        function searchCertainResult(candidates, validCombinations, groupingFlagsLeft) {
            let leastBombs = getLeastFlagAmount(validCombinations);
            let noBombsLeftForRest = (leastBombs === groupingFlagsLeft && outsideUnknowns.length > 0);

            if (noBombsLeftForRest) {
                resultInfo.messages.push("Clickables found - no bombs left for non candidates");

                applyToCells(field, cell => {
                    if (cell.isHidden && !cell.isFlagged && !cell.isBorderCell) {
                        revealCell(cell);
                    }
                });
            }

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

            let anyCertainReveal = false;
            let anyCertainFlag = false;

            candidates.forEach(candidate => {
                if (candidate.isCertainReveal) {
                    if (!anyCertainReveal) {
                        resultInfo.messages.push("Clickables found - no bomb in any valid combination");
                        anyCertainReveal = true;
                    }

                    candidate.clusterGroup.forEach(clusterCell => revealCell(clusterCell));
                } else if (candidate.isCertainFlag) {
                    if (!anyCertainFlag) {
                        resultInfo.messages.push("Flags found - bomb in every valid combination");
                        anyCertainFlag = true;
                    }

                    candidate.clusterGroup.forEach(clusterCell => flagCell(clusterCell));
                }
            });

            let certainResultFound = noBombsLeftForRest || anyCertainReveal || anyCertainFlag;

            return {
                certainResultFound: certainResultFound,
                validCombinations: validCombinations,
                candidates: candidates,
                leastBombs: leastBombs,
            };
        }

        function checkIsolatedUnknowns() {
            resultInfo.messages.push("Case of isolated unknowns");

            if (outsideUnknowns.length > 0) {
                if (totalFlagsLeft === 0) {
                    resultInfo.certainResultFound = true;
                    resultInfo.messages.push("Clickables found - no bombs left");

                    outsideUnknowns.forEach(outsideUnknown => {
                        revealCell(outsideUnknown);
                    });
                } else if (withGuessing) {
                    let percentage = (totalFlagsLeft / outsideUnknowns.length * 100).toFixed(1) + "%";
                    resultInfo.messages.push("Reveal random cell (" + percentage + ")");
                    revealCell(outsideUnknowns[0]);
                }
            }
        }

        function setCheckResultSummaries(groupingCheckResults) {
            groupingCheckResults.forEach(checkResult => {
                let summaries = {};
                let summaryList = [];

                checkResult.validCombinations.forEach(comb => {
                    let summary;

                    if (summaries.hasOwnProperty(comb.flagAmount)) {
                        summary = summaries[comb.flagAmount];
                    } else {
                        summary = { values: Array(comb.values.length).fill(0), flagAmount: comb.flagAmount, mergedCount: 0 };
                        summaries[comb.flagAmount] = summary;
                        summaryList.push(summary);
                    }

                    let occurenceCount = 1;
                    comb.values.forEach((value, i) => occurenceCount *= binomialCoefficient(checkResult.candidates[i].clusterSize, value));

                    summary.mergedCount += occurenceCount;
                    comb.values.forEach((value, i) => summary.values[i] += value * occurenceCount);
                });

                checkResult.summaries = summaryList;
            });
        }

        function mergeGroupingsCombinationsAndCheck(groupingCheckResults) {
            setCheckResultSummaries(groupingCheckResults);

            let mergedSummaries = [];

            groupingCheckResults.forEach(checkResult => {
                if (mergedSummaries.length > 0) {

                    let newSummaries = {};
                    let newSummaryList = [];

                    mergedSummaries.forEach(rootSummary => {
                        checkResult.summaries.forEach(leafSummary => {
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
                                    newSummary.values.forEach((value, i) => baseSummary.values[i] += value);
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

            mergedSummaries = mergedSummaries.filter(summary => (summary.flagAmount + outsideUnknowns.length) >= totalFlagsLeft);

            let mergedCandidates = [];
            groupingCheckResults.forEach(checkResult => mergedCandidates = mergedCandidates.concat(checkResult.candidates));

            let searchResult = searchCertainResultForSummaries(mergedCandidates, mergedSummaries, totalFlagsLeft);
            return searchResult;
        }

        function searchCertainResultForSummaries(candidates, mergedSummaries) {
            let totalSummary = { values: Array(candidates.length).fill(0), mergedCount: 0 };
            let leastBombs = Number.MAX_VALUE;

            mergedSummaries.forEach(summary => {
                summary.values.forEach((value, i) => totalSummary.values[i] += value);
                totalSummary.mergedCount += summary.mergedCount;
                leastBombs = (summary.flagAmount < leastBombs) ? summary.flagAmount : leastBombs;
            });

            let noBombsLeftForRest = (leastBombs === totalFlagsLeft && outsideUnknowns.length > 0);

            if (noBombsLeftForRest) {
                resultInfo.messages.push("Clickables found - no bombs left for non candidates");

                applyToCells(field, cell => {
                    if (cell.isHidden && !cell.isFlagged && !cell.isBorderCell) {
                        revealCell(cell);
                    }
                });
            }

            candidates.forEach((candidate, candidateI) => {
                candidate.isCertainReveal = true;
                candidate.isCertainFlag = true;

                let value = totalSummary.values[candidateI];

                if (value !== 0) {
                    candidate.isCertainReveal = false;
                }

                if (value !== totalSummary.mergedCount * candidate.clusterSize) {
                    candidate.isCertainFlag = false;
                }
            });

            let anyCertainReveal = false;
            let anyCertainFlag = false;

            candidates.forEach(candidate => {
                if (candidate.isCertainReveal) {
                    if (!anyCertainReveal) {
                        resultInfo.messages.push("Clickables found - no bomb in any valid combination");
                        anyCertainReveal = true;
                    }

                    candidate.clusterGroup.forEach(clusterCell => revealCell(clusterCell));
                } else if (candidate.isCertainFlag) {
                    if (!anyCertainFlag) {
                        resultInfo.messages.push("Flags found - bomb in every valid combination");
                        anyCertainFlag = true;
                    }

                    candidate.clusterGroup.forEach(clusterCell => flagCell(clusterCell));
                }
            });

            let certainResultFound = noBombsLeftForRest || anyCertainReveal || anyCertainFlag;

            return {
                certainResultFound: certainResultFound,
                mergedSummaries: mergedSummaries,
                candidates: candidates,
                leastBombs: leastBombs,
            };
        }

        function calculateCandidateCellProbs(checkResult) {
            let candidates = checkResult.candidates;
            let candidateAmount = candidates.reduce((a, b) => a + b.clusterSize, 0);
            let unknownAmount = outsideUnknowns.length + candidateAmount;
            let combinationProbs = checkResult.mergedSummaries;

            combinationProbs.forEach(prob => {
                let distribution = approxHypergeometricDistribution(unknownAmount, totalFlagsLeft, candidateAmount, prob.flagAmount);
                prob.weight = prob.mergedCount * distribution / binomialCoefficient(candidateAmount, prob.flagAmount);

                for (let i = 0; i < prob.values.length; i++) {
                    prob.values[i] /= (prob.mergedCount * candidates[i].clusterSize);
                }
            });

            let candidateValues = calculateCandidateValues(combinationProbs, candidates);
            let cellProbs = convertToCellProbs(candidateValues, candidates);
            return cellProbs;
        }

        function convertToCellProbs(candidateValues, candidates) {
            let cellProbs = [];

            candidateValues.forEach((value, i) => {
                candidates[i].clusterGroup.forEach(groupCell => {
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
            combinationProbs.forEach(prob => totalWeight += prob.weight);
            let candidateValues = new Array(candidates.length).fill(0);

            combinationProbs.forEach(prob => {
                prob.values.forEach((value, i) => {
                    candidateValues[i] += value * (prob.weight / totalWeight);
                });
            });

            return candidateValues;
        }

        function calculateOutsiderCellProb(cellProbs) {
            if (outsideUnknowns.length === 0) {
                return null;
            }

            let averageFlagsInBorder = 0;

            cellProbs.forEach(cellProb => {
                averageFlagsInBorder += cellProb.fraction;
            });

            let averageFlagsLeftOutside = totalFlagsLeft - averageFlagsInBorder;
            let outsideUnknownsFraction = averageFlagsLeftOutside / outsideUnknowns.length;

            outsideUnknowns.forEach(outsider => {
                let probabilityOfZero = 1;

                outsider.neighbors.forEach(neighbor => {
                    let probabilityOfBomb;

                    if (neighbor.isBorderCell && neighbor.isUnknown) {
                        probabilityOfBomb = cellProbs.find(cellProb => {
                            return cellProb.candidate.x === neighbor.x &&
                                cellProb.candidate.y === neighbor.y;
                        }).fraction;
                    } else if (neighbor.isFlagged) {
                        probabilityOfBomb = 1;
                    } else if (outsideUnknowns.includes(neighbor)) {
                        probabilityOfBomb = outsideUnknownsFraction;
                    }

                    probabilityOfZero *= (1 - probabilityOfBomb);
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

        function handleNoCertainResultFound(checkResult) {
            let cellProbs = calculateCandidateCellProbs(checkResult);
            let outsider = calculateOutsiderCellProb(cellProbs);
            evaluateCellProbs(cellProbs, outsider);
        }

        function setCellProbScoresAndSort(cellProbs) {
            cellProbs.forEach(cellProb => {
                cellProb.score = cellProb.fraction * (cellProb.isOutsider ? 1.125 : 1);
            });

            return cellProbs.sort((a, b) => a.score - b.score);
        }

        function evaluateCellProbs(candidateCellProbs, outsider) {
            let cellProbs = createAllCellProbs(candidateCellProbs, outsider);
            cellProbs = setCellProbScoresAndSort(cellProbs);

            if (withGuessing && cellProbs.length > 0) {
                let lowestCellProb = cellProbs[0];
                resultInfo.messages.push("Reveal lowest score cell (" + lowestCellProb.percentage + ")");
                revealCell(lowestCellProb.candidate);
            } else {
                resultInfo.messages.push("No certain cell found");
                resultInfo.messages.push("Candidates with percentages:");

                let counter = 1;
                let placing = 1;
                let lastCellProb = null;

                cellProbs.forEach(cellProb => {
                    if (lastCellProb && cellProb.fraction > lastCellProb.fraction) {
                        placing = counter;
                    }

                    cellProb.placing = placing;
                    lastCellProb = cellProb;
                    counter += 1;
                });

                cellProbs.forEach(cellProb => {
                    let message = "#" + cellProb.placing + " " +
                        formatCellProbCoords(cellProb) + ": " +
                        cellProb.percentage + " (Score: " +
                        (cellProb.score * 100).toFixed(3) + ")";

                    if (cellProb.isOutsider) {
                        message += " - Outsider";
                    } else if (cellProb.candidate.clusterSize > 1) {
                        message += " - Cluster";
                    }

                    resultInfo.messages.push(message);

                    if (cellProb.candidate.referenceCell.div) {
                        resultInfo.messages.push(cellProb.candidate.referenceCell.div);
                    } else {
                        resultInfo.messages.push(cellProb.candidate.referenceCell);
                    }
                });
            }

            function formatCellProbCoords(cellProb) {
                let cell = cellProb.candidate;
                return "(" + (cell.y + 1) + "_" + (cell.x + 1) + ")";
            }
        }

        function createAllCellProbs(candidateCellProbs, outsider) {
            let allCellProbs = candidateCellProbs.slice(0);
            if (outsider) { allCellProbs.push(outsider); }
            return allCellProbs;
        }

        function getOutsideUnknowns() {
            let outsideUnknowns = [];

            applyToCells(field, cell => {
                if (cell.isUnknown && !cell.isBorderCell) {
                    cell.borderCellNeighborAmount = 0;

                    cell.neighbors.forEach(neighbor => {
                        if (neighbor.isBorderCell) {
                            cell.borderCellNeighborAmount += 1;
                        }
                    });

                    outsideUnknowns.push(cell);
                }
            });

            return outsideUnknowns;
        }
    }

    function getFlagsLeft(field) {
        let flagsAmount = getFlagsAmount(field);
        let flagsLeft = bombAmount - flagsAmount;
        return flagsLeft;
    }

    function getFlagsAmount(field) {
        let flagsAmount = 0;

        applyToCells(field, cell => {
            if (cell.isFlagged) {
                flagsAmount += 1;
            }
        });

        return flagsAmount;
    }

    function checkBombDeath(field) {
        return !trueForAllCells(field, cell => !cell.isRevealedBomb);
    }

    function checkStart(field) {
        return trueForAllCells(field, cell => cell.isHidden);
    }

    function checkSolved(field) {
        return getHiddenAmount(field) === bombAmount;
    }

    function getHiddenAmount(field) {
        return field.reduce((rowA, rowB) => rowA + rowB.reduce((a, b) => a + (b.isHidden ? 1 : 0), 0), 0);
    }

    function trueForAllCells(field, condition) {
        let trueForAll = true;

        applyToCells(field, cell => {
            if (!condition(cell)) {
                trueForAll = false;
                return "break";
            }
        });

        return trueForAll;
    }

    function getBinaryAssignments(valueAmount, amountOfOnes) {
        let binaryAssignments = [];
        let assignment = Array(valueAmount).fill(0);
        let lastI = assignment.length - 1;

        while (true) {
            for (let i = 0; i < lastI; i++) {
                if (assignment[i] > 1) {
                    assignment[i] = 0;
                    assignment[i + 1] += 1;
                } else { break; }
            }

            if (assignment[lastI] > 1) { break; }

            if (amountOfOnes === null || assignment.reduce((a, b) => a + b, 0) === amountOfOnes) {
                binaryAssignments.push(assignment.slice(0));
            }

            assignment[0] += 1;
        }

        return binaryAssignments;
    }

    function checkDigitsFlagCombinations(borderCells) {
        let interactionFound = false;
        let digits = borderCells.digits;

        digits.forEach(digit => {
            let freeSpots = digit.neighbors;
            let flagAmount = (digit.value - digit.flaggedNeighborAmount);
            let assignments = getBinaryAssignments(freeSpots.length, flagAmount);
            let validAssignments = [];

            assignments.forEach(assignment => {
                let assignmentValid = true;
                let flaggedNeighborCounts = {};

                for (let i = 0; i < assignment.length && assignmentValid; i++) {
                    if (assignment[i] === 0) {
                        continue;
                    }

                    let freeSpot = freeSpots[i];

                    freeSpot.neighbors.forEach(digitNeighbor => {
                        if (assignmentValid && digitNeighbor !== digit) {
                            if (digitNeighbor.value < (digitNeighbor.flaggedNeighborAmount + 1)) {
                                assignmentValid = false;
                            } else {
                                let index = getCellCoords(digitNeighbor);

                                if (flaggedNeighborCounts.hasOwnProperty(index)) {
                                    flaggedNeighborCounts[index] += 1;

                                    if (digitNeighbor.value < (digitNeighbor.flaggedNeighborAmount + flaggedNeighborCounts[index])) {
                                        assignmentValid = false;
                                    }
                                } else {
                                    flaggedNeighborCounts[index] = 1;
                                }
                            }
                        }
                    });
                }

                if (assignmentValid) {
                    validAssignments.push(assignment);
                }
            });

            if (validAssignments.length === 0) {
                throw new Error("No valid assignments for digit.");
            }

            let validAssignmentsSum = Array(freeSpots.length).fill(0);
            validAssignments.forEach(assign => assign.forEach((value, i) => validAssignmentsSum[i] += value));

            validAssignmentsSum.forEach((assignmentSum, i) => {
                if (assignmentSum === 0) {
                    revealCell(freeSpots[i]);
                    interactionFound = true;
                } else if (assignmentSum === validAssignments.length) {
                    flagCell(freeSpots[i]);
                    interactionFound = true;
                }
            });
        });

        return interactionFound;
    }

    function getBorderCells(field) {
        let fieldBorderDigits = [];
        let borderDigits = [];

        applyToCells(field, cell => {
            if (cell.isDigit && cell.unknownNeighborAmount > 0) {
                cell.isBorderCell = true;
                fieldBorderDigits.push(cell);
                borderDigits.push(createBorderDigit(cell));
            }
        });

        let fieldBorderUnknowns = [];
        let borderUnknowns = [];

        fieldBorderDigits.forEach((fieldDigitBorderCell, i) => {
            fieldDigitBorderCell.neighbors.forEach(neighbor => {
                if (neighbor.isUnknown) {
                    if (!fieldBorderUnknowns.includes(neighbor)) {
                        neighbor.isBorderCell = true;
                        fieldBorderUnknowns.push(neighbor);
                        let created = createBorderUnknown(neighbor);
                        borderUnknowns.push(created);
                        borderDigits[i].neighbors.push(created);
                        created.neighbors.push(borderDigits[i]);
                    }
                    else {
                        let indexOfUnknown = fieldBorderUnknowns.indexOf(neighbor);
                        borderDigits[i].neighbors.push(borderUnknowns[indexOfUnknown]);
                        borderUnknowns[indexOfUnknown].neighbors.push(borderDigits[i]);
                    }
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

        unknowns.forEach(assumedFlag => {
            let filledDigits = [];

            assumedFlag.neighbors.forEach(digitNeighbor => {
                if (digitNeighbor.flaggedNeighborAmount + 1 === digitNeighbor.value) {
                    filledDigits.push(digitNeighbor);
                }
            });

            if (filledDigits.length === 0) {
                return;
            }

            let filledDigitsUnknownNeighbors = [];

            filledDigits.forEach(filledDigit => {
                filledDigit.neighbors.forEach(unknownNeighbor => {
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

            filledDigitsUnknownNeighbors.forEach(unknownNeighbor => {
                unknownNeighbor.neighbors.forEach(digitToSuffocate => {
                    if (!suffocationFound && !filledDigits.includes(digitToSuffocate)) {
                        let flagsLeft = digitToSuffocate.value - digitToSuffocate.flaggedNeighborAmount;

                        if (flagsLeft > (digitToSuffocate.unknownNeighborAmount - 1)) {
                            suffocationFound = true;
                        } else {
                            let index = getCellCoords(digitToSuffocate);

                            if (suffocateCounts.hasOwnProperty(index)) {
                                suffocateCounts[index] += 1;

                                if (flagsLeft > (digitToSuffocate.unknownNeighborAmount - suffocateCounts[index])) {
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

        applyToCells(field, cell => {
            if (cell.isDigit && cell.hiddenNeighborAmount === cell.value && cell.flaggedNeighborAmount !== cell.value) {
                cell.neighbors.forEach(neighborCell => {
                    if (neighborCell.isUnknown) {
                        flagCell(neighborCell);
                        flagsFound = true;
                    }
                });
            }
        });

        return flagsFound;
    }

    function revealCell(cell) { addInteraction(cell.referenceCell, false); }
    function flagCell(cell) { addInteraction(cell.referenceCell, true); }

    function addInteraction(referenceCell, isFlag) {
        let duplicate = interactions.find(c => c.cell === referenceCell && c.isFlag === isFlag);

        if (!duplicate) {
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
                if (isBreak) { return; }
            }
        }
    }
}

function applyToCells(matrix, action) {
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            let isBreak = action(matrix[y][x]) === "break";
            if (isBreak) { return; }
        }
    }
}

function simulate(element, eventName, mouseButton) {
    let eventMatchers = {
        'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
        'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
    };

    let defaultOptions = {
        pointerX: 0,
        pointerY: 0,
        button: (mouseButton ? mouseButton : 0),
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
        bubbles: true,
        cancelable: true
    };

    let options = extend(defaultOptions, arguments[2] || {});
    let oEvent, eventType = null;

    for (let name in eventMatchers) {
        if (eventMatchers[name].test(eventName)) { eventType = name; break; }
    }

    if (!eventType) {
        throw new SyntaxError('Only HTMLEvents and MouseEvents interfaces are supported');
    }

    if (document.createEvent) {
        oEvent = document.createEvent(eventType);

        if (eventType === 'HTMLEvents') {
            oEvent.initEvent(eventName, options.bubbles, options.cancelable);
        }
        else {
            oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, document.defaultView,
                options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
                options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, element);
        }

        element.dispatchEvent(oEvent);
    }
    else {
        options.clientX = options.pointerX;
        options.clientY = options.pointerY;
        let evt = document.createEventObject();
        oEvent = extend(evt, options);
        element.fireEvent('on' + eventName, oEvent);
    }

    return element;

    function extend(destination, source) {
        for (let property in source) {
            destination[property] = source[property];
        }

        return destination;
    }
}

function approxHypergeometricDistribution(N, M, n, k) {
    return (n * 20 <= N) ? binomialDistribution(n, M / N, k) : hypergeometricDistribution(N, M, n, k);
}

function hypergeometricDistribution(N, M, n, k) {
    return binomialCoefficient(M, k) * binomialCoefficient(N - M, n - k) / binomialCoefficient(N, n);
}

function binomialDistribution(n, p, k) {
    return binomialCoefficient(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

function binomialCoefficient(n, k) {
    let coefficient = 1;

    if (k > n - k) {
        k = n - k;
    }

    for (let i = 0; i < k; ++i) {
        coefficient *= (n - i);
        coefficient /= (i + 1);
    }

    return coefficient;
}