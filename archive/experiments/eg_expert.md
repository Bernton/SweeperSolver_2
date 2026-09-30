## Suite expert — 2026-09-29 — 4806b8b + uncommitted sweeper.js changes
Seeds from 1, 4 threads, 10000 games per variant
- Variant 0: current
- Variant 1: current with endgameSearchMaxUnknowns=0
- Variant 2: current with endgameSearchMaxUnknowns=8
- Variant 3: current with endgameSearchMaxUnknowns=16
- Variant 4: current with endgameSearchMaxUnknowns=20

| Preset | Variant | Win % | Δ win vs variant 0 (paired) | Expected win % | Δ expected (paired) | Forced games | Games played differently | Guesses/game | ms/game | Slowest step ms | Errors |
|---|---|---|---|---|---|---|---|---|---|---|---|
| expert 30x16/99 | 0 | 54.00 ± 0.50 |  | 53.33 ± 0.43 |  | 28.8% |  | 2.53 | 13.4 | 421 | 0 |
|  | 1 | 53.52 ± 0.50 | -0.48 ± 0.16 (-3.0σ) | 52.81 ± 0.42 | -0.52 ± 0.12 (-4.3σ) | 29.6% | 733 | 2.54 | 12.5 | 396 | 0 |
|  | 2 | 53.70 ± 0.50 | -0.30 ± 0.10 (-2.9σ) | 52.96 ± 0.43 | -0.37 ± 0.09 (-3.9σ) | 29.3% | 368 | 2.54 | 12.5 | 352 | 0 |
|  | 3 | 54.10 ± 0.50 | +0.10 ± 0.10 (1.0σ) | 53.47 ± 0.43 | +0.15 ± 0.09 (1.7σ) | 28.5% | 369 | 2.53 | 26.9 | 942 | 0 |
|  | 4 | 54.15 ± 0.50 | +0.15 ± 0.11 (1.4σ) | 53.51 ± 0.43 | +0.19 ± 0.10 (2.0σ) | 28.3% | 456 | 2.53 | 76.6 | 1279 | 0 |

Robustness gate (current version: no errors, no step over SLOW_STEP_TIME = 2000 ms): PASS

Total time: 394 s
