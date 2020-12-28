let States = Object.freeze({
    start: "start",
    solving: "solving",
    stuck: "stuck",
    solved: "solved",
    death: "death",
});

let AutoSweepConfig = {
    doLog: true,
    autoSweepEnabled: false,
    maxAllowedCandidates: 20,
    lastRestState: null,
    baseIdleTime: 0,
    solvingIdleTime: 0,
    newGameStateIdleTime: 0,
    restDefaultIdleTime: 0,
    restIdleTimes: { start: null, stuck: null, solved: null, death: null }
};

let AutoSweepResults = {
    stateCounts: {
        start: 0,
        solving: 0,
        stuck: 0,
        solved: 0,
        death: 0
    }
}

function formatLogAutoSweepInfo() {
    let solved = AutoSweepResults.stateCounts[States.solved];
    let death = AutoSweepResults.stateCounts[States.death];
    let winPercentage = (solved / (solved + death) * 100);
    console.log("Solved: " + (winPercentage.toFixed(2)) + "% " + solved + ":" + death);
}

function disableEndOfGamePrompt() {
    prompt = () => "cancel";
}

function resetAutoSweepResults() {
    AutoSweepResults.stateCounts.start = 0;
    AutoSweepResults.stateCounts.solving = 0;
    AutoSweepResults.stateCounts.stuck = 0;
    AutoSweepResults.stateCounts.solved = 0;
    AutoSweepResults.stateCounts.death = 0;
}

function startAutoSweep(withAutoSolve = true, timingOptions = AutoSweepConfig) {
    AutoSweepConfig.autoSweepEnabled = true;
    setTimeout(() => autoSweep(withAutoSolve, timingOptions), 0);
}

function stopAutoSweep() {
    AutoSweepConfig.autoSweepEnabled = false;
}

function lastWasNewGameState(config) {
    return isNewGameState(config.lastRestState);
}

