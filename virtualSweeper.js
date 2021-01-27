let SweepStates = { start: 0, solving: 1, stuck: 2, solved: 3, death: 4 };
let AutoSweepStats = { gameStats: [] };

let seedRngGenerator = null;
let getRandomG = () => seedRngGenerator ? seedRngGenerator() : Math.random();
let getRandomIntG = (max) => Math.floor(getRandomG() * Math.floor(max));

let minesweeper = {};

let AutoSweepConfig = {
    virtualGameConfig: null,
    gameIndex: 0,
    isAutoSweepEnabled: false,
    lastSweepResult: { state: null, solver: null }
};

onmessage = function (e) {
    let message = e.data[0];

    switch (message) {
        case "start": startAutoSweep(); break;
        case "stop": stopAutoSweep(); break;
    }
};

function startAutoSweep() {
    resetAutoSweep();
    autoSweep();
}

function stopAutoSweep() {
    AutoSweepConfig.isAutoSweepEnabled = false;
}

function resetAutoSweep() {
    AutoSweepConfig.isAutoSweepEnabled = true;
    AutoSweepConfig.gameIndex = 0;
    resetGameStats();
    startNewGameForAutoSweep();
}

function resetGameStats() {
    AutoSweepStats.gameStats = [];
}

function startNewGameForAutoSweep() {
    AutoSweepConfig.lastSweepResult.state = null;
    AutoSweepConfig.lastSweepResult.solver = null;
    AutoSweepConfig.gameIndex += 1;
    restartVirtualGame();
}

function autoSweep() {
    while (AutoSweepConfig.isAutoSweepEnabled) {
        let restartNeeded = lastWasNewGameState();

        if (restartNeeded) {
            if (lastWasDeathNotGuessing()) {
                throw new Error("Died while not guessing!");
            }

            postMessage(AutoSweepStats);
            startNewGameForAutoSweep();
        }
        else {
            executeSweepCycle();
        }
    }
}

function executeSweepCycle() {
    let sweepResult = sweepPage();
    let interactions = sweepResult.interactions;

    if (!sweepResult.solver) {
        sweepResult.solver = AutoSweepConfig.lastSweepResult.solver;
    }

    AutoSweepConfig.lastSweepResult = sweepResult;
    executeVirtualInteractions(interactions);
}

function lastWasNewGameState() {
    return isNewGameState(AutoSweepConfig.lastSweepResult.state);
}

function lastWasDeathNotGuessing() {
    return AutoSweepConfig.lastSweepResult.state === "death" && AutoSweepConfig.lastSweepResult.solver !== "3g";
}

function isNewGameState(state) {
    return state === SweepStates.solved || state === SweepStates.death;
}

function executeVirtualInteractions(interactions) {
    let game = minesweeper;
    let field = game.field;
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
        revealFirstCell(cells, interactions[0].cell, game.bombAmount);
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
        let chosenIndex = getRandomIntG(cells.length);
        let chosenCell = cells[chosenIndex];
        chosenCell.isBomb = true;
    }

    function getViableBombCells(cells, cell) {
        return cells.filter(c => !((c === cell) || cell.neighbors.includes(c)));
    }

    function getCellsFromField(field) {
        return field.reduce((a, b) => a.concat(b.reduce((a, b) => a.concat(b), []), []));
    }
}

function restartVirtualGame() {
    setVirtualGame(AutoSweepConfig.virtualGameConfig);
    minesweeper.field = createVirtualField(minesweeper);

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

    function setVirtualGame(config) {
        minesweeper = config ? createGameFromConfig(config) : createExpertGame();
    }

    function createGameFromConfig(config) {
        return createVirtualGame(config.width, config.height, config.bombAmount);
    }

    function createVirtualGame(width, height, bombAmout) {
        return { width: width, height: height, bombAmount: bombAmout, hasStarted: false };
    }

    function createExpertGame() { return createVirtualGame(30, 16, 99); }
}

