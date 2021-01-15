let SweepStates = {
    start: "start",
    solving: "solving",
    stuck: "stuck",
    solved: "solved",
    death: "death"
};

let AutoSweepConfig = {
    doLog: false,
    isAutoSweepEnabled: false,
    isRiddleFinderMode: false,
    isVirtualMode: false,
    batchSizeForVirtual: 1000,
    baseIdleTime: 0,
    solvingIdleTime: 0,
    newGameStateIdleTime: 0,
    restDefaultIdleTime: 0,
    gameId: 0,
    lastRestState: null
};

let AutoSweepStats = {
    stateCounts: [],
    currentStateCounts: {
        start: 0,
        solving: 0,
        stuck: 0,
        solved: 0,
        death: 0
    }
};

disableEndOfGamePrompt();
setKeyDownHandler();



function disableEndOfGamePrompt() {
    prompt = () => "cancel";
}

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
            case "s": startAutoSweep(); break;
            case "d": stopAutoSweep(); break;
            case "i": formatLogAutoSweepStats(); break;
            case "o": formatLogGameTimeStats(); break;
            case "k": resetAutoSweepStats(); break;
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

function startAutoSweep(config = AutoSweepConfig, stats = AutoSweepStats) {
    config.isAutoSweepEnabled = true;
    setTimeout(() => autoSweep(config, stats, config.batchSizeForVirtual), 0);
}

function stopAutoSweep(config = AutoSweepConfig) {
    config.isAutoSweepEnabled = false;
}

function formatLogAutoSweepStats(index, stats = AutoSweepStats) {
    let isCurrent = (typeof index === "undefined");
    let stateCount;

    if (isCurrent) {
        stateCount = stats.currentStateCounts;
        index = stats.stateCounts.length;
    } else {
        stateCount = stats.stateCounts[index];
    }

    logFormatted(stateCount);

    function logFormatted(stateCount) {
        let solved = stateCount[SweepStates.solved];
        let death = stateCount[SweepStates.death];
        let total = solved + death;
        let winPercentage = (solved / total * 100);
        console.log("[" + index + "] " + "Solved: " + (winPercentage.toFixed(2)) + "% (" + solved + "/" + total + ")");
    }
}

function formatLogGameTimeStats() {
    let sweepTimes = window.sweepTimes;

    if (!sweepTimes) {
        return;
    }

    let gameTimeStats = sweepTimes.map(mapStats);
    let gameStats = mapStats(gameTimeStats.map(c => c.sum));

    console.log("Stats for all games:", gameStats);
    console.log("Stats per data:", gameTimeStats);

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
        return (values.length % 2) ? values[half] : ((values[half - 1] + values[half]) / 2.0);
    }
}

function resetAutoSweepStats(stats = AutoSweepStats) {
    stats.currentStateCounts.start = 0;
    stats.currentStateCounts.solving = 0;
    stats.currentStateCounts.stuck = 0;
    stats.currentStateCounts.solved = 0;
    stats.currentStateCounts.death = 0;
    stats.stateCounts = [];
}

function toggleDoLog(config = AutoSweepConfig) {
    config.doLog = !config.doLog;
}

function startNewGame(config = AutoSweepConfig) {
    config.lastRestState = null;
    config.gameId += 1;

    if (config.isVirtualMode) {
        restartVirtualGame();
    } else {
        simulate(document.getElementById('face'), "mousedown");
        simulate(document.getElementById('face'), "mouseup");
    }
}

function updateStateCounts(stats) {
    let stateCounts = stats.currentStateCounts;
    stats.stateCounts.push(stateCounts);
    stats.currentStateCounts = {
        start: stateCounts.start,
        solving: stateCounts.solving,
        stuck: stateCounts.stuck,
        solved: stateCounts.solved,
        death: stateCounts.death
    };
}

