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

