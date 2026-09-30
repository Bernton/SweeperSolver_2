import sys
src, dst = sys.argv[1], sys.argv[2]
s = open(src).read()
def rep(old, new, count=1):
    global s
    assert s.count(old) == count, (old[:60], s.count(old))
    s = s.replace(old, new)
# sweep-scoped lists
rep("    let cellCounts = { cells: 0, hidden: 0, flagged: 0, revealedBombs: 0 };\n    let depth = sweepDepth;",
    "    let cellCounts = { cells: 0, hidden: 0, flagged: 0, revealedBombs: 0 };\n    // Filled during the copy, in board order: digits with unknown neighbors and unknown cells\n    let activeDigits = [];\n    let unknownCells = [];\n    let depth = sweepDepth;")
# collect in setCellNeighborCounts
rep("""                cell.unknownNeighborAmount = unknownNeighborAmount;
                cell.flaggedNeighborAmount = flaggedNeighborAmount;
                cell.hiddenNeighborAmount = unknownNeighborAmount + flaggedNeighborAmount;
""", """                cell.unknownNeighborAmount = unknownNeighborAmount;
                cell.flaggedNeighborAmount = flaggedNeighborAmount;
                cell.hiddenNeighborAmount = unknownNeighborAmount + flaggedNeighborAmount;

                if (cell.isDigit && unknownNeighborAmount > 0) {
                    activeDigits.push(cell);
                } else if (cell.isUnknown) {
                    unknownCells.push(cell);
                }
""")
# trivial reveals
rep("""        let revealsFound = false;

        applyToCells(field, (cell) => {
            if (cell.isDigit && cell.flaggedNeighborAmount === cell.value) {
                cell.neighbors.forEach((neighbor) => {
                    if (neighbor.isUnknown) {
                        revealCell(neighbor);
                        revealsFound = true;
                    }
                });
            }
        });
""", """        let revealsFound = false;

        activeDigits.forEach((cell) => {
            if (cell.flaggedNeighborAmount === cell.value) {
                cell.neighbors.forEach((neighbor) => {
                    if (neighbor.isUnknown) {
                        revealCell(neighbor);
                        revealsFound = true;
                    }
                });
            }
        });
""")
rep("""        let flagsFound = false;

        applyToCells(field, (cell) => {
            if (cell.isDigit && cell.hiddenNeighborAmount === cell.value && cell.flaggedNeighborAmount !== cell.value) {""",
"""        let flagsFound = false;

        activeDigits.forEach((cell) => {
            if (cell.hiddenNeighborAmount === cell.value && cell.flaggedNeighborAmount !== cell.value) {""")
rep("""        applyToCells(field, (cell) => {
            if (cell.isDigit && cell.unknownNeighborAmount > 0) {
                cell.isBorderCell = true;
                fieldBorderDigits.push(cell);
                borderDigits.push(createBorderDigit(cell));
            }
        });""", """        activeDigits.forEach((cell) => {
            cell.isBorderCell = true;
            fieldBorderDigits.push(cell);
            borderDigits.push(createBorderDigit(cell));
        });""")
rep("""        applyToCells(field, (cell) => {
            if (cell.isUnknown && !cell.isBorderCell) {""", """        unknownCells.forEach((cell) => {
            if (!cell.isBorderCell) {""")
open(dst, "w").write(s)
