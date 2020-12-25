// if (document.sweepId) {
//     clearInterval(document.sweepId);
// }

prompt = () => "cancel";

let sweepAlive = true;
let startSweepEndless = () => { sweepAlive = true; setTimeout(sweepEndless, 0) };
let stopSweep = () => sweepAlive = false;

let won = 0;
let lost = 0;
let lastState = null;

let printStatus = () => {
    console.log("Win fraction: " + ((won / (won + lost) * 100).toFixed(2)) + "% " + won + ":" + lost);
}

let sweepEndless = () => {
    const idleTime = 3000;
    let state = sweep(true);
    let time;

    if (state === "start" || state === "finish" || state === "death") {
        time = idleTime;

        if (state !== "start") {
            setTimeout(startNewGame, idleTime);
        }
    }
    else {
        time = 0;
    }

    if (state === "finish" && lastState !== "finish") {
        won += 1;
    } else if (state === "death" && lastState !== "death") {
        lost += 1;
    }

    lastState = state;

    if (sweepAlive) {
        setTimeout(sweepEndless, time + 0);
    }
};

startSweepEndless();

//document.sweepId = setInterval(sweep, 1000);
//document.addEventListener('mousedown', sweep);

document.addEventListener('keydown', (e) => {
    if (e.code === "KeyS") {
        sweep(true);
    }
});


function startNewGame() {
    simulate(document.getElementById('face'), "mousedown");
    simulate(document.getElementById('face'), "mouseup");
}