function autoSweep(config, stats, iters) {
    if (!config.isAutoSweepEnabled) {
        return;
    }

    let idleTime;
    let restartNeeded = lastWasNewGameState(config);

    if (restartNeeded) {
        startNewGame(config);
        idleTime = 0;
    }
    else {
        idleTime = executeSweepCycle(config, stats);
    }

    if (iters > 0 && config.isVirtualMode) {
        autoSweep(config, stats, iters - 1); 
    } else {
        continueAutoSweep(config, stats, idleTime);
    }

    function continueAutoSweep(config, stats, idleTime) {
        if (config.isAutoSweepEnabled) {
            let timeOutTime = (idleTime + config.baseIdleTime);
            setTimeout(() => autoSweep(config, stats, config.batchSizeForVirtual), timeOutTime);
        }
    }

    function executeSweepCycle(config, stats) {
        let idleTime;
        let sweepResult = sweepPage(true, config.doLog, config.gameId, config.isVirtualMode);
        let interactions = sweepResult.interactions;
        let isRiddle = config.isRiddleFinderMode && sweepResult.solver === "3";

        if (isRiddle) {
            config.isAutoSweepEnabled = false;
            idleTime = 0;
        }
        else {
            let state = sweepResult.state;
            idleTime = getIdleTimeForState(state);
            updateAutoSweepStats(config, stats, state);
            config.lastRestState = state;
        }

        executeInteractions(interactions, !isRiddle, config.isVirtualMode);
        return idleTime;
    }

    function updateAutoSweepStats(config, stats, state) {
        if (state === SweepStates.solving) {
            stats.currentStateCounts[state] += 1;
        } else if (!config.lastRestState || config.lastRestState !== state) {
            stats.currentStateCounts[state] += 1;

            if (isNewGameState(state)) {
                updateStateCounts(stats);
            }
        }
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

    function isNewGameState(state) {
        return state === SweepStates.solved || state === SweepStates.death;
    }

    function lastWasNewGameState(config) {
        return isNewGameState(config.lastRestState);
    }
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
    return bombAmount;
}

function executeVirtualInteractions(interactions) {
    if (!window.virtualGame) {
        return;
    }

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

    // field.forEach((row, i) => {
    //     console.log(row.reduce((a, b) => a + formatCell(b), " " + i + " "));
    // });

    function formatCell(cell) {
        if (cell.isUnknown) {
            return "[ ]";
        } else if (cell.isFlagged) {
            return "[x]";
        } else if (cell.isDigit) {
            return "[" + cell.value + "]";
        } else {
            return "   ";
        }
    }

    function revealFirstCell(cells, cell, bombAmout) {
        let viableBombCells = getViableBombCells(cells, cell);
        setBombs(viableBombCells, bombAmout);
        setDigits(cells);
        revealCell(cell);
    }

    function revealCell(cell) {
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
                cell.neighbors.forEach(neighborCell => revealCell(neighborCell));
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

    function setBombs(cells, bombAmount) {
        if (bombAmount < 1) {
            return;
        }

        let chosenIndex = getRandomInt(cells.length);
        let chosenCell = cells[chosenIndex];
        chosenCell.isBomb = true;
        setBombs(cells.filter(c => c !== chosenCell), bombAmount - 1);
    }

    function getRandomInt(max) {
        return Math.floor(window.getRandom() * Math.floor(max));
    }

    function getViableBombCells(cells, cell) {
        return cells.filter(c => {
            let isNeighbor = ((c === cell) || cell.neighbors.includes(c));
            return !isNeighbor;
        });
    }

    function getCellsFromField(field) {
        return field.reduce((a, b) => a.concat(b.reduce((a, b) => a.concat(b), []), []));
    }
}

function restartVirtualGame(config) {
    if (!window.seedRng) {
        window.seedRng = null;

        window.setSeed = (seed) => {
            if (seed) {
                window.seedRng = new Math.seedrandom(seed);
            } else {
                window.seedRng = null;
            }
        };

        window.getRandom = () => {
            if (window.seedRng) {
                return seedRng();
            } else {
                return Math.random();
            }
        };
    }

    initVirtualGame();

    window.virtualGame.field = createVirtualField(window.virtualGame);

    function createVirtualField(virtualGame) {
        let field = [];

        for (let y = 0; y < virtualGame.height; y++) {
            let row = [];

            for (let x = 0; x < virtualGame.width; x++) {
                let cell = {
                    x: x,
                    y: y,
                    isHidden: true,
                    isUnknown: true,
                    isRevealedBomb: false,
                    value: -1
                };

                row.push(cell);
            }

            field.push(row);
        }

        applyToCells(field, cell => {
            let neighbors = [];

            applyToNeighbors(field, cell, neighborCell => {
                neighbors.push(neighborCell);
            });

            cell.neighbors = neighbors;
        });

        return field;
    }

    function initVirtualGame() {
        if (config) {
            window.virtualGame = {
                width: config.width,
                height: config.height,
                bombAmount: config.bombAmount,
                hasStarted: false
            };
        } else {
            window.virtualGame = {
                width: 30,
                height: 16,
                bombAmount: 99,
                hasStarted: false
            };
        }
    }
}

function getVirtualGame() {
    if (!window.virtualGame) {
        restartVirtualGame();
    }

    return {
        field: window.virtualGame.field,
        bombAmount: window.virtualGame.bombAmount
    };
}

function sweepPage(withGuessing = true, doLog = true, gameId = null, isVirtualMode = false) {
    let field;
    let bombAmount;

    if (isVirtualMode) {
        let virtualGame = getVirtualGame();
        field = virtualGame.field;
        bombAmount = virtualGame.bombAmount;
    } else {
        field = initializeField();
        bombAmount = getBombAmount();
    }

    return sweep(field, bombAmount, withGuessing, doLog, gameId);

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

                if (jDiv.length < 1 || jDiv.css('display') === "none") {
                    break;
                }

                let jDivClass = jDiv.attr('class');

                let cell = {
                    div: jDiv[0],
                    x: x,
                    y: y
                };

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

function sweep(fieldToSweep, bombAmount, withGuessing = true, doLog = true, gameId = null) {
    let sweepT0 = performance.now();
    let interactions = [];
    let checkResult = checkForAndAddInteractions();

    let sweepResult = {
        interactions: interactions,
        state: checkResult.state,
        solver: checkResult.solver
    };

    recordSweepTime(sweepT0, gameId);
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

        if (checkSuffocations(field, borderCells)) {
            return onStandardSolving("1", "[1] Suffocations");
        }

        if (checkDigitsFlagCombinations(field, borderCells)) {
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
        return {
            state: state,
            solver: solver
        };
    }

    function onBombDeath() {
        log("[x] Bomb death");
        return createCheckResult(SweepStates.death);
    }

    function log() {
        if (doLog) {
            console.log.apply(console, arguments);
        }
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

        if (withGuessing) {
            revealCell(field[Math.floor(field.length / 2)][Math.floor(field[0].length / 2)]);
        }

        return createCheckResult(SweepStates.start);
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

        return field;
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
            let groupingResults = [];
            let leastBombsCount = 0;

            let checkAllCombinationsT0 = performance.now();

            borderCellGroupings.forEach(grouping => {
                if (!resultInfo.certainResultFound) {
                    let groupingFlagsLeft = totalFlagsLeft - leastBombsCount;
                    let groupingResult = checkGrouping(grouping, groupingFlagsLeft);
                    leastBombsCount += (groupingResult.leastBombs ? groupingResult.leastBombs : 0);
                    groupingResults.push(groupingResult);
                }
            });

            if (!resultInfo.certainResultFound) {
                let cellProbs = checkGroupingsCombined(groupingResults);

                if (!resultInfo.certainResultFound) {
                    handleNoCertainResultFound(cellProbs);
                }
            }

            let checkAllCombinationsT1 = performance.now();
            let checkAllCombinationsTime = (checkAllCombinationsT1 - checkAllCombinationsT0);

            resultInfo.messages.push("Check of all combinations took " + checkAllCombinationsTime.toFixed(4) + " milliseconds");
            addTime(window, "sweepCombinTimes", checkAllCombinationsTime);
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
                        digit.valueForUnknowns = 1 / combinations(digit.unknownNeighborAmount, digit.value - digit.flaggedNeighborAmount);
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

                    if (primary !== 0) {
                        return primary;
                    } else {
                        return -(a.digits.length - b.digits.length);
                    }
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
                    if (clusteredGroups.length > 0) {
                        let belongsToCluster = false;

                        clusteredGroups.forEach(cluster => {
                            let isEqual = true;
                            let toCompare = cluster[0];

                            if (toCompare.neighbors.length === cell.neighbors.length) {
                                toCompare.neighbors.forEach(toCompareNeighbor => {
                                    if (!cell.neighbors.includes(toCompareNeighbor)) {
                                        isEqual = false;
                                    }
                                });
                            } else {
                                isEqual = false;
                            }

                            if (isEqual) {
                                belongsToCluster = true;
                                cluster.push(cell);
                            }
                        });

                        if (!belongsToCluster) {
                            clusteredGroups.push([cell]);
                        }
                    } else {
                        clusteredGroups.push([cell]);
                    }
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

        function checkGrouping(grouping, groupingFlagsLeft) {
            let groupingResult = {
                validCombinations: null,
                leastBombs: null,
                mostBombs: null,
                caseWithNoFlagsLeftFound: false,
                messages: []
            };

            let digits = grouping.digits;
            let candidates = clusterCandidates(grouping.unknowns);

            let validCombinations = [];

            digits.forEach(digit => {
                digit.u = digit.unknownNeighborAmount;
                digit.f = digit.flaggedNeighborAmount;
            });

            let validCombinationNodes = [{
                combination: [],
                unknownsI: "u",
                flagsI: "f",
                flagsLeft: groupingFlagsLeft
            }];

            while (validCombinationNodes.length > 0) {
                let node = validCombinationNodes.pop();
                let candidate = candidates[node.combination.length];
                let clusterSize = candidate.clusterSize;

                for (let flagsToSet = 0; flagsToSet <= clusterSize; flagsToSet++) {
                    let freesToSet = clusterSize - flagsToSet;

                    let areValidFreesToSet = true;

                    if (freesToSet > 0) {
                        candidate.neighbors.forEach(digitNeighbor => {
                            if (areValidFreesToSet && ((digitNeighbor[node.unknownsI] - freesToSet) + digitNeighbor[node.flagsI]) < digitNeighbor.value) {
                                areValidFreesToSet = false;
                            }
                        });
                    }

                    if (areValidFreesToSet) {
                        let areValidFlagsToSet = (node.flagsLeft >= flagsToSet);

                        if (areValidFlagsToSet && flagsToSet > 0) {
                            candidate.neighbors.forEach(digitNeighbor => {
                                if (areValidFlagsToSet && (digitNeighbor[node.flagsI] + flagsToSet) > digitNeighbor.value) {
                                    areValidFlagsToSet = false;
                                }
                            });
                        }

                        if (areValidFlagsToSet) {
                            let newCombination = node.combination.slice(0);
                            newCombination.push(flagsToSet);

                            if (node.combination.length + 1 < candidates.length) {
                                let newUnknownsI = node.unknownsI + String(flagsToSet);
                                let newFlagsI = node.flagsI + String(flagsToSet);

                                digits.forEach(digit => {
                                    digit[newUnknownsI] = digit[node.unknownsI];
                                    digit[newFlagsI] = digit[node.flagsI];
                                });

                                candidate.neighbors.forEach(digitNeighbor => {
                                    digitNeighbor[newUnknownsI] -= clusterSize;
                                    digitNeighbor[newFlagsI] += flagsToSet;
                                });

                                validCombinationNodes.push({
                                    combination: newCombination,
                                    unknownsI: newUnknownsI,
                                    flagsI: newFlagsI,
                                    flagsLeft: (node.flagsLeft - flagsToSet)
                                });
                            } else {
                                validCombinations.push(newCombination);
                            }
                        }
                    }
                }

                digits.forEach(digit => {
                    delete digit[node.unknownsI];
                    delete digit[node.flagsI];
                });
            }

            groupingResult.validCombinations = validCombinations;
            searchCertainResult(candidates, groupingResult, groupingFlagsLeft);
            return groupingResult;
        }

        function searchCertainResult(candidates, groupingResult, groupingFlagsLeft) {
            let occurencesValues = Array(candidates.length).fill(0);
            let occurenceCounts = [];
            let totalOccurences = 0;

            let leastBombs = candidates.length;
            let mostBombs = 0;

            groupingResult.validCombinations.forEach(validCombination => {
                let occurenceCount = 1;
                let bombs = 0;

                validCombination.forEach((flagValue, j) => {
                    let clusterSize = candidates[j].clusterSize;

                    if (clusterSize > 1) {
                        let combinationAmount = combinations(clusterSize, flagValue);
                        occurenceCount *= combinationAmount;
                    }

                    bombs += flagValue;
                });

                validCombination.forEach((flagValue, j) => {
                    occurencesValues[j] += ((flagValue / candidates[j].clusterSize) * occurenceCount);
                });

                occurenceCounts.push(occurenceCount);
                totalOccurences += occurenceCount;

                leastBombs = Math.min(leastBombs, bombs);
                mostBombs = Math.max(mostBombs, bombs);
            });

            groupingResult.leastBombs = leastBombs;
            groupingResult.mostBombs = mostBombs;

            let noBombsLeftForRest = (leastBombs === groupingFlagsLeft && outsideUnknowns.length > 0);

            if (noBombsLeftForRest) {
                resultInfo.messages.push("Clickables found - no bombs left for non candidates");

                applyToCells(field, cell => {
                    if (cell.isHidden && !cell.isFlagged && !cell.isBorderCell) {
                        revealCell(cell);
                    }
                });
            }

            let fractionOfFlag = occurencesValues.map(c => c / totalOccurences);
            let percentOfFlag = occurencesValues.map(c => (c / totalOccurences * 100.0).toFixed(1) + "%");
            let cellProbs = [];

            candidates.forEach((candidate, i) => {
                cellProbs.push({
                    percentage: percentOfFlag[i],
                    fraction: fractionOfFlag[i],
                    score: fractionOfFlag[i],
                    candidate: candidate
                });
            });

            let anyZeroPercent = false;

            cellProbs.forEach(cellProb => {
                if (cellProb.fraction === 0) {
                    if (!anyZeroPercent) {
                        resultInfo.messages.push("Clickables found - no bomb in any valid combination");
                        anyZeroPercent = true;
                    }

                    cellProb.candidate.clusterGroup.forEach(clusterCell => {
                        revealCell(clusterCell);
                    });
                }
            });

            if (noBombsLeftForRest || anyZeroPercent) {
                resultInfo.certainResultFound = true;
            } else {
                let flagsFound = false;

                cellProbs.forEach(cellProb => {
                    if (cellProb.fraction === 1) {
                        if (!flagsFound) {
                            resultInfo.messages.push("Flags found - bomb in every valid combination");
                            flagsFound = true;
                        }

                        cellProb.candidate.clusterGroup.forEach(clusterCell => {
                            flagCell(clusterCell);
                        });
                    }
                });

                if (flagsFound) {
                    resultInfo.certainResultFound = true;
                } else {
                    groupingResult.cellProbs = cellProbs;
                }
            }
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

        function mergeGroupingsCellProbsWithCheck(groupingResults, totalLeastBombs, totalMostBombs) {
            let mergeResult = {
                cellProbs: [],
                caseWithNoFlagsLeftFound: false
            };

            let tooFewBombsNotPossible = (totalLeastBombs + outsideUnknowns.length >= totalFlagsLeft);
            let tooManyBombsNotPossible = (totalMostBombs <= totalFlagsLeft);

            if (tooFewBombsNotPossible && tooManyBombsNotPossible) {
                groupingResults.forEach(groupingResult => {
                    groupingResult.cellProbs.forEach(cellProb => {
                        mergeResult.cellProbs.push(cellProb);
                    });
                });
            } else {
                checkGroupingsCellProbs(groupingResults, mergeResult);
            }

            return mergeResult;
        }

        function checkGroupingsCellProbs(groupingResults, mergeResult) {
            let mergedValidCombinations = [];
            let mergedCandidates = [];

            groupingResults.forEach((groupingResult, i) => {
                let newValidCombinations = [];
                let isLastToMerge = (i === (groupingResults.length - 1));

                if (mergedCandidates.length > 0) {
                    mergedValidCombinations.forEach(currentCombination => {
                        groupingResult.validCombinations.forEach(combinationToMerge => {
                            let newCombination = currentCombination.concat(combinationToMerge);
                            addNewCombinationIfValid(newValidCombinations, newCombination, isLastToMerge);
                        });
                    });
                } else {
                    groupingResult.validCombinations.forEach(combinationToMerge => {
                        addNewCombinationIfValid(newValidCombinations, combinationToMerge, isLastToMerge);
                    });
                }

                mergedValidCombinations = newValidCombinations;

                groupingResult.cellProbs.forEach(cellProb => {
                    mergedCandidates.push(cellProb.candidate);
                });
            });

            let mergedGroupingResult = {
                validCombinations: mergedValidCombinations
            };

            searchCertainResult(mergedCandidates, mergedGroupingResult, totalFlagsLeft);
            mergeResult.cellProbs = mergedGroupingResult.cellProbs;

            function addNewCombinationIfValid(toAddTo, newCombination, isLastToMerge) {
                let isValid = true;
                let flagAmount = 0;

                for (let i = 0; i < newCombination.length; i++) {
                    let combFlagAmount = newCombination[i];

                    flagAmount += combFlagAmount;

                    if (flagAmount > totalFlagsLeft) {
                        mergeResult.caseWithNoFlagsLeftFound = true;
                        isValid = false;
                        break;
                    }
                }

                if (isLastToMerge && isValid && (flagAmount + outsideUnknowns.length) < totalFlagsLeft) {
                    isValid = false;
                }

                if (isValid) {
                    toAddTo.push(newCombination);
                }
            }
        }

        function checkGroupingsCombined(groupingResults) {
            let caseWithNoFlagsLeftFound = false;
            let totalLeastBombs = 0;
            let totalMostBombs = 0;

            groupingResults.forEach(groupingResult => {
                if (groupingResult.validCombinations && groupingResult.validCombinations.length > 0) {
                    totalLeastBombs += groupingResult.leastBombs;
                    totalMostBombs += groupingResult.mostBombs;
                }

                if (groupingResult.caseWithNoFlagsLeftFound) {
                    caseWithNoFlagsLeftFound = true;
                }
            });

            let mergeResult = mergeGroupingsCellProbsWithCheck(groupingResults, totalLeastBombs, totalMostBombs);

            if (caseWithNoFlagsLeftFound) {
                resultInfo.messages.push("Case with no flags left found");
            } else if (mergeResult.caseWithNoFlagsLeftFound) {
                resultInfo.messages.push("Case with no flags left found (after merge)");
            }

            return mergeResult.cellProbs;
        }

        function handleNoCertainResultFound(cellProbs) {
            let unclusteredCellProbs = [];

            cellProbs.forEach(cellProb => {
                if (cellProb.candidate.clusterSize > 1) {
                    cellProb.candidate.clusterGroup.forEach(clusterCell => {
                        let newCellProb = {
                            percentage: cellProb.percentage,
                            fraction: cellProb.fraction,
                            score: cellProb.fraction,
                            candidate: clusterCell
                        };

                        unclusteredCellProbs.push(newCellProb);
                    });
                } else {
                    unclusteredCellProbs.push(cellProb);
                }
            });

            cellProbs = unclusteredCellProbs;

            if (outsideUnknowns.length > 0) {
                let averageFlagsInBorder = 0;

                cellProbs.forEach(cellProb => {
                    averageFlagsInBorder += cellProb.fraction;
                });

                let averageFlagsLeftOutside = totalFlagsLeft - averageFlagsInBorder;
                let fractionForOutsideUnknowns = averageFlagsLeftOutside / outsideUnknowns.length;

                outsideUnknowns = outsideUnknowns.sort((a, b) => {
                    let flaggedNeighborAmountDiff = -(a.flaggedNeighborAmount - b.flaggedNeighborAmount);

                    if (flaggedNeighborAmountDiff !== 0) {
                        return flaggedNeighborAmountDiff;
                    } else {
                        return -(a.borderCellNeighborAmount - b.borderCellNeighborAmount);
                    }
                });

                let outsideCandidate = outsideUnknowns[0];

                cellProbs.push({
                    percentage: (fractionForOutsideUnknowns * 100).toFixed(1) + "%",
                    fraction: fractionForOutsideUnknowns,
                    score: fractionForOutsideUnknowns,
                    candidate: outsideCandidate,
                    isOutside: true
                });
            }

            cellProbs.forEach(cellProb => {
                setTurnedTrivial(cellProb);

                if (cellProb.turnedTrivial > 0) {
                    cellProb.score = Math.pow(cellProb.fraction, 1.2);
                }
            });

            cellProbs = cellProbs.sort((a, b) => {
                let scoreDiff = a.score - b.score;

                if (scoreDiff !== 0) {
                    return scoreDiff;
                } else {
                    let turnedTrivialDiff = -(a.turnedTrivial - b.turnedTrivial);

                    if (turnedTrivialDiff !== 0) {
                        return turnedTrivialDiff;
                    } else {
                        return -(a.candidate.neighbors.length - b.candidate.neighbors.length);
                    }
                }
            });

            if (withGuessing) {
                if (cellProbs.length > 0) {
                    let lowestCellProb = cellProbs[0];
                    resultInfo.messages.push("Reveal lowest score cell (" + lowestCellProb.percentage + ")");
                    revealCell(lowestCellProb.candidate);
                }
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
                    let message = "#" + cellProb.placing + " " + formatCellProbCoords(cellProb) + ": " + cellProb.percentage;

                    if (cellProb.isOutside) {
                        message += " - Outsider";
                    }

                    if (cellProb.candidate.clusterSize > 1) {
                        message += " - Cluster";
                    }

                    resultInfo.messages.push(message);
                    resultInfo.messages.push(cellProb.candidate.referenceCell);
                });
            }

            function setTurnedTrivial(cellProb) {
                if (typeof cellProb.turnedTrivial === "undefined") {
                    cellProb.turnedTrivial = 0;

                    cellProb.candidate.neighbors.forEach(digitNeighbor => {
                        let flagsLeft = digitNeighbor.value - digitNeighbor.flaggedNeighborAmount;

                        if (flagsLeft === (digitNeighbor.neighbors.length - 1)) {
                            cellProb.turnedTrivial += 1;
                        }
                    });
                }
            }

            function formatCellProbCoords(cellProb) {
                let cell = cellProb.candidate;
                return "(" + (cell.y + 1) + "_" + (cell.x + 1) + ")";
            }
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
        let flags = getFlagAmount(field);
        return flags === bombAmount && trueForAllCells(field, cell => !cell.isUnknown);
    }

    function getFlagAmount(field) {
        return field.reduce((A, B) => A + B.reduce((a, b) => a + (b.isFlagged ? 1 : 0), 0), 0);
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

    function borderDigitsValid(digits) {
        let valid = true;

        for (let i = 0; i < digits.length; i++) {
            let digit = digits[i];
            let flagsLeft = digit.value - digit.flaggedNeighborAmount;

            digit.neighbors.forEach(neighbor => {
                if (valid && neighbor.isFlagged) {
                    flagsLeft -= 1;

                    if (flagsLeft < 0) {
                        valid = false;
                    }
                }
            });

            if (!valid) {
                break;
            }
        }

        return valid;
    }

    function checkDigitsFlagCombinations(field, borderCells) {
        let flagsFound = false;
        let digitsLength = borderCells.digits.length;

        for (let i = 0; i < digitsLength; i++) {
            let digits = getBorderCells(field).digits;
            let digit = digits[i];

            let unknownNeighborAmount = digit.unknownNeighborAmount;
            let combinationAmount = (1 << unknownNeighborAmount);
            let validStateAmount = 0;
            let flagsLeft = (digit.value - digit.flaggedNeighborAmount);
            let flagCandidates = [];

            digit.neighbors.forEach(flagCandidate => {
                flagCandidate.includedCount = 0;
                flagCandidates.push(flagCandidate);
            });

            for (let mask = 0; mask < combinationAmount; mask++) {
                let bitwiseOnes = countBitwiseOnes(mask);

                if (bitwiseOnes === flagsLeft) {
                    for (let unknownI = 0; unknownI < unknownNeighborAmount; unknownI++) {
                        let isOneAtUnknownI = ((1 << unknownI) & mask) !== 0;
                        flagCandidates[unknownI].isFlagged = isOneAtUnknownI;
                        flagCandidates[unknownI].isUnknown = !isOneAtUnknownI;
                    }

                    if (borderDigitsValid(digits)) {
                        flagCandidates.forEach(flagCandidate => {
                            if (flagCandidate.isFlagged) {
                                flagCandidate.includedCount += 1;
                            }
                        });

                        validStateAmount += 1;
                    }
                }
            }

            flagCandidates.forEach(flagCandidate => {
                if (flagCandidate.includedCount === validStateAmount) {
                    flagCell(flagCandidate);
                    flagsFound = true;
                }
            });
        }

        return flagsFound;
    }

    function countBitwiseOnes(number) {
        return number.toString(2).replace(/0/g, "").length;
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

        if (fieldBorderDigits.length > 0) {
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
        }

        return {
            digits: borderDigits,
            unknowns: borderUnknowns
        };
    }

    function createBorderUnknown(fieldBorderUnknown) {
        return {
            referenceCell: fieldBorderUnknown.referenceCell,
            x: fieldBorderUnknown.x,
            y: fieldBorderUnknown.y,
            unknownNeighborAmount: fieldBorderUnknown.unknownNeighborAmount,
            flaggedNeighborAmount: fieldBorderUnknown.flaggedNeighborAmount,
            isHidden: true,
            isUnknown: true,
            value: -1,
            neighbors: []
        };
    }

    function createBorderDigit(fieldBorderDigit) {
        return {
            referenceCell: fieldBorderDigit.referenceCell,
            x: fieldBorderDigit.x,
            y: fieldBorderDigit.y,
            unknownNeighborAmount: fieldBorderDigit.unknownNeighborAmount,
            flaggedNeighborAmount: fieldBorderDigit.flaggedNeighborAmount,
            isDigit: true,
            value: fieldBorderDigit.value,
            neighbors: []
        };
    }

    function checkSuffocations(field, borderCells) {
        let suffocationsFound = false;
        let unknownsLength = borderCells.unknowns.length;

        for (let i = 0; i < unknownsLength; i++) {
            let unknowns = getBorderCells(field).unknowns;
            let assumedFlag = unknowns[i];
            assumedFlag.isUnknown = false;
            assumedFlag.isFlagged = true;

            let filledDigits = [];

            assumedFlag.neighbors.forEach(neighbor => {
                neighbor.flaggedNeighborAmount += 1;
                neighbor.unknownNeighborAmount -= 1;

                if (neighbor.flaggedNeighborAmount === neighbor.value) {
                    filledDigits.push(neighbor);
                }
            });

            if (filledDigits.length > 0) {
                let filledDigitsUnknownNeighbors = [];

                filledDigits.forEach(filledDigit => {
                    filledDigit.neighbors.forEach(neighbor => {
                        if (neighbor.isUnknown && !filledDigitsUnknownNeighbors.includes(neighbor)) {
                            filledDigitsUnknownNeighbors.push(neighbor);
                        }
                    });
                });

                if (filledDigitsUnknownNeighbors.length > 0) {
                    let suffocationFound = false;

                    filledDigitsUnknownNeighbors.forEach(unknownNeighbor => {
                        unknownNeighbor.neighbors.forEach(digitToSuffocate => {
                            if (!suffocationFound && !filledDigits.includes(digitToSuffocate)) {
                                digitToSuffocate.unknownNeighborAmount -= 1;
                                let flagsLeft = digitToSuffocate.value - digitToSuffocate.flaggedNeighborAmount;

                                if (flagsLeft > digitToSuffocate.unknownNeighborAmount) {
                                    suffocationFound = true;
                                }
                            }
                        });
                    });

                    if (suffocationFound) {
                        revealCell(assumedFlag);
                        suffocationsFound = true;
                    }
                }
            }
        }

        return suffocationsFound;
    }

    function revealCell(cell) {
        addInteraction(cell.referenceCell, false);
    }

    function flagCell(cell) {
        addInteraction(cell.referenceCell, true);
    }

    function addInteraction(referenceCell, isFlag) {
        let duplicate = interactions.find(c => c.cell === referenceCell && c.isFlag === isFlag);

        if (!duplicate) {
            interactions.push({ cell: referenceCell, isFlag: isFlag });
        }
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

    function recordSweepTime(sweepT0, gameId) {
        let sweepT1 = performance.now();
        let sweepTime = (sweepT1 - sweepT0);

        if (!window.sweepTimes) {
            window.sweepTimes = [];
        }

        addTime(window.sweepTimes, gameId !== null ? gameId : 0, sweepTime);
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

            let yInBounds = y >= 0 && y < matrix.length;
            let xInBounds = x >= 0 && x < matrix[cell.y].length;
            let inBounds = yInBounds && xInBounds;

            if (inBounds) {
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

function addTime(obj, propName, time) {
    if (!obj[propName]) {
        obj[propName] = [];
    }

    obj[propName].push(time);
}

function combinations(n, k) {
    return factorial(n) / (factorial(k) * factorial(n - k));

    function factorial(n) {
        if (!window.factorialCache) {
            window.factorialCache = [];
        }

        let cache = window.factorialCache;

        if (n === 0 || n === 1) {
            return 1;
        }

        if (cache[n] > 0) {
            return cache[n];
        }

        cache[n] = factorial(n - 1) * n;
        return cache[n];
    }
}