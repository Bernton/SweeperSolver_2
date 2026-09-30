## Suite expert — 2026-09-29 — 4806b8b + uncommitted sweeper.js changes
Seeds from 1, 4 threads, 3000 games per variant
- Variant 0: current (endgameSearchMaxUnknowns=20)
- Variant 1: current with endgameSearchMaxUnknowns=0
- Variant 2: current with endgameSearchMaxUnknowns=12
- Variant 3: current with endgameSearchMaxUnknowns=16
- Variant 4: current with endgameSearchMaxUnknowns=24
- Variant 5: current with endgameSearchMaxUnknowns=28

| Preset | Variant | Win % | Δ win vs variant 0 (paired) | Expected win % | Δ expected (paired) | Forced games | Games played differently | Guesses/game | ms/game | Slowest step ms | Errors |
|---|---|---|---|---|---|---|---|---|---|---|---|
| expert 30x16/99 | 0 | 54.20 ± 0.91 |  | 53.75 ± 0.78 |  | 28.9% |  | 2.58 | 24.5 | 495 | 0 |
|  | 1 | 53.60 ± 0.91 | -0.60 ± 0.37 (-1.6σ) | 53.17 ± 0.77 | -0.59 ± 0.29 (-2.0σ) | 30.8% | 374 | 2.61 | 13.1 | 360 | 0 |
|  | 2 | 54.17 ± 0.91 | -0.03 ± 0.23 (-0.1σ) | 53.66 ± 0.77 | -0.09 ± 0.21 (-0.4σ) | 30.1% | 184 | 2.59 | 14.3 | 377 | 0 |
|  | 3 | 54.10 ± 0.91 | -0.10 ± 0.15 (-0.7σ) | 53.73 ± 0.77 | -0.03 ± 0.14 (-0.2σ) | 29.4% | 81 | 2.59 | 15.2 | 379 | 0 |
|  | 4 | 54.30 ± 0.91 | +0.10 ± 0.12 (0.8σ) | 53.90 ± 0.78 | +0.15 ± 0.10 (1.4σ) | 28.7% | 52 | 2.57 | 39.6 | 537 | 0 |
|  | 5 | 54.37 ± 0.91 | +0.17 ± 0.13 (1.3σ) | 53.95 ± 0.78 | +0.20 ± 0.11 (1.8σ) | 28.8% | 67 | 2.57 | 55.1 | 768 | 0 |

Robustness gate (current version: no errors, no step over SLOW_STEP_TIME = 2000 ms): PASS

Total time: 137 s
