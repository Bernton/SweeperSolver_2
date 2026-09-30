import sys
s = open(sys.argv[1]).read()
def rep(old, new):
    global s
    assert s.count(old) == 1, old[:80]
    s = s.replace(old, new)
rep("""                let cellToSweep = rowToSweep[x];
                let cell = row[x];
                cell.referenceCell""", """                let cellToSweep = rowToSweep[x];
                let cell = row[x];
                let unknownBefore = cell.isUnknown ? 1 : 0;
                let flaggedBefore = !cell.isUnknown && cell.isFlagged ? 1 : 0;
                cell.referenceCell""")
rep("""                cell.isBorderCell = false;

                cellCounts.cells += 1;""", """                cell.isBorderCell = false;

                // The solver field keeps the neighbor counts of its previous board, only changed cells update them
                let unknownChange = (cell.isUnknown ? 1 : 0) - unknownBefore;
                let flaggedChange = (!cell.isUnknown && cell.isFlagged ? 1 : 0) - flaggedBefore;

                if (unknownChange !== 0 || flaggedChange !== 0) {
                    let neighbors = cell.neighbors;

                    for (let i = 0; i < neighbors.length; i++) {
                        neighbors[i].unknownNeighborAmount += unknownChange;
                        neighbors[i].flaggedNeighborAmount += flaggedChange;
                        neighbors[i].hiddenNeighborAmount += unknownChange + flaggedChange;
                    }
                }

                cellCounts.cells += 1;""")
start = s.index("    function setCellNeighborCounts(field) {")
end = s.index("    function checkAllValidCombinations(")
s = s[:start] + """    function setCellNeighborCounts(field) {
        for (let y = 0; y < field.length; y++) {
            let row = field[y];

            for (let x = 0; x < row.length; x++) {
                let cell = row[x];

                if (cell.isDigit && cell.unknownNeighborAmount > 0) {
                    activeDigits.push(cell);
                } else if (cell.isUnknown) {
                    unknownCells.push(cell);
                }
            }
        }
    }

""" + s[end:]
open(sys.argv[2], "w").write(s)
