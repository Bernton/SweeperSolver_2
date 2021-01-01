let SweepStates = Object.freeze({
    start: "start",
    solving: "solving",
    stuck: "stuck",
    solved: "solved",
    death: "death",
});

let AutoSweepConfig = {
    doLog: true,
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
    stateCounts: {
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

function formatLogAutoSweepInfo() {
    let solved = AutoSweepStats.stateCounts[SweepStates.solved];
    let death = AutoSweepStats.stateCounts[SweepStates.death];
    let winPercentage = (solved / (solved + death) * 100);
    console.log("Solved: " + (winPercentage.toFixed(2)) + "% " + solved + ":" + death);
}

function toggleDoLog() {
    AutoSweepConfig.doLog = !AutoSweepConfig.doLog;
}

function startNewGame() {
    simulate(document.getElementById('face'), "mousedown");
    simulate(document.getElementById('face'), "mouseup");
}

function resetAutoSweepResults() {
    AutoSweepStats.stateCounts.start = 0;
    AutoSweepStats.stateCounts.solving = 0;
    AutoSweepStats.stateCounts.stuck = 0;
    AutoSweepStats.stateCounts.solved = 0;
    AutoSweepStats.stateCounts.death = 0;
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
                AutoSweepStats.stateCounts[state] += 1;
            } else {
                if (isNewGameState(state) && config.newGameStateIdleTime !== null) {
                    stateIdleTime = config.newGameStateIdleTime;
                }
                else {
                    let specificIdleTime = config.restIdleTimes[state];
                    stateIdleTime = specificIdleTime !== null ? specificIdleTime : config.restDefaultIdleTime;
                }

                if (!config.lastRestState || config.lastRestState !== state) {
                    AutoSweepStats.stateCounts[state] += 1;
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

        setCellNeighborInfo(field);

        if (checkForSolved(field)) {
            return onSolved();
        }

        if (determineTrivialFlags(field) || determineTrivialReveals(field)) {
            return onStandardSolving("[0] Trivial cases");
        }

        if (determineSuffocations(field)) {
            return onStandardSolving("[1] Suffocations");
        }

        if (checkDigitsFlagCombinations(field)) {
            onStandardSolving("[2] Check digits flag combinations");
        }

        let resultInfo = checkAllCombinations(field, maxAllowedUnknowns);

        if (resultInfo.resultIsCertain) {
            return onCheckAllCombinationsCertain(resultInfo);
        }

        if (withGuessing) {
            return onCheckAllCombinationsGuessing(resultInfo);
        }

        return onCheckAllCombinationsStuck(resultInfo);
    })();

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

    function onBombDeath() {
        log("[x] Bomb death");
        return SweepStates.death;
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

    function checkForBombDeath() {
        return document.getElementsByClassName('square bombdeath').length > 0;
    }

    function getBorderCellIslands(borderCellLists, maxAllowedUnknowns, resultInfo) {
        let borderCells = borderCellLists.digits.concat(borderCellLists.unknowns);
        let islands = [];
        let maxReachedAmount = 0;
        let newIslandFound = false;

        borderCells.forEach(cell => cell.islandIndex = null);

        do {
            let island = [];
            let maxReachedIncremented = false;

            let startCell = borderCells.find(borderCell => borderCell.islandIndex === null);

            let index = islands.length;
            let unknownsMarked = 0;

            if (startCell) {
                newIslandFound = true;

                let addToIsland = cell => {
                    if (cell.islandIndex === null) {
                        cell.islandIndex = index;

                        if (!cell.isDigit) {
                            unknownsMarked += 1;
                        }

                        if (unknownsMarked <= maxAllowedUnknowns) {
                            island.push(cell);
                            cell.neighbors.forEach(neighbor => {
                                addToIsland(neighbor, index);
                            });
                        } else if (!maxReachedIncremented) {
                            maxReachedAmount += 1;
                            maxReachedIncremented = true;
                        }
                    }
                };

                addToIsland(startCell);
                island = island.filter(cell => !cell.isDigit);

                if (island.length > 0) {
                    islands.push(island);
                }

            } else {
                newIslandFound = false;
            }

        } while (newIslandFound);

        if (maxReachedAmount > 0) {
            let times = (maxReachedAmount > 1) ? "times" : "time";
            resultInfo.messages.push("Warning: Max reached " + maxReachedAmount + " " + times + ", probabilities not perfect");
        }

        islands.forEach(island => {
            island.forEach(unknown => {
                unknown.neighbors.forEach(neighbor => {
                    if (neighbor.isDigit && !island.includes(neighbor)) {
                        island.push(neighbor);
                    }
                });
            });
        });

        let islandBorderCellLists = [];

        islands.forEach(island => {
            islandBorderCellLists.push({
                digits: island.filter(c => c.isDigit),
                unknowns: island.filter(c => !c.isDigit)
            });
        });

        islandBorderCellLists = islandBorderCellLists.sort((a, b) => -(a.digits.length - b.digits.length));
        islandBorderCellLists = islandBorderCellLists.sort((a, b) => a.unknowns.length - b.unknowns.length);
        return islandBorderCellLists;
    }

    function getAmountOfNonBorderUnknowns(field) {
        let amountOfNonBorderUnknowns = 0;

        applyToCells(field, cell => {
            if (cell.isUnknown && !cell.isBorderCell) {
                amountOfNonBorderUnknowns += 1;
            }
        });

        return amountOfNonBorderUnknowns;
    }

    function checkAllCombinations(field, maxAllowedUnknowns) {
        let resultInfo = {
            resultIsCertain: false,
            messages: []
        };

        const totalFlagsLeft = getFlagsLeft(field);
        const amountOfNonBorderUnknowns = getAmountOfNonBorderUnknowns(field);

        let allBorderCells = getBorderCells(field);
        let isSplitIntoIslands = allBorderCells.unknowns.length > maxAllowedUnknowns;
        let borderCellIslands;

        if (isSplitIntoIslands) {
            borderCellIslands = getBorderCellIslands(allBorderCells, maxAllowedUnknowns, resultInfo);
        } else {
            borderCellIslands = [allBorderCells];
        }

        resultInfo.messages.push("Candidate amount: " + allBorderCells.unknowns.length);

        let islandResults = [];
        let noFlagsLeftFound = false;

        let checkAllCombinationsT0 = performance.now();

        borderCellIslands.forEach(borderCells => {
            if (resultInfo.resultIsCertain) {
                return;
            }

            let islandResult = { messages: [] };
            islandResults.push(islandResult);

            let candidateNeighbors = borderCells.digits;
            let candidates = borderCells.unknowns;
            let candidateAmount = candidates.length;

            let iterations = 1;
            let validCombinations = [0n, 1n];

            if (candidateAmount > 1) {
                do {
                    iterations += 1;
                    let newCombinations = [];

                    for (let previousMaskI = 0; previousMaskI < validCombinations.length; previousMaskI++) {
                        newCombinations.push(validCombinations[previousMaskI]);
                        newCombinations.push(validCombinations[previousMaskI] | (1n << BigInt(iterations - 1)));
                    }

                    validCombinations = [];

                    for (let newCombinationI = 0; newCombinationI < newCombinations.length; newCombinationI++) {
                        let mask = newCombinations[newCombinationI];

                        for (let i = 0; i < candidateNeighbors.length; i++) {
                            let digitNeighbor = candidateNeighbors[i];
                            digitNeighbor.maskFlaggedNeighbors = digitNeighbor.flaggedNeighborAmount;
                            digitNeighbor.maskFreeNeighbors = digitNeighbor.unknownNeighborAmount;
                        }

                        let bombsLeft = totalFlagsLeft;
                        let valid = true;
                        let orComparer = 1n;

                        for (let i = 0; i < iterations; i++) {
                            let setAsBomb = (orComparer & mask) !== 0n;
                            let digitNeighborAmount = candidates[i].neighbors.length;

                            if (setAsBomb) {
                                bombsLeft -= 1;

                                if (bombsLeft < 0) {
                                    valid = false;
                                    noFlagsLeftFound = true;
                                    break;
                                }
                            }

                            for (let j = 0; j < digitNeighborAmount; j++) {
                                let digitNeighbor = candidates[i].neighbors[j];

                                digitNeighbor.maskFreeNeighbors -= 1;

                                if (setAsBomb) {
                                    digitNeighbor.maskFlaggedNeighbors += 1;
                                }

                                if ((digitNeighbor.maskFlaggedNeighbors > digitNeighbor.value) ||
                                    ((digitNeighbor.maskFreeNeighbors + digitNeighbor.maskFlaggedNeighbors) < digitNeighbor.value)) {
                                    valid = false;
                                    i = iterations;
                                    break;
                                }
                            }

                            orComparer = orComparer << 1n;
                        }

                        if (valid) {
                            validCombinations.push(mask);
                        }
                    }

                } while (iterations < candidateAmount);
            }

            if (validCombinations.length > 0) {
                let occurencesOfOnes = Array(candidateAmount).fill(0);
                let leastBombs = candidateAmount;
                let mostBombs = 0;

                for (let i = 0; i < validCombinations.length; i++) {
                    let bombs = 0;

                    for (let j = 0; j < candidateAmount; j++) {
                        let isOne = ((1n << BigInt(j) & validCombinations[i])) !== 0n;

                        if (isOne) {
                            bombs += 1;
                            occurencesOfOnes[j] += 1;
                        }
                    }

                    leastBombs = Math.min(leastBombs, bombs);
                    mostBombs = Math.max(mostBombs, bombs);
                }

                let noBombsLeftForRest = (leastBombs === totalFlagsLeft && amountOfNonBorderUnknowns > 0);

                if (noBombsLeftForRest) {
                    resultInfo.messages.push("Clickables found - no bombs left for non candidates");

                    applyToCells(field, cell => {
                        if (cell.isHidden && !cell.isFlagged && !cell.isBorderCell) {
                            simulate(cell.div, "mouseup");
                            resultInfo.messages.push(cell.div);
                        }
                    });
                }

                let fractionOfOnes = occurencesOfOnes.map(c => c / validCombinations.length);
                let percentOfOnes = occurencesOfOnes.map(c => (c / validCombinations.length * 100.0).toFixed(1) + "%");
                let divProbs = [];

                candidates.forEach((candidate, i) => {
                    divProbs.push({
                        div: candidate.div,
                        percentage: percentOfOnes[i],
                        fraction: fractionOfOnes[i],
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

                        simulate(divProb.div, "mouseup");
                        resultInfo.messages.push(divProb.div);
                    }
                });

                if (noBombsLeftForRest || anyZeroPercent) {
                    resultInfo.resultIsCertain = true;
                } else {
                    let flagsFound = false;

                    divProbs.forEach(divProb => {
                        if (divProb.fraction === 1) {
                            flagDiv(divProb.div);
                            flagsFound = true;
                        }
                    });

                    if (flagsFound) {
                        resultInfo.resultIsCertain = true;
                        resultInfo.messages.push("Flag found");
                    } else {
                        islandResult.resultIsCertain = false;

                        let lowestDivProb = null;

                        divProbs.forEach(divProb => {
                            if (!lowestDivProb || divProb.fraction < lowestDivProb.fraction) {
                                lowestDivProb = divProb;
                            }
                        });

                        islandResult.bestToClick = lowestDivProb;

                        if (withGuessing) {
                            islandResult.messages.push("Reveal lowest probability cell (" + lowestDivProb.percentage + ")");
                        } else {
                            islandResult.messages.push("No certain cell found");
                            islandResult.divProbs = divProbs;
                        }
                    }
                }
            }
        });

        let checkAllCombinationsT1 = performance.now();
        let checkAllCombinationsTime = (checkAllCombinationsT1 - checkAllCombinationsT0);

        if (noFlagsLeftFound) {
            resultInfo.messages.push("Case with no bombs left found");
        }

        resultInfo.messages.push("Check of all combinations took " + checkAllCombinationsTime.toFixed(4) + " milliseconds");

        if (!resultInfo.resultIsCertain) {
            let bestResult = null;

            islandResults.forEach(islandResult => {
                if (!bestResult || (islandResult.bestToClick && islandResult.bestToClick.fraction < bestResult.bestToClick.fraction)) {
                    bestResult = islandResult;
                }
            });

            if (bestResult && bestResult.bestToClick) {
                resultInfo.messages = resultInfo.messages.concat(bestResult.messages);

                if (withGuessing) {
                    simulate(bestResult.bestToClick.div, "mouseup");
                } else {
                    resultInfo.messages.push("Candidates with probability of being a bomb:");

                    let allDivProbs = [];

                    islandResults.forEach(islandResult => {
                        islandResult.divProbs.forEach(divProb => {
                            allDivProbs.push(divProb);
                        });
                    });

                    allDivProbs = allDivProbs.sort((a, b) => a.fraction - b.fraction);

                    let number = 1;
                    let placing = 1;
                    let lastDivProb = null;

                    allDivProbs.forEach(divProb => {
                        if (lastDivProb && divProb.fraction > lastDivProb.fraction) {
                            placing = number;
                        }

                        divProb.placing = placing;
                        lastDivProb = divProb;
                        number += 1;
                    });

                    allDivProbs.forEach(divProb => {
                        resultInfo.messages.push("#" + divProb.placing + " " + formatDivProbCoords(divProb) + ": " + divProb.percentage);
                        resultInfo.messages.push(divProb.div);
                    });
                }
            }
        }

        function formatDivProbCoords(divProb) {
            let cell = divProb.candidate;
            return "(" + (cell.y + 1) + "_" + (cell.x + 1) + ")";
        }

        return resultInfo;
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

    function checkDigitsFlagCombinations(field) {
        let flagsFound = false;
        let digitsLength = getBorderCells(field).digits.length;

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
            if (cell.isDigit) {
                if (cell.unknownNeighborAmount > 0) {
                    cell.isBorderCell = true;
                    fieldBorderDigits.push(cell);
                    borderDigits.push(createBorderDigit(cell));
                }
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
        } else {
            applyToCells(field, cell => {
                if (cell.isUnknown) {
                    cell.isBorderCell = true;
                    borderUnknowns.push(createBorderDigit(cell));
                }
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

    function determineSuffocations(field) {
        let suffocationsFound = false;
        let unknownsLength = getBorderCells(field).unknowns.length;

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

        return field;
    }

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
