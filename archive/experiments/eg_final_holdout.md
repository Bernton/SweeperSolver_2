## Suite expert — 2026-09-29 — 4806b8b + uncommitted sweeper.js changes
Seeds from 100001, 4 threads, 10000 games per variant
- Variant 0: reference HEAD
- Variant 1: current

| Preset | Variant | Win % | Δ win vs variant 0 (paired) | Expected win % | Δ expected (paired) | Forced games | Games played differently | Guesses/game | ms/game | Slowest step ms | Errors |
|---|---|---|---|---|---|---|---|---|---|---|---|
| expert 30x16/99 | 0 | 52.44 ± 0.50 |  | 52.43 ± 0.42 |  | 30.0% |  | 2.56 | 12.5 | 501 | 0 |
|  | 1 | 53.14 ± 0.50 | +0.70 ± 0.20 (3.5σ) | 53.33 ± 0.43 | +0.91 ± 0.17 (5.5σ) | 28.7% | 1354 | 2.54 | 23.1 | 549 | 0 |

Robustness gate (current version: no errors, no step over SLOW_STEP_TIME = 2000 ms): PASS

Total time: 106 s
