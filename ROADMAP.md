# Roadmap

State, review findings and the prioritized plan. Measurements and history are in [bench/RESULTS.md](bench/RESULTS.md).

## Current state

- **Expert (30x16/99, minesweeperonline.com rules): about 53.7% wins** (expected win: 53.86% on tuning seeds 1-10000,
  53.74% on fresh seeds 300001-340000; expected win counts forced coin flips at their exact chance). On the website:
  1000 games through the website's code in a browser won 55.3% (review, bench/RESULTS.md entry 19).
- Reference: David Hill's Java solver reports 54.3% for the same rules (start at (3,3), first click opens an area);
  his JavaScript solver JSMinesweeper won **+0.86 ± 0.32 points more than this solver on the same 10000 boards**
  (entry 19).
- Solver: rule stages [0] trivial and [1] suffocations, then the exact full check [3] with exact bomb probabilities.
  Guesses: of the 3 cells with the lowest bomb probability, the one most likely to survive itself and the next move
  (look-ahead, exact analysis of each value the cell can show); with up to 28 unknown cells left, the exact best guess
  (search over all bomb configurations and strategies). First click on the fourth cell from the top left corner on
  expert, the third on other boards (`solverConfig.boardSettings`).
- Works on all website sizes (up to 99x99, any bomb count); robustness gate passes. Boards that no bomb configuration
  fits (e.g. a wrong flag set by hand) are reported and no move is made (L3); wrong flags that still fit the digits
  are trusted, and the auto sweeper stops with a warning when it loses on a certain move (L3b, not planned).
- `sweeper.js` stays a single copy/pastable script; the console output shows bomb probability, statistics and the
  evaluation for every candidate.
- Benchmark: headless, website-exact boards (verified), paired comparisons, feature ablation, expected win. 10,000 expert
  games take about 1-2.5 minutes on 4 threads, depending on machine load (about 25 ms of solver time per game).

## Where games are lost

Measured before the endgame search and the expert first click (entries 12-13), 5000 expert games:

| | |
|---|---|
| Losses by bomb probability of the fatal guess | 0-10%: 13%, 10-20%: 29%, 20-30%: 10%, 30-40%: 8%, **49-51%: 39%** |
| Losses by guess number | first guess after the opening: 32%, second: 22%, third: 15%, later: 31% |
| Losses by unknown cells left | **8 or fewer: 42%**, 9-16: 8%, 17-60: 14%, more: 35% |

**Forced losses cannot be avoided by any play** (proof and check in bench/RESULTS.md, entry 13): about 35% of all
losses. Avoidable losses by unknown cells left: more than 60: 16.9% of games, 17-60: 6.5%, 16 or fewer: 6.6% (the
endgame part is now played optimally, entry 14). Among the 6 cells with the lowest bomb probability, no better early
choice was detectable at ±0.13 points per position (entry 15); the comparison with JSMinesweeper (entry 19) shows that
most of its advantage arises at the first guess, from choosing among cells with equal scores.

## Review of 2026-09-29

Six independent reviews (solver correctness, website use, benchmark methodology, performance, code health, state of
the art) plus an own review; details and measurements in bench/RESULTS.md entry 19. Findings are listed below with IDs:
**L** live use, **W** win rate, **B** benchmark and methodology, **S** speed, **C** code health and documentation.

## Ranking of all findings

All findings of the six reviews and the own review, collected in two passes (the second pass added L12, L13, B11,
B12, C9, C10, S8, W7-W9; W10 and L14 were added later by the own review). Reviews: **SC** solver correctness, **WU** website use, **BM** benchmark methodology,
**PF** performance, **CH** code health, **SA** state of the art, **OR** own review.

**Priority = impact × confidence ÷ effort**, with impact high 3, medium-high 2.5, medium 2, low-medium 1.5, low 1,
tiny 0.5; confidence high 1, medium 0.8, low 0.5; effort small 1, small-medium 1.5, medium 2, large 3. Impact is judged
against the repository goal: games won on the website (Expert first, all sizes), reliable decisions, trial speed,
usability, and the owner's rules (one copy/pastable script, no magic numbers).

