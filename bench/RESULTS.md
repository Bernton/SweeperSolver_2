# Evaluation log

Newest entries at the bottom. Every solver change is benchmarked against its predecessor on the same seeds
(paired Δ), and all features in *bench/features.js* are re-evaluated with `--ablate` whenever a feature is added.

## 1. Baseline before any changes (385bee0)

Old virtual game (bombs placed after the first click, excluding its 3x3 area), old probability weights.
Silent NaN probabilities on 99x99 boards are not detected by this version (see entry 3).

| Preset | Variant | Win % | Δ win vs variant 0 (paired) | Guesses/game | ms/game | Slowest step ms | Errors |
|---|---|---|---|---|---|---|---|
| expert 30x16/99 | 0 | 50.31 ± 0.50 |  | 2.65 | 19.9 | 114 | 0 |
| beginner 9x9/10 | 0 | 96.48 ± 0.26 |  | 0.12 | 0.6 | 13 | 0 |
| intermediate 16x16/40 | 0 | 87.24 ± 0.47 |  | 0.45 | 4.0 | 22 | 0 |
| wide 60x16/198 | 0 | 34.90 ± 1.51 |  | 3.94 | 60.3 | 42 | 0 |
| square 24x24/115 | 0 | 55.65 ± 1.11 |  | 2.01 | 23.4 | 91 | 0 |
| big 50x50/500 | 0 | 32.25 ± 2.34 |  | 2.80 | 197.0 | 92 | 0 |
| max 99x99/1960 | 0 | 12.50 ± 5.23 |  | 4.28 | 2747.3 | 204 | 0 |
| max 99x99/2450 (25%) | 0 | 0.00 ± 0.00 |  | 6.88 | 3915.9 | 216 | 0 |
| max 99x99/2940 (30%) | 0 | 0.00 ± 0.00 |  | 8.25 | 1586.1 | 194 | 0 |
| max 99x99/3920 (40%) | 0 | 0.00 ± 0.00 |  | 4.75 | 786.7 | 226 | 0 |
| max 99x99/8820 (90%) | 0 | 0.00 ± 0.00 |  | 1.63 | 104.0 | 181 | 0 |
| max 99x99/9795 (overfull) | 0 | 0.00 ± 0.00 |  | 0.00 | 6.2 | 9 | 8 ⚠ |
| dense 30x16/200 | 0 | 0.00 ± 0.00 |  | 5.24 | 13.2 | 36 | 0 |
| overfull 9x9/75 | 0 | 0.00 ± 0.00 |  | 0.00 | 0.1 | 5 | 200 ⚠ |
| line 1x30/5 | 0 | 43.40 ± 2.22 |  | 2.79 | 0.2 | 11 | 0 |
| tiny 2x2/3 | 0 | 0.00 ± 0.00 |  | 0.00 | 0.0 | 3 | 100 ⚠ |
| empty 10x10/0 | 0 | 100.00 ± 0.00 |  | 0.00 | 0.1 | 0 | 0 |

Errors:
- max 99x99/9795 (overfull), variant 0: 8x Cannot set properties of undefined (setting 'isBomb')
- overfull 9x9/75, variant 0: 200x Cannot set properties of undefined (setting 'isBomb')
- tiny 2x2/3, variant 0: 100x Cannot set properties of undefined (setting 'isBomb')

Robustness gate (current version: no errors, no step over 2000 ms): FAIL

## 2. Virtual game places bombs exactly like minesweeperonline.com

Port of the website's algorithm (uniform placement, then bombs moved off the first click and out of its 3x3 area as far as room allows).
`bench/verify-website.js`: identical boards for all tested sizes, densities and first-click positions. Boards differ from entry 1, so this run is not paired.
Expert/sizes changes vs entry 1 are within noise (same board distribution, different boards). Overfull boards no longer crash.

| Preset | Variant | Win % | Δ win vs variant 0 (paired) | Guesses/game | ms/game | Slowest step ms | Errors |
|---|---|---|---|---|---|---|---|
| expert 30x16/99 | 0 | 51.12 ± 0.50 |  | 2.66 | 19.0 | 88 | 0 |
| beginner 9x9/10 | 0 | 95.98 ± 0.28 |  | 0.13 | 0.5 | 17 | 0 |
| intermediate 16x16/40 | 0 | 87.68 ± 0.46 |  | 0.45 | 3.9 | 44 | 0 |
| wide 60x16/198 | 0 | 32.20 ± 1.48 |  | 3.97 | 59.6 | 43 | 0 |
| square 24x24/115 | 0 | 56.85 ± 1.11 |  | 2.08 | 22.2 | 54 | 0 |
| big 50x50/500 | 0 | 36.25 ± 2.40 |  | 2.96 | 196.2 | 69 | 0 |
| max 99x99/1960 | 0 | 15.00 ± 5.65 |  | 3.92 | 1980.3 | 290 | 0 |
| max 99x99/2450 (25%) | 0 | 0.00 ± 0.00 |  | 4.63 | 3088.6 | 193 | 0 |
| max 99x99/2940 (30%) | 0 | 0.00 ± 0.00 |  | 9.31 | 1902.1 | 394 | 0 |
| max 99x99/3920 (40%) | 0 | 0.00 ± 0.00 |  | 4.69 | 758.2 | 274 | 0 |
| max 99x99/8820 (90%) | 0 | 0.00 ± 0.00 |  | 2.13 | 238.2 | 241 | 0 |
| max 99x99/9795 (overfull) | 0 | 100.00 ± 0.00 |  | 1.00 | 132.8 | 131 | 0 |
| dense 30x16/200 | 0 | 0.00 ± 0.00 |  | 4.83 | 11.2 | 33 | 0 |
| overfull 9x9/75 | 0 | 94.00 ± 1.68 |  | 1.20 | 0.7 | 6 | 0 |
| line 1x30/5 | 0 | 48.40 ± 2.23 |  | 2.83 | 0.1 | 4 | 0 |
| tiny 2x2/3 | 0 | 100.00 ± 0.00 |  | 0.00 | 0.0 | 1 | 0 |
| empty 10x10/0 | 0 | 100.00 ± 0.00 |  | 0.00 | 0.1 | 0 | 0 |

Robustness gate (current version: no errors, no step over 2000 ms): PASS

## 3. Exact probability weights in log space

Replaces the binomial approximation / hypergeometric term (which overflowed to NaN on 99x99, e.g. 10 of 49 guess steps at 25% density, undetected) with C(outside unknowns, flags left - k) in log space. NaN fractions now fail validation.
Check against the old code with the approximation disabled (same math, linear space), expert 10k: -0.06 ± 0.12 (float tie-breaks only).
Paired vs entry 2 (--compare HEAD):

