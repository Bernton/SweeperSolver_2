function searchEndgame(unknownAmount, bombsLeft, digits, digitsOfCells, neighborMasks, flaggedNeighbors, budget) {
    let configurations = enumerateEndgameConfigurations(unknownAmount, bombsLeft, digits, digitsOfCells, budget);

    if (!configurations) {
        return null;
    }

    let allCells = unknownAmount === 0 ? 0 : 2 ** unknownAmount - 1;
    let workLeft = budget - configurations.length;
    // Memo by (revealed cells, candidate list); candidate lists are hashed and compared exactly on a hash match
    let memo = new Map();
    let isWon = (configuration, revealed) => (~configuration & allCells & ~revealed) === 0;

    let winsWhenRevealing = (i, candidates, revealed) => {
        let nextRevealed = revealed | (1 << i);
        let bit = 1 << i;
        let mask = neighborMasks[i];
        // A revealed cell shows its flagged neighbors plus 0 to 8 bombs among its unknown neighbors
        let groups = [[], [], [], [], [], [], [], [], []];
        let wins = 0;

        for (let c = 0; c < candidates.length; c++) {
            let configuration = candidates[c];

            if (!(configuration & bit)) {
                let group = groups[bitCount(configuration & mask)];

                if (isWon(configuration, nextRevealed)) {
                    wins += 1;
                } else {
                    group.push(configuration);
                }
            }
        }

        for (let g = 0; g < groups.length; g++) {
            if (groups[g].length > 0) {
                wins += winsFrom(groups[g], nextRevealed);
            }
        }

        return wins;
    };

    let winsFrom = (candidates, revealed) => {
        if (candidates.length === 0) {
            return 0;
        }

        let hash = revealed | 0;

        for (let c = 0; c < candidates.length; c++) {
            hash = Math.imul(hash ^ candidates[c], 0x01000193) + c;
        }

        let key = revealed + "|" + candidates.length + "|" + hash;
        let entries = memo.get(key);

        if (entries) {
            for (let e = 0; e < entries.length; e++) {
                let other = entries[e].candidates;
                let isSame = true;

                for (let c = 0; c < candidates.length && isSame; c++) {
                    isSame = other[c] === candidates[c];
                }

                if (isSame) {
                    return entries[e].wins;
                }
            }
        } else {
            entries = [];
            memo.set(key, entries);
        }

        if (--workLeft < 0) {
            throw endgameBudgetExceeded;
        }

        let bombCells = 0;
        let alwaysBombCells = allCells;

        for (let c = 0; c < candidates.length; c++) {
            bombCells |= candidates[c];
            alwaysBombCells &= candidates[c];
        }

        let certainSafe = allCells & ~revealed & ~bombCells;
        let best = 0;

        if (certainSafe) {
            best = winsWhenRevealing(31 - Math.clz32(certainSafe & -certainSafe), candidates, revealed);
        } else {
            for (let i = 0; i < unknownAmount; i++) {
                if (!(revealed & (1 << i)) && !(alwaysBombCells & (1 << i))) {
                    best = Math.max(best, winsWhenRevealing(i, candidates, revealed));
                }
            }
        }

        entries.push({ candidates: candidates, wins: best });
        return best;
    };
