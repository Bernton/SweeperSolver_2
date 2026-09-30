## Suite expert — 2026-09-29 — ccbd3e0 + uncommitted sweeper.js changes
Seeds from 1, 4 threads, 10000 games per variant
- Variant 0: current
- Variant 1: current with firstClickCornerOffset=null
- Variant 2: current with firstClickCornerOffset=1
- Variant 3: current with firstClickCornerOffset=3
- Variant 4: current with guessLookaheadCandidates=0
- Variant 5: current with guessLookaheadCandidates=6
- Variant 6: current with guessLookaheadCandidates=12

| Preset | Variant | Win % | Δ win vs variant 0 (paired) | Games played differently | Guesses/game | ms/game | Slowest step ms | Errors |
|---|---|---|---|---|---|---|---|---|
| expert 30x16/99 | 0 | 53.52 ± 0.50 |  |  | 2.54 | 14.0 | 765 | 0 |
|  | 1 | 52.04 ± 0.50 | -1.48 ± 0.43 (-3.4σ) | 9906 | 2.54 | 20.0 | 1179 | 0 |
|  | 2 | 51.35 ± 0.50 | -2.17 ± 0.32 (-6.8σ) | 8670 | 2.77 | 14.2 | 958 | 0 |
|  | 3 | 53.63 ± 0.50 | +0.11 ± 0.33 (0.3σ) | 8679 | 2.48 | 13.7 | 748 | 0 |
|  | 4 | 52.29 ± 0.50 | -1.23 ± 0.27 (-4.6σ) | 3866 | 2.68 | 5.4 | 70 | 0 |
|  | 5 | 53.38 ± 0.50 | -0.14 ± 0.14 (-1.0σ) | 1163 | 2.50 | 15.1 | 1195 | 0 |
|  | 6 | 53.34 ± 0.50 | -0.18 ± 0.15 (-1.2σ) | 1236 | 2.50 | 15.4 | 1627 | 0 |

Robustness gate (current version: no errors, no step over 2000 ms): PASS

Total time: 255 s