function isNewGameState(state) {
    return state === States.solved || state === States.death;
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

            if (state === States.solving) {
                stateIdleTime = config.solvingIdleTime;
                AutoSweepResults.stateCounts[state] += 1;
            } else {
                if (isNewGameState(state) && config.newGameStateIdleTime !== null) {
                    stateIdleTime = config.newGameStateIdleTime;
                }
                else {
                    let specificIdleTime = config.restIdleTimes[state];
                    stateIdleTime = specificIdleTime !== null ? specificIdleTime : config.restDefaultIdleTime;
                }

                if (!config.lastRestState || config.lastRestState !== state) {
                    AutoSweepResults.stateCounts[state] += 1;
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
}

disableEndOfGamePrompt();
setKeyDownHandler();

function setKeyDownHandler() {
    document.removeEventListener('keydown', keyDownHandler);
    document.addEventListener('keydown', keyDownHandler);
}

function keyDownHandler(e) {
    if (e.code === "KeyA") {
        sweep(true, AutoSweepConfig.doLog, AutoSweepConfig.maxAllowedCandidates);
    } else if (e.code === "KeyS") {
        sweep(false, AutoSweepConfig.doLog, AutoSweepConfig.maxAllowedCandidates);
    } else if (e.code === "KeyQ") {
        stopAutoSweep();
    } else if (e.code === "KeyY") {
        startAutoSweep();
    } else if (e.code === "KeyX") {
        startAutoSweep(false);
    }
}

function startNewGame() {
    simulate(document.getElementById('face'), "mousedown");
    simulate(document.getElementById('face'), "mouseup");
}

function sweep(withAutoSolve = true, doLog = true, maxAllowedCandidates = 20) {

    return (function main() {
        maxAllowedCandidates = (maxAllowedCandidates <= 30) ? maxAllowedCandidates : 30;

        if (checkForBombDeath()) {
            return onBombDeath(withAutoSolve);
        }

        let field = initializeField();

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

            if (assumeDigitsFlagPermutations(field)) {
                newBombsFound = true;
                onStandardSolving("[2] Assume digits flag permutations");
            }
            else {
                newBombsFound = false;
            }
        } while (newBombsFound);

        determineTrivialFlags(field);
        processFlags(field);

        determineTrivialClicksNoClick(field);

        let info = exhaustiveSearch(field, maxAllowedCandidates);

        if (info.resultIsCertain) {
            return onExhaustiveSearchCertain(info);
        }

        if (!withAutoSolve) {
            return onExhaustiveSearchStuck(info);
        }

        return onExhaustiveSearchGuessing(info);
    })();

    function log(content) {
        if (doLog) {
            console.log(content);
        }
    }

    function onExhaustiveSearchGuessing(resultInfo) {
        log("[3g] Assume all permutations guessing");
        resultInfo.messages.forEach(c => log("-> [3g] " + c));
        return States.solving;
    }

    function onExhaustiveSearchStuck(resultInfo) {
        log("[3s] Stuck");
        resultInfo.messages.forEach(c => log("-> [3s] " + c));
        return States.stuck;
    }

    function onExhaustiveSearchCertain(resultInfo) {
        log("[3] Assume all permutations");
        resultInfo.messages.forEach(c => log("-> [3] " + c));
        return States.solving;
    }

    function onStandardSolving(message) {
        log(message);
        return States.solving;
    }

    function onBombDeath(withAutoSolve) {
        log("[x] Bomb death");

        if (withAutoSolve) {
            log("[xr] Ready for new game");
        }

        return States.death;
    }

    function onStart(field, withAutoSolve) {
        log("[s] " + States.start);

        if (withAutoSolve) {
            simulate(field[Math.round(field.length / 2)][Math.round(field[0].length / 2)].div, "mouseup");
            log("[sr] Ready for new game");
        }

        return States.start;
    }

    function onSolved(withAutoSolve) {
        log("[e]", States.solved);

        if (withAutoSolve) {
            log("[er] Ready for new game");
        }

        return States.solved;
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
        islandFound = false;

        borderCells.forEach(cell => cell.islandIndex = null);

        do {
            let island = [];
            let maxReachedIncremented = false;

            let startCell = borderCells.find(borderCell => borderCell.islandIndex === null);

            let index = islands.length;
            let freeCellsMarked = 0;

            if (startCell) {
                addToIsland(startCell, islands.length);
                island = island.filter(cell => !cell.isDigit);

                if (island.length > 0) {
                    islands.push(island);
                }
                islandFound = true;
            } else {
                islandFound = false;
            }

            function addToIsland(cell) {
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
            }

        } while (islandFound);

        if (maxReachedAmount > 0) {
            resultInfo.messages.push("Amount of max reached is " + maxReachedAmount);
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

    function exhaustiveSearch(field, maxAllowedCandidates) {
        let resultInfo = {
            newBombsFound: false,
            clickFound: false,
            resultIsCertain: false,
            messages: []
        };

        const unflaggedBombsAmount = getUnflaggedBombsAmount(field);

        resultInfo.messages.push("Unflagged bombs amount: " + unflaggedBombsAmount);

        let allBorderCells = getBorderCells(field);
        let borderCellIslands = getBorderCellIslands(allBorderCells, maxAllowedCandidates, resultInfo);
        let islandResults = [];

        borderCellIslands.forEach(borderCells => {
            if (resultInfo.resultIsCertain) {
                return;
            }

            let islandResult = { messages: [] };
            islandResults.push(islandResult);
            let candidateNeighbors = borderCells.digitCells;
            let candidates = borderCells.freeCells;

            let candidateAmount = candidates.length;

            const permutationAmount = (1 << candidateAmount);
            let validPermutations = [];

            // let t0 = performance.now()

            for (let mask = 0; mask < permutationAmount; mask++) {

                for (let i = 0; i < candidateNeighbors.length; i++) {
                    candidateNeighbors[i].maskFlaggedNeighbors = candidateNeighbors[i].flaggedNeighbors;
                    candidateNeighbors[i].maskFreeNeighbors = candidateNeighbors[i].freeNeighbors;
                }

                let bombsLeft = unflaggedBombsAmount;
                let valid = true;

                for (let i = 0; i < candidateAmount; i++) {
                    let setAsBomb = ((1 << i) & mask) !== 0;
                    let digitNeighborAmount = candidates[i].neighbors.length;

                    if (setAsBomb) {
                        bombsLeft -= 1;

                        if (bombsLeft < 0) {
                            valid = false;
                            break;
                        }
                    }

                    for (let j = 0; j < digitNeighborAmount; j++) {
                        let digitNeighbor = candidates[i].neighbors[j];

                        digitNeighbor.maskFreeNeighbors -= 1;

                        if (setAsBomb) {
                            digitNeighbor.maskFlaggedNeighbors += 1;
                        }

                        if ((digitNeighbor.maskFreeNeighbors === 0 && digitNeighbor.maskFlaggedNeighbors !== digitNeighbor.value) || bombsLeft < 0) {
                            valid = false;
                            i = candidateAmount;
                            break;
                        }
                    }
                }

                if (valid) {
                    validPermutations.push(mask);
                }
            }

            if (validPermutations.length > 0) {

                let occurencesOfOnes = Array(candidateAmount).fill(0);

                for (let i = 0; i < validPermutations.length; i++) {
                    for (let j = 0; j < candidateAmount; j++) {
                        let isOne = ((1 << j) & validPermutations[i]) !== 0;

                        if (isOne) {
                            occurencesOfOnes[j] += 1;
                        }
                    }
                }

                let fractionOfOnes = occurencesOfOnes.map(c => c / validPermutations.length);
                let percentOfOnes = occurencesOfOnes.map((c, i) => (c / validPermutations.length * 100.0).toFixed(1) + "%");
                let divProbs = [];

                candidates.forEach((candidate, i) => {
                    divProbs.push({
                        div: candidate.div,
                        percentage: percentOfOnes[i],
                        fraction: fractionOfOnes[i],
                        candidate: candidate
                    });
                });

                let clickableFound = false;

                divProbs.forEach(divProb => {
                    if (divProb.fraction === 0) {
                        clickableFound = true;
                        simulate(divProb.div, "mouseup");
                    }
                });

                if (clickableFound) {
                    resultInfo.clickableFound = true;
                    resultInfo.resultIsCertain = true;
                    resultInfo.messages.push("Clickable found");
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
                        // Uncertain territory (decision not perfect)
                        // For now, just pick lowest one
                        islandResult.resultIsCertain = false;

                        let lowestDivProb = null;

                        divProbs.forEach(divProb => {
                            if (!lowestDivProb || divProb.fraction < lowestDivProb.fraction) {
                                lowestDivProb = divProb;
                            }
                        });

                        islandResult.bestToClick = lowestDivProb;

                        if (withAutoSolve) {
                            islandResult.messages.push("Click lowest probability cell (" + lowestDivProb.percentage + ")");
                        } else {
                            islandResult.messages.push("No certain cell found, best would be "
                                + lowestDivProb.percentage
                                + " (" + (lowestDivProb.candidate.y + 1)
                                + "_"
                                + (lowestDivProb.candidate.x + 1)
                                + ")");
                        }
                    }
                }
            }
        });

        if (!resultInfo.resultIsCertain) {
            let bestResult = null;

            islandResults.forEach(islandResult => {
                if (!bestResult || (islandResult.bestToClick && islandResult.bestToClick.fraction < bestResult.bestToClick.fraction)) {
                    bestResult = islandResult;
                }
            });

            if (bestResult && bestResult.bestToClick) {

                if (withAutoSolve) {
                    simulate(bestResult.bestToClick.div, "mouseup");
                }

                resultInfo.messages = resultInfo.messages.concat(bestResult.messages);
            }
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

    function processClicks(field) {
        applyToCells(field, cell => {
            if (cell.isClickable) {
                simulate(cell.div, 'mouseup');
            }
        });
    }

    function determineTrivialClicksNoClick(field) {
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
                            trivialClicksFound = true;
                        }
                    })
                }
            }
        });

        return trivialClicksFound;
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
                    })
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

                if (yOffset == 0 && xOffset == 0)
                    continue;

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

    if (!eventType)
        throw new SyntaxError('Only HTMLEvents and MouseEvents interfaces are supported');

    if (document.createEvent) {
        oEvent = document.createEvent(eventType);
        if (eventType == 'HTMLEvents') {
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
        for (let property in source)
            destination[property] = source[property];
        return destination;
    }
}
