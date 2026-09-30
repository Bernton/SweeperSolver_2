## Suite expert — 2026-09-29 — ccbd3e0 + uncommitted sweeper.js changes
Seeds from 1, 4 threads, 10000 games per variant
- Variant 0: current
- Variant 1: current with firstClickCornerOffset=null
- Variant 2: current with firstClickCornerOffset=1
- Variant 3: current with firstClickCornerOffset=3
- Variant 4: current with guessLookaheadCandidates=3
- Variant 5: current with guessLookaheadCandidates=6
- Variant 6: current with guessLookaheadCandidates=12

| Preset | Variant | Win % | Δ win vs variant 0 (paired) | Games played differently | Guesses/game | ms/game | Slowest step ms | Errors |
|---|---|---|---|---|---|---|---|---|
| expert 30x16/99 | 0 | 52.29 ± 0.50 |  |  | 2.68 | 5.1 | 46 | 0 |
|  | 1 | 51.08 ± 0.50 | -1.21 ± 0.43 (-2.8σ) | 9904 | 2.66 | 5.9 | 85 | 0 |
|  | 2 | 49.88 ± 0.50 | -2.41 ± 0.32 (-7.5σ) | 8670 | 2.89 | 5.3 | 50 | 0 |
|  | 3 | 52.33 ± 0.50 | +0.04 ± 0.33 (0.1σ) | 8679 | 2.60 | 5.3 | 85 | 0 |
|  | 4 | 53.31 ± 0.50 | +1.02 ± 0.29 (3.5σ) | 4157 | 2.53 | 18.6 | 623 | 0 |
|  | 5 | 53.08 ± 0.50 | +0.79 ± 0.31 (2.6σ) | 4418 | 2.48 | 29.0 | 1739 | 0 |
|  | 6 | 53.10 ± 0.50 | +0.81 ± 0.31 (2.6σ) | 4433 | 2.48 | 50.1 | 3950 ⚠ | 0 |

Robustness gate (current version: no errors, no step over 2000 ms): PASS

Total time: 309 s