| Rank | ID | Finding | Impact | Conf. | Effort | Priority | Reviews |
|---|---|---|---|---|---|---|---|
| 1 | L1 | **Fixed**: [s] throws forever after a loss the auto sweeper did not cause | high | high | S | 3.0 | WU, CH |
| 1 | L2 | **Fixed**: [w] does nothing on fresh boards after the first game; repeated [e] prints nothing | high | high | S | 3.0 | WU |
| 3 | B1 | **Fixed**: hung game makes expected win NaN; timeout per task, not per game | med-high | high | S | 2.5 | BM, CH |
| 3 | B2 | Seed discipline: seed ledger (started) and a fixed adoption rule | med-high | high | S | 2.5 | BM |
| 3 | B3 | **Fixed**: ablation blind spot: board-specific values hide the general ones | med-high | high | S | 2.5 | BM |
| 3 | S1-S4 | Four decision-preserving speed-ups (0.70x expert, 0.63x 99x99) | med-high | high | S | 2.5 | PF |
| 7 | W1 | Tie-breaking and scoring all tied cells (+0.24 ± 0.07 on fresh seeds) | high | medium | S | 2.4 | SA |
| 8 | L3 | **Fixed**: inconsistent positions (wrong flags, wrong count): deaths on "certain" moves, crash | high | high | S-M | 2.0 | SC, WU |
| 8 | L5 | **Fixed**: duplicate auto-sweep loops after pasting again or repeated [s] | medium | high | S | 2.0 | WU |
| 8 | B12 | Strict identity check (every step's moves) for decision-preserving changes | medium | high | S | 2.0 | PF |
| 8 | C2 | Remaining magic numbers (owner rule) | medium | high | S | 2.0 | CH |
| 12 | L4 | Bomb count from the options form instead of the running game (only seen on the test page: check on the website first) | medium | medium | S | 1.6 | WU, SC |
| 13 | L6 | **Fixed**: keybinds fire in page inputs, with Ctrl/Meta/Alt and on key repeat | low-med | high | S | 1.5 | WU, CH |
| 13 | L8 | **Fixed**: stats: time is solver time only, "Highest [3] time" misses guesses, empty [i], wrong `median` | low-med | high | S | 1.5 | WU, CH |
| 13 | L13 | Console: only 3 of the tied cells evaluated, repeated numbers, noise lines | low-med | high | S | 1.5 | WU |
| 13 | B7 | **Fixed**: `verify-forced` does not check `getForcedWinChance`; expected win "n/a" on overfull boards | low-med | high | S | 1.5 | BM, CH |
| 13 | C1 | Dead code and stray parameters | low-med | high | S | 1.5 | CH |
| 13 | C3 | **Fixed**: config traps (`endgameSearchBudget: null` turns the search off, candidates 1 = 0, missing evaluation) | low-med | high | S | 1.5 | CH, SC |
| 13 | C6 | States and solver codes compared as strings | low-med | high | S | 1.5 | CH |
| 13 | C9 | **Fixed**: outdated verifier comments; `verify-forced` cannot fail on "below optimal" | low-med | high | S | 1.5 | CH |
| 21 | L7 | Auto sweeper pacing: 7x more games per second possible | medium | high | S-M | 1.3 | WU, OR |
| 21 | B4 | Automated periodic full re-evaluation, "on its own" mode | medium | high | S-M | 1.3 | BM |
| 21 | B5 | Load-dependent timing: interleave variants (the gate part is fixed: slow games are replayed alone) | medium | high | S-M | 1.3 | BM, PF, SC |
| 21 | C5 | Benchmark setup and game loop copied in four places | medium | high | S-M | 1.3 | CH |
| 25 | L9 | 99x99 live: cache the square elements | low | high | S | 1.0 | WU |
| 25 | L10 | **Fixed**: riddle finder mode prints the answer (it still stops at every [3] step, as intended) | low | high | S | 1.0 | WU |
| 25 | L12 | **Fixed**: question marks need a second key press | low | high | S | 1.0 | WU |
| 25 | B6 | Sizes suite too small for 1-3 point regressions on large boards | medium | high | M | 1.0 | BM |
| 25 | B8 | One check command, per-game JSON output, sequential testing | medium | high | M | 1.0 | BM, CH |
| 25 | B9 | Exact test when few games differ (`--seed 0` is fixed: rejected) | low | high | S | 1.0 | BM |
| 25 | B11 | **Fixed**: command-line arguments not validated | low | high | S | 1.0 | CH |
| 25 | C7 | **Fixed**: remaining documentation fixes (README options, sample output, settings list, entry 15 note) | low | high | S | 1.0 | CH, BM |
| 25 | C10 | Naming typos, swapped offset names, implicit globals, positional booleans | low | high | S | 1.0 | CH |
| 34 | W10 | Measure the headroom to the optimum (bound for a player who sees the bombs, playouts of every candidate) | medium | medium | M | 0.8 | OR |
| 34 | L14 | Pasting the script a second time in Firefox is untested (Chrome allows redeclaring `let`) | low | medium | S | 0.8 | OR |
| 34 | S5 | Benchmark forced check costs 8-9% of trial time | low-med | medium | S-M | 0.8 | PF |
| 34 | S8 | Minor speed leftovers (settings copy per call, border cells built twice, closures) | low | medium | S | 0.8 | PF |
| 38 | W2 | Paired JSMinesweeper harness to explain the remaining ~0.6 point gap | high | low | M | 0.75 | SA |
| 39 | C4 | Move pure parts of `sweep()` to top-level functions in the same file | medium | high | L | 0.67 | CH |
| 40 | B10 | Website fidelity: keep a snapshot and hash of the website's game code | low-med | medium | M | 0.6 | BM |
| 40 | S6 | Work budget for the main combination search (never hang) | low-med | medium | M | 0.6 | PF, SC |
| 42 | W5 | Overfull boards: check the website's bomb cap first | low | low | S | 0.5 | SC |
| 42 | W6 | Isolated-unknowns path skips endgame search and look-ahead | tiny | high | S | 0.5 | SC |
| 44 | W3 | Exact search triggered by few configurations (wider masks) | low-med | medium | L | 0.4 | SA, SC |
| 44 | W4 | Avoid dead cells as guesses | low | medium | M | 0.4 | SA |
| 46 | W7 | Derive the first click offset from board properties instead of one board key | low-med | low | M | 0.38 | BM |
| 47 | S7 | Update only the affected grouping in hypotheticals (large boards) | low | medium | L | 0.27 | PF |
| 48 | W8 | Early-game ceiling for cells away from the digits (rollouts) | low | low | M | 0.25 | SC |
| 49 | W9 | Exact search of enclosed regions mid-game | tiny | medium | M | 0.2 | SA |
| - | L11 | High scores: automated wins may be submitted as "cancel" | owner decision | | | | WU, OR |
| - | C8 | Legacy browser virtual mode and `Math.seedrandom` in the pasted script | owner decision | | | | CH |

**Execution order** (the ranking, adjusted for dependencies). Done: L1, L2, L3, L5, L6 (entry 20), B1, B3, B7, B11,
C3, C7, C9, L8, L10, L12 and parts of B5 and B9 (entry 21), fixes from the review of the pull request (entry 22).
Open: L4 waits for a check on the website. Next, with the owner's focus on aspects other than win rate: (1) B12, then
S1-S4 (B12 proves they change no move); (2) C2, C1, C6, L13; (3) L7, B4, B5, C5; then the rest by rank. Win-rate work
waits: the B2 adoption rule, then W1. C4 goes with the first change that needs it (S7, W3).

## Findings

### L: Live use on the website

- **L1** **Fixed** (entry 20). (high, verified) After any loss the auto sweeper did not cause (e.g. played with [w] or by hand), [s] throws
  "Died while not guessing!" and keeps throwing until the page is reloaded: `autoSweep` checks the previous result and
  never resets it. Fix: warn instead of throwing in live mode, reset the state when the auto sweeper starts.
- **L2** **Fixed** (entry 20). (high, verified) The board-state cache of `sweepStep` makes [w] do nothing on every fresh board after the first
  game (all fresh boards look alike) and makes a repeated [e]/[shift+E] print nothing. Fix: only suppress key repeats.
- **L3** **Fixed** (entry 20). (high, verified) Inconsistent positions (a wrong user flag, too many flags, a wrong bomb count) lead to deaths
  on "certain" moves (180 of 300 test games with one wrong flag, measured with the virtual game's old cascade, entry
  22), reveal-all behavior and a crash in
  `onIsolatedUnknowns`. Fix: detect "no valid combination", negative bombs left, bombs left without unknown cells; warn
  and make no move.
- **L3b** (**not planned**, owner decision: wrong flags set by hand only need to be reported, without added
  complexity) A wrong flag that still fits the digits cannot be detected while the solver trusts
  flags: with one wrong flag, 157 of 294 expert games still die on a non-guess move and 134 are reported as invalid
  (entry 22; the auto sweeper stops with a warning instead of throwing). Possible fix: treat flags the solver did not set itself as unknown cells (the
  solver re-derives correct flags; one it finds safe is unflagged, then revealed).
- **L4** (medium, **only seen on the test page, not yet confirmed on the website**) The bomb count is read from the
  options form, not from the running game: changing options before a new game gives wrong probabilities and wrong
  certain moves. The test page's options form and its link to the next game are a guess (the website's page code is
  not available here); the manual check or the page source decides (entry 20). Fix if confirmed: bombs = mine counter
  plus flags on the board; the website's counter shows at most 999 (its game code), so above that the form stays the
  source. **Check on the website** (about a minute): paste the script, start an expert game, open the options, select
  beginner (or change the custom mines) and close the options without starting a new game, then run
  `getBombAmount()` in the console: 10 (or the custom value) while the expert board is shown confirms L4. The test
  environment cannot reach minesweeperonline.com (network policy of the cloud environment; allowing the domain in the
  environment's network settings would make the real page testable).
- **L5** **Fixed** (entries 20, 22). (medium, verified) Pasting again or pressing [s] several times (or holding it) starts extra auto-sweep loops
  that [d] cannot stop, and a new paste silently resets the stats. Fixed with run ids (only the newest auto sweeper
  continues), the key handler replaced on a new paste, and the stats and the game index kept.
- **L6** **Fixed** (entries 20, 22: text fields only). (medium-low, verified) Keybinds fire while typing in the page's inputs (e.g. the custom size fields) and with
  Ctrl/Meta/Alt (Ctrl+S starts the auto sweeper). Fix: ignore input targets and modified keys.
- **L7** (medium, verified) Auto sweeper pacing: about 80% of its time is waiting for browser timers; about 2.8 expert
  games per second where about 19 would be possible (7x). Run steps time-boxed per timer tick.
- **L8** **Fixed** (entry 21; no games per second, the average game time gives it). (low-medium, verified) Stats: [i] "time" measures only the solver (10x less than real time), "Highest [3]
  time" leaves out the guess steps, [i] prints nothing before the first finished game, no games per second, no ± on
  the win rate; `median` is wrong and unused.
- **L9** (low, verified) 99x99 live: reading the board costs more than solving (about 5.6 ms per step for
  `getElementById` on every cell). Cache the square elements per board.
- **L10** **Fixed** (entry 21: the answer is no longer printed; stopping at every [3] step is the mode's definition).
  (low, verified) Riddle finder mode stops at every [3] step (1.7 per expert game) and prints the answer at once;
  the README promises "difficult problems for you to solve".
- **L12** **Fixed** (entry 21). (low, verified) Question marks (the website's "marks" option): the website cycles flag, question mark and
  blank, so the first [e] turns a "?" into blank and only the second [e] flags; it works but looks like a no-op.
- **L13** (low-medium, verified) Console output: when more than 3 cells tie at the lowest bomb probability, only the
  first 3 get an evaluation and the *Evaluation:* line reads as if those were all; evaluated lines repeat one number
  twice (statistic and evaluation are equal today); "Candidate amount" and "took ... milliseconds" are noise for
  humans. Partly resolved by W1 (all tied cells evaluated).
- **L14** (low, not tested) Pasting the script a second time: Chrome's console allows redeclaring the script's `let`
  variables (the live tests use its semantics); Firefox's console may refuse the second paste. Test in Firefox; if it
  fails, the global state could move to `window` properties (as done for the key handler and the stats).
- **L11** (owner decision, see below) The script replaces the page's `prompt` with one returning "cancel": fast
  automated wins may be submitted to the public high scores under the name "cancel" (inferred from the website code).

### W: Win rate

- **W1** (high, measured by the review) Tie-breaking as in David Hill's solvers: score every cell tied at the lowest bomb
  probability (not just 3), and break exact ties of the look-ahead evaluation by the expected number of certain safe
  cells after the guess. +0.23 ± 0.10 and +0.24 ± 0.10 expected win on two fresh 10000-game blocks (patch in the
  review's scratch space, about 40 lines).
- **W2** (medium, research) The rest of the gap to JSMinesweeper, about 0.6 ± 0.35 points, is unexplained; a paired
  harness (JSMinesweeper headless on the same boards, finding where guesses differ) is the instrument for it.
- **W3** (low-medium) Exact search triggered by few bomb configurations rather than only by 28 or fewer unknown cells
  (Hill: 400 to 1000 configurations); needs wider bit masks. A search up to 45 unknown cells gained only +0.05 ± 0.04
  (entry 19), so expect +0.05 to +0.15 at most.
- **W4** (low) Avoid "dead" cells (only one possible value, no information) as guesses when a live cell is as good:
  1.3% of games pick a dead cell while a live one is in the top 3; at most +0.1.
- **W5** (low) Overfull boards: the website's placement is not uniform there (entry 14); check first whether the
  website caps the bomb count for custom boards, which may make these boards impossible.
- **W7** (low-medium, low confidence) The expert first click (offset 3) is tied to the board key "30x16/99"; other
  boards with similar size or density get offset 2. Derive the offset from board properties if measurements support a
  rule (needs trials on several sizes).
- **W8** (low) The early-game ceiling for cells away from the digits was never measured (entry 15 covered only the
  candidate list; entry 16 showed the look-ahead overrates them, not their true value).
- **W9** (tiny) Exact search of enclosed regions (fixed bomb count, independent of the rest) mid-game: such a region
  exists at 4% of mid-game guesses, but the solver guessed inside one in 4 of 3000 games.
- **W6** (tiny) The isolated-unknowns path (no digits next to unknown cells) skips the endgame search and look-ahead;
  about 10 guesses in 2000 expert games.
- **W10** (research) Measure the headroom instead of estimating it (see "Theoretical maximum" below): (a) the upper
  bound of a player who sees the bombs except for indistinguishable layouts, on 10000 boards (a separate benchmark
  script, medium effort); (b) at a few hundred sampled guess positions, play out every candidate with the solver and
  compare with its choice (any gain found is real; expensive, affordable after the speed-ups S1-S4).

#### Theoretical maximum and the gap to JSMinesweeper (estimate of 2026-09-29)

- The optimum is well defined: a game is a finite decision problem against chance (all boards equally likely apart
  from the website's safe 3x3 first click area; a position is the set of bomb layouts consistent with what is
  visible; finitely many moves). Its value, including the choice of the first click, is one exact number. It is
  computed by the same search as the endgame search (which plays it exactly with up to 28 unknown cells while within
  its budget), but for a whole expert game there are up to about 10^93-10^104 consistent layouts after the opening
  (at most C(unknown cells, 99)): not computable with any realistic resources. Flags and chording do not change it (they reveal no information).
- Bounds: at least the best measured play, JSMinesweeper's 54.4% on our boards (Hill's Java solver reports 54.3%).
  An upper bound that can be computed: a player who sees the bombs except for layouts no revealable number can tell
  apart (each such spot with k layouts caps that board at 1/k); it ignores the guesses caused by not knowing yet
  (the early game), so it is expected to be many points too high.
- **Estimate: about 55% (most likely 54.7-56%)**, a judgement, not a result: endgames with up to 28 unknown cells are
  played optimally while the search stays within endgameSearchBudget (checked exactly up to 12 unknown cells by
  verify-forced); about 30% of games reach a forced position (about 35% of losses, pure chance from there); the first
  guess among the 6 safest cells showed no headroom beyond ±0.13 per position (entry 15); gains shrink (+3.4 points
  so far; JSMinesweeper's +0.86, most of it at the first guess; W1 tie-breaking +0.24 of it). The rest would come from planning several moves
  ahead in the middle game, which no current solver does exactly.
- Surpassing JSMinesweeper: W1 plus what W2 finds should bring parity within about 0.2-0.3 points; clearly beating it
  needs something neither does yet (more computation per guess is available, as run time weighs less than win rate:
  deeper look-ahead, wider exact search; the wider search measured +0.05 ± 0.04 (entry 19), deeper look-ahead is not
  measured yet: entry 15 covered only the choice among the 6 safest cells). Showing a lead of 0.1-0.2
  points needs on the order of 100000 paired games per comparison (one paired 10000-game run resolves about ±0.3).

### B: Benchmark and methodology

- **B1** **Fixed** (entry 21). (medium-high, verified) The timeout result has no `forcedWinChance`, so a hung game turns expected win and its
  deltas into NaN; the timeout is per task (up to 104 expert games, about 104 minutes), not per game, and overwrites
  finished games.
- **B2** (medium-high) Seed discipline: held-out blocks were reused across decisions and the offset decision added games
  until it was significant. Keep a seed ledger in RESULTS.md and a fixed adoption rule: at least 2σ better in expected
  win on the tuning seeds 1-10000, then at least 2σ on a new, unused seed block, decided in one look.
- **B3** **Fixed** (entry 21). (medium-high, verified) Ablation blind spot: `--ablate-key firstClickCornerOffset` changes nothing on expert,
  because `boardSettings` overrides it; ablations must also override board-specific values.
- **B4** (medium) The periodic full re-evaluation is not automated: the last full ablation predates the endgame search.
  Add it to the check routine on a new seed block, and an "on its own" mode (feature added to the baseline).
- **B5** (medium; the gate part is fixed, entry 21: games with a slow step are replayed alone) Timing is load-dependent (ms/game and the slowest step vary up to about 3x with threads and load), so
  the 2 s gate can fail spuriously and speed comparisons within a run are unreliable. Interleave variants, measure the
  gate single-threaded or by CPU time, report deterministic work counters next to times.
- **B6** (medium) The sizes suite is too small to detect 1-3 point regressions on large boards (99x99: 40 games).
- **B7** **Fixed** (entry 21). (low-medium) `verify-forced` never checks the benchmark's own `getForcedWinChance`; add the cross-check (the
  review's brute force: 505 positions, 0 mismatches) and mark expected win "n/a" on overfull boards. The metric needs
  no solver optimality: in a forced position any play that never reveals a certain bomb wins with exactly 1/N.
- **B8** (medium) One check command (the three verifiers plus a quick gate), per-game JSON output, and sequential
  testing to stop clear comparisons early.
- **B9** (low) `--seed 0` makes game 0 unseeded (fixed, entry 21: seeds below 1 are rejected); the normal approximation is
  weak when few games differ (open).
- **B11** **Fixed** (entries 21, 22). (low, verified) Command-line arguments are not validated (`--games abc` gives NaN games, `--set key` without
  `=` throws a cryptic JSON error).
- **B12** (medium) "Games played differently" compares only won, guesses and steps; decision-preserving changes should
  be checked on every step's moves (the performance review's `check.js` does this).
- Also in B4 (fixed, entry 21): with `--compare`, ablation deltas were shown against the reference, not the current
  version.
- **B10** (low-medium) The website fidelity check relies on a browser harness outside the repository; keep at least a
  snapshot and hash of the website's game code.

### S: Speed (decision-preserving; prototypes in the review's scratch space)

- **S1** Endgame search memo keyed by revealed cells and their shown numbers instead of joining all configurations:
  1.9x faster searches, about 15% on expert.
- **S2** Scan only digits with unknown neighbors and unknown cells (collected during the neighbor count) instead of the
  whole board in the trivial stage, border and outside cell searches: 16-24% on large boards, about 8% on expert.
- **S3** Incremental neighbor counts in the reused board copy: about 10% more.
- **S4** Skip clusters of size 1 in the occurrence count product (bit-identical): up to 22% on dense 99x99.
- Together: about 0.70x solver time on expert, 0.63x on 99x99; 0 games played differently on all presets.
- **S5** The benchmark's forced check costs 8-9% of trial time; let the solver report forcedness where it already knows.
- **S6** Complexity risk: the main combination search has no work budget; a long, weakly constrained border could grow
  exponentially (largest seen: 5880 combinations over 57 candidates, 420 ms). A deterministic work counter with a
  fallback only changes decisions where the solver would otherwise hang.
- **S8** Minor leftovers: `getBoardSettings` copies the settings and about 40 closures are created per `sweep` call
  (adds up over hypotheticals), `forEach` closures in `enumerateEndgameConfigurations`, border cells built twice per
  step, quadratic `includes` in grouping helpers (harmless at observed sizes); about 3-6% together.
- **S7** Correction: "cheaper hypothetical boards" is worth only 3-5% on expert (copying is a small part); "update only
  the affected grouping" matters on large and dense boards.

### C: Code health and documentation

- **C1** Dead code (the unused stats helpers are removed, entry 21): old-IE branch and deprecated `initMouseEvent` in `simulate`, unused
  `borderCellNeighborAmount`, `score`, the "break" protocol of `applyToCells`, stray parameters.
- **C2** Magic numbers left: right mouse button 2, the `conditionValue` heuristic `(clusterSize - 1) / (2 + a)` (divides
  by the reduce accumulator, looks accidental), `31 - Math.clz32(...)`, `virtualGameConfig`, `Number.MAX_VALUE`
  sentinels, repeated percent formatting, the verifier boards (`mismatches <= 5` is named, entry 21); the expert override is duplicated in
  `bench/features.js`.
- **C3** **Fixed** (entry 21). Config traps: `endgameSearchBudget: null` switches the search off (unlike `guessLookaheadBudget: null`),
  `guessLookaheadCandidates: 1` acts like 0, a guess without evaluation when the budget runs out on the first candidate.
- **C4** Structure: `sweep()` is a 1700-line closure with shared mutable state; move pure parts (look-ahead, endgame
  input, output formatting) to top-level functions **in the same file** (the script must stay one copy/pastable file).
- **C5** Benchmark duplication: sandbox setup and the game loop are copied in four places; share them via
  `bench/sandbox.js`.
- **C6** States and solver codes are compared as strings (`"death"`, `solver.includes("g")`).
- **C7** **Fixed** (entry 21). Documentation: stale numbers and backlog numbering (fixed), README bench options incomplete (`--set` needs
  JSON), README sample output lacks two lines, README lists 4 of 10 `autoSweepConfig` keys, RESULTS entry 15 still names the
  removed tool and its note sits in entry 16, "recoverable" wording for patches that were never committed (entries
  16, 18: only the description remains).
- **C9** **Fixed** (entry 21). Verifier comments are outdated (`verify-forced` still describes the endgame search as missing and does not
  fail when the solver is below optimal), and the definition of forced positions lives in three places.
- **C10** Naming: typos (`executeInterationsOnBoard`, `bombAmout`, `occurenceCount`), `applyToNeighbors` swaps its
  offset names, implicit globals (fixed with the live-use fixes: now explicit `window` properties), "flags" used for bombs, three
  positional booleans in `sweep(...)`.
- **C8** Legacy in-browser virtual mode (`isVirtualMode`, `virtualBatchSize`) and `Math.seedrandom` (not on the website)
  in the pasted script; the benchmark needs only the virtual game functions (owner decision).

## Owner decisions

- **Focus (2026-09-29)**: for now the other aspects before win rate (live use, benchmark, code health, documentation);
  bugs first. Win-rate work (W) waits.
- **L3b Wrong flags**: flags set by hand are only reported (warning, no move), no added complexity to detect wrong
  flags that fit the digits.
- **L11 High scores**: should the script keep automated wins out of the website's public high scores (e.g. not
  submitting while the auto sweeper runs)? Currently it answers the name prompt with "cancel".
- **C8 Legacy browser virtual mode**: keep, document, or remove from the pasted script.
- **W2 Comparison harness**: JSMinesweeper is third-party code; keep the harness outside the repository (scratch or a
  separate project) unless its license allows including it.
- **B2 Adoption rule**: confirm or adjust the proposed thresholds.

## Tried and not adopted

Documented in bench/RESULTS.md, no code kept: sharing moves between benchmark variants (11), caching binomial
coefficients (11), batching trivial moves (11), caching groupings across hypotheticals (10), more look-ahead
candidates (10), more cells away from the digits as candidates (16), progress in the evaluation (18), early-game
rollouts (15), exact search up to 45 unknown cells (19), blending best and second-best next safety 4:1 (19), long-term
risk and early unavoidable 50/50s (19, measured about 0 in JSMinesweeper; early 50/50s also conflict with the owner's
preference to fill the board first).

## Rules

- `sweeper.js` is one self-contained script that works when pasted into the browser console on minesweeperonline.com.
- Win rate matters far more than runtime unless runtime grows by an order of magnitude (then ask the owner).
- Every change is shown to help alone and in combination (ablation), confirmed on unused seeds, and re-evaluated
  periodically; decision-preserving changes show 0 games played differently.
- Negative or inconclusive experiments leave no code behind; they are documented in bench/RESULTS.md.
- No magic numbers: every constant is named with a reason, also in documentation and messages.