| Preset | Variant | Win % | Δ win vs variant 0 (paired) | Guesses/game | ms/game | Slowest step ms | Errors |
|---|---|---|---|---|---|---|---|
| expert 30x16/99 | 0 | 51.12 ± 0.50 |  | 2.66 | 18.5 | 68 | 0 |
|  | 1 | 51.08 ± 0.50 | -0.04 ± 0.12 (-0.3σ) | 2.66 | 21.3 | 82 | 0 |
| beginner 9x9/10 | 0 | 95.98 ± 0.28 |  | 0.13 | 0.7 | 17 | 0 |
|  | 1 | 96.00 ± 0.28 | +0.02 ± 0.04 (0.4σ) | 0.13 | 0.7 | 15 | 0 |
| intermediate 16x16/40 | 0 | 87.68 ± 0.46 |  | 0.45 | 4.0 | 20 | 0 |
|  | 1 | 87.66 ± 0.47 | -0.02 ± 0.07 (-0.3σ) | 0.45 | 4.0 | 23 | 0 |
| wide 60x16/198 | 0 | 32.20 ± 1.48 |  | 3.97 | 57.2 | 40 | 0 |
|  | 1 | 32.20 ± 1.48 | +0.00 ± 0.32 (0.0σ) | 3.95 | 61.3 | 35 | 0 |
| square 24x24/115 | 0 | 56.85 ± 1.11 |  | 2.08 | 22.3 | 41 | 0 |
|  | 1 | 56.75 ± 1.11 | -0.10 ± 0.25 (-0.4σ) | 2.08 | 24.3 | 37 | 0 |
| big 50x50/500 | 0 | 36.25 ± 2.40 |  | 2.96 | 203.3 | 95 | 0 |
|  | 1 | 35.50 ± 2.39 | -0.75 ± 0.43 (-1.7σ) | 2.95 | 201.7 | 70 | 0 |
| max 99x99/1960 | 0 | 15.00 ± 5.65 |  | 3.92 | 1575.3 | 248 | 0 |
|  | 1 | 12.50 ± 5.23 | -2.50 ± 2.47 (-1.0σ) | 3.92 | 2372.4 | 275 | 0 |
| max 99x99/2450 (25%) | 0 | 0.00 ± 0.00 |  | 4.63 | 2558.2 | 207 | 0 |
|  | 1 | 0.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 9.69 | 5022.7 | 238 | 0 |
| max 99x99/2940 (30%) | 0 | 0.00 ± 0.00 |  | 9.31 | 1681.8 | 259 | 0 |
|  | 1 | 0.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 9.13 | 1749.3 | 330 | 0 |
| max 99x99/3920 (40%) | 0 | 0.00 ± 0.00 |  | 4.69 | 748.1 | 212 | 0 |
|  | 1 | 0.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 4.69 | 723.8 | 179 | 0 |
| max 99x99/8820 (90%) | 0 | 0.00 ± 0.00 |  | 2.13 | 243.0 | 177 | 0 |
|  | 1 | 0.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 2.13 | 228.9 | 183 | 0 |
| max 99x99/9795 (overfull) | 0 | 100.00 ± 0.00 |  | 1.00 | 124.7 | 139 | 0 |
|  | 1 | 100.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 1.00 | 122.0 | 109 | 0 |
| dense 30x16/200 | 0 | 0.00 ± 0.00 |  | 4.83 | 11.0 | 29 | 0 |
|  | 1 | 0.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 4.82 | 10.4 | 33 | 0 |
| overfull 9x9/75 | 0 | 94.00 ± 1.68 |  | 1.20 | 0.5 | 7 | 0 |
|  | 1 | 94.00 ± 1.68 | +0.00 ± 0.00 (0.0σ) | 1.20 | 0.9 | 9 | 0 |
| line 1x30/5 | 0 | 48.40 ± 2.23 |  | 2.83 | 0.1 | 7 | 0 |
|  | 1 | 48.40 ± 2.23 | +0.00 ± 0.00 (0.0σ) | 2.83 | 0.2 | 13 | 0 |
| tiny 2x2/3 | 0 | 100.00 ± 0.00 |  | 0.00 | 0.0 | 0 | 0 |
|  | 1 | 100.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 0.00 | 0.0 | 0 | 0 |
| empty 10x10/0 | 0 | 100.00 ± 0.00 |  | 0.00 | 0.5 | 4 | 0 |
|  | 1 | 100.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 0.00 | 0.3 | 4 | 0 |

Robustness gate (current version: no errors, no step over 2000 ms): PASS

Rechecks on new seeds: big 50x50/500 seeds 401-2400: -0.35 ± 0.27 (-1.3σ); max 99x99/1960 seeds 41-200: +0.63 ± 0.62.
Expert neutral. Slight negative trend on 50x50 (combined about -1.8σ) is not significant; re-evaluate once guess selection changes, as the outside-cell probability depends on these weights.

## 4. Speed (no decision changes)

Virtual game: cell list built once and in linear time. Solver: plain loops in setCellNeighborInfo, Map/Set lookups in getBorderCells and calculateOutsiderCellProb.
0 games played differently on all suites. Single thread: expert 26.7 -> 12.3 ms/game, 99x99/1960 1880 -> 545 ms/game.
Remaining cost is the full board copy and neighbor lists rebuilt on every step (about 60% of the time).

## 5. First click n cells in from the top left corner (solverConfig.firstClickCornerOffset)

Offset 0 = corner, 2 = third cell from the corner, null = center (previous behavior). Different first clicks give different boards, so paired Δ is less tight here.
Expert ablation (default was null = center):

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

Sizes ablation (variants as above: 0 = center, 1..5 = offset 0..4):

| Preset | Variant | Win % | Δ win vs variant 0 (paired) | Games played differently | Guesses/game | ms/game | Slowest step ms | Errors |
|---|---|---|---|---|---|---|---|---|
| beginner 9x9/10 | 0 | 96.00 ± 0.28 |  |  | 0.13 | 0.5 | 27 | 0 |
|  | 1 | 95.66 ± 0.29 | -0.34 ± 0.28 (-1.2σ) | 4142 | 0.26 | 0.6 | 17 | 0 |
|  | 2 | 96.78 ± 0.25 | +0.78 ± 0.26 (3.0σ) | 4200 | 0.13 | 0.5 | 16 | 0 |
|  | 3 | 96.86 ± 0.25 | +0.86 ± 0.24 (3.6σ) | 3976 | 0.10 | 0.5 | 19 | 0 |
|  | 4 | 96.68 ± 0.25 | +0.68 ± 0.23 (3.0σ) | 3389 | 0.11 | 0.5 | 12 | 0 |
|  | 5 | 96.00 ± 0.28 | +0.00 ± 0.00 (0.0σ) | 0 | 0.13 | 0.5 | 26 | 0 |
| intermediate 16x16/40 | 0 | 87.66 ± 0.47 |  |  | 0.45 | 2.6 | 14 | 0 |
|  | 1 | 85.92 ± 0.49 | -1.74 ± 0.41 (-4.2σ) | 4785 | 0.77 | 2.7 | 19 | 0 |
|  | 2 | 88.48 ± 0.45 | +0.82 ± 0.37 (2.2σ) | 4756 | 0.53 | 2.6 | 14 | 0 |
|  | 3 | 89.84 ± 0.43 | +2.18 ± 0.34 (6.4σ) | 4697 | 0.43 | 2.6 | 20 | 0 |
|  | 4 | 88.94 ± 0.44 | +1.28 ± 0.33 (3.9σ) | 4607 | 0.42 | 2.4 | 14 | 0 |
|  | 5 | 87.74 ± 0.46 | +0.08 ± 0.28 (0.3σ) | 4519 | 0.45 | 2.4 | 20 | 0 |
| wide 60x16/198 | 0 | 32.20 ± 1.48 |  |  | 3.95 | 37.0 | 55 | 0 |
|  | 1 | 30.10 ± 1.45 | -2.10 ± 1.31 (-1.6σ) | 996 | 4.36 | 34.0 | 24 | 0 |
|  | 2 | 32.10 ± 1.48 | -0.10 ± 1.31 (-0.1σ) | 996 | 4.22 | 34.0 | 47 | 0 |
|  | 3 | 34.20 ± 1.50 | +2.00 ± 1.33 (1.5σ) | 998 | 3.98 | 34.6 | 23 | 0 |
|  | 4 | 34.50 ± 1.50 | +2.30 ± 1.31 (1.8σ) | 996 | 3.99 | 35.2 | 36 | 0 |
|  | 5 | 32.90 ± 1.49 | +0.70 ± 1.19 (0.6σ) | 995 | 4.10 | 40.8 | 45 | 0 |
| square 24x24/115 | 0 | 56.75 ± 1.11 |  |  | 2.08 | 15.1 | 32 | 0 |
|  | 1 | 51.70 ± 1.12 | -5.05 ± 0.89 (-5.7σ) | 1990 | 2.58 | 13.6 | 50 | 0 |
|  | 2 | 56.20 ± 1.11 | -0.55 ± 0.87 (-0.6σ) | 1972 | 2.27 | 14.7 | 42 | 0 |
|  | 3 | 59.20 ± 1.10 | +2.45 ± 0.83 (3.0σ) | 1972 | 2.11 | 14.8 | 56 | 0 |
|  | 4 | 58.30 ± 1.10 | +1.55 ± 0.80 (1.9σ) | 1963 | 1.99 | 15.9 | 79 | 0 |
|  | 5 | 57.15 ± 1.11 | +0.40 ± 0.72 (0.6σ) | 1964 | 2.05 | 13.6 | 68 | 0 |
| big 50x50/500 | 0 | 35.50 ± 2.39 |  |  | 2.95 | 126.8 | 77 | 0 |
|  | 1 | 30.50 ± 2.30 | -5.00 ± 1.39 (-3.6σ) | 399 | 3.41 | 118.1 | 34 | 0 |
|  | 2 | 32.75 ± 2.35 | -2.75 ± 1.29 (-2.1σ) | 398 | 3.10 | 121.9 | 38 | 0 |
|  | 3 | 34.25 ± 2.37 | -1.25 ± 1.25 (-1.0σ) | 397 | 3.00 | 184.8 | 46 | 0 |
|  | 4 | 34.50 ± 2.38 | -1.00 ± 1.27 (-0.8σ) | 399 | 3.03 | 141.2 | 90 | 0 |
|  | 5 | 34.00 ± 2.37 | -1.50 ± 1.12 (-1.3σ) | 400 | 2.95 | 176.2 | 56 | 0 |
| max 99x99/1960 | 0 | 12.50 ± 5.23 |  |  | 3.92 | 931.0 | 169 | 0 |
|  | 1 | 10.00 ± 4.74 | -2.50 ± 4.31 (-0.6σ) | 40 | 4.55 | 945.0 | 137 | 0 |
|  | 2 | 12.50 ± 5.23 | +0.00 ± 5.00 (0.0σ) | 40 | 4.05 | 990.1 | 146 | 0 |
|  | 3 | 12.50 ± 5.23 | +0.00 ± 5.00 (0.0σ) | 40 | 3.90 | 1183.4 | 179 | 0 |
|  | 4 | 12.50 ± 5.23 | +0.00 ± 3.54 (0.0σ) | 40 | 3.65 | 1120.8 | 231 | 0 |
|  | 5 | 12.50 ± 5.23 | +0.00 ± 3.54 (0.0σ) | 40 | 3.55 | 1143.7 | 176 | 0 |