function sweepPage() {
    let field = minesweeper.field;
    let bombAmount = minesweeper.bombAmount;

    let sweepT0 = performance.now();
    let sweepResult = sweep(field, bombAmount, true, false);
    recordGameStats(field, sweepResult, sweepT0);
    return sweepResult;

    function recordGameStats(field, sweepResult, sweepT0) {
        let sweepT1 = performance.now();
        let sweepTime = (sweepT1 - sweepT0);
        let gameIndex = AutoSweepConfig.gameIndex;

        if (!AutoSweepStats.gameStats[gameIndex]) {
            AutoSweepStats.gameStats[gameIndex] = { index: gameIndex };
            AutoSweepStats.gameStats[gameIndex].stepStats = [];
        }

        let gameStats = AutoSweepStats.gameStats[gameIndex];

        if (!gameStats.finishState) {
            gameStats.stepStats.push({
                result: {
                    state: sweepResult.state,
                    solver: sweepResult.solver
                }, time: sweepTime
            });

            if (isNewGameState(sweepResult.state)) {
                field.forEach(row => row.forEach(cell => delete cell.neighbors));
                gameStats.finishState = sweepResult.state;
                gameStats.finishField = field;
            }
        }
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
                let combinedCheckResult = checkGroupingsCombined(groupingCheckResults);

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

        function checkGrouping(grouping, groupingFlagsLeft) {
            let digits = grouping.digits;
            let candidates = clusterCandidates(grouping.unknowns);
            let caseWithNoFlagsLeftFound = false;
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

                        if (!areValidFlagsToSet) { caseWithNoFlagsLeftFound = true; }

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

            let searchResult = searchCertainResult(candidates, validCombinations, groupingFlagsLeft);
            searchResult.caseWithNoFlagsLeftFound = caseWithNoFlagsLeftFound;
            return searchResult;
        }

        function searchCertainResult(candidates, validCombinations, groupingFlagsLeft) {
            let certainResultFound = false;
            let occurencesValues = Array(candidates.length).fill(0);
            let occurenceCounts = [];
            let totalOccurences = 0;

            let leastBombs = Number.MAX_VALUE;
            let mostBombs = 0;

            validCombinations.forEach(validCombination => {
                let occurenceCount = 1;
                let bombs = 0;

                validCombination.forEach((flagValue, j) => {
                    let clusterSize = candidates[j].clusterSize;

                    if (clusterSize > 1) {
                        let combinationAmount = binomialCoefficient(clusterSize, flagValue);
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
            let cellProbs = [];

            candidates.forEach((candidate, i) => {
                cellProbs.push({
                    fraction: fractionOfFlag[i],
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

                    cellProb.candidate.clusterGroup.forEach(clusterCell => revealCell(clusterCell));
                }
            });

            if (noBombsLeftForRest || anyZeroPercent) {
                certainResultFound = true;
            } else {
                cellProbs.forEach(cellProb => {
                    if (cellProb.fraction === 1) {
                        if (!certainResultFound) {
                            resultInfo.messages.push("Flags found - bomb in every valid combination");
                            certainResultFound = true;
                        }

                        cellProb.candidate.clusterGroup.forEach(clusterCell => flagCell(clusterCell));
                    }
                });
            }

            return {
                certainResultFound: certainResultFound,
                validCombinations: validCombinations,
                candidates: candidates,
                leastBombs: leastBombs,
                mostBombs: mostBombs
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

        function mergeGroupingsCombinationsAndCheck(groupingCheckResults) {
            let mergedValidCombinations = [];
            let mergedCandidates = [];
            let caseWithNoFlagsLeftFound = false;

            groupingCheckResults.forEach((groupingSearchResult, i) => {
                let newValidCombinations = [];
                let isLastToMerge = (i === (groupingCheckResults.length - 1));

                if (mergedCandidates.length > 0) {
                    mergedValidCombinations.forEach(currentCombination => {
                        groupingSearchResult.validCombinations.forEach(combinationToMerge => {
                            let newCombination = currentCombination.concat(combinationToMerge);
                            addNewCombinationIfValid(newValidCombinations, newCombination, isLastToMerge);
                        });
                    });
                } else {
                    groupingSearchResult.validCombinations.forEach(combinationToMerge => {
                        addNewCombinationIfValid(newValidCombinations, combinationToMerge, isLastToMerge);
                    });
                }

                mergedValidCombinations = newValidCombinations;

                groupingSearchResult.candidates.forEach(candidate => {
                    mergedCandidates.push(candidate);
                });
            });

            let searchResult = searchCertainResult(mergedCandidates, mergedValidCombinations, totalFlagsLeft);
            searchResult.caseWithNoFlagsLeftFound = caseWithNoFlagsLeftFound;
            return searchResult;

            function addNewCombinationIfValid(toAddTo, newCombination, isLastToMerge) {
                let isValid = true;
                let flagAmount = 0;

                for (let i = 0; i < newCombination.length; i++) {
                    let combFlagAmount = newCombination[i];

                    flagAmount += combFlagAmount;

                    if (flagAmount > totalFlagsLeft) {
                        caseWithNoFlagsLeftFound = true;
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

        function checkGroupingsCombined(groupingCheckResults) {
            let caseWithNoFlagsLeftFound = groupingCheckResults.reduce((a, b) => a || b.caseWithNoFlagsLeftFound, false);
            let checkResult = mergeGroupingsCombinationsAndCheck(groupingCheckResults);

            if (caseWithNoFlagsLeftFound) {
                resultInfo.messages.push("Case with no flags left found");
            } else if (checkResult.caseWithNoFlagsLeftFound) {
                resultInfo.messages.push("Case with no flags left found (after merge)");
            }

            return checkResult;
        }

        function calculateCandidateCellProbs(checkResult) {
            let candidates = checkResult.candidates;
            let candidateAmount = candidates.reduce((a, b) => a + b.clusterSize, 0);

            let combinationProbs = checkResult.validCombinations.map(validCombination => {
                return {
                    combination: validCombination,
                    flagAmount: validCombination.reduce((a, b) => a + b),
                    occurences: validCombination.reduce((a, b, i) => {
                        return a * binomialCoefficient(candidates[i].clusterSize, b);
                    }, 1)
                };
            });

            let unknownAmount = outsideUnknowns.length + candidateAmount;
            let totalWeight = 0;

            combinationProbs.forEach(prob => {
                let occurenceRatio = prob.occurences / binomialCoefficient(candidateAmount, prob.flagAmount);
                let likelyhood = approxHypergeometricDistribution(unknownAmount, totalFlagsLeft, candidateAmount, prob.flagAmount);
                prob.weight = occurenceRatio * likelyhood;
                totalWeight += prob.weight;
            });

            combinationProbs.forEach(prob => prob.normalWeight = prob.weight / totalWeight);
            let candidateValues = new Array(candidates.length).fill(0);

            combinationProbs.forEach(prob => {
                prob.combination.forEach((value, i) => {
                    candidateValues[i] += (value * prob.normalWeight) / candidates[i].clusterSize;
                });
            });

            let cellProbs = [];

            candidateValues.forEach((value, i) => {
                candidates[i].clusterGroup.forEach(groupCell => {
                    cellProbs.push({
                        percentage: (value * 100).toFixed(2) + "%",
                        fraction: value,
                        score: value,
                        candidate: groupCell,
                    });
                });
            });

            return cellProbs;
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
            let fractionForOutsideUnknowns = averageFlagsLeftOutside / outsideUnknowns.length;

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
                        probabilityOfBomb = fractionForOutsideUnknowns;
                    }

                    probabilityOfZero *= (1 - probabilityOfBomb);
                });

                outsider.probabilityOfZero = probabilityOfZero;
            });

            outsideUnknowns = outsideUnknowns.sort((a, b) => -(a.probabilityOfZero - b.probabilityOfZero));
            let outsiderCandidate = outsideUnknowns[0];

            return {
                percentage: (fractionForOutsideUnknowns * 100).toFixed(2) + "%",
                fraction: fractionForOutsideUnknowns,
                score: fractionForOutsideUnknowns,
                candidate: outsiderCandidate,
                isOutside: true
            };
        }

        function handleNoCertainResultFound(checkResult) {
            let cellProbs = calculateCandidateCellProbs(checkResult);
            let outsider = calculateOutsiderCellProb(cellProbs);
            if (outsider) { cellProbs.push(outsider); }
            evaluateCellProbs(cellProbs);
        }

        function evaluateCellProbs(cellProbs) {
            cellProbs = cellProbs.sort((a, b) => a.score - b.score);

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
                    let message = "#" + cellProb.placing + " " + formatCellProbCoords(cellProb) + ": " + cellProb.percentage;

                    if (cellProb.isOutside) {
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

    function borderDigitsValid(digits) {
        let isValid = true;

        digits.forEach(digit => {
            if (isValid) {
                let flagsLeft = digit.value - digit.flaggedNeighborAmount;

                digit.neighbors.forEach(neighbor => {
                    if (isValid && neighbor.isFlagged) {
                        flagsLeft -= 1;

                        if (flagsLeft < 0) {
                            isValid = false;
                        }
                    }
                });
            }
        });

        return isValid;
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

        function countBitwiseOnes(number) {
            return number.toString(2).replace(/0/g, "").length;
        }
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

            if (filledDigits.length === 0) {
                continue;
            }

            let filledDigitsUnknownNeighbors = [];

            filledDigits.forEach(filledDigit => {
                filledDigit.neighbors.forEach(neighbor => {
                    if (neighbor.isUnknown && !filledDigitsUnknownNeighbors.includes(neighbor)) {
                        filledDigitsUnknownNeighbors.push(neighbor);
                    }
                });
            });

            if (filledDigitsUnknownNeighbors.length === 0) {
                continue;
            }

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

        return suffocationsFound;
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