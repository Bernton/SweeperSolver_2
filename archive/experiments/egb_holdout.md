## Suite expert — 2026-09-29 — 4806b8b + uncommitted sweeper.js changes
Seeds from 100001, 4 threads, 10000 games per variant
- Variant 0: current
- Variant 1: current with endgameSearchBudget=20000
- Variant 2: current with endgameSearchBudget=500000

| Preset | Variant | Win % | Δ win vs variant 0 (paired) | Expected win % | Δ expected (paired) | Forced games | Games played differently | Guesses/game | ms/game | Slowest step ms | Errors |
|---|---|---|---|---|---|---|---|---|---|---|---|
| expert 30x16/99 | 0 | 52.78 ± 0.50 |  | 52.93 ± 0.43 |  | 29.0% |  | 2.55 | 12.3 | 497 | 0 |
|  | 1 | 52.78 ± 0.50 | +0.00 ± 0.00 (0.0σ) | 52.93 ± 0.43 | +0.00 ± 0.00 (0.0σ) | 29.0% | 0 | 2.55 | 12.1 | 471 | 0 |
|  | 2 | 52.78 ± 0.50 | +0.00 ± 0.00 (0.0σ) | 52.93 ± 0.43 | +0.00 ± 0.00 (0.0σ) | 29.0% | 0 | 2.55 | 12.0 | 487 | 0 |

Robustness gate (current version: no errors, no step over SLOW_STEP_TIME = 2000 ms): PASS

Total time: 112 s