Robustness gate (current version: no errors, no step over 2000 ms): PASS

Rechecks of offset 2 vs center on new seeds: big 50x50/500 seeds 401-2800: +2.13 ± 0.57 (3.7σ); max 99x99/1960 seeds 41-280: +1.25 ± 0.93 (1.3σ).
Offset 2 is best or tied best on every size, so it is the default for all sizes (no expert-specific setting needed). Stress suite passes the gate with it.
Kept for re-evaluation in bench/features.js: null (center), 1, 2, 3.

## 6. Snapshot of the current state (db6cee9), reference for the next features

| Preset | Variant | Win % | Δ win vs variant 0 (paired) | Games played differently | Guesses/game | ms/game | Slowest step ms | Errors |
|---|---|---|---|---|---|---|---|---|
| expert 30x16/99 | 0 | 52.29 ± 0.50 |  |  | 2.68 | 12.8 | 63 | 0 |
| beginner 9x9/10 | 0 | 96.86 ± 0.25 |  |  | 0.10 | 0.5 | 12 | 0 |
| intermediate 16x16/40 | 0 | 89.84 ± 0.43 |  |  | 0.43 | 2.5 | 17 | 0 |
| wide 60x16/198 | 0 | 34.20 ± 1.50 |  |  | 3.98 | 35.2 | 31 | 0 |
| square 24x24/115 | 0 | 59.20 ± 1.10 |  |  | 2.11 | 14.4 | 48 | 0 |
| big 50x50/500 | 0 | 34.25 ± 2.37 |  |  | 3.00 | 128.0 | 33 | 0 |
| max 99x99/1960 | 0 | 12.50 ± 5.23 |  |  | 3.90 | 1010.7 | 157 | 0 |
| max 99x99/2450 (25%) | 0 | 0.00 ± 0.00 |  |  | 6.50 | 1052.9 | 117 | 0 |
| max 99x99/2940 (30%) | 0 | 0.00 ± 0.00 |  |  | 4.75 | 137.3 | 37 | 0 |
| max 99x99/3920 (40%) | 0 | 0.00 ± 0.00 |  |  | 4.06 | 102.4 | 33 | 0 |
| max 99x99/8820 (90%) | 0 | 0.00 ± 0.00 |  |  | 1.50 | 24.6 | 15 | 0 |
| max 99x99/9795 (overfull) | 0 | 100.00 ± 0.00 |  |  | 1.00 | 127.2 | 133 | 0 |
| dense 30x16/200 | 0 | 0.00 ± 0.00 |  |  | 4.14 | 5.8 | 17 | 0 |
| overfull 9x9/75 | 0 | 92.50 ± 1.86 |  |  | 1.28 | 0.4 | 8 | 0 |
| line 1x30/5 | 0 | 48.80 ± 2.24 |  |  | 2.90 | 0.2 | 10 | 0 |
| tiny 2x2/3 | 0 | 100.00 ± 0.00 |  |  | 0.00 | 0.0 | 0 | 0 |
| empty 10x10/0 | 0 | 100.00 ± 0.00 |  |  | 0.00 | 0.0 | 0 | 0 |

Robustness gate (current version: no errors, no step over 2000 ms): PASS

Full `all` suite: 86 s on 4 threads (entry 1: 336 s).

## 7. Speed: reuse the solver's board copy, read the live board without jQuery (no decision changes)

The solver's copy of the board and its neighbor lists are built once per board size and reused; each step only copies cell states and recounts neighbors.
Live mode reads squares with getElementById/className/style.display instead of jQuery; duplicate interaction checks use Sets.

- Headless, all suites (--scale 0.2 --compare HEAD): 0 games played differently; sweep time per game expert 12.8 -> 10.0 ms, 50x50 155 -> 98 ms, 99x99/1960 674 -> 538 ms, 99x99 90% 35 -> 9 ms.
- Live, website code (as pasted from the browser) in headless Chromium, seeded, sweeper.js injected like a console paste: identical games (expert: 200 games, 102 wins, 14272 steps each).
  Solver time per game: expert 86.8 -> 22.6 ms, 99x99/1960 12432 -> 2354 ms. Clicks (website code) cost 15 ms (expert) and 4 s (99x99) per game, as the website snapshots its whole grid on every click.
- Keyboard flow ([s], [d], [i]) works with the pasted script.

## 8. Speed: fixed cell shapes, state counts during the copy (no decision changes)

Virtual and solver cells get all properties up front (same hidden class, faster property access). Hidden/flag/revealed-bomb counts are taken while copying the board instead of three extra scans per step.
0 games played differently on all suites; sweep time per game vs entry 7: expert 8.8 -> 5.4 ms, 50x50 114 -> 53 ms, 99x99/1960 584 -> 272 ms (4 threads, --scale 0.2).
Live (website code in Chromium): identical 200 expert games, solver time 22.6 -> 16.5 ms per game. Full `all` suite: 21 s at --scale 0.2.

## 9. Fix: digit constraint with no bombs left had no valid combination

getValidCombinationsForNeighbors skipped the all-zero combination, so a digit whose bombs are all flagged made its grouping impossible.
Normal play never reached it (the trivial rules resolve such digits first); the look-ahead analysis (entry 10) does. 0 games played differently on all suites.

## 10. Guess look-ahead (solverConfig.guessLookaheadCandidates, guessLookaheadBudget)

Of the n safest guesses, pick the one maximizing P(safe) × E[safety of the best next move], averaged over the values the cell can show.
Each value is analyzed exactly on a hypothetical board (sweep in analysis mode: configuration count and best safety; 1 if a certain safe cell exists).
`bench/verify-analysis.js` compares this with brute-force enumeration: 6947 hypothetical boards, 0 mismatches (found the bug of entry 9).
Exact pruning: candidates are sorted by safety and a score can not exceed the safety, so evaluation stops early (-37% time, identical games).
Budget: at most 20000 enumerated bomb combinations per guess (deterministic, not time based); on 50x50 the slowest step drops from 5.2 s to 0.9 s with identical wins.
Tried and dropped: caching solved groupings across the hypothetical boards (slower on expert; the cost is in the grouping that contains the revealed cell).

Expert ablation (current = look-ahead 3, budget 100000 at the time):

