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
    // Bombs among the unknown neighbors of each cell in each configuration, computed once
    let bombNeighbors = new Uint8Array(configurations.length * unknownAmount);

    configurations.forEach((configuration, c) => {
        for (let i = 0; i < unknownAmount; i++) {
            bombNeighbors[c * unknownAmount + i] = bitCount(configuration & neighborMasks[i]);
        }
    });

    // A position is the revealed cells and the numbers they showed: for the same revealed cells, different numbers
    // leave disjoint (so different) configuration lists, so this key identifies the configuration list exactly.
    // One character per cell: UNREVEALED_KEY_CODE, or the bombs among its unknown neighbors.
    const UNREVEALED_KEY_CODE = 65;
    let rootKey = String.fromCharCode(UNREVEALED_KEY_CODE).repeat(unknownAmount);

    // candidates: indices into configurations
    let winsWhenRevealing = (i, candidates, revealed, key) => {
        let nextRevealed = revealed | (1 << i);
        let groups = new Map();
        let wins = 0;

        for (let c = 0; c < candidates.length; c++) {
            let index = candidates[c];
            let configuration = configurations[index];

            if (!(configuration & (1 << i))) {
                if (isWon(configuration, nextRevealed)) {
                    wins += 1;
                } else {
                    let value = bombNeighbors[index * unknownAmount + i];
                    let group = groups.get(value);
                    group ? group.push(index) : groups.set(value, [index]);
                }
            }
        }

        groups.forEach((group, value) => {
            let nextKey = key.slice(0, i) + String.fromCharCode(value) + key.slice(i + 1);
            wins += winsFrom(group, nextRevealed, nextKey);
        });

        return wins;
    };

    let winsFrom = (candidates, revealed, key) => {
        let wins = memo.get(key);

        if (wins === undefined) {
            if (--workLeft < 0) {
                throw endgameBudgetExceeded;
            }

            // A cell that is safe in every configuration costs nothing and only adds information, so revealing it
            // first is optimal: then only that cell needs to be searched
            let bombCells = 0;
            let alwaysBombCells = allCells;

            for (let c = 0; c < candidates.length; c++) {
                bombCells |= configurations[candidates[c]];
                alwaysBombCells &= configurations[candidates[c]];
            }

            let certainSafe = allCells & ~revealed & ~bombCells;
            wins = 0;

            if (certainSafe) {
                wins = winsWhenRevealing(31 - Math.clz32(certainSafe & -certainSafe), candidates, revealed, key);
            } else {
                for (let i = 0; i < unknownAmount; i++) {
                    if (!(revealed & (1 << i)) && !(alwaysBombCells & (1 << i))) {
                        wins = Math.max(wins, winsWhenRevealing(i, candidates, revealed, key));
                    }
                }
            }

            memo.set(key, wins);
        }

        return wins;
    };

    try {
        let winCounts = [];
        let bombCounts = [];
        let isForced = true;
        let allIndices = configurations.map((configuration, c) => c);

        for (let i = 0; i < unknownAmount; i++) {
            winCounts.push(winsWhenRevealing(i, allIndices, 0, rootKey));
