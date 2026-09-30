## Suite expert — 2026-09-29 — 4806b8b + uncommitted sweeper.js changes
Seeds from 1, 4 threads, 3000 games per variant
- Variant 0: current (endgameSearchMaxUnknowns=28)
- Variant 1: current with endgameSearchBudget=20000
- Variant 2: current with endgameSearchBudget=500000
- Variant 3: current with endgameSearchBudget=2000000

| Preset | Variant | Win % | Δ win vs variant 0 (paired) | Expected win % | Δ expected (paired) | Forced games | Games played differently | Guesses/game | ms/game | Slowest step ms | Errors |
|---|---|---|---|---|---|---|---|---|---|---|---|
| expert 30x16/99 | 0 | 54.37 ± 0.91 |  | 53.95 ± 0.78 |  | 28.8% |  | 2.57 | 56.1 | 606 | 0 |
|  | 1 | 54.27 ± 0.91 | -0.10 ± 0.15 (-0.7σ) | 53.90 ± 0.77 | -0.05 ± 0.12 (-0.4σ) | 29.2% | 60 | 2.58 | 22.7 | 290 | 0 |
|  | 2 | 54.40 ± 0.91 | +0.03 ± 0.11 (0.3σ) | 53.92 ± 0.78 | -0.03 ± 0.10 (-0.3σ) | 28.6% | 54 | 2.57 | 168.9 | 3410 ⚠ | 0 |
|  | 3 | 54.37 ± 0.91 | +0.00 ± 0.12 (0.0σ) | 53.92 ± 0.78 | -0.03 ± 0.11 (-0.3σ) | 28.5% | 78 | 2.56 | 457.9 | 14213 ⚠ | 0 |

Robustness gate (current version: no errors, no step over SLOW_STEP_TIME = 2000 ms): PASS

Total time: 548 s