- Variant 0: current
- Variant 1: current with firstClickCornerOffset=null
- Variant 2: current with firstClickCornerOffset=1
- Variant 3: current with firstClickCornerOffset=3
- Variant 4: current with guessLookaheadCandidates=0
- Variant 5: current with guessLookaheadCandidates=6
- Variant 6: current with guessLookaheadCandidates=12

| Preset | Variant | Win % | Δ win vs variant 0 (paired) | Games played differently | Guesses/game | ms/game | Slowest step ms | Errors |
|---|---|---|---|---|---|---|---|---|
| expert 30x16/99 | 0 | 53.52 ± 0.50 |  |  | 2.54 | 14.0 | 765 | 0 |
|  | 1 | 52.04 ± 0.50 | -1.48 ± 0.43 (-3.4σ) | 9906 | 2.54 | 20.0 | 1179 | 0 |
|  | 2 | 51.35 ± 0.50 | -2.17 ± 0.32 (-6.8σ) | 8670 | 2.77 | 14.2 | 958 | 0 |
|  | 3 | 53.63 ± 0.50 | +0.11 ± 0.33 (0.3σ) | 8679 | 2.48 | 13.7 | 748 | 0 |
|  | 4 | 52.29 ± 0.50 | -1.23 ± 0.27 (-4.6σ) | 3866 | 2.68 | 5.4 | 70 | 0 |
|  | 5 | 53.38 ± 0.50 | -0.14 ± 0.14 (-1.0σ) | 1163 | 2.50 | 15.1 | 1195 | 0 |
|  | 6 | 53.34 ± 0.50 | -0.18 ± 0.15 (-1.2σ) | 1236 | 2.50 | 15.4 | 1627 | 0 |

Robustness gate (current version: no errors, no step over 2000 ms): PASS

50x50 ablation (budget alternatives):

| big 50x50/500 | current (3, budget 100000) 36.25 ± 2.40, slowest step 2641 ms | budget 20000: +0.00, 2 games differ, slowest 907 ms | no budget: +0.00, slowest 4465 ms |

All suites, look-ahead 3 with budget 20000 vs entry 9 (no look-ahead):

| Preset | Variant | Win % | Δ win vs variant 0 (paired) | Games played differently | Guesses/game | ms/game | Slowest step ms | Errors |
|---|---|---|---|---|---|---|---|---|
| expert 30x16/99 | 0 | 52.29 ± 0.50 |  |  | 2.68 | 5.5 | 52 | 0 |
|  | 1 | 53.52 ± 0.50 | +1.23 ± 0.27 (4.6σ) | 3865 | 2.54 | 13.6 | 486 | 0 |
| beginner 9x9/10 | 0 | 96.86 ± 0.25 |  |  | 0.10 | 0.2 | 10 | 0 |
|  | 1 | 96.88 ± 0.25 | +0.02 ± 0.04 (0.4σ) | 32 | 0.10 | 0.4 | 20 | 0 |
| intermediate 16x16/40 | 0 | 89.84 ± 0.43 |  |  | 0.43 | 1.0 | 11 | 0 |
|  | 1 | 89.88 ± 0.43 | +0.04 ± 0.16 (0.3σ) | 283 | 0.41 | 1.7 | 51 | 0 |
| wide 60x16/198 | 0 | 34.20 ± 1.50 |  |  | 3.98 | 15.3 | 30 | 0 |
|  | 1 | 35.90 ± 1.52 | +1.70 ± 0.84 (2.0σ) | 538 | 3.86 | 33.1 | 300 | 0 |
| square 24x24/115 | 0 | 59.20 ± 1.10 |  |  | 2.11 | 6.3 | 63 | 0 |
|  | 1 | 59.85 ± 1.10 | +0.65 ± 0.53 (1.2σ) | 612 | 2.00 | 11.9 | 372 | 0 |
| big 50x50/500 | 0 | 34.25 ± 2.37 |  |  | 3.00 | 52.0 | 43 | 0 |
|  | 1 | 36.25 ± 2.40 | +2.00 ± 1.11 (1.8σ) | 167 | 3.05 | 80.1 | 944 | 0 |
| max 99x99/1960 | 0 | 12.50 ± 5.23 |  |  | 3.90 | 403.4 | 149 | 0 |
|  | 1 | 15.00 ± 5.65 | +2.50 ± 4.31 (0.6σ) | 21 | 4.17 | 451.0 | 146 | 0 |
| max 99x99/2450 (25%) | 0 | 0.00 ± 0.00 |  |  | 6.50 | 438.1 | 97 | 0 |
|  | 1 | 0.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 12 | 8.06 | 1282.7 | 467 | 0 |
| max 99x99/2940 (30%) | 0 | 0.00 ± 0.00 |  |  | 4.75 | 55.2 | 17 | 0 |
|  | 1 | 0.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 10 | 7.38 | 298.7 | 90 | 0 |
| max 99x99/3920 (40%) | 0 | 0.00 ± 0.00 |  |  | 4.06 | 46.7 | 20 | 0 |
|  | 1 | 0.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 10 | 3.56 | 116.6 | 56 | 0 |
| max 99x99/8820 (90%) | 0 | 0.00 ± 0.00 |  |  | 1.50 | 10.5 | 11 | 0 |
|  | 1 | 0.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 1 | 1.38 | 18.9 | 32 | 0 |
| max 99x99/9795 (overfull) | 0 | 100.00 ± 0.00 |  |  | 1.00 | 8.8 | 10 | 0 |
|  | 1 | 100.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 8 | 2.00 | 33.7 | 23 | 0 |
| dense 30x16/200 | 0 | 0.00 ± 0.00 |  |  | 4.14 | 3.6 | 13 | 0 |
|  | 1 | 0.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 303 | 4.03 | 13.5 | 25 | 0 |
| overfull 9x9/75 | 0 | 92.50 ± 1.86 |  |  | 1.28 | 0.4 | 7 | 0 |
|  | 1 | 85.00 ± 2.52 | -7.50 ± 1.86 (-4.0σ) | 200 | 2.18 | 1.6 | 16 | 0 |
| line 1x30/5 | 0 | 48.80 ± 2.24 |  |  | 2.90 | 0.1 | 6 | 0 |
|  | 1 | 48.80 ± 2.24 | +0.00 ± 0.00 (0.0σ) | 0 | 2.90 | 0.1 | 7 | 0 |
| tiny 2x2/3 | 0 | 100.00 ± 0.00 |  |  | 0.00 | 0.0 | 0 | 0 |
|  | 1 | 100.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 0 | 0.00 | 0.0 | 0 | 0 |
| empty 10x10/0 | 0 | 100.00 ± 0.00 |  |  | 0.00 | 0.0 | 0 | 0 |
|  | 1 | 100.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 0 | 0.00 | 0.0 | 0 | 0 |

Robustness gate (current version: no errors, no step over 2000 ms): PASS

Gains on all realistic sizes (expert +1.23, 4.6σ; wide +1.7; big +2.0), neutral on beginner/intermediate.
Regression on overfull 9x9/75 (-7.5): tiny endgames (e.g. 3 bombs among 8 equally likely cells) where one move of look-ahead is not the win probability.
Candidate fix: exact endgame search when few unknowns remain (next feature). Cost: expert 5.5 -> 13.6 ms per game.

## 11. Trial speed: rule stages, constraint check, shared variant prefixes

Single thread, wall time per game (look-ahead on), with rule stages switched off (the full check [3] is complete, so wins and guesses stay identical; only steps and time change):

| Stage switched off | expert 30x16/99 | big 50x50/500 | max 99x99/1960 |
|---|---|---|---|
| none (current) | 11.64 ms | 52.3 ms | 482 ms |
| [0] trivial cases | 16.24 ms (+40%) | 91.1 ms (+74%) | 781 ms (+62%) |
| [1] suffocations | 12.63 ms (+8.5%) | 57.5 ms (+10%) | 525 ms (+9%) |
| [2] digit flag combinations | 11.76 ms (±0) | 52.3 ms (±0) | 474 ms (-2%) |
| [1] and [2] | 11.75 ms | 53.9 ms | 871 ms (+81%) |
| [0], [1] and [2] | 13.02 ms (+12%) | 99.7 ms (+91%) | 1759 ms (+265%) |

