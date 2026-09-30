## Suite expert — 2026-09-29 — b22cc61 + uncommitted sweeper.js changes
Seeds from 1, 4 threads, 10000 games per variant
- Variant 0: current
- Variant 1: current with guessLookaheadOutsiders=1
- Variant 2: current with guessLookaheadOutsiders=2
- Variant 3: current with guessLookaheadOutsiders=4
- Variant 4: current with guessLookaheadOutsiders=8

| Preset | Variant | Win % | Δ win vs variant 0 (paired) | Expected win % | Δ expected (paired) | Forced games | Games played differently | Guesses/game | ms/game | Slowest step ms | Errors |
|---|---|---|---|---|---|---|---|---|---|---|---|
| expert 30x16/99 | 0 | 54.24 ± 0.50 |  | 53.62 ± 0.43 |  | 28.2% |  | 2.52 | 24.8 | 420 | 0 |
|  | 1 | 54.24 ± 0.50 | +0.00 ± 0.01 (0.0σ) | 53.64 ± 0.43 | +0.02 ± 0.01 (1.4σ) | 28.2% | 19 | 2.52 | 24.3 | 410 | 0 |
|  | 2 | 54.22 ± 0.50 | -0.02 ± 0.07 (-0.3σ) | 53.64 ± 0.43 | +0.02 ± 0.07 (0.3σ) | 28.2% | 249 | 2.53 | 27.2 | 443 | 0 |
|  | 3 | 54.00 ± 0.50 | -0.24 ± 0.14 (-1.7σ) | 53.39 ± 0.43 | -0.23 ± 0.13 (-1.8σ) | 28.2% | 700 | 2.54 | 26.3 | 432 | 0 |
|  | 4 | 53.85 ± 0.50 | -0.39 ± 0.15 (-2.6σ) | 53.23 ± 0.43 | -0.39 ± 0.13 (-2.9σ) | 28.2% | 751 | 2.53 | 26.6 | 450 | 0 |

Robustness gate (current version: no errors, no step over SLOW_STEP_TIME = 2000 ms): PASS

Total time: 363 s
