# Roadmap

State, review findings and ranked backlog. Measurements and history are in [bench/RESULTS.md](bench/RESULTS.md).

## Current state

- **Expert (30x16/99, minesweeperonline.com rules): about 53.7% wins** (expected win: 53.86% on tuning seeds 1-10000,
  53.74% on fresh seeds 300001-340000; expected win counts forced coin flips at their exact chance).
  Reference: JSMinesweeper reports 54.3% for the same rules (first click opens an area, start at (3,3)).
- Solver: rule stages [0] trivial and [1] suffocations, then the exact full check [3] with exact bomb probabilities.
  Guesses: of the 3 cells with the lowest bomb probability, the one most likely to survive itself and the next move
  (look-ahead, exact analysis of each value the cell can show); with up to 28 unknown cells left, the exact best guess
  (search over all bomb configurations and strategies). First click on the fourth cell from the top left corner on expert,
  the third on other boards (`solverConfig.boardSettings`).
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

The exact endgame search (done, entry 14) made the solver optimal in all checked endgames and gained about 0.9 points.
The early game is the largest pool of losses, but rollouts found no better choice among the cells with the lowest bomb
probability (entry 15): the solver's early choice beats every fixed alternative, early losses are mostly inherent risk.

## Ranked backlog

Impact = expected effect on the expert win rate or on trial time; each item is evaluated with the benchmark
(paired, ablation) and confirmed on held-out seeds before it is adopted.

### Next options

The win rate items of the list are done or measured negative (entries 14-18); the remaining one (overfull boards) only
matters on boards with more bombs than cells outside the first click's area. Candidates for the next task:

1. **Live auto sweeper pacing** (recommended next): for real use on the website. The auto sweeper plays about 3 expert
   games per second although solving and clicking take about 30 ms per game, because every step waits for a browser
   timer (at least 4 ms). Run several steps per timer tick, time-boxed so the page stays responsive (item 12).
2. **Trial speed**: cheaper hypothetical boards in the look-ahead (estimate 20-30% on expert, not measured) and an
   incremental trivial stage for large boards (items 7-9).
3. **Housekeeping**: one check command running the three verifiers and the gate (item 15), and removing the old-IE code
   and the wrong, unused `median` (item 17).
4. **New win rate ideas beyond the list**, e.g. a look-ahead two moves deep for the top candidates, measured the same way
   (benchmark, held-out seeds; no code kept if negative or inconclusive).

### Win rate

2. Done: early-game ceiling measurement (entry 15; the rollout tool was removed, recoverable from commit b22cc61): no headroom found among the cells with
   the lowest bomb probability.
3. Done (negative, entry 18): progress (chance of a certain next move) in the look-ahead's evaluation lowers the win
   rate at every weight tried.
4. Done: first click offset 3 on expert only (entry 17, via `solverConfig.boardSettings`); 2 stays the general default
   (3 is worse on beginner and intermediate).
5. **Overfull boards**: model the website's non-uniform placement around the first click when there are more bombs
   than cells outside that area (bench/RESULTS.md entry 14); only matters on those boards.
6. Done: exact endgame search (entry 14). Not worth it (measured): more cells away from the digits as look-ahead
   candidates (entry 16), more look-ahead candidates (6 or 12 instead of 3; covers ties, no gain), dropping the
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

- **Rule**: experiments that are negative or inconclusive leave no code behind; they are documented in bench/RESULTS.md
  (with the commit to recover them) and listed here as tried.

14. **Held-out confirmation**: tune on seeds 1-10000, confirm adopted changes with `--seed 100001` before committing
    (done for the current features, see bench/RESULTS.md entry 12).
15. **One check command** running `verify-website`, `verify-analysis`, `verify-forced` and a quick gate run before each
    commit.
16. **Expected win as the main metric** for comparisons (less noise, entry 13); done in the benchmark output, keep the
    counted win rate next to it.

### Code health

17. Leftovers: the old-IE branch in `simulate` (`createEventObject`/`fireEvent`), the unused and wrong `median` in the
    stats helpers (reads the unsorted list), `isRecordingStepStats`. Low priority.
