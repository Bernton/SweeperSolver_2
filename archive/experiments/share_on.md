## Suite expert — 2026-09-29 — 6437548
Seeds from 1, 4 threads, 3000 games per variant
- Variant 0: current
- Variant 1: current with firstClickCornerOffset=null
- Variant 2: current with firstClickCornerOffset=1
- Variant 3: current with firstClickCornerOffset=3
- Variant 4: current with guessLookaheadCandidates=0
- Variant 5: current with guessLookaheadCandidates=6
- Variant 6: current with guessLookaheadCandidates=12
- Variant 7: current with guessLookaheadBudget=5000
- Variant 8: current with guessLookaheadBudget=100000
Variants 0, 1, 2, 3, 4, 5, 6, 7, 8 share identical moves until their decisions differ (--no-share to disable)

| Preset | Variant | Win % | Δ win vs variant 0 (paired) | Games played differently | Guesses/game | ms/game | Slowest step ms | Errors |
|---|---|---|---|---|---|---|---|---|
| expert 30x16/99 | 0 | 53.60 ± 0.91 |  |  | 2.61 | 25.0 | 749 | 0 |
|  | 1 | 51.17 ± 0.91 | -2.43 ± 0.80 (-3.1σ) | 2961 | 2.50 | 26.0 | 538 | 0 |
|  | 2 | 51.37 ± 0.91 | -2.23 ± 0.59 (-3.8σ) | 2579 | 2.82 | 23.5 | 226 | 0 |
|  | 3 | 53.33 ± 0.91 | -0.27 ± 0.61 (-0.4σ) | 2618 | 2.48 | 24.9 | 697 | 0 |
|  | 4 | 52.30 ± 0.91 | -1.30 ± 0.48 (-2.7σ) | 1159 | 2.76 | 10.6 | 146 | 0 |
|  | 5 | 53.47 ± 0.91 | -0.13 ± 0.24 (-0.6σ) | 350 | 2.55 | 27.8 | 714 | 0 |
|  | 6 | 53.37 ± 0.91 | -0.23 ± 0.25 (-0.9σ) | 373 | 2.54 | 28.4 | 705 | 0 |
|  | 7 | 53.60 ± 0.91 | +0.00 ± 0.00 (0.0σ) | 5 | 2.61 | 24.5 | 276 | 0 |
|  | 8 | 53.60 ± 0.91 | +0.00 ± 0.00 (0.0σ) | 0 | 2.61 | 25.2 | 667 | 0 |

Robustness gate (current version: no errors, no step over 2000 ms): PASS

Total time: 154 s
