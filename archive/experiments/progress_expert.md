## Suite expert — 2026-09-29 — 3b63610 + uncommitted sweeper.js changes
Seeds from 1, 4 threads, 10000 games per variant
- Variant 0: current
- Variant 1: current with guessProgressWeight=0.05
- Variant 2: current with guessProgressWeight=0.1
- Variant 3: current with guessProgressWeight=0.2
- Variant 4: current with guessProgressWeight=0.5
- Variant 5: current with guessProgressWeight=1

| Preset | Variant | Win % | Δ win vs variant 0 (paired) | Expected win % | Δ expected (paired) | Forced games | Games played differently | Guesses/game | ms/game | Slowest step ms | Errors |
|---|---|---|---|---|---|---|---|---|---|---|---|
| expert 30x16/99 | 0 | 54.51 ± 0.50 |  | 53.86 ± 0.42 |  | 29.8% |  | 2.45 | 24.8 | 451 | 0 |
|  | 1 | 54.42 ± 0.50 | -0.09 ± 0.14 (-0.7σ) | 53.82 ± 0.42 | -0.04 ± 0.12 (-0.4σ) | 29.7% | 1278 | 2.37 | 24.8 | 495 | 0 |
|  | 2 | 54.18 ± 0.50 | -0.33 ± 0.16 (-2.0σ) | 53.58 ± 0.42 | -0.28 ± 0.15 (-1.8σ) | 29.6% | 1719 | 2.34 | 24.9 | 386 | 0 |
|  | 3 | 54.07 ± 0.50 | -0.44 ± 0.19 (-2.3σ) | 53.50 ± 0.42 | -0.36 ± 0.18 (-2.0σ) | 29.4% | 2180 | 2.31 | 23.8 | 423 | 0 |
|  | 4 | 53.92 ± 0.50 | -0.59 ± 0.22 (-2.7σ) | 53.36 ± 0.42 | -0.50 ± 0.20 (-2.5σ) | 29.4% | 2552 | 2.29 | 23.6 | 865 | 0 |
|  | 5 | 53.98 ± 0.50 | -0.53 ± 0.23 (-2.3σ) | 53.42 ± 0.42 | -0.44 ± 0.21 (-2.1σ) | 29.3% | 2677 | 2.27 | 23.9 | 621 | 0 |

Robustness gate (current version: no errors, no step over SLOW_STEP_TIME = 2000 ms): PASS

Total time: 410 s
