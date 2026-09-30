## Suite expert — 2026-09-29 — ff48d02
Seeds from 1, 4 threads, 10000 games per variant
- Variant 0: current
- Variant 1: current with firstClickCornerOffset=null
- Variant 2: current with firstClickCornerOffset=1
- Variant 3: current with firstClickCornerOffset=3
- Variant 4: current with guessLookaheadCandidates=0
- Variant 5: current with guessLookaheadCandidates=6
- Variant 6: current with guessLookaheadCandidates=12
- Variant 7: current with guessLookaheadBudget=5000
- Variant 8: current with guessLookaheadBudget=100000

| Preset | Variant | Win % | Δ win vs variant 0 (paired) | Expected win % | Δ expected (paired) | Forced games | Games played differently | Guesses/game | ms/game | Slowest step ms | Errors |
|---|---|---|---|---|---|---|---|---|---|---|---|
| expert 30x16/99 | 0 | 53.52 ± 0.50 |  | 52.81 ± 0.42 |  | 29.6% |  | 2.54 | 12.6 | 322 | 0 |
|  | 1 | 52.05 ± 0.50 | -1.47 ± 0.43 (-3.4σ) | 51.37 ± 0.42 | -1.43 ± 0.38 (-3.8σ) | 32.9% | 9914 | 2.54 | 14.2 | 383 | 0 |
|  | 2 | 51.35 ± 0.50 | -2.17 ± 0.32 (-6.8σ) | 50.72 ± 0.43 | -2.09 ± 0.28 (-7.4σ) | 29.2% | 8665 | 2.77 | 14.1 | 361 | 0 |
|  | 3 | 53.63 ± 0.50 | +0.11 ± 0.33 (0.3σ) | 53.00 ± 0.42 | +0.19 ± 0.29 (0.7σ) | 31.2% | 8662 | 2.48 | 12.2 | 585 | 0 |
|  | 4 | 52.29 ± 0.50 | -1.23 ± 0.27 (-4.6σ) | 51.73 ± 0.43 | -1.07 ± 0.25 (-4.4σ) | 29.5% | 3870 | 2.68 | 5.8 | 54 | 0 |
|  | 5 | 53.38 ± 0.50 | -0.14 ± 0.14 (-1.0σ) | 52.76 ± 0.42 | -0.04 ± 0.13 (-0.3σ) | 29.7% | 1161 | 2.50 | 13.0 | 425 | 0 |
|  | 6 | 53.34 ± 0.50 | -0.18 ± 0.15 (-1.2σ) | 52.74 ± 0.42 | -0.06 ± 0.13 (-0.5σ) | 29.8% | 1234 | 2.50 | 13.9 | 344 | 0 |
|  | 7 | 53.52 ± 0.50 | +0.00 ± 0.00 (0.0σ) | 52.81 ± 0.42 | +0.00 ± 0.00 (0.0σ) | 29.6% | 8 | 2.54 | 11.2 | 167 | 0 |
|  | 8 | 53.52 ± 0.50 | +0.00 ± 0.00 (0.0σ) | 52.81 ± 0.42 | +0.00 ± 0.00 (0.0σ) | 29.6% | 1 | 2.54 | 11.4 | 784 | 0 |

Robustness gate (current version: no errors, no step over 2000 ms): PASS

Total time: 298 s