function sweep(autoSolve) {

    return (function main() {
        let result = createFieldResult();
        let field = result.field;

        processFlags(field);
        processClicks(field);

        if (isBombDeath()) {
            console.log("[x] Bomb death");

            if (autoSolve) {
                console.log("[xr] Start new game");
                //startNewGame();
            }

            return "death";
        }

        if (result.state === "start" || result.state === "finish") {
            console.log("[...]", result.state);

            if (autoSolve) {
                if (result.state === "start") {
                    simulate(field[Math.round(field.length / 2)][Math.round(field[0].length / 2)].div, "mouseup");
                } else {
                    console.log("[...r] Start new game");
                    //startNewGame();
                }
            }

            return result.state;
        }

        if (result.state === "clickChanged") {
            console.log("[0] Trivial");
        }
        else {
            let assumeChanged = assumeFlags(field);

            if (assumeChanged) {
                console.log("[1] Assume flags");
            } else {
                let assumeFlagPermutationsChanged = assumeFlagPermutations(field);

                if (assumeFlagPermutationsChanged) {
                    console.log("[2] Assume flag permutations for digits");
                } else {
                    let resultInfo = assumeAllPermutations(field);

                    if (resultInfo.certain) {
                        console.log("[3] Assume all permutations");
                    }

                    resultInfo.messages.forEach(c => console.log("[3m]", c));
                }
            }
        }

        return "";
    })();

    function isBombDeath() {
        return document.getElementsByClassName('square bombdeath').length > 0;
    }

    function assumeAllPermutations(field) {
        const maxAllowedCandidates = 20; // Can't be more than 30 with Number

        let resultInfo = {
            certain: true,
            messages: []
        };

        const unflaggedBombsAmount = getUnflaggedBombsAmount(field);
        const candidateNeighbors = getCandidateNeighbors(field);
        const candidates = getCandidatesAndSetTheirDigitNeighbors(field, candidateNeighbors);
        let candidateAmount = candidates.length;

        // console.log("Candidates:", candidateAmount);
        // console.log("Bombs left:", unflaggedBombsAmount);

        if (candidateAmount > maxAllowedCandidates) {
            // Maybe it's not certain here already, have to check
            resultInfo.messages.push("Candidate amount too high, splice to " + maxAllowedCandidates);
            candidates.splice(maxAllowedCandidates);
            candidateAmount = maxAllowedCandidates;
        }

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
                let digitNeighborAmount = candidates[i].digitNeighbors.length;

                if (setAsBomb) {
                    bombsLeft -= 1;

                    if (bombsLeft < 0) {
                        valid = false;
                        break;
                    }
                }

                for (let j = 0; j < digitNeighborAmount; j++) {
                    let digitNeighbor = candidates[i].digitNeighbors[j];

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

        // let t1 = performance.now();

        // console.log("Time to find valid masks: " + (t1 - t0).toFixed(5) + " milliseconds.")

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

            // console.log("Percentages:", divProbs);

            let clickableFound = false;

            divProbs.forEach(divProb => {
                if (divProb.fraction === 0) {
                    simulate(divProb.div, "mouseup");
                    clickableFound = true;
                }
            });

            if (clickableFound) {
                resultInfo.certain = true;
                resultInfo.messages.push("Clickable found");
            } else {
                let flagsFound = false;

                divProbs.forEach(divProb => {
                    if (divProb.fraction === 1) {
                        divProb.candidate.isFlagged = true;

                        processFlags(field);
                        let bombsChanged = setClicks(field);

                        if (bombsChanged) {
                            processClicks(field);
                            flagsFound = true;
                        }
                    }
                });

                if (flagsFound) {
                    resultInfo.certain = true;
                    resultInfo.messages.push("Flag Changed found");
                } else if (autoSolve) {
                    // Uncertain territory (decision not perfect)
                    // For now, just pick lowest one

                    let lowestDivProb = null;

                    divProbs.forEach(divProb => {
                        if (!lowestDivProb || divProb.fraction < lowestDivProb.fraction) {
                            lowestDivProb = divProb;
                        }
                    });

                    simulate(lowestDivProb.div, "mouseup");

                    resultInfo.certain = false;
                    resultInfo.messages.push("Click lowest probability cell (" + lowestDivProb.percentage + ")");
                } else {
                    resultInfo.certain = false;
                    resultInfo.messages.push("No certain cell found");
                }
            }
        }

        return resultInfo;
    }

    function asBinaryString(mask, magnitude) {
        let maskAsString = "";

        for (let i = 0; i < magnitude; i++) {
            let is1 = ((1 << i) & mask) !== 0;

            maskAsString = (is1 ? "1" : "0") + maskAsString;
        }

        return maskAsString;
    }

    function getCandidateNeighbors(field) {
        let candidateNeighbors = [];

        applyToCells(field, cell => {

            if (cell.isDigit) {
                cell.freeNeighbors = (cell.unknownNeighbors - cell.flaggedNeighbors);

                if (cell.freeNeighbors > 0) {
                    candidateNeighbors.push(cell);
                }
            }
        });

        return candidateNeighbors;
    }

    function getCandidatesAndSetTheirDigitNeighbors(field, candidateNeighbors) {
        let candidates = [];

        candidateNeighbors.forEach(cell => {
            applyToNeighbors(field, cell, nCell => {
                if (nCell.isUnknown && !nCell.isFlagged) {

                    if (typeof nCell.digitNeighbors === "undefined") {
                        nCell.digitNeighbors = [];
                    }

                    nCell.digitNeighbors.push(cell);

                    if (!candidates.includes(nCell)) {
                        candidates.push(nCell);
                    }
                }
            });
        });

        return candidates;
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

    function createFieldResult() {
        let field = initializeField();
        let resultState = "";

        setNeighborsInfo(field);

        if (checkForStart(field)) {
            resultState = "start";
        } else if (checkForFinish(field)) {
            resultState = "finish";
        } else {
            setFlags(field);
            let clickChanged = setClicks(field);

            if (clickChanged) {
                resultState = "clickChanged";
            }
        }

        return {
            field: field,
            state: resultState
        };
    }

    function checkForStart(field) {
        let isStart = true;

        applyToCells(field, cell => {
            if (!cell.isUnknown) {
                isStart = false;
            }
        });

        return isStart;
    }

    function checkForFinish(field) {
        let isFinish = true;

        applyToCells(field, cell => {
            if (cell.isDigit && cell.unknownNeighbors !== cell.value) {
                isFinish = false;
            }
        });

        return isFinish;
    }

    function assumeFlagPermutations(originalField) {
        let searchPossibleBombsChanged = false;

        applyToCells(originalField, searchCell => {
            if (searchCell.isDigit && (searchCell.unknownNeighbors - searchCell.flaggedNeighbors) > 0) {

                let viableNeighbors = [];
                let bombCandidates = [];
                let bombsLeft = (searchCell.value - searchCell.flaggedNeighbors);

                applyToNeighbors(originalField, searchCell, nCell => {
                    if (nCell.isUnknown && !nCell.isFlagged) {
                        viableNeighbors.push(nCell);
                        bombCandidates.push({
                            cell: nCell,
                            included: 0,
                        });
                    }
                });

                let upper = Math.pow(2, viableNeighbors.length);

                let cellFlagPermutations = [];
                let validStateAmount = 0;

                for (let combination = 0; combination < upper; combination++) {
                    let amountOf1s = countBitwise1s(combination);

                    if (amountOf1s === bombsLeft) {
                        let cellsToFlag = [];

                        for (let j = 0; j < viableNeighbors.length; j++) {
                            if ((combination >> j) % 2 == 1) {
                                cellsToFlag.push(viableNeighbors[j]);
                            }
                        }

                        cellFlagPermutations.push(cellsToFlag);
                    }
                }

                for (let cellFlagsIndex = 0; cellFlagsIndex < cellFlagPermutations.length; cellFlagsIndex++) {
                    let cellFlags = cellFlagPermutations[cellFlagsIndex];

                    let searchField = createLightCopy(originalField);

                    for (let cellFlagIndex = 0; cellFlagIndex < cellFlags.length; cellFlagIndex++) {
                        let cellFlag = cellFlags[cellFlagIndex];
                        searchField[cellFlag.y][cellFlag.x].isFlagged = true;
                    }

                    let isValidState = true;

                    for (let y = 0; y < searchField.length; y++) {
                        for (let x = 0; x < searchField[y].length; x++) {
                            let cell = searchField[y][x];

                            if (!cell.isFlagged && cell.isDigit) {
                                cell.flaggedNeighbors = 0;

                                applyToNeighbors(searchField, cell, nCell => {
                                    if (nCell.isFlagged) {
                                        cell.flaggedNeighbors += 1;
                                    }
                                });

                                if (cell.flaggedNeighbors > cell.value) {
                                    isValidState = false;
                                }
                            }
                        }
                    }

                    if (isValidState) {
                        for (let i = 0; i < cellFlags.length; i++) {
                            for (let j = 0; j < bombCandidates.length; j++) {
                                let cellFlag = cellFlags[i];
                                let candidate = bombCandidates[j];

                                if (cellFlag.x === candidate.cell.x && cellFlag.y === candidate.cell.y) {
                                    candidate.included += 1;
                                }
                            }
                        }

                        validStateAmount += 1;
                    }
                }

                let foundBombs = [];

                bombCandidates.forEach(candidate => {
                    if (candidate.included === validStateAmount) {
                        foundBombs.push(candidate.cell);
                    }
                });

                if (foundBombs.length > 0) {
                    foundBombs.forEach(bombCell => {
                        originalField[bombCell.y][bombCell.x].isFlagged = true;
                        processFlags(originalField);
                        let bombsChanged = setClicks(originalField);

                        if (bombsChanged) {
                            processClicks(originalField);
                            searchPossibleBombsChanged = true;
                        }
                    });
                }
            }
        });

        return searchPossibleBombsChanged;
    }

    function countBitwise1s(n) {
        return n.toString(2).replace(/0/g, "").length;
    }

    function assumeFlags(originalField) {
        let assumeChanged = false;

        applyToCells(originalField, assumeFlagCell => {
            if (assumeFlagCell.isUnknown) {
                let assumeField = createLightCopy(originalField);

                assumeField[assumeFlagCell.y][assumeFlagCell.x].isFlagged = true;
                let clickChanged = setClicks(assumeField);

                if (clickChanged) {
                    applyToCells(assumeField, cell => {
                        if (cell.isDigit) {
                            let flaggedNeighbors = 0;
                            let neighbors = 0;
                            let known = 0;

                            applyToNeighbors(assumeField, cell, nCell => {
                                if (nCell.isFlagged) {
                                    flaggedNeighbors += 1;
                                    known += 1;
                                } else if (nCell.isClickable) {
                                    known += 1;
                                } else if (!nCell.isUnknown) {
                                    known += 1;
                                }

                                neighbors += 1;
                            });

                            if ((flaggedNeighbors + (neighbors - known)) < cell.value) {
                                simulate(originalField[assumeFlagCell.y][assumeFlagCell.x].div, 'mouseup');
                                assumeChanged = true;
                            }
                        }
                    });
                }
            }
        });

        return assumeChanged;
    }

    function processClicks(field) {
        applyToCells(field, cell => {
            if (cell.isClickable) {
                simulate(cell.div, 'mouseup');
            }
        });
    }

    function setClicks(field) {
        let somethingChanged = false;

        applyToCells(field, cell => {
            if (!cell.isFlagged && cell.isDigit) {
                cell.flaggedNeighbors = 0;

                applyToNeighbors(field, cell, nCell => {
                    if (nCell.isFlagged) {
                        cell.flaggedNeighbors += 1;
                    }
                });

                if (cell.flaggedNeighbors === cell.value) {
                    applyToNeighbors(field, cell, nCell => {
                        if (!nCell.isFlagged && nCell.isUnknown) {
                            nCell.isClickable = true;
                            somethingChanged = true;
                        }
                    });
                }
            }
        });

        return somethingChanged;
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

    function setFlags(field) {
        applyToCells(field, cell => {
            if (cell.isDigit && cell.unknownNeighbors === cell.value) {
                applyToNeighbors(field, cell, nCell => {
                    if (nCell.isUnknown) {
                        nCell.isFlagged = true;
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
                    cell.isUnknown = true;
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

    function clone(obj) {
        if (obj === null || typeof obj !== "object") {
            return obj;
        } else if (Array.isArray(obj)) {
            var clonedArr = [];
            obj.forEach(function (element) {
                clonedArr.push(clone(element));
            });
            return clonedArr;
        } else {
            let clonedObj = {};
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    clonedObj[prop] = clone(obj[prop]);
                }
            }
            return clonedObj;
        }
    }

    function createLightCopy(originalField) {
        applyToCells(originalField, cell => {
            cell.jDiv = undefined;
            cell.div = undefined;
        });

        let lightCopy = clone(originalField);

        applyToCells(originalField, cell => {
            cell.jDiv = $('#' + (cell.y + 1) + '_' + (cell.x + 1));
            cell.div = cell.jDiv[0];
        });

        return lightCopy;
    }

    function setNeighborsInfo(field) {
        applyToCells(field, cell => {
            cell.unknownNeighbors = 0;
            cell.neighborAmount = 0;

            applyToNeighbors(field, cell, nCell => {
                if (nCell.isUnknown) {
                    cell.unknownNeighbors += 1;
                }

                cell.neighborAmount += 1;
            });
        });
    }

    function applyToCells(matrix, action) {
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                action(matrix[y][x]);
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
                    action(matrix[y][x]);
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