Stages [0] and [1] pay off; [2] is redundant next to [1] and was removed (re-measured against HEAD: expert 11.68 -> 11.18 ms, 50x50 58.0 -> 55.2 ms, 99x99 395 -> 376 ms; identical wins and guesses on all suites).
Time by deciding stage, expert: guess steps [3g] 70% (2.5/game, 3.3 ms each, look-ahead), [0] 19% (63/game), [1] 6%, [2] 2%, [3] 2%. 50x50: [0] 52%, [3g] 38%.

Digit constraints are now checked by the reachable bomb range instead of scanning all valid combinations (same legal values; 0 games played differently): expert about 6-11% faster.

Tried and dropped:
- Sharing identical moves between variants that differ only in decisions (replaying the reference's certain steps): identical results, but 154 s vs 110 s for an expert ablation on 4 threads (single thread only 5% faster), as guess steps dominate and cannot be shared.
- Caching small binomial coefficients: slower than computing them.
- Returning trivial flags and reveals in one step: 9% fewer steps, no measurable time gain.

## 12. Review: loss analysis and held-out confirmation

Where expert games are lost (5000 games, current solver):

- By bomb probability of the fatal guess: 0-10%: 13.4%, 10-20%: 28.7%, 20-30%: 10.3%, 30-40%: 7.8%, 40-49%: 0.3%, 49-51%: 39.2%, above: 0.3%
- By guess number: 1st: 32.4%, 2nd: 21.7%, 3rd: 15.3%, 4th: 11.3%, 5th or later: 19.3%
- By unknown cells left: 8 or fewer: 42.2%, 9-16: 8.3%, 17-30: 8.4%, 31-60: 6.0%, more: 35.1%
- Expected deaths (sum of guess bomb probabilities): 2364 (actual 2314); from 45-55% guesses: 940; from guesses with 16 or fewer unknowns: 1220
- 25.6% of guesses have more than 3 cells tied at the lowest bomb probability (more look-ahead candidates did not help, entry 10); 6.8% of guesses are outsiders; the first guess after the opening has 17.7% bomb probability on average

All features re-evaluated on held-out seeds 100001-110000 (tuning used seeds 1-10000):

- Variant 0: current
- Variant 1: current with firstClickCornerOffset=null
- Variant 2: current with firstClickCornerOffset=1
- Variant 3: current with firstClickCornerOffset=3
- Variant 4: current with guessLookaheadCandidates=0
- Variant 5: current with guessLookaheadCandidates=6
- Variant 6: current with guessLookaheadCandidates=12
- Variant 7: current with guessLookaheadBudget=5000
- Variant 8: current with guessLookaheadBudget=100000

| Preset | Variant | Win % | Δ win vs variant 0 (paired) | Games played differently | Guesses/game | ms/game | Slowest step ms | Errors |
|---|---|---|---|---|---|---|---|---|
| expert 30x16/99 | 0 | 52.44 ± 0.50 |  |  | 2.56 | 11.8 | 399 | 0 |
|  | 1 | 51.27 ± 0.50 | -1.17 ± 0.42 (-2.8σ) | 9906 | 2.52 | 14.2 | 336 | 0 |
|  | 2 | 50.34 ± 0.50 | -2.10 ± 0.32 (-6.7σ) | 8585 | 2.72 | 12.3 | 404 | 0 |
|  | 3 | 53.05 ± 0.50 | +0.61 ± 0.32 (1.9σ) | 8680 | 2.49 | 11.3 | 405 | 0 |
|  | 4 | 51.20 ± 0.50 | -1.24 ± 0.27 (-4.7σ) | 3832 | 2.67 | 4.6 | 22 | 0 |
|  | 5 | 52.54 ± 0.50 | +0.10 ± 0.15 (0.7σ) | 1156 | 2.53 | 17.5 | 785 | 0 |
|  | 6 | 52.59 ± 0.50 | +0.15 ± 0.15 (1.0σ) | 1225 | 2.52 | 15.2 | 795 | 0 |
|  | 7 | 52.44 ± 0.50 | +0.00 ± 0.00 (0.0σ) | 1 | 2.56 | 11.1 | 270 | 0 |
|  | 8 | 52.43 ± 0.50 | -0.01 ± 0.01 (-1.0σ) | 2 | 2.56 | 12.5 | 970 | 0 |

Robustness gate (current version: no errors, no step over 2000 ms): PASS

Look-ahead (+1.24, 4.7σ) and first click offset 2 vs center (+1.17, 2.8σ) confirmed. Offset 3 vs 2 undecided (+0.11 ± 0.33 on tuning seeds, +0.61 ± 0.32 here).
Absolute expert win rate on held-out seeds 52.44% vs 53.52% on the tuning seeds: report about 53%.

## 13. Forced positions: definition, proof, check, expected win metric

A position is forced when no unknown cell can give information: every unknown cell would show the same number in all bomb configurations where it is safe.
Then (1) no reveal ever gives information (the property holds for every subset of configurations), so every strategy is a fixed order of cells;
(2) a fixed order wins configuration C exactly when all safe cells of C come before all its bombs; two different configurations with the same bomb count cannot both satisfy that (a cell x bomb in C1, safe in C2 and a cell y the other way round would need y before x and x before y);
(3) so the optimum is the probability of the most likely configuration (1 / number of configurations, all configurations of the unknown cells being equally likely), reached by revealing the safe cells of one configuration.

`bench/verify-forced.js` (exact optimal play by search over all adaptive strategies, positions with up to MAX_SEARCHED_UNKNOWNS = 12 unknown cells, 1500 expert games):

- Forced positions: 501, optimum exactly one configuration in all of them, the solver reaches it in all of them (PASS).
- Other positions: 287, mean optimal 47.12% vs solver 44.29%; the solver is below optimal in 68 of them, 8.13 wins in 1500 games (about +0.5 points): the ceiling for an exact endgame search on these positions.

Loss breakdown (2000 expert games, forced check limited to 30 unknown cells at the time): 34.7% of losses are forced (98% of them 50/50s). Non-forced losses by unknown cells left: more than 60: 16.9% of games (average bomb probability of those guesses 10.5%), 17-60: 6.5% (14.6%), 16 or fewer: 6.6% (30.3%).

Benchmark: *Expected win %* counts games that reach a forced position with its exact win chance instead of the coin flips (same expected value). The forced check needs no size limit: it stops at the first cell that can show two values, so it costs about 1 s per 3000 expert games. Expert ablation with it:

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

Paired standard errors shrink by 8-13% (about 20-25% fewer games for the same precision); the full run took 298 s (earlier ablations 255-290 s).
The seeds 1-10000 were lucky in forced coin flips: expected win 52.81% vs 53.52% counted, which explains most of the gap to the held-out seeds (52.44%, entry 12).

## 14. Exact endgame search (solverConfig.endgameSearchMaxUnknowns, endgameSearchBudget)

When at most endgameSearchMaxUnknowns unknown cells are left, all bomb configurations are enumerated (pruned by the digits) and all adaptive strategies are searched exactly; the guess with the best win chance is played (ties: lower bomb probability). Cells that are safe in every configuration are revealed first in the search (it cannot lower the win chance). Above endgameSearchBudget (configurations plus search states) the look-ahead decides. The console shows *win chance with best play* per cell and a *Forced* line when no cell can give information.

`bench/verify-forced.js` now finds the solver optimal in all endgame positions it checks (up to MAX_SEARCHED_UNKNOWNS = 12 unknown cells): 0 of 263 non-forced positions below optimal (before: 68 of 287, 8.13 wins per 1500 games).

Size limit (expert, current look-ahead, budget 100000):

| endgameSearchMaxUnknowns | tuning seeds, Δ expected vs 12 | held-out seeds, Δ expected vs 12 | time per game (single thread) |
|---|---|---|---|
| 0 (off) | -0.52 ± 0.12 (4.3σ) | -0.50 ± 0.13 (3.8σ) | 13.8 ms |
| 8 | -0.37 ± 0.09 | -0.37 ± 0.10 | |
| 12 | 0 | 0 | 13.4 ms |
| 16 | +0.15 ± 0.09 | +0.22 ± 0.09 | 13.8 ms |
| 20 | +0.19 ± 0.10 | +0.38 ± 0.11 (3.4σ) | 23 ms |

Against 20 (3000 games): 24: +0.15 ± 0.10, 28: +0.20 ± 0.11 (55 ms per game with budget 100000). Budget at 28: 20000: -0.05 ± 0.12 at 22.7 ms per game; 500000 and 2000000: no gain, 169 and 458 ms per game, steps up to 3.4 s and 14.2 s (gate fails). Chosen: 28 with budget 20000 (win rate over run time, same order of magnitude).

All suites, final defaults vs entry 13 (no endgame search):

| Preset | Variant | Win % | Δ win vs variant 0 (paired) | Expected win % | Δ expected (paired) | Forced games | Games played differently | Guesses/game | ms/game | Slowest step ms | Errors |
|---|---|---|---|---|---|---|---|---|---|---|---|
| expert 30x16/99 | 0 | 53.52 ± 0.50 |  | 52.81 ± 0.42 |  | 29.6% |  | 2.54 | 12.0 | 387 | 0 |
|  | 1 | 54.24 ± 0.50 | +0.72 ± 0.20 (3.7σ) | 53.62 ± 0.43 | +0.81 ± 0.16 (5.1σ) | 28.2% | 1262 | 2.52 | 23.9 | 400 | 0 |
| beginner 9x9/10 | 0 | 96.88 ± 0.25 |  | 96.97 ± 0.19 |  | 4.8% |  | 0.10 | 0.4 | 23 | 0 |
|  | 1 | 96.86 ± 0.25 | -0.02 ± 0.04 (-0.4σ) | 96.93 ± 0.19 | -0.04 ± 0.04 (-1.0σ) | 4.7% | 23 | 0.10 | 0.5 | 104 | 0 |
| intermediate 16x16/40 | 0 | 89.88 ± 0.43 |  | 89.69 ± 0.35 |  | 13.0% |  | 0.41 | 1.5 | 30 | 0 |
|  | 1 | 89.94 ± 0.43 | +0.06 ± 0.15 (0.4σ) | 89.82 ± 0.35 | +0.13 ± 0.12 (1.1σ) | 12.5% | 145 | 0.40 | 2.8 | 130 | 0 |
| wide 60x16/198 | 0 | 35.90 ± 1.52 |  | 35.99 ± 1.26 |  | 33.5% |  | 3.86 | 28.5 | 271 | 0 |
|  | 1 | 36.80 ± 1.53 | +0.90 ± 0.57 (1.6σ) | 37.09 ± 1.28 | +1.10 ± 0.47 (2.3σ) | 32.4% | 147 | 3.84 | 47.1 | 246 | 0 |
| square 24x24/115 | 0 | 59.85 ± 1.10 |  | 60.18 ± 0.92 |  | 30.4% |  | 2.00 | 11.9 | 292 | 0 |
|  | 1 | 60.10 ± 1.09 | +0.25 ± 0.42 (0.6σ) | 60.81 ± 0.92 | +0.64 ± 0.36 (1.8σ) | 29.1% | 261 | 1.97 | 22.7 | 309 | 0 |
| big 50x50/500 | 0 | 36.25 ± 2.40 |  | 36.83 ± 1.84 |  | 48.0% |  | 3.05 | 69.1 | 765 | 0 |
|  | 1 | 35.50 ± 2.39 | -0.75 ± 0.90 (-0.8σ) | 36.69 ± 1.86 | -0.14 ± 0.74 (-0.2σ) | 46.8% | 82 | 3.01 | 93.1 | 760 | 0 |
| max 99x99/1960 | 0 | 15.00 ± 5.65 |  | 12.84 ± 3.86 |  | 32.5% |  | 4.17 | 491.8 | 110 | 0 |
|  | 1 | 17.50 ± 6.01 | +2.50 ± 2.47 (1.0σ) | 14.61 ± 3.93 | +1.77 ± 1.29 (1.4σ) | 40.0% | 7 | 4.22 | 512.3 | 93 | 0 |
| max 99x99/2450 (25%) | 0 | 0.00 ± 0.00 |  | 0.00 ± 0.00 |  | 0.0% |  | 8.06 | 1279.0 | 406 | 0 |
|  | 1 | 0.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 0.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 0.0% | 0 | 8.06 | 1325.7 | 365 | 0 |
| max 99x99/2940 (30%) | 0 | 0.00 ± 0.00 |  | 0.00 ± 0.00 |  | 0.0% |  | 7.38 | 336.8 | 115 | 0 |
|  | 1 | 0.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 0.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 0.0% | 0 | 7.38 | 281.8 | 86 | 0 |
| max 99x99/3920 (40%) | 0 | 0.00 ± 0.00 |  | 0.00 ± 0.00 |  | 0.0% |  | 3.56 | 125.9 | 60 | 0 |
|  | 1 | 0.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 0.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 0.0% | 0 | 3.56 | 104.9 | 65 | 0 |
| max 99x99/8820 (90%) | 0 | 0.00 ± 0.00 |  | 0.00 ± 0.00 |  | 0.0% |  | 1.38 | 19.6 | 54 | 0 |
|  | 1 | 0.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 0.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 0.0% | 0 | 1.38 | 14.5 | 27 | 0 |
| max 99x99/9795 (overfull) | 0 | 100.00 ± 0.00 |  | 100.00 ± 0.00 |  | 0.0% |  | 2.00 | 37.9 | 24 | 0 |
|  | 1 | 100.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 100.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 0.0% | 8 | 1.00 | 14.6 | 26 | 0 |
| dense 30x16/200 | 0 | 0.00 ± 0.00 |  | 0.00 ± 0.00 |  | 0.0% |  | 4.03 | 13.5 | 44 | 0 |
|  | 1 | 0.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 0.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 0.0% | 0 | 4.03 | 13.6 | 24 | 0 |
| overfull 9x9/75 | 0 | 85.00 ± 2.52 |  | 85.00 ± 2.53 |  | 0.0% |  | 2.18 | 1.3 | 19 | 0 |
|  | 1 | 86.00 ± 2.45 | +1.00 ± 0.70 (1.4σ) | 85.50 ± 2.47 | +0.50 ± 0.35 (1.4σ) | 1.0% | 200 | 1.17 | 2.4 | 9 | 0 |
| line 1x30/5 | 0 | 48.80 ± 2.24 |  | 49.35 ± 2.19 |  | 4.2% |  | 2.90 | 0.1 | 4 | 0 |
|  | 1 | 48.80 ± 2.24 | +0.00 ± 0.00 (0.0σ) | 49.35 ± 2.19 | +0.00 ± 0.00 (0.0σ) | 4.2% | 0 | 2.90 | 0.1 | 5 | 0 |
| tiny 2x2/3 | 0 | 100.00 ± 0.00 |  | 100.00 ± 0.00 |  | 0.0% |  | 0.00 | 0.0 | 0 | 0 |
|  | 1 | 100.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 100.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 0.0% | 0 | 0.00 | 0.0 | 1 | 0 |
| empty 10x10/0 | 0 | 100.00 ± 0.00 |  | 100.00 ± 0.00 |  | 0.0% |  | 0.00 | 0.0 | 0 | 0 |
|  | 1 | 100.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 100.00 ± 0.00 | +0.00 ± 0.00 (0.0σ) | 0.0% | 0 | 0.00 | 0.0 | 0 | 0 |

Robustness gate (current version: no errors, no step over SLOW_STEP_TIME = 2000 ms): PASS

Held-out seeds 100001-110000, expert: +0.70 ± 0.20 counted, **+0.91 ± 0.17 (5.5σ) expected**; expected win 53.33% (tuning seeds 53.62%).

Overfull boards (more bombs than cells outside the first click's 3x3 area): the website moves the bombs out of that area in reading order until the outside is full, so the remaining ones are the last in reading order (9x9/75, bomb frequency around the first click: top row 0%, middle row 1.8% / 16.9%, bottom row about 94%; uniform would be 37.5%). The solver assumes uniform placement, so there the look-ahead and the search (both optimal under that assumption) lose against the plain safest cell rule, which happens to try the top left cells first (85-86% vs 92.5%). Known limitation of these boards only.

## 15. Early-game ceiling (bench/measure-early.js, removed after the measurement)

The tool and the guess candidates it read from the step result were removed again after this measurement (no headroom found, no code kept for it); both are in commit b22cc61.

For the first early guess (more than EARLY_MIN_UNKNOWN_CELLS = 60 unknown cells) of each of 415 expert games (200 positions), the solver's choice and the next cells by bomb probability (CANDIDATE_AMOUNT = 6 in total) were played out by the current solver on the same bomb configurations, sampled uniformly from all configurations that fit the board (sampler check: sampled mine frequencies match the exact bomb probabilities within sampling error). Rollouts that reach a position decided by the exact endgame search stop there with its win chance.

- Win chance after the solver's choice: 44.8%.
- Choosing the best of the 6 candidates on SELECTION_SAMPLES = 150 samples each and checking it on 300 fresh ones: **-0.41 ± 0.13 per position (-3.2σ)**. The differences between the candidates are smaller than the rollout noise (about ±4 points per candidate), so the selected candidate is mostly a lucky one (bomb probability 13.5% vs 10.6%).
- Fixed rules (unbiased, they do not look at the samples), instead of the solver's choice: lowest bomb probability -0.15 ± 0.07; candidate 2 by bomb probability -1.00 ± 0.19; 3: -1.52 ± 0.21; 4: -2.09 ± 0.24; 5: -3.04 ± 0.31; 6: -3.99 ± 0.34.

Conclusion: among the cells with the lowest bomb probability, the solver's early choice is the best measurable one; no headroom found there. Early losses are mostly inherent risk (about 10% bomb probability per early guess). Not covered: cells outside the candidate list (only one cell away from the digits is considered) and strategies deeper than one move.

## 16. More cells away from the digits as look-ahead candidates (tried, not adopted)

Experiment: solverConfig.guessLookaheadOutsiders added that many cells away from the digits (most likely openings first) to the look-ahead candidates, next to the 3 cells with the lowest bomb probability. Expert, 10000 games, vs 0 (current):

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

1 or 2 extra cells change almost nothing; 4 and 8 are worse (-0.23 ± 0.13, -0.39 ± 0.13 expected): with more such cells in the comparison, the look-ahead's survival of the next move overrates them. Removed again; the patch was never committed, only this description remains.


## 17. First click offset 3 on expert (solverConfig.boardSettings)

Offset 3 vs 2 on expert, current solver, fresh seeds: 200001-220000: +0.30 ± 0.20 expected (+0.13 ± 0.23 counted); 300001-340000: +0.39 ± 0.14 expected (+0.36 ± 0.16 counted). Combined **+0.36 ± 0.11 expected (3.1σ)** on 60000 games (earlier: +0.11 ± 0.33 and +0.61 ± 0.32 counted, older solvers).

Other sizes, offset 3 vs 2 (expected win, seeds 1-... and 100001-...):

| Preset | seeds from 1 | seeds from 100001 |
|---|---|---|
| beginner 9x9/10 | -0.32 ± 0.16 | -0.19 ± 0.16 |
| intermediate 16x16/40 | -0.65 ± 0.23 | -0.46 ± 0.24 |
| wide 60x16/198 | +0.33 ± 0.74 | -0.33 ± 0.68 |
| square 24x24/115 | -0.89 ± 0.55 | -0.10 ± 0.58 |
| big 50x50/500 | -0.47 ± 0.90 | +0.02 ± 0.78 |
| max 99x99/1960 | +0.36 ± 0.41 | -1.25 ± 1.25 |

Offset 3 is an expert-specific gain (worse on beginner and intermediate), so it is set for expert only: solverConfig.boardSettings holds values per board ("width x height / bombs"), and the solver reads all settings through them (getBoardSettings). Only expert games change (all other presets play identically). Ablation: feature boardSettings in bench/features.js.

## 18. Progress in the look-ahead's evaluation (tried, not adopted)

Experiment: evaluation = (1 - bomb probability) × (expected next safety + guessProgressWeight × chance of a certain next move), the chance taken from the same exact analysis (best next safety exactly 1). Expert, 10000 games, vs weight 0 (current, which already counts a certain next move as safety 1):

- Variant 0: current
- Variant 1: current with guessProgressWeight=0.05
- Variant 2: current with guessProgressWeight=0.1
- Variant 3: current with guessProgressWeight=0.2
- Variant 4: current with guessProgressWeight=0.5
- Variant 5: current with guessProgressWeight=1

| Preset | Variant | Win % | Δ win vs variant 0 (paired) | Expected win % | Δ expected (paired) | Forced games | Games played differently | Guesses/game | ms/game | Slowest step ms | Errors |
|---|---|---|---|---|---|---|---|---|---|---|---|
| expert 30x16/99 | 0 | 54.51 ± 0.50 |  | 53.86 ± 0.42 |  | 29.8% |  | 2.45 | 24.8 | 451 | 0 |
|  | 1 | 54.42 ± 0.50 | -0.09 ± 0.14 (-0.7σ) | 53.82 ± 0.42 | -0.04 ± 0.12 (-0.4σ) | 29.7% | 1278 | 2.37 | 24.8 | 495 | 0 |
|  | 2 | 54.18 ± 0.50 | -0.33 ± 0.16 (-2.0σ) | 53.58 ± 0.42 | -0.28 ± 0.15 (-1.8σ) | 29.6% | 1719 | 2.34 | 24.9 | 386 | 0 |
|  | 3 | 54.07 ± 0.50 | -0.44 ± 0.19 (-2.3σ) | 53.50 ± 0.42 | -0.36 ± 0.18 (-2.0σ) | 29.4% | 2180 | 2.31 | 23.8 | 423 | 0 |
|  | 4 | 53.92 ± 0.50 | -0.59 ± 0.22 (-2.7σ) | 53.36 ± 0.42 | -0.50 ± 0.20 (-2.5σ) | 29.4% | 2552 | 2.29 | 23.6 | 865 | 0 |
|  | 5 | 53.98 ± 0.50 | -0.53 ± 0.23 (-2.3σ) | 53.42 ± 0.42 | -0.44 ± 0.21 (-2.1σ) | 29.3% | 2677 | 2.27 | 23.9 | 621 | 0 |

Robustness gate (current version: no errors, no step over SLOW_STEP_TIME = 2000 ms): PASS

Fewer guesses per game (2.45 -> 2.27) but lower win rates at every weight (up to -0.50 ± 0.20 expected): rewarding progress trades survival for cells that unlock certain moves. Code removed; the patch was never committed, only this description remains.

## 19. Review of 2026-09-29: measurements of the six independent reviews

Findings and the resulting plan are in ROADMAP.md (IDs L, W, B, S, C). Measurements taken by the reviews (scripts in the
session's scratch space, not in the repository):

- **Website use** (website's game code in headless Chromium, script pasted as in the console): 1000 expert games won
  55.3% (553/1000). Auto sweeper: about 2.8 games per second, about 80% of the time spent waiting for browser timers;
  solving plus clicking would allow about 19 per second. 99x99/1960: about 7.5 s per game, board reading about 5.6 ms
  per step.
- **Inconsistent positions**: with one wrong flag placed next to a digit after step 5, 180 of 300 expert games died on
  non-guess steps and 2 crashed in `onIsolatedUnknowns`.
- **JSMinesweeper (David Hill) on the same boards** (seeds 300001-310000, start (3,3)): 54.42% vs 53.56% counted,
  paired **+0.86 ± 0.32**; on 6000 of its own boards 54.67 ± 0.64. 42% of games differ at the first guess, which
  accounts for about +66 of the +86 wins, mostly among cells with equal bomb probability and equal evaluation (58% of
  first guesses have exact ties among the evaluated candidates). Endgames: +11 ± 18 (noise).
- **Tie-breaking** (score all cells tied at the lowest bomb probability, up to 12; break exact ties by the expected
  number of certain safe cells after the guess): +0.23 ± 0.10 (seeds 300001-310000), +0.24 ± 0.10 (400001-410000)
  expected win; parts alone: tie-break +0.08 ± 0.07, all tied cells +0.08 ± 0.05. Not yet adopted (ROADMAP W1).
- Blending best and second-best next-move safety 4:1 (Hill's default): +0.06 ± 0.10 (10000 games). Not adopted.
- Exact endgame search up to 45 unknown cells (wider masks): +0.05 ± 0.04 expected (3000 games, 8 games differ),
  +21% time. Not adopted.
- Re-checks of adopted features on unused seeds: endgame limit 28 vs 20: +0.17 ± 0.09 (500001-504000); expert first
  click offset 3 vs 4: +1.56 ± 0.45 (600001-604000); look-ahead on vs off with the endgame search on: +0.88 ± 0.43
  (700001-703000).
- **Expected win metric**: brute-force cross-check of `getForcedWinChance` on 800 games (positions with up to 18
  unknown cells): 505 positions, 256 forced, 0 mismatches.
- **Speed prototypes** (decision-preserving, strict check of every step's interactions): together 0.695x solver time
  on expert (seeds 2001-3000) and 0.627x on 99x99/1960; `bench/run.js all --scale 0.2`: 0 games played differently.
- **Timing variance**: the same 400 games at 1, 3 and 4 threads: 19.9, 32.4 and 55-58 ms/game, slowest step 94, 170 and
  627-735 ms; within one ablation run identical games measured 54.8 vs 24.8 ms/game depending on when they ran.

### Seed ledger

Expert seed blocks used so far (use the next unused block for confirmations; decide in one look):

| Seeds | Used for |
|---|---|
| 1-10000 | tuning, all entries |
| 100001-110000 | held-out checks (entries 12, 14, 17 sizes) |
| 200001-220000, 300001-340000 | first click offset decision (entry 17); 300001-340000 also the fresh-seed headline 53.74% |
| 300001-310000, 400001-410000 | review: JSMinesweeper comparison, tie-breaking |
| 500001-504000, 600001-604000, 700001-703000 | review: re-checks of adopted features |
| **800001 and up** | unused |


## 20. Live-use fixes L1, L2, L3, L5, L6 (ROADMAP)

**Which findings could come from the test page alone.** The live tests run the website's own game code (the
`Minesweeper` class, which builds the board, the mine counter and the face) in headless Chromium and paste the script
the way Chrome's console does. The page around it is a reconstruction: the options form and how the next game reads
it are guesses, since the website's page code is not reachable from the test environment. Re-run on a page without
the reconstructed options behavior (fixed options):

| Finding | Shown by | Depends on the reconstructed page? | Result on the page without it |
|---|---|---|---|
| L1 [s] throws after a loss not caused by the auto sweeper | code (`autoSweep`), live test | no: face class and board come from the website's code | reproduced: "Died while not guessing!" on every [s], also after [d] mid-game and a manual loss |
| L2 [w] does nothing on a new board | code (`sweepStep` cache), live test | no: the website's `newGame` resets every square to "square blank" | reproduced: [w] did nothing on the new board |
| L3 inconsistent positions | headless benchmark sandbox, live test | no: flags are the website's classes | reproduced headless: 180 of 300 games with one wrong flag died on non-guess moves, 2 crashed |
| L4 bomb count from the options form | live test only | **yes** | not decided; waits for a check on the website |
| L5 duplicate loops | live test (Chrome console semantics) | no | reproduced: a loop of an earlier paste kept running after [d] |
| L6 keys in fields and with Ctrl/Alt/Meta | live test | fields: the website has input fields in its options (the script reads the custom mine count from one); modifier keys are the browser's | modifier part independent of the page |

**Fixes** (all in `sweeper.js`):
- L1: starting the auto sweeper resets its last result and starts a new game if the current one is already over; a
  loss on a non-guess move of the auto sweeper stops it with a warning (instead of throwing forever).
- L2: the board-state check only applies to held keys (key repeat): a held [w]/[e] keeps playing while the steps change
  the board, every separate press always acts.
- L3: a new state `invalid` with a warning and no move for more flags than bombs, more bombs left than unknown cells, a
  digit with more flagged neighbors than its number, a grouping without any valid bomb combination, and no combination
  that fits the bombs left. The auto sweeper stops on it.
- L5: each start of the auto sweeper gets a run id and only the newest continues (repeated [s], held [s], pasting
  again); pasting again replaces the key handler and keeps the stats.
- L6: keys are ignored while typing in input fields and with Ctrl, Alt or Meta; [s], [d], [i], [o], [k], [l] ignore
  key repeat.

**Checks**:
- `bench/run.js all --scale 0.2 --compare HEAD`: 0 games played differently in every suite, 0 errors (consistent
  positions never reach the new checks).
- Headless, one wrong flag next to a digit after step 5 (300 expert games): 32 detected as invalid, 0 crashes, 152
  still die on a non-guess move (wrong flags that fit the digits are trusted; the auto sweeper stops with a warning; ROADMAP L3b, not planned), 57 won.
- Live tests (Chromium, the website's game code): all reproductions above now behave as intended; held [shift+E]
  prints once, held [w] keeps playing, held [s] runs one loop that [d] stops, Ctrl+S/Ctrl+W/Ctrl+E/Alt+W/Meta+W and
  typing "sweep" in a field do nothing, [s] on an invalid board warns once and does not start.

## 21. Bug fixes: benchmark, verifiers, stats, riddle mode, question marks, config (ROADMAP)

Owner direction: aspects other than win rate first, bugs first. No change to the solver's decisions.

**Benchmark (`bench/run.js`)**:
- B1: one message per game and a timeout per game (MAX_GAME_TIME, 60 s) instead of per task; a hung game counts as an
  error with no forced win chance (no NaN), the finished games of its task are kept and the rest go back to the queue.
  Tested with a copy of the script rigged to hang on one seed: 1 error, the other 39 of 40 games counted, expected win a
  number.
- B3: a value set by `--set` or an ablation applies to all boards (it also replaces that key's board-specific values);
  keys with board-specific values run all their values. `--ablate-key firstClickCornerOffset` on expert now plays
  differently for null, 1 and 2 and identically for 3 (the expert value), before it changed nothing.
- B4 (part): ablation differences are against the current version, also with `--compare`; the variant list names each
  base.
- B5 (gate part): games of the current version with a step over SLOW_STEP_TIME are replayed alone after the run (up to
  MAX_REPLAYED_SLOW_GAMES = 20) and the gate uses the replayed time. Tested with the rigged copy: a step slow only in
  the run (2200 ms) replayed in 5 ms, a step slow in both still failed the gate.
- B7: expected win "n/a" on boards with more bombs than cells outside the first click's 3x3 area
  (FIRST_CLICK_AREA_CELLS), where the website's placement is not uniform.
- B9, B11: arguments are checked (numbers, seeds of at least 1, `--set key=json`, missing values, unknown features) with
  a one-line error.

**Verifiers**: `verify-forced` also checks the benchmark's forced check (`getForcedWinChance`, now exported by
`bench/sandbox.js`) against the brute force and fails if the solver is below optimal anywhere; comments updated (C9).
600 games: 187 forced and 98 other positions, 0 disagreements, solver optimal in all. `verify-analysis` names its print
limit (MAX_PRINTED_MISMATCHES).

**Script (`sweeper.js`)**:
- L8: [i] says when there are no finished games yet, shows the win rate with ± one standard error, labels the solver
  time as such and adds the game time (wall clock); "Highest [3] time" includes the guess steps; the wrong, unused
  `median` is removed.
- L10: riddle finder mode no longer prints the answer when it stops.
- L12: flagging a cell marked "?" (website option "marks") uses the two right clicks the website needs.
- C3: `endgameSearchBudget: null` means no limit (it switched the search off); `guessLookaheadCandidates` 0 or 1 both
  guess the safest cell (documented); when the look-ahead budget is exceeded before any cell is evaluated, the
  *Evaluation:* line says so.

**Checks**: `bench/run.js all --scale 0.2 --compare HEAD`: 0 games played differently in every suite, same win and
expected win, gate passes; `verify-forced` PASS; live tests (Chromium, the website's game code) for [i], riddle mode and
question marks as described. Documentation: README options, sample output (real output), all `autoSweepConfig` keys;
RESULTS entries 15, 16, 18 notes corrected (C7).
