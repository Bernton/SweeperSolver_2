# Archive: prototypes, experiment scripts and raw outputs (not for merging)

This branch (`archive/prototypes`) keeps work that exists only as prototypes or one-off scripts, so it is not lost
when a development session ends. It is based on master at the merge of pull request #3 and is **never merged**: master
keeps only adopted code and the documentation (ROADMAP.md, bench/RESULTS.md), per the owner's rule to remove baggage
from the code and document instead.

Notes for reuse:
- Scripts were written for one session: they contain absolute paths (e.g. `/home/user/SweeperSolver_2/...`) and
  expect the files of that time; adjust paths before running.
- Full copies of a modified `sweeper.js` are stored as diffs against their base, `sweeper.js` at commit 3b63610
  (`git show 3b63610:sweeper.js`), labelled `base-3b63610/sweeper.js`. The live-use and bug fixes of entries 20-22
  came later, so patches need re-applying on the current script.
- Third-party code is **not** included: the website's game code (the `Minesweeper` class of minesweeperonline.com),
  jQuery 1.8.3, and JSMinesweeper. Where to get them is noted below.

## speedups/ (ROADMAP S1-S4, B12; bench/RESULTS.md entry 19)

Decision-preserving speed-ups from the performance review, together about 0.70x solver time on expert and 0.63x on
99x99/1960, with 0 games played differently on all presets.
- `speedups.diff`: all four combined (S1 endgame memo by revealed cells and their numbers, S2 scan only active digits
  and unknown cells, S3 incremental neighbor counts, S4 skip clusters of size 1 in the occurrence product).
- `endgame-only.diff` (S1), `scan-only.diff` (S2), `proto-*.diff`: the steps and variants on the way.
- `check.js`: the strict identity check (B12): plays games with two `sweeper.js` versions and compares every step's
  interactions; reports CPU time per version. Usage: `node check.js <a.js> <b.js> <width> <height> <bombs> <games> [firstSeed]`.
- `apply_incr.py`, `apply_scan.py`: scripts that applied S3 and S2 to the source.
- `egbench.js`, `eg_new*.js`, `eg_small.jsonl`, `eg_expert.jsonl`: endgame search benchmark and captured endgame
  positions (inputs for it); `capture.js` captured them.
- Profiling and measurement helpers: `instr.js`, `steps.js`, `agg.js`, `lines*.js`, `maxcomb.js` (largest combination
  searches, ROADMAP S6), `play.js`, `sub.js`, `subself.js`, `forced.js`, `sandbox1.js`, `sandbox2.js`.

## tie-break/ (ROADMAP W1; entry 19)

- `tie-break.patch`: score all cells tied at the lowest bomb probability (up to `guessLookaheadAllTied`) and break
  exact ties of the evaluation by the expected number of certain safe cells after the guess
  (`guessClearsTieBreak`): +0.23 ± 0.10 and +0.24 ± 0.10 expected win on seeds 300001-310000 and 400001-410000. Also
  contains the progress tie weight tried on the way (`guessProgressTieWeight`, 0 = off). Applies to the base
  (commit 3b63610), like `speedups.diff`.
- `blend.diff`: blending best and second-best next-move safety 4:1 as in Hill's solvers (+0.06 ± 0.10, not adopted).
- `tie.diff`, `exp2.diff` with `tie*.log`: tie-break experiments; `instr*.diff` with `instr*-N.log`: instrumentation
  of the first guess (how often candidates tie); `first*.js`, `diverge.js`, `drive*.js`, `glist.log`: analysis of where
  this solver and JSMinesweeper choose differently.

## jsminesweeper-harness/ (ROADMAP W2; entry 19)

