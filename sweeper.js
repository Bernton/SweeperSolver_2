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
    maxAllowedCandidates: 50,
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
    sweep(true, AutoSweepConfig.doLog, AutoSweepConfig.maxAllowedCandidates);
}

function sweepStepCertain() {
    return sweep(false, AutoSweepConfig.doLog, AutoSweepConfig.maxAllowedCandidates);
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
            let state = sweep(withAutoSolve, config.doLog, config.maxAllowedCandidates);
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

function sweep(withAutoSolve = true, doLog = true, maxAllowedCandidates = 20) {

    return (function main() {

        let field = initializeField();
        processFlags(field);

        if (checkForBombDeath()) {
            return onBombDeath(withAutoSolve);
        }

        if (checkForStart(field)) {
            return onStart(field, withAutoSolve);
        }

        setCellNeighborInfo(field);

        if (checkForSolved(field)) {
            return onSolved(withAutoSolve);
        }

        let newBombsFound = false;

        do {
            if (determineTrivial(field)) {
                return onStandardSolving("[0] Trivial");
            }

            if (assumeFlags(field)) {
                return onStandardSolving("[1] Assume flags");
            }

            newBombsFound = assumeDigitsFlagPermutations(field);

            if (newBombsFound) {
                onStandardSolving("[2] Assume digits flag permutations");
            }

        } while (newBombsFound);

        let info = exhaustiveSearch(field, maxAllowedCandidates);

        if (info.resultIsCertain) {
            return onExhaustiveSearchCertain(info);
        }

        if (!withAutoSolve) {
            return onExhaustiveSearchStuck(info);
        }

        return onExhaustiveSearchGuessing(info);
    })();

    function log() {
        if (doLog) {
            console.log.apply(console, arguments);
        }
    }

    function onExhaustiveSearchGuessing(resultInfo) {
        let message = "Assume all permutations guessing";
        return onExhaustiveSearch(resultInfo, message, "[3g]", SweepStates.solving);
    }

    function onExhaustiveSearchStuck(resultInfo) {
        let message = "Stuck, nothing certain found";
        return onExhaustiveSearch(resultInfo, message, "[3s]", SweepStates.stuck);
    }

    function onExhaustiveSearchCertain(resultInfo) {
        let message = "Assume all permutations";
        return onExhaustiveSearch(resultInfo, message, "[3]", SweepStates.solving);
    }

    function onExhaustiveSearch(resultInfo, message, prefix, resultState) {
        log(prefix, message);
        resultInfo.messages.forEach(c => { log("->", prefix, c); });
        return resultState;
    }

    function onStandardSolving(message) {
        log(message);
        return SweepStates.solving;
    }

    function onBombDeath(withAutoSolve) {
        log("[x] Bomb death");

        if (withAutoSolve) {
            log("[xr] Ready for new game");
        }

        return SweepStates.death;
    }

    function onStart(field, withAutoSolve) {
        log("[s] " + SweepStates.start);

        if (withAutoSolve) {
            simulate(field[Math.round(field.length / 2)][Math.round(field[0].length / 2)].div, "mouseup");
        }

        return SweepStates.start;
    }

    function onSolved(withAutoSolve) {
        log("[e]", SweepStates.solved);

        if (withAutoSolve) {
            log("[er] Ready for new game");
        }

        return SweepStates.solved;
    }

    function determineTrivial(field) {
        determineTrivialFlags(field);
        processFlags(field);

        let trivialClicksFound = determineTrivialClicks(field);
        return trivialClicksFound;
    }

    function checkForBombDeath() {
        return document.getElementsByClassName('square bombdeath').length > 0;
    }

    function getBorderCellIslands(borderCellLists, maxAllowedCandidates, resultInfo) {
        let borderCells = borderCellLists.digitCells.concat(borderCellLists.freeCells);
        let islands = [];
        let maxReachedAmount = 0;
        let islandFound = false;

        borderCells.forEach(cell => cell.islandIndex = null);

        do {
            let island = [];
            let maxReachedIncremented = false;

            let startCell = borderCells.find(borderCell => borderCell.islandIndex === null);

            let index = islands.length;
            let freeCellsMarked = 0;

            if (startCell) {
                let addToIsland = cell => {
                    if (cell.islandIndex === null) {
                        cell.islandIndex = index;

                        if (!cell.isDigit) {
                            freeCellsMarked += 1;
                        }

                        if (freeCellsMarked <= maxAllowedCandidates) {
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
                islandFound = true;
            } else {
                islandFound = false;
            }

        } while (islandFound);

        if (maxReachedAmount > 0) {
            let times = (maxReachedAmount > 1) ? "times" : "time";
            resultInfo.messages.push("Warning: Max reached " + maxReachedAmount + " " + times + ", probabilities not perfect");
        }

        islands.forEach(island => {
            island.forEach(freeCell => {
                freeCell.neighbors.forEach(freeCellNeighbor => {
                    if (freeCellNeighbor.isDigit && !island.includes(freeCellNeighbor)) {
                        island.push(freeCellNeighbor);
                    }
                });
            });
        });

        let islandBorderCellLists = [];

        islands.forEach(island => {
            islandBorderCellLists.push({
                digitCells: island.filter(c => c.isDigit),
                freeCells: island.filter(c => !c.isDigit)
            });
        });

        islandBorderCellLists = islandBorderCellLists.sort((a, b) => -(a.digitCells.length - b.digitCells.length));
        islandBorderCellLists = islandBorderCellLists.sort((a, b) => a.freeCells.length - b.freeCells.length);
        return islandBorderCellLists;
    }

    function getAmountOfFreeNonBorderCells(field) {
        let amountOfFreeNonBorderCells = 0;

        applyToCells(field, cell => {
            if (cell.isHidden && !cell.isFlagged && !cell.isBorderCell) {
                amountOfFreeNonBorderCells += 1;
            }
        });

        return amountOfFreeNonBorderCells;
    }

    function exhaustiveSearch(field, maxAllowedCandidates) {
        let resultInfo = {
            clickableFound: false,
            resultIsCertain: false,
            messages: []
        };

        const unflaggedBombsAmount = getUnflaggedBombsAmount(field);

        let allBorderCells = getBorderCells(field);
        let freeNonCandidates = getAmountOfFreeNonBorderCells(field);

        let isSplit = allBorderCells.freeCells.length > maxAllowedCandidates;
        let borderCellIslands;

        if (isSplit) {
            borderCellIslands = getBorderCellIslands(allBorderCells, maxAllowedCandidates, resultInfo);
        } else {
            borderCellIslands = [allBorderCells];
        }

        let islandResults = [];
        let exhaustiveSearchT0 = performance.now();

        resultInfo.messages.push("Unflagged bombs amount: " + unflaggedBombsAmount);
        resultInfo.messages.push("Candidate amount: " + allBorderCells.freeCells.length);
        let noBombsLeftFound = false;

        borderCellIslands.forEach(borderCells => {
            if (resultInfo.resultIsCertain) {
                return;
            }

            let islandResult = { messages: [] };
            islandResults.push(islandResult);
            let candidateNeighbors = borderCells.digitCells;
            let candidates = borderCells.freeCells;
            let candidateAmount = candidates.length;

            let iterations = 1;
            let validPermutations = [0n, 1n];

            if (candidateAmount > 1) {
                do {
                    iterations += 1;
                    let newPermutations = [];

                    for (let previousMaskI = 0; previousMaskI < validPermutations.length; previousMaskI++) {
                        newPermutations.push(validPermutations[previousMaskI]);
                        newPermutations.push(validPermutations[previousMaskI] | (1n << BigInt(iterations - 1)));
                    }

                    validPermutations = [];

                    for (let newPermutationI = 0; newPermutationI < newPermutations.length; newPermutationI++) {
                        let mask = newPermutations[newPermutationI];

                        for (let i = 0; i < candidateNeighbors.length; i++) {
                            let digitNeighbor = candidateNeighbors[i];
                            digitNeighbor.maskFlaggedNeighbors = digitNeighbor.flaggedNeighbors;
                            digitNeighbor.maskFreeNeighbors = digitNeighbor.freeNeighbors;
                        }

                        let bombsLeft = unflaggedBombsAmount;
                        let valid = true;
                        let orComparer = 1n;

                        for (let i = 0; i < iterations; i++) {
                            let setAsBomb = (orComparer & mask) !== 0n;
                            let digitNeighborAmount = candidates[i].neighbors.length;

                            if (setAsBomb) {
                                bombsLeft -= 1;

                                if (bombsLeft < 0) {
                                    valid = false;
                                    noBombsLeftFound = true;
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
                            validPermutations.push(mask);
                        }
                    }

                } while (iterations < candidateAmount);
            }

            if (validPermutations.length > 0) {
                let occurencesOfOnes = Array(candidateAmount).fill(0);
                let leastBombs = candidateAmount;
                let mostBombs = 0;

                for (let i = 0; i < validPermutations.length; i++) {
                    let bombs = 0;

                    for (let j = 0; j < candidateAmount; j++) {
                        let isOne = ((1n << BigInt(j) & validPermutations[i])) !== 0n;

                        if (isOne) {
                            bombs += 1;
                            occurencesOfOnes[j] += 1;
                        }
                    }

                    leastBombs = Math.min(leastBombs, bombs);
                    mostBombs = Math.max(mostBombs, bombs);
                }

                if (mostBombs > unflaggedBombsAmount) {
                    throw Error("Permutations with more bombs than existing!");
                }

                let noBombsLeftForRest = (leastBombs === unflaggedBombsAmount && freeNonCandidates > 0);

                if (noBombsLeftForRest) {
                    resultInfo.messages.push("Clickable found, no bombs left for non candidates");

                    applyToCells(field, cell => {
                        if (cell.isHidden && !cell.isFlagged && !cell.isBorderCell) {
                            simulate(cell.div, "mouseup");
                            resultInfo.messages.push(cell.div);
                        }
                    });
                }

                let fractionOfOnes = occurencesOfOnes.map(c => c / validPermutations.length);
                let percentOfOnes = occurencesOfOnes.map(c => (c / validPermutations.length * 100.0).toFixed(1) + "%");
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
                            resultInfo.messages.push("Clickable found, no bomb in any valid permutation");
                            anyZeroPercent = true;
                        }

                        simulate(divProb.div, "mouseup");
                        resultInfo.messages.push(divProb.div);
                    }
                });

                if (noBombsLeftForRest || anyZeroPercent) {
                    resultInfo.clickableFound = true;
                    resultInfo.resultIsCertain = true;
                } else {
                    let flagsFound = false;

                    divProbs.forEach(divProb => {
                        if (divProb.fraction === 1) {
                            divProb.candidate.isFlagged = true;

                            processFlags(field);
                            let clicksChanged = determineTrivialClicks(field);

                            if (clicksChanged) {
                                flagsFound = true;
                            }
                        }
                    });

                    if (flagsFound) {
                        resultInfo.clickableFound = true;
                        resultInfo.resultIsCertain = true;
                        resultInfo.messages.push("Flag Changed found");
                    } else {
                        islandResult.resultIsCertain = false;

                        let lowestDivProb = null;

                        divProbs.forEach(divProb => {
                            if (!lowestDivProb || divProb.fraction < lowestDivProb.fraction) {
                                lowestDivProb = divProb;
                            }
                        });

                        islandResult.bestToClick = lowestDivProb;

                        if (withAutoSolve) {
                            islandResult.messages.push("Reveal lowest probability cell (" + lowestDivProb.percentage + ")");
                        } else {
                            islandResult.messages.push("No certain cell found");
                            islandResult.divProbs = divProbs;
                        }
                    }
                }
            }
        });

        let exhaustiveSearchT1 = performance.now();
        let exhaustiveSearchTime = (exhaustiveSearchT1 - exhaustiveSearchT0);

        if (noBombsLeftFound) {
            resultInfo.messages.push("Case with no bombs left found");
        }

        resultInfo.messages.push("Exhaustive search took " + exhaustiveSearchTime.toFixed(4) + " milliseconds.");

        if (!resultInfo.resultIsCertain) {
            let bestResult = null;

            islandResults.forEach(islandResult => {
                if (!bestResult || (islandResult.bestToClick && islandResult.bestToClick.fraction < bestResult.bestToClick.fraction)) {
                    bestResult = islandResult;
                }
            });

            if (bestResult && bestResult.bestToClick) {
                resultInfo.messages = resultInfo.messages.concat(bestResult.messages);

                if (withAutoSolve) {
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

    function getUnflaggedBombsAmount(field) {
        let bombAmount = getBombAmount();
        let flagsAmount = getFlagsAmount(field);
        let unflaggedBombsAmount = bombAmount - flagsAmount;
        return unflaggedBombsAmount;
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
                return true;
            }
        });

        return isStart;
    }

    function checkForSolved(field) {
        let isFinish = true;

        applyToCells(field, cell => {
            if (cell.isDigit && cell.hiddenNeighborAmount !== cell.value) {
                isFinish = false;
                return true;
            }
        });

        return isFinish;
    }

    function borderDigitsValid(digitCells) {
        let valid = true;

        for (let i = 0; i < digitCells.length; i++) {
            let digitCell = digitCells[i];
            let bombCapacity = digitCell.value - digitCell.flaggedNeighbors;

            digitCell.neighbors.forEach(freeCell => {
                if (valid && freeCell.isFlagged) {
                    bombCapacity -= 1;

                    if (bombCapacity < 0) {
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

    function assumeDigitsFlagPermutations(field) {
        let newBombsFound = false;
        let digitsCellsLength = getBorderCells(field).digitCells.length;
        let confirmedFlags = [];

        for (let i = 0; i < digitsCellsLength; i++) {
            let digitCells = getBorderCells(field).digitCells;
            let digitCell = digitCells[i];

            let freeNeighbors = digitCell.freeNeighbors;
            let permutationAmount = (1 << freeNeighbors);
            let validStateAmount = 0;
            let bombsLeft = (digitCell.value - digitCell.flaggedNeighbors);
            let bombCandidates = [];

            digitCell.neighbors.forEach(bombCandidateCell => {
                bombCandidateCell.includedCount = 0;
                bombCandidates.push(bombCandidateCell);
            });

            for (let mask = 0; mask < permutationAmount; mask++) {
                let amountOf1s = countBitwise1s(mask);

                if (amountOf1s === bombsLeft) {
                    for (let j = 0; j < freeNeighbors; j++) {
                        let is1 = ((1 << j) & mask) !== 0;
                        bombCandidates[j].isFlagged = is1;
                    }

                    if (borderDigitsValid(digitCells)) {
                        bombCandidates.forEach(bombCandidate => {
                            if (bombCandidate.isFlagged) {
                                bombCandidate.includedCount += 1;
                            }
                        });

                        validStateAmount += 1;
                    }
                }
            }

            bombCandidates.forEach(bombCandidate => {
                if (bombCandidate.includedCount === validStateAmount) {
                    confirmedFlags.push(bombCandidate);
                }
            });
        }

        confirmedFlags.forEach(confirmedFlag => {
            let originalCell = field[confirmedFlag.y][confirmedFlag.x];
            if (!originalCell.isFlagged) {
                originalCell.isFlagged = true;
                newBombsFound = true;
            }
        });

        if (newBombsFound) {
            processFlags(field);
        }

        return newBombsFound;
    }

    function countBitwise1s(n) {
        return n.toString(2).replace(/0/g, "").length;
    }

    function getBorderCells(field) {
        let fieldDigitBorderCells = [];
        let digitBorderCells = [];

        applyToCells(field, cell => {
            if (cell.isDigit) {
                cell.freeNeighbors = (cell.hiddenNeighborAmount - cell.flaggedNeighbors);

                if (cell.freeNeighbors > 0) {
                    cell.isBorderCell = true;
                    fieldDigitBorderCells.push(cell);
                    digitBorderCells.push(createDigitBorderCell(cell));
                }
            }
        });

        let fieldFreeBorderCells = [];
        let freeBorderCells = [];

        fieldDigitBorderCells.forEach((fieldDigitBorderCell, i) => {
            fieldDigitBorderCell.neighbors.forEach(neighbor => {
                if (neighbor.isHidden && !neighbor.isFlagged) {
                    if (!fieldFreeBorderCells.includes(neighbor)) {
                        neighbor.isBorderCell = true;
                        fieldFreeBorderCells.push(neighbor);
                        let created = createFreeBorderCell(neighbor);
                        freeBorderCells.push(created);
                        digitBorderCells[i].neighbors.push(created);
                        created.neighbors.push(digitBorderCells[i]);
                    }
                    else {
                        let freeIndex = fieldFreeBorderCells.indexOf(neighbor);
                        digitBorderCells[i].neighbors.push(freeBorderCells[freeIndex]);
                        freeBorderCells[freeIndex].neighbors.push(digitBorderCells[i]);
                    }
                }
            });
        });

        return {
            digitCells: digitBorderCells,
            freeCells: freeBorderCells
        };
    }

    function createFreeBorderCell(fieldFreeBorderCell) {
        return {
            jDiv: fieldFreeBorderCell.jDiv,
            div: fieldFreeBorderCell.div,
            x: fieldFreeBorderCell.x,
            y: fieldFreeBorderCell.y,
            isDigit: false,
            isFlagged: false,
            neighbors: []
        };
    }

    function createDigitBorderCell(fieldDigitBorderCell) {
        return {
            jDiv: fieldDigitBorderCell.jDiv,
            div: fieldDigitBorderCell.div,
            x: fieldDigitBorderCell.x,
            y: fieldDigitBorderCell.y,
            freeNeighbors: fieldDigitBorderCell.freeNeighbors,
            flaggedNeighbors: fieldDigitBorderCell.flaggedNeighbors,
            isDigit: true,
            value: fieldDigitBorderCell.value,
            neighbors: []
        };
    }

    function assumeFlags(field) {
        let clicksFound = false;
        let freeCellsLength = getBorderCells(field).freeCells.length;

        for (let i = 0; i < freeCellsLength; i++) {
            let freeCells = getBorderCells(field).freeCells;
            let assumedFlag = freeCells[i];
            assumedFlag.isFlagged = true;

            let filledDigitCells = [];

            assumedFlag.neighbors.forEach(neighbor => {
                neighbor.flaggedNeighbors += 1;

                if (neighbor.flaggedNeighbors === neighbor.value) {
                    filledDigitCells.push(neighbor);
                }
            });

            if (filledDigitCells.length > 0) {
                let unflaggedFreeCells = [];

                filledDigitCells.forEach(filledDigitCell => {
                    filledDigitCell.neighbors.forEach(freeCell => {
                        if (!freeCell.isFlagged && !unflaggedFreeCells.includes(freeCell)) {
                            unflaggedFreeCells.push(freeCell);
                        }
                    });
                });

                if (unflaggedFreeCells.length > 0) {
                    unflaggedFreeCells.forEach(unflaggedFreeCell => {
                        unflaggedFreeCell.neighbors.forEach(digitToSuffcate => {
                            if (!clicksFound && !filledDigitCells.includes(digitToSuffcate)) {
                                digitToSuffcate.freeNeighbors -= 1;

                                if ((digitToSuffcate.value - digitToSuffcate.flaggedNeighbors) > digitToSuffcate.freeNeighbors) {
                                    simulate(assumedFlag.div, "mouseup");
                                    clicksFound = true;
                                }
                            }
                        });
                    });
                }
            }
        }

        return clicksFound;
    }

    function determineTrivialClicks(field) {
        let trivialClicksFound = false;

        applyToCells(field, cell => {
            if (cell.isDigit) {
                cell.flaggedNeighbors = 0;

                cell.neighbors.forEach(neighbor => {
                    if (neighbor.isFlagged) {
                        cell.flaggedNeighbors += 1;
                    }
                });

                if (cell.flaggedNeighbors === cell.value) {
                    cell.neighbors.forEach(neighbor => {
                        if (neighbor.isHidden && !neighbor.isFlagged) {
                            simulate(neighbor.div, "mouseup");
                            trivialClicksFound = true;
                        }
                    });
                }
            }
        });

        return trivialClicksFound;
    }

    function processFlags(field) {
        applyToCells(field, cell => {
            if (cell.isFlagged) {
                cell.jDiv.css('background-position', '-32px -78px');
            } else {
                cell.jDiv.css('background-position', '');
            }
        });
    }

    function determineTrivialFlags(field) {
        applyToCells(field, cell => {
            if (cell.isDigit && cell.hiddenNeighborAmount === cell.value) {
                cell.neighbors.forEach(neighbor => {
                    if (neighbor.isHidden) {
                        neighbor.isFlagged = true;
                    }
                });
            }
        });
    }

    function initializeField() {
        const openClass = "square open";

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
            cell.hiddenNeighborAmount = 0;

            applyToNeighbors(field, cell, neighborCell => {
                if (neighborCell.isHidden) {
                    cell.hiddenNeighborAmount += 1;
                }

                cell.neighbors.push(neighborCell);
            });

            cell.neighborAmount = cell.neighbors.length;
        });
    }

    function applyToCells(matrix, action) {
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                let isBreak = action(matrix[y][x]) === true;

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
                    let isBreak = action(matrix[y][x]) === true;

                    if (isBreak) {
                        return;
                    }
                }
            }
        }
    }
}

function simulate(element, eventName) {
    let eventMatchers = {
        'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
        'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
    };

    let defaultOptions = {
        pointerX: 0,
        pointerY: 0,
        button: 0,
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
