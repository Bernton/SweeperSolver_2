# Roadmap

State, review findings and ranked backlog. Measurements and history are in [bench/RESULTS.md](bench/RESULTS.md).

## Current state

- **Expert (30x16/99, minesweeperonline.com rules): about 53% wins**, 2.56 guesses per game.
  Tuning seeds 1-10000: 53.52% counted, 52.81% expected (forced coin flips at their exact chance: these seeds were
  lucky there); held-out seeds 100001-110000: 52.44% counted.
  Reference: JSMinesweeper reports 54.3% for the same rules (first click opens an area, start at (3,3)).
- Solver: rule stages [0] trivial and [1] suffocations, then the exact full check [3] with exact bomb probabilities.
  Guesses: of the 3 cells with the lowest bomb probability, the one most likely to survive itself and the next move
  (look-ahead, exact analysis of each value the cell can show). First click on the third cell from the top left corner.
- Works on all website sizes (up to 99x99, any bomb count); robustness gate passes (no errors, no step over 2 s).
- `sweeper.js` stays a single copy/pastable script; the console output shows bomb probability, statistics and the
  evaluation for every candidate.
- Benchmark: headless and multi-threaded, identical boards to the website (verified), paired comparisons, feature
  ablation. 10,000 expert games take about 30 s on 4 threads.

## Where games are lost (expert, 5000 games)

| | |
|---|---|
| Losses by bomb probability of the fatal guess | 0-10%: 13%, 10-20%: 29%, 20-30%: 10%, 30-40%: 8%, **49-51%: 39%** |
| Losses by guess number | first guess after the opening: 32%, second: 22%, third: 15%, later: 31% |
| Losses by unknown cells left | **8 or fewer: 42%**, 9-16: 8%, 17-60: 14%, more: 35% |
| Expected deaths (sum of bomb probabilities of all guesses) | 2364, of which endgame guesses (16 or fewer unknowns): **1220** |

**Forced losses cannot be avoided by any play** (proof and check in bench/RESULTS.md, entry 13): a position is forced
when no unknown cell can give information anymore; then the best possible chance is fixed and the solver reaches it.
About 35% of all losses are forced (almost all 50/50s). The avoidable losses, by unknown cells left at the fatal guess:

| Unknown cells left | Games lost (non-forced) | Average bomb probability of those guesses |
|---|---|---|
| more than 60 (early game) | 16.9% | 10.5% |
| 17-60 | 6.5% | 14.6% |
| 16 or fewer (endgame) | 6.6% | 30.3% |

Exact optimal play in small endgames (up to 12 unknown cells) would win about 0.5 points more than the solver
(`bench/verify-forced.js`); the early game is the largest pool, but its ceiling is not measured yet.

## Ranked backlog

Impact = expected effect on the expert win rate or on trial time; each item is evaluated with the benchmark
(paired, ablation) and confirmed on held-out seeds before it is adopted.

### Next: exact endgame search (win rate)

When few unknown cells and bomb configurations are left, compute the exact win probability of every possible guess
(expectimax over all configurations: guess, observe the value, continue with certain moves and further guesses) and play
the best one. Replaces the one-move look-ahead there.

- Why: measured ceiling of about +0.5 points for endgames up to 12 unknown cells (`bench/verify-forced.js`), likely
  more with larger endgames; fixes the overfull 9x9/75 regression. Forced positions need no search (already optimal).
  JSMinesweeper does the same ("brute force analysis").
- Plan: (1) the exact search exists as a check (`bench/verify-forced.js`); turn it into a solver function working on
  configuration sets; (2) integrate behind `solverConfig` with a named, deterministic size limit (unknown cells,
  configurations), skip forced positions, ablate, confirm on held-out seeds, check the gate and step times.
- Risk: exponential cost; needs a hard, deterministic limit and memoization of positions.

### Win rate

2. **Measure the early-game ceiling** (largest avoidable pool, 16.9% of games): e.g. deeper look-ahead for the first
   guesses on sampled positions, to see what better early guesses could gain before building anything.
3. **Evaluation blend**: combine survival with the next move with progress (chance the guess gives a certain safe move)
   and look further than one move for the top candidates. Unknown gain; JSMinesweeper's main difference besides the
   endgame.
4. **More outside cells in the look-ahead**: only one cell away from the digits (the most likely opening) is considered
   now; 6.8% of guesses are such cells.
5. **First click offset 3 vs 2**: undecided (+0.11 ± 0.33 on tuning seeds, +0.61 ± 0.32 on held-out seeds); re-run with
   more seeds when the solver changes.
6. Not worth it (measured): more look-ahead candidates (6 or 12 instead of 3; covers ties, no gain), dropping the
   look-ahead budget.

### Trial speed

7. **Cheaper hypothetical boards in the look-ahead** (70% of expert time is in guess steps): reuse the current board
   state instead of copying the whole board and recounting all neighbors for each hypothetical (only the revealed cell
   and its neighbors change). Estimated 20-30% on expert.
8. **Update only the affected grouping** in a hypothetical (filter its known combinations by the new constraint)
   instead of solving it again; large gain on big boards, more complex.
9. **Incremental trivial stage** for large boards: stage [0] rescans the whole board on every step (52% of the time on
   50x50, 19% on expert).
10. **Early stopping** of comparisons once clearly significant (fewer games per trial).
11. Not worth it (measured): sharing identical moves between variants, caching small binomial coefficients, returning
    trivial flags and reveals in one step, caching solved groupings across hypothetical boards.

### Live use on the website

12. **Auto sweeper pacing**: every step waits for a timer, which browsers delay by at least 4 ms, so the auto sweeper
    plays far slower than it computes (about 3 expert games per second, while solving and clicking take about 30 ms per game). Run several steps per
    timer tick (time-boxed, so the page stays responsive) when `baseIdleTime` is 0.
13. Clicks on large boards are slow in the website's own code (it snapshots the whole grid on every click); nothing to
    do on our side.

### Methodology

14. **Held-out confirmation**: tune on seeds 1-10000, confirm adopted changes with `--seed 100001` before committing
    (done for the current features, see bench/RESULTS.md entry 12).
15. **One check command** running `verify-website`, `verify-analysis`, `verify-forced` and a quick gate run before each
    commit.
16. **Expected win as the main metric** for comparisons (less noise, entry 13); done in the benchmark output, keep the
    counted win rate next to it.

### Code health

17. Leftovers: the old-IE branch in `simulate` (`createEventObject`/`fireEvent`), the unused and wrong `median` in the
    stats helpers (reads the unsorted list), `isRecordingStepStats`. Low priority.
