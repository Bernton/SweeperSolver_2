let SweepStates = {
    start: "start",
    solving: "solving",
    stuck: "stuck",
    solved: "solved",
    death: "death",
};

let AutoSweepConfig = {
    doLog: false,
    autoSweepEnabled: false,
    maxAllowedUnknowns: 50,
    lastRestState: null,
    baseIdleTime: 0,
    solvingIdleTime: 0,
    newGameStateIdleTime: 0,
    restDefaultIdleTime: 0,
    restIdleTimes: { start: null, stuck: null, solved: null, death: null }
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
        if (e.code === "KeyW") {
            sweepStep();
        } else if (e.code === "KeyE") {
            if (!window.stepCertainLocked) {
                let resultState = sweepStepCertain();

                if (resultState !== SweepStates.solving) {
                    window.stepCertainLocked = true;
                    setTimeout(() => window.stepCertainLocked = false, 2000);
                }
            }
        } else if (e.code === "KeyS") {
            startAutoSweep();
        } else if (e.code === "KeyD") {
            stopAutoSweep();
        } else if (e.code === "KeyI") {
            formatLogAutoSweepInfo();
        } else if (e.code === "KeyK") {
            resetAutoSweepResults();
        } else if (e.code === "KeyL") {
            toggleDoLog();
        }
    }
}

function sweepStep() {
    sweep(true, AutoSweepConfig.doLog, AutoSweepConfig.maxAllowedUnknowns);
}

function sweepStepCertain() {
    return sweep(false, AutoSweepConfig.doLog, AutoSweepConfig.maxAllowedUnknowns);
}

function startAutoSweep(withAutoSolve = true, timingOptions = AutoSweepConfig) {
    AutoSweepConfig.autoSweepEnabled = true;
    setTimeout(() => autoSweep(withAutoSolve, timingOptions), 0);
}

function stopAutoSweep() {
    AutoSweepConfig.autoSweepEnabled = false;
}

function formatLogAutoSweepInfo(index) {

    let isCurrent = (typeof index === "undefined");
    let stateCount;

    if (isCurrent) {
        stateCount = AutoSweepStats.currentStateCounts;
        index = AutoSweepStats.stateCounts.length;
    } else {
        stateCount = AutoSweepStats.stateCounts[index];
    }

    let solved = stateCount[SweepStates.solved];
    let death = stateCount[SweepStates.death];
    let winPercentage = (solved / (solved + death) * 100);
    console.log("[" + index + "] " + "Solved: " + (winPercentage.toFixed(2)) + "% " + solved + ":" + death);
}

function toggleDoLog() {
    AutoSweepConfig.doLog = !AutoSweepConfig.doLog;
}

function startNewGame() {
    simulate(document.getElementById('face'), "mousedown");
    simulate(document.getElementById('face'), "mouseup");
}

function resetAutoSweepResults() {
    AutoSweepStats.currentStateCounts.start = 0;
    AutoSweepStats.currentStateCounts.solving = 0;
    AutoSweepStats.currentStateCounts.stuck = 0;
    AutoSweepStats.currentStateCounts.solved = 0;
    AutoSweepStats.currentStateCounts.death = 0;
    AutoSweepStats.stateCounts = [];
}

function updateStateCounts() {
    let stateCounts = AutoSweepStats.currentStateCounts;
    AutoSweepStats.stateCounts.push(stateCounts);
    AutoSweepStats.currentStateCounts = {
        start: stateCounts.start,
        solving: stateCounts.solving,
        stuck: stateCounts.stuck,
        solved: stateCounts.solved,
        death: stateCounts.death
    };
}

