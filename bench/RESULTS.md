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

