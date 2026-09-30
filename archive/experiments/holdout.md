## Suite expert — 2026-09-29 — 5d29120
Seeds from 100001, 4 threads, 10000 games per variant
- Variant 0: current
- Variant 1: current with firstClickCornerOffset=null
- Variant 2: current with firstClickCornerOffset=1
- Variant 3: current with firstClickCornerOffset=3
- Variant 4: current with guessLookaheadCandidates=0
- Variant 5: current with guessLookaheadCandidates=6
- Variant 6: current with guessLookaheadCandidates=12
- Variant 7: current with guessLookaheadBudget=5000
- Variant 8: current with guessLookaheadBudget=100000

| Preset | Variant | Win % | Δ win vs variant 0 (paired) | Games played differently | Guesses/game | ms/game | Slowest step ms | Errors |
|---|---|---|---|---|---|---|---|---|
| expert 30x16/99 | 0 | 52.44 ± 0.50 |  |  | 2.56 | 11.8 | 399 | 0 |
|  | 1 | 51.27 ± 0.50 | -1.17 ± 0.42 (-2.8σ) | 9906 | 2.52 | 14.2 | 336 | 0 |
|  | 2 | 50.34 ± 0.50 | -2.10 ± 0.32 (-6.7σ) | 8585 | 2.72 | 12.3 | 404 | 0 |
|  | 3 | 53.05 ± 0.50 | +0.61 ± 0.32 (1.9σ) | 8680 | 2.49 | 11.3 | 405 | 0 |
|  | 4 | 51.20 ± 0.50 | -1.24 ± 0.27 (-4.7σ) | 3832 | 2.67 | 4.6 | 22 | 0 |
|  | 5 | 52.54 ± 0.50 | +0.10 ± 0.15 (0.7σ) | 1156 | 2.53 | 17.5 | 785 | 0 |
|  | 6 | 52.59 ± 0.50 | +0.15 ± 0.15 (1.0σ) | 1225 | 2.52 | 15.2 | 795 | 0 |
|  | 7 | 52.44 ± 0.50 | +0.00 ± 0.00 (0.0σ) | 1 | 2.56 | 11.1 | 270 | 0 |
|  | 8 | 52.43 ± 0.50 | -0.01 ± 0.01 (-1.0σ) | 2 | 2.56 | 12.5 | 970 | 0 |

Robustness gate (current version: no errors, no step over 2000 ms): PASS

Total time: 290 s