function autoSweep(withAutoSolve = true, config = AutoSweepConfig) {
    if (AutoSweepConfig.autoSweepEnabled) {
        let idleTime = 0;

        if (lastWasNewGameState(config) && withAutoSolve) {
            config.lastRestState = null;
            startNewGame();
        }
        else {
            let state = sweep(withAutoSolve, config.doLog, config.maxAllowedUnknowns);
            let stateIdleTime = 0;

            if (state === SweepStates.solving) {
                stateIdleTime = config.solvingIdleTime;
                AutoSweepStats.currentStateCounts[state] += 1;
            } else {
                if (isNewGameState(state) && config.newGameStateIdleTime !== null) {
                    stateIdleTime = config.newGameStateIdleTime;
                }
                else {
                    let specificIdleTime = config.restIdleTimes[state];
                    stateIdleTime = specificIdleTime !== null ? specificIdleTime : config.restDefaultIdleTime;
                }

                if (!config.lastRestState || config.lastRestState !== state) {
                    AutoSweepStats.currentStateCounts[state] += 1;

                    if (isNewGameState(state)) {
                        updateStateCounts();
                    }
                }

                config.lastRestState = state;
            }

            idleTime = stateIdleTime;
        }

        if (config.autoSweepEnabled) {
            let timeOutTime = (idleTime + config.baseIdleTime);
            setTimeout(() => autoSweep(withAutoSolve, config), timeOutTime);
        }
    }

    function isNewGameState(state) {
        return state === SweepStates.solved || state === SweepStates.death;
    }

    function lastWasNewGameState(config) {
        return isNewGameState(config.lastRestState);
    }
}

