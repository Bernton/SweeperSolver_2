## Suite sizes — 2026-09-29 — ccbd3e0 + uncommitted sweeper.js changes
Seeds from 1, 4 threads, 13440 games per variant
- Variant 0: reference HEAD
- Variant 1: current (guessLookaheadCandidates=3)

| Preset | Variant | Win % | Δ win vs variant 0 (paired) | Games played differently | Guesses/game | ms/game | Slowest step ms | Errors |
|---|---|---|---|---|---|---|---|---|
| beginner 9x9/10 | 0 | 96.86 ± 0.25 |  |  | 0.10 | 0.2 | 8 | 0 |
|  | 1 | 96.92 ± 0.24 | +0.06 ± 0.05 (1.1σ) | 39 | 0.10 | 0.4 | 31 | 0 |
| intermediate 16x16/40 | 0 | 89.84 ± 0.43 |  |  | 0.43 | 1.0 | 12 | 0 |
|  | 1 | 89.84 ± 0.43 | +0.00 ± 0.17 (0.0σ) | 312 | 0.41 | 2.7 | 77 | 0 |
| wide 60x16/198 | 0 | 34.20 ± 1.50 |  |  | 3.98 | 13.5 | 26 | 0 |
|  | 1 | 34.80 ± 1.51 | +0.60 ± 0.93 (0.6σ) | 578 | 3.89 | 44.5 | 453 | 0 |
| square 24x24/115 | 0 | 59.20 ± 1.10 |  |  | 2.11 | 5.9 | 37 | 0 |
|  | 1 | 59.45 ± 1.10 | +0.25 ± 0.56 (0.4σ) | 659 | 1.99 | 17.5 | 491 | 0 |
| big 50x50/500 | 0 | 34.25 ± 2.37 |  |  | 3.00 | 40.5 | 51 | 0 |
|  | 1 | 35.50 ± 2.39 | +1.25 ± 1.20 (1.0σ) | 177 | 3.04 | 121.8 | 4768 ⚠ | 0 |
| max 99x99/1960 | 0 | 12.50 ± 5.23 |  |  | 3.90 | 436.6 | 110 | 0 |
|  | 1 | 15.00 ± 5.65 | +2.50 ± 4.31 (0.6σ) | 22 | 4.47 | 619.7 | 167 | 0 |

Robustness gate (current version: no errors, no step over 2000 ms): FAIL

Total time: 62 s
