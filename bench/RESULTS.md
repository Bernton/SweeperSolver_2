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

