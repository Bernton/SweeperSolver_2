## Suite expert — 2026-09-28 — 15d5c7e + uncommitted sweeper.js changes
Seeds from 1, 4 threads, 10000 games per variant
- Variant 0: current
- Variant 1: current with firstClickCornerOffset=0
- Variant 2: current with firstClickCornerOffset=1
- Variant 3: current with firstClickCornerOffset=2
- Variant 4: current with firstClickCornerOffset=3
- Variant 5: current with firstClickCornerOffset=4

| Preset | Variant | Win % | Δ win vs variant 0 (paired) | Guesses/game | ms/game | Slowest step ms | Errors |
|---|---|---|---|---|---|---|---|
| expert 30x16/99 | 0 | 51.08 ± 0.50 |  | 2.66 | 18.7 | 65 | 0 |
|  | 1 | 46.34 ± 0.50 | -4.74 ± 0.46 (-10.4σ) | 3.16 | 18.8 | 125 | 0 |
|  | 2 | 49.88 ± 0.50 | -1.20 ± 0.45 (-2.7σ) | 2.89 | 19.0 | 70 | 0 |
|  | 3 | 52.29 ± 0.50 | +1.21 ± 0.43 (2.8σ) | 2.68 | 20.6 | 65 | 0 |
|  | 4 | 52.33 ± 0.50 | +1.25 ± 0.42 (3.0σ) | 2.60 | 18.6 | 88 | 0 |
|  | 5 | 50.72 ± 0.50 | -0.36 ± 0.38 (-0.9σ) | 2.66 | 18.0 | 87 | 0 |

Robustness gate (current version: no errors, no step over 2000 ms): PASS

Total time: 296 s
