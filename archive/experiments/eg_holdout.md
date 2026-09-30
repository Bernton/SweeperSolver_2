## Suite expert — 2026-09-29 — 4806b8b + uncommitted sweeper.js changes
Seeds from 100001, 4 threads, 10000 games per variant
- Variant 0: current
- Variant 1: current with endgameSearchMaxUnknowns=0
- Variant 2: current with endgameSearchMaxUnknowns=8
- Variant 3: current with endgameSearchMaxUnknowns=16
- Variant 4: current with endgameSearchMaxUnknowns=20

| Preset | Variant | Win % | Δ win vs variant 0 (paired) | Expected win % | Δ expected (paired) | Forced games | Games played differently | Guesses/game | ms/game | Slowest step ms | Errors |
|---|---|---|---|---|---|---|---|---|---|---|---|
| expert 30x16/99 | 0 | 52.78 ± 0.50 |  | 52.93 ± 0.43 |  | 29.0% |  | 2.55 | 11.9 | 461 | 0 |
|  | 1 | 52.44 ± 0.50 | -0.34 ± 0.17 (-2.0σ) | 52.43 ± 0.42 | -0.50 ± 0.13 (-3.8σ) | 30.0% | 810 | 2.56 | 13.1 | 519 | 0 |
|  | 2 | 52.45 ± 0.50 | -0.33 ± 0.11 (-3.0σ) | 52.56 ± 0.43 | -0.37 ± 0.10 (-3.6σ) | 29.5% | 390 | 2.56 | 12.3 | 429 | 0 |
|  | 3 | 52.95 ± 0.50 | +0.17 ± 0.09 (1.8σ) | 53.15 ± 0.43 | +0.22 ± 0.09 (2.5σ) | 28.9% | 389 | 2.54 | 14.4 | 516 | 0 |
|  | 4 | 53.09 ± 0.50 | +0.31 ± 0.12 (2.6σ) | 53.31 ± 0.43 | +0.38 ± 0.11 (3.4σ) | 28.7% | 657 | 2.54 | 21.1 | 542 | 0 |

Robustness gate (current version: no errors, no step over SLOW_STEP_TIME = 2000 ms): PASS

Total time: 218 s