Headless bulk runner for David N. Hill's JSMinesweeper on the same boards as this benchmark (website rules: safe 3x3
first click at (3,3) on expert), and the paired comparison.
- Needs JSMinesweeper (MIT license, https://github.com/DavidNHill/JSMinesweeper, used at commit 256cd7d) checked out
  next to this folder, as `run.js` expects (`../JSMinesweeper/Minesweeper/client/...`).
- `run.js`: `node run.js <firstGame> <games> <threads> <variant>` (variants: base, noLTR, noEarly5050, noAdv).
- `paired.js`, `cmp.js`: paired comparison of two result files (per-game wins).
- `res-base-boards-1-10000.json`: JSMinesweeper's per-game results on this benchmark's boards 1-10000 (54.42%), so the
  paired comparison needs no rerun; `res-*-1-6000.json`: its own boards; `*.log`: summaries.

## live-tests/ (entries 19-22)

Browser tests of the pasted script in headless Chromium (Playwright), running the website's own game code.
- Needs, next to the scripts: `site.js` (the `Minesweeper` class of minesweeperonline.com, from the website) and
  `jquery.js` (jQuery 1.8.3, e.g. `npm pack jquery@1.8.3`), plus `sweeper.js` (copy of the version to test).
- `page.html` (fixed options) and `page2.html` (with a reconstructed options form; not the website's page code) wrap
  the game; `lib.js` opens a page and pastes the script as Chrome's console does (`replMode`).
- `t1.js` [s]/[w]/paste sequences (L1, L2, L5), `t2.js` [s] after a game ended otherwise, keys in fields and with
  Ctrl, repeated [s], repeated [e] (L1, L2, L5, L6), `t3.js` question marks, wrong flags, options changed without a new
  game (L12, L3, L4), `t4.js`, `t5.js` impossible flags (L3), `t6.js`-`t8.js`, `t11.js` timing and pacing (L7, L9), `t9.js`, `t10.js` riddle mode (L10),
  `t12.js`, `t13.js` options form (L4, test page only), `t14.js` modifier keys, typing, held keys, invalid board
  (L6), `t15.js` key repeat, `t16.js` stop on a certain-move loss, `t17.js` stats, riddle mode, question marks, `t18.js`
  console output sample, `rp_live1.js` stats after a second paste, `rp_live2.js` keys with a focused checkbox;
  `live.js`, `ux.js`, `autolog.js`: earlier live checks of play and console output.

## review-scripts/ (entries 19-22)

- `solver/`: configuration and solver-stage counts, Monte Carlo check, slow positions, the wrong-flag experiments
  (`wrongflag.js` original, `wrongflag_cur.js` with invalid-board detection).
- `bench/`: brute-force cross-check of the forced check (`forcedcheck.js`), endgame limit and offset re-check outputs.
- `pr/`: scripts and outputs of the pull request review (pause timing, second paste, wrong flags on any cell,
  comparison outputs, rigged-run output).
- `code/`: helper outputs of the code health review.

## experiments/ (entries 1-18)

- Patches of ideas tried and not adopted: `outsiders.patch` (entry 16, more cells away from the digits as look-ahead
  candidates), `progress.patch` (entry 18, progress in the evaluation); earlier stages: `lookahead.patch` (the
  look-ahead, since adopted), `step3.patch` (first click offset ablation).
- Scripts: `forced.js` and `optimal.js` (entry 13, forced positions: classification and exact optimum), `brute.js`
  (look-ahead analysis vs brute force, now bench/verify-analysis.js), `verify.js` (website placement port, now
  bench/verify-website.js), `losses.js` (where games are lost), `bench.js` (early benchmark), `egtime.js`,
  `stagetime.js`, `stageshare.js`, `sharetime.js` (timing of stages and sharing), `overfull_prior.js`,
  `vf_overfull.js` (overfull boards), `sandbox_limit.js`, `slow.js`, `trace.js`, `dbg.js`, `prof-play.js`,
  `prof-summarize.js` (CPU profiling).
- Raw outputs: `*.md` benchmark tables of the entries (ablations, holdouts, first click offset, look-ahead, endgame
  search), `early_raw.json` and `early_200.txt` (entry 15), `dist.out`, `in2_10k.out`, `play_*.out` (website placement
  check).
