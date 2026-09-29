# Roadmap

State, review findings and ranked backlog. Measurements and history are in [bench/RESULTS.md](bench/RESULTS.md).

## Current state

- **Expert (30x16/99, minesweeperonline.com rules): about 53% wins**, 2.56 guesses per game.
  Tuning seeds 1-10000: 53.52%; held-out seeds 100001-110000: 52.44% (the tuning seeds read optimistic).
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

About half of the loss mass is in endgames, much of it 50/50 guesses. Part of those are unavoidable (two cells, one
bomb, no further information possible); the rest depends on guess order and choice, which the one-move look-ahead does
not optimize. The overfull 9x9/75 regression of the look-ahead (bench/RESULTS.md, entry 10) is the same weakness.

## Ranked backlog

Impact = expected effect on the expert win rate or on trial time; each item is evaluated with the benchmark
(paired, ablation) and confirmed on held-out seeds before it is adopted.

### Next: exact endgame search (win rate)

When few unknown cells and bomb configurations are left, compute the exact win probability of every possible guess
(expectimax over all configurations: guess, observe the value, continue with certain moves and further guesses) and play
the best one. Replaces the one-move look-ahead there.

- Why: about half of the expected deaths happen with 16 or fewer unknowns; the look-ahead is myopic there (overfull
  regression). JSMinesweeper does the same ("brute force analysis").
- Plan: (1) build the exact search as an analysis function, check it against brute force on tiny boards like
  `bench/verify-analysis.js`; (2) measure offline on recorded endgame positions how much win probability its choice
  gains over the current choice, before integrating; (3) integrate behind `solverConfig` with a deterministic size limit
  (unknowns, configurations), ablate, confirm on held-out seeds, check the gate and step times.
- Risk: exponential cost; needs a hard, deterministic limit and memoization of positions.

### Win rate

2. **Evaluation blend**: combine survival with the next move with progress (chance the guess gives a certain safe move)
   and look further than one move for the top candidates. Unknown gain; JSMinesweeper's main difference besides the
   endgame.
3. **More outside cells in the look-ahead**: only one cell away from the digits (the most likely opening) is considered
   now; 6.8% of guesses are such cells.
4. **First click offset 3 vs 2**: undecided (+0.11 ± 0.33 on tuning seeds, +0.61 ± 0.32 on held-out seeds); re-run with
   more seeds when the solver changes.
5. Not worth it (measured): more look-ahead candidates (6 or 12 instead of 3; covers ties, no gain), dropping the
   look-ahead budget.

### Trial speed

6. **Cheaper hypothetical boards in the look-ahead** (70% of expert time is in guess steps): reuse the current board
   state instead of copying the whole board and recounting all neighbors for each hypothetical (only the revealed cell
   and its neighbors change). Estimated 20-30% on expert.
7. **Update only the affected grouping** in a hypothetical (filter its known combinations by the new constraint)
   instead of solving it again; large gain on big boards, more complex.
8. **Incremental trivial stage** for large boards: stage [0] rescans the whole board on every step (52% of the time on
   50x50, 19% on expert).
9. **Early stopping** of comparisons once clearly significant (fewer games per trial).
10. Not worth it (measured): sharing identical moves between variants, caching small binomial coefficients, returning
    trivial flags and reveals in one step, caching solved groupings across hypothetical boards.

### Live use on the website

11. **Auto sweeper pacing**: every step waits for a timer, which browsers delay by at least 4 ms, so the auto sweeper
    plays far slower than it computes (about 3 expert games per second, while solving and clicking take about 30 ms per game). Run several steps per
    timer tick (time-boxed, so the page stays responsive) when `baseIdleTime` is 0.
12. Clicks on large boards are slow in the website's own code (it snapshots the whole grid on every click); nothing to
    do on our side.

### Methodology

13. **Held-out confirmation**: tune on seeds 1-10000, confirm adopted changes with `--seed 100001` before committing
    (done for the current features, see bench/RESULTS.md entry 12).
14. **One check command** running `verify-website`, `verify-analysis` and a quick gate run before each commit.

### Code health

15. Leftovers: the old-IE branch in `simulate` (`createEventObject`/`fireEvent`), the unused and wrong `median` in the
    stats helpers (reads the unsorted list), `isRecordingStepStats`. Low priority.
