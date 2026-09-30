## Suite sizes — 2026-09-29 — ccbd3e0 + uncommitted sweeper.js changes
Seeds from 1, 4 threads, 13440 games per variant
- Variant 0: reference HEAD
- Variant 1: current

| Preset | Variant | Win % | Δ win vs variant 0 (paired) | Games played differently | Guesses/game | ms/game | Slowest step ms | Errors |
|---|---|---|---|---|---|---|---|---|
| beginner 9x9/10 | 0 | 96.86 ± 0.25 |  |  | 0.10 | 0.3 | 15 | 0 |
|  | 1 | 96.88 ± 0.25 | +0.02 ± 0.04 (0.4σ) | 32 | 0.10 | 0.4 | 35 | 0 |
| intermediate 16x16/40 | 0 | 89.84 ± 0.43 |  |  | 0.43 | 1.1 | 45 | 0 |
|  | 1 | 89.88 ± 0.43 | +0.04 ± 0.16 (0.3σ) | 283 | 0.41 | 2.0 | 60 | 0 |
| wide 60x16/198 | 0 | 34.20 ± 1.50 |  |  | 3.98 | 13.7 | 23 | 0 |
|  | 1 | 35.90 ± 1.52 | +1.70 ± 0.84 (2.0σ) | 538 | 3.86 | 32.6 | 461 | 0 |
| square 24x24/115 | 0 | 59.20 ± 1.10 |  |  | 2.11 | 5.7 | 38 | 0 |
|  | 1 | 59.85 ± 1.10 | +0.65 ± 0.53 (1.2σ) | 612 | 2.00 | 12.5 | 481 | 0 |
| big 50x50/500 | 0 | 34.25 ± 2.37 |  |  | 3.00 | 41.3 | 31 | 0 |
|  | 1 | 36.25 ± 2.40 | +2.00 ± 1.11 (1.8σ) | 168 | 3.05 | 102.6 | 5200 ⚠ | 0 |
| max 99x99/1960 | 0 | 12.50 ± 5.23 |  |  | 3.90 | 466.2 | 177 | 0 |
|  | 1 | 15.00 ± 5.65 | +2.50 ± 4.31 (0.6σ) | 21 | 4.17 | 530.0 | 154 | 0 |

Robustness gate (current version: no errors, no step over 2000 ms): FAIL

Total time: 54 s