function sweep(withGuessing = true, doLog = true, maxAllowedUnknowns = 20) {

    return (function main() {
        if (checkForBombDeath()) {
            return onBombDeath();
        }

        let field = initializeField();

        if (checkForStart(field)) {
            return onStart(field);
        }

        if (checkForSolved(field)) {
            return onSolved();
        }

        if (determineTrivialFlags(field) || determineTrivialReveals(field)) {
            return onStandardSolving("[0] Trivial cases");
        }

        let borderCells = getBorderCells(field);

        if (determineSuffocations(field, borderCells)) {
            return onStandardSolving("[1] Suffocations");
        }

        if (checkDigitsFlagCombinations(field, borderCells)) {
            return onStandardSolving("[2] Check digits flag combinations");
        }

        let resultInfo = checkAllCombinations(field, maxAllowedUnknowns);

        if (resultInfo.certainResultFound) {
            return onCheckAllCombinationsCertain(resultInfo);
        }

        if (withGuessing) {
            return onCheckAllCombinationsGuessing(resultInfo);
        }

        return onCheckAllCombinationsStuck(resultInfo);
    })();

    function checkForBombDeath() {
        return document.getElementsByClassName('square bombdeath').length > 0;
    }

    function onBombDeath() {
        log("[x] Bomb death");
        return SweepStates.death;
    }

    function log() {
        if (doLog) {
            console.log.apply(console, arguments);
        }
    }

    function onCheckAllCombinationsCertain(resultInfo) {
        let message = "Check all combinations";
        return onCheckAllCombinations(resultInfo, message, "[3]", SweepStates.solving);
    }

    function onCheckAllCombinationsGuessing(resultInfo) {
        let message = "Check all combinations - guessing";
        return onCheckAllCombinations(resultInfo, message, "[3g]", SweepStates.solving);
    }

    function onCheckAllCombinationsStuck(resultInfo) {
        let message = "Check all combinations - stuck";
        return onCheckAllCombinations(resultInfo, message, "[3s]", SweepStates.stuck);
    }

    function onCheckAllCombinations(resultInfo, message, prefix, resultState) {
        log(prefix, message);
        resultInfo.messages.forEach(c => { log("->", prefix, c); });
        return resultState;
    }

    function onStandardSolving(message) {
        log(message);
        return SweepStates.solving;
    }

    function onStart(field) {
        log("[s]", SweepStates.start);

        if (withGuessing) {
            revealDiv(field[Math.round(field.length / 2)][Math.round(field[0].length / 2)].div);
        }

        return SweepStates.start;
    }

    function onSolved() {
        log("[o]", SweepStates.solved);
        return SweepStates.solved;
    }

    function determineTrivialReveals(field) {
        let revealsFound = false;

        applyToCells(field, cell => {
            if (cell.isDigit && cell.flaggedNeighborAmount === cell.value) {
                cell.neighbors.forEach(neighbor => {
                    if (neighbor.isUnknown) {
                        revealDiv(neighbor.div);
                        revealsFound = true;
                    }
                });
            }
        });

        return revealsFound;
    }

    function checkAllCombinations(field, maxAllowedUnknowns) {
        let resultInfo = {
            certainResultFound: false,
            messages: []
        };

        let totalFlagsLeft = getFlagsLeft(field);
        let borderCellGroupings = getBorderCellGroupings();
        let outsideUnknowns = getOutsideUnknowns();

        if (borderCellGroupings.length > 0) {
            let groupingResults = [];
            let totalLeastBombs = 0;

            let checkAllCombinationsT0 = performance.now();

            borderCellGroupings.forEach(grouping => {
                if (!resultInfo.certainResultFound) {
                    let groupingFlagsLeft = totalFlagsLeft - totalLeastBombs;
                    let groupingResult = checkGrouping(grouping, groupingFlagsLeft);
                    totalLeastBombs += (groupingResult.leastBombs ? groupingResults.leastBombs : 0);
                    groupingResults.push(groupingResult);
                }
            });

            if (!resultInfo.certainResultFound) {
                let divProbs = checkGroupingsCombined(groupingResults);

                if (!resultInfo.certainResultFound) {
                    handleNoCertainResultFound(divProbs);
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
            let borderCellGroupings = splitToBorderCellGroupings(allBorderCells);
            resultInfo.messages.push("Candidate amount: " + allBorderCells.unknowns.length);
            return borderCellGroupings;
        }

        function splitToBorderCellGroupings(borderCellLists) {
            let borderCells = borderCellLists.digits.concat(borderCellLists.unknowns);
            let groupings = [];
            let maxReachedAmount = 0;
            let newGroupingFound = false;

            borderCells.forEach(cell => cell.groupingIndex = null);

            do {
                let grouping = [];
                let maxReachedIncremented = false;

                let startCell = borderCells.find(borderCell => borderCell.groupingIndex === null);

                let index = groupings.length;
                let unknownsMarked = 0;

                if (startCell) {
                    newGroupingFound = true;

                    let addToGrouping = cell => {
                        if (cell.groupingIndex === null) {
                            cell.groupingIndex = index;

                            if (!cell.isDigit) {
                                unknownsMarked += 1;
                            }

                            if (unknownsMarked <= maxAllowedUnknowns) {
                                grouping.push(cell);
                                cell.neighbors.forEach(neighbor => {
                                    addToGrouping(neighbor, index);
                                });
                            } else if (!maxReachedIncremented) {
                                maxReachedAmount += 1;
                                maxReachedIncremented = true;
                            }
                        }
                    };

                    addToGrouping(startCell);
                    grouping = grouping.filter(cell => !cell.isDigit);

                    if (grouping.length > 0) {
                        groupings.push(grouping);
                    }

                } else {
                    newGroupingFound = false;
                }

            } while (newGroupingFound);

            if (maxReachedAmount > 0) {
                let times = (maxReachedAmount > 1) ? "times" : "time";
                resultInfo.messages.push("Warning: Max reached " + maxReachedAmount + " " + times + ", probabilities not perfect");
            }

            groupings.forEach(grouping => {
                grouping.forEach(unknown => {
                    unknown.neighbors.forEach(digitNeighbor => {
                        if (!grouping.includes(digitNeighbor)) {
                            grouping.push(digitNeighbor);
                        }
                    });
                });
            });

            let groupingBorderCellLists = [];

            groupings.forEach(grouping => {
                groupingBorderCellLists.push({
                    digits: grouping.filter(c => c.isDigit),
                    unknowns: grouping.filter(c => !c.isDigit)
                });
            });

            groupingBorderCellLists = groupingBorderCellLists.sort((a, b) => -(a.digits.length - b.digits.length));
            groupingBorderCellLists = groupingBorderCellLists.sort((a, b) => a.unknowns.length - b.unknowns.length);
            return groupingBorderCellLists;
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
            let candidates = grouping.unknowns;

            let validCombinations = [0n, 1n];

            for (let includedCandidates = 2; includedCandidates <= candidates.length; includedCandidates++) {
                let newCombinations = [];

                for (let previousMaskI = 0; previousMaskI < validCombinations.length; previousMaskI++) {
                    newCombinations.push(validCombinations[previousMaskI]);
                    newCombinations.push(validCombinations[previousMaskI] | (1n << BigInt(includedCandidates - 1)));
                }

                validCombinations = [];

                for (let newCombinationI = 0; newCombinationI < newCombinations.length; newCombinationI++) {
                    let combination = newCombinations[newCombinationI];

                    for (let i = 0; i < digits.length; i++) {
                        let digit = digits[i];
                        digit.maskFlaggedNeighbors = digit.flaggedNeighborAmount;
                        digit.maskFreeNeighbors = digit.unknownNeighborAmount;
                    }

                    let flagsLeft = groupingFlagsLeft;
                    let andComparer = 1n;
                    let valid = true;

                    for (let candidateI = 0; candidateI < includedCandidates; candidateI++) {
                        let setAsFlag = (andComparer & combination) !== 0n;
                        let digitNeighborAmount = candidates[candidateI].neighbors.length;

                        if (setAsFlag) {
                            flagsLeft -= 1;

                            if (flagsLeft < 0) {
                                valid = false;
                                groupingResult.caseWithNoFlagsLeftFound = true;
                                break;
                            }
                        }

                        for (let neighborI = 0; neighborI < digitNeighborAmount; neighborI++) {
                            let digitNeighbor = candidates[candidateI].neighbors[neighborI];

                            digitNeighbor.maskFreeNeighbors -= 1;

                            if (setAsFlag) {
                                digitNeighbor.maskFlaggedNeighbors += 1;
                            }

                            if ((digitNeighbor.maskFlaggedNeighbors > digitNeighbor.value) ||
                                ((digitNeighbor.maskFreeNeighbors + digitNeighbor.maskFlaggedNeighbors) < digitNeighbor.value)) {
                                valid = false;
                                candidateI = includedCandidates;
                                break;
                            }
                        }

                        andComparer = andComparer << 1n;
                    }

                    if (valid) {
                        validCombinations.push(combination);
                    }
                }
            }

            groupingResult.validCombinations = validCombinations;
            searchCertainResult(candidates, groupingResult, groupingFlagsLeft);

            return groupingResult;
        }

        function searchCertainResult(candidates, groupingResult, groupingFlagsLeft) {
            let occurencesOfOnes = Array(candidates.length).fill(0);
            let leastBombs = candidates.length;
            let mostBombs = 0;

            for (let i = 0; i < groupingResult.validCombinations.length; i++) {
                let bombs = 0;

                for (let j = 0; j < candidates.length; j++) {
                    let isOne = ((1n << BigInt(j) & groupingResult.validCombinations[i])) !== 0n;

                    if (isOne) {
                        bombs += 1;
                        occurencesOfOnes[j] += 1;
                    }
                }

                leastBombs = Math.min(leastBombs, bombs);
                mostBombs = Math.max(mostBombs, bombs);
            }

            groupingResult.leastBombs = leastBombs;
            groupingResult.mostBombs = mostBombs;

            let noBombsLeftForRest = (leastBombs === groupingFlagsLeft && outsideUnknowns.length > 0);

            if (noBombsLeftForRest) {
                resultInfo.messages.push("Clickables found - no bombs left for non candidates");

                applyToCells(field, cell => {
                    if (cell.isHidden && !cell.isFlagged && !cell.isBorderCell) {
                        revealDiv(cell.div);
                    }
                });
            }

            let fractionOfOnes = occurencesOfOnes.map(c => c / groupingResult.validCombinations.length);
            let percentOfOnes = occurencesOfOnes.map(c => (c / groupingResult.validCombinations.length * 100.0).toFixed(1) + "%");
            let divProbs = [];

            candidates.forEach((candidate, i) => {
                divProbs.push({
                    div: candidate.div,
                    percentage: percentOfOnes[i],
                    fraction: fractionOfOnes[i],
                    score: fractionOfOnes[i],
                    candidate: candidate
                });
            });

            let anyZeroPercent = false;

            divProbs.forEach(divProb => {
                if (divProb.fraction === 0) {
                    if (!anyZeroPercent) {
                        resultInfo.messages.push("Clickables found - no bomb in any valid combination");
                        anyZeroPercent = true;
                    }

                    revealDiv(divProb.div);
                    resultInfo.messages.push(divProb.div);
                }
            });

            if (noBombsLeftForRest || anyZeroPercent) {
                resultInfo.certainResultFound = true;
            } else {
                let flagsFound = false;

                divProbs.forEach(divProb => {
                    if (divProb.fraction === 1) {
                        if (!flagsFound) {
                            resultInfo.messages.push("Flags found - bomb in every valid combination");
                            flagsFound = true;
                        }

                        flagDiv(divProb.div);
                        resultInfo.messages.push(divProb.div);
                    }
                });

                if (flagsFound) {
                    resultInfo.certainResultFound = true;
                } else {
                    groupingResult.divProbs = divProbs;
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
                        revealDiv(outsideUnknown.div);
                    });
                } else if (withGuessing) {
                    let percentage = (totalFlagsLeft / outsideUnknowns.length * 100).toFixed(1) + "%";
                    resultInfo.messages.push("Reveal random cell (" + percentage + ")");
                    revealDiv(outsideUnknowns[0].div);
                }
            }
        }

        function mergeGroupingsDivProbsWithCheck(groupingResults, totalLeastBombs, totalMostBombs) {
            let mergeResult = {
                divProbs: [],
                caseWithNoFlagsLeftFound: false
            };

            let tooFewBombsNotPossible = (totalLeastBombs + outsideUnknowns.length >= totalFlagsLeft);
            let tooManyBombsNotPossible = (totalMostBombs <= totalFlagsLeft);

            if (tooFewBombsNotPossible && tooManyBombsNotPossible) {
                groupingResults.forEach(groupingResult => {
                    groupingResult.divProbs.forEach(divProb => {
                        mergeResult.divProbs.push(divProb);
                    });
                });
            } else {
                checkGroupingsDivProbs(groupingResults, mergeResult);
            }

            return mergeResult;
        }

        function checkGroupingsDivProbs(groupingResults, mergeResult) {
            let mergedValidCombinations = [];
            let mergedCandidates = [];

            groupingResults.forEach((groupingResult, i) => {
                let newValidCombinations = [];
                let currentLength = BigInt(mergedCandidates.length);
                let toMergeLength = BigInt(groupingResult.divProbs.length);
                let totalNewLength = currentLength + toMergeLength;
                let isLastToMerge = (i === (groupingResults.length - 1));

                if (mergedCandidates.length > 0) {
                    mergedValidCombinations.forEach(currentCombination => {
                        groupingResult.validCombinations.forEach(combinationToMerge => {
                            let newCombination = currentCombination | (combinationToMerge << currentLength);
                            addNewCombinationIfValid(newValidCombinations, newCombination, totalNewLength, isLastToMerge);
                        });
                    });
                } else {
                    groupingResult.validCombinations.forEach(combinationToMerge => {
                        addNewCombinationIfValid(newValidCombinations, combinationToMerge, totalNewLength, isLastToMerge);
                    });
                }

                mergedValidCombinations = newValidCombinations;

                groupingResult.divProbs.forEach(divProb => {
                    mergedCandidates.push(divProb.candidate);
                });
            });

            let mergedGroupingResult = {
                validCombinations: mergedValidCombinations
            };

            searchCertainResult(mergedCandidates, mergedGroupingResult, totalFlagsLeft);
            mergeResult.divProbs = mergedGroupingResult.divProbs;

            function addNewCombinationIfValid(toAddTo, newCombination, combinationLength, isLastToMerge) {
                let isValid = true;
                let flagAmount = 0;
                let andComparer = 1n;

                for (let i = 0; i < combinationLength; i++) {
                    let setAsFlag = (andComparer & newCombination) !== 0n;

                    if (setAsFlag) {
                        flagAmount += 1;
                    }

                    if (flagAmount > totalFlagsLeft) {
                        mergeResult.caseWithNoFlagsLeftFound = true;
                        isValid = false;
                        break;
                    }

                    andComparer = andComparer << 1n;
                }

                if (isLastToMerge && (flagAmount + outsideUnknowns.length) < totalFlagsLeft) {
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

            let mergeResult = mergeGroupingsDivProbsWithCheck(groupingResults, totalLeastBombs, totalMostBombs);

            if (caseWithNoFlagsLeftFound) {
                resultInfo.messages.push("Case with no flags left found");
            } else if (mergeResult.caseWithNoFlagsLeftFound) {
                resultInfo.messages.push("Case with no flags left found (after merge)");
            }

            return mergeResult.divProbs;
        }

        function handleNoCertainResultFound(divProbs) {
            if (outsideUnknowns.length > 0) {
                let averageFlagsInBorder = 0;

                divProbs.forEach(divProb => {
                    averageFlagsInBorder += divProb.fraction;
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

                divProbs.push({
                    div: outsideCandidate.div,
                    percentage: (fractionForOutsideUnknowns * 100).toFixed(1) + "%",
                    fraction: fractionForOutsideUnknowns,
                    score: fractionForOutsideUnknowns,
                    candidate: outsideCandidate,
                    isOutside: true
                });
            }

            divProbs.forEach(divProb => {
                setTurnedTrivial(divProb);

                if (divProb.turnedTrivial > 0) {
                    divProb.score = Math.pow(divProb.fraction, 1.2);
                }
            });

            divProbs = divProbs.sort((a, b) => {
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
                if (divProbs.length > 0) {
                    let lowestDivProb = divProbs[0];
                    resultInfo.messages.push("Reveal lowest score cell (" + lowestDivProb.percentage + ")");
                    revealDiv(lowestDivProb.div);
                }
            } else {
                resultInfo.messages.push("No certain cell found");
                resultInfo.messages.push("Candidates with percentages:");

                let counter = 1;
                let placing = 1;
                let lastDivProb = null;

                divProbs.forEach(divProb => {
                    if (lastDivProb && divProb.fraction > lastDivProb.fraction) {
                        placing = counter;
                    }

                    divProb.placing = placing;
                    lastDivProb = divProb;
                    counter += 1;
                });

                divProbs.forEach(divProb => {
                    let message = "#" + divProb.placing + " " + formatDivProbCoords(divProb) + ": " + divProb.percentage;

                    if (divProb.isOutside) {
                        message += " - Outsider";
                    }

                    resultInfo.messages.push(message);
                    resultInfo.messages.push(divProb.div);
                });
            }


            function setTurnedTrivial(divProb) {
                if (typeof divProb.turnedTrivial === "undefined") {
                    divProb.turnedTrivial = 0;

                    divProb.candidate.neighbors.forEach(digitNeighbor => {
                        let flagsLeft = digitNeighbor.value - digitNeighbor.flaggedNeighborAmount;

                        if (flagsLeft === (digitNeighbor.neighbors.length - 1)) {
                            divProb.turnedTrivial += 1;
                        }
                    });
                }
            }

            function formatDivProbCoords(divProb) {
                let cell = divProb.candidate;
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
        let bombAmount = getBombAmount();
        let flagsAmount = getFlagsAmount(field);
        let flagsLeft = bombAmount - flagsAmount;
        return flagsLeft;
    }

    function getBombAmount() {
        let optionsForm = $('#options-form');
        let checkedBox = optionsForm.find('input[name="field"]:checked');
        let optionsRow = checkedBox.parent().parent().parent();
        let amountBombsCell = optionsRow.find('td').last();
        let bombAmount = Number(amountBombsCell.html());
        return bombAmount;
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

    function checkForStart(field) {
        let isStart = true;

        applyToCells(field, cell => {
            if (!cell.isHidden) {
                isStart = false;
                return "break";
            }
        });

        return isStart;
    }

    function checkForSolved(field) {
        let isSolved = true;

        applyToCells(field, cell => {
            if (cell.isUnknown) {
                isSolved = false;
                return "break";
            }
        });

        return isSolved;
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
                    flagDiv(flagCandidate.div);
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
            jDiv: fieldBorderUnknown.jDiv,
            div: fieldBorderUnknown.div,
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
            jDiv: fieldBorderDigit.jDiv,
            div: fieldBorderDigit.div,
            x: fieldBorderDigit.x,
            y: fieldBorderDigit.y,
            unknownNeighborAmount: fieldBorderDigit.unknownNeighborAmount,
            flaggedNeighborAmount: fieldBorderDigit.flaggedNeighborAmount,
            isDigit: true,
            value: fieldBorderDigit.value,
            neighbors: []
        };
    }

    function determineSuffocations(field, borderCells) {
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
                        revealDiv(assumedFlag.div);
                        suffocationsFound = true;
                    }
                }
            }
        }

        return suffocationsFound;
    }

    function revealDiv(div) {
        simulate(div, "mouseup");
    }

    function flagDiv(div) {
        if (div.classList.value !== "square bombflagged") {
            simulate(div, "mousedown", 2);
            simulate(div, "mouseup", 2);
        }
    }

    function determineTrivialFlags(field) {
        let flagsFound = false;

        applyToCells(field, cell => {
            if (cell.isDigit && cell.hiddenNeighborAmount === cell.value && cell.flaggedNeighborAmount !== cell.value) {
                cell.neighbors.forEach(neighbor => {
                    if (neighbor.isUnknown) {
                        flagDiv(neighbor.div);
                        flagsFound = true;
                    }
                });
            }
        });

        return flagsFound;
    }

    function initializeField() {
        const openClass = "square open";
        const flagClass = "square bombflagged";

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
                    jDiv: jDiv,
                    div: jDiv[0],
                    x: x,
                    y: y,
                };

                if (jDivClass.substr(0, openClass.length) === openClass) {
                    let number = jDivClass.substr(openClass.length);
                    cell.value = Number(number);
                    cell.isDigit = cell.value > 0;
                } else {
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
        }

        return field;
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
