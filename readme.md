# Sweeper Solver 2
Designed to work on: [http://minesweeperonline.com/](http://minesweeperonline.com/)

For use beyond keybinds minimal technical skill in javascript is needed.

Finds all certain results and if a guess has to be made, it calculates the probability of candidates being bombs and picks the guess most likely to survive both itself and the next move; in endgames it searches all bomb configurations exactly for the guess with the best chance to win. Reaches a win rating of about 53.7% on expert with an average of roughly 2.5 guesses per game (expected win in the headless benchmark: 53.86% on 10,000 tuning seeds, 53.74% on 40,000 fresh seeds, see below). Works on all board sizes the website offers (up to 99x99).

## How to setup:

 1. Navigate to [http://minesweeperonline.com/](http://minesweeperonline.com/)
 2. Open the [developer console](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/What_are_browser_developer_tools) for your browser
 3. Copy all the code within [sweeper.js](https://raw.githubusercontent.com/Bernton/SweeperSolver_2/master/sweeper.js)  into the console and execute it

## How to use / functionality:
*Note: Keybinds are in square brackets.*

sweep step guessing **[w]**:\
Executes a single step for solving the game, guesses move if not certain.

sweep step guessing without board interaction **[shift+w]**:\
Determines a single step and outputs the interactions to the console, suggests a move if not certain.

sweep step certain **[e]**:\
Executes a single step for solving the game, stops when there is no certain interaction and outputs step details in that case (bomb chances of all candidates and a suggested guess).

sweep step certain without board interaction **[shift+e]**:\
Determines a single step and outputs the certain interactions to the console, or the step details if there are none.
 
 start auto sweeper **[s]**:\
 Starts the auto sweeper, that will execute steps automatically until stopped (starts a new game first if the current one is over).
 
 
 stop auto sweeper **[d]**:\
 Stops the auto sweeper.

format log game stats **[i]**:\
Outputs the stats of the games played by the auto sweeper to the console: win rate (± one standard error), guesses, solver time and game time (wall clock, without pauses).

format log game stats with raw **[o]**:\
Outputs the stats for the auto sweeper to the console with raw data included.

reset game stats **[k]**:\
Resets the game stats for the auto sweeper.

toggle log **[l]**:\
Toggles if the auto sweeper should output its steps to the console.

Holding **[w]** or **[e]** keeps stepping while the board changes. Keys are ignored while typing in a text field of the page and together with Ctrl, Alt or Meta, so browser shortcuts stay untouched. Pasting the script again replaces the running version and keeps the game stats (when updating from a version before September 2026, reload the page first: its auto sweeper cannot be stopped by a newer paste).

The functionality that is offered with keybinds and more can also be called directly in the console as functions.

## Reading the output:
Cells are named *(row_column)*, like the ids of the squares on the website, and each line ends with the square's element (hover it in the console to highlight it on the board).
When no certain move is left, **[e]** / **[shift+e]** show:

```
[3s] Check combinatorially - stuck
-> [3s] Candidate amount: 21
-> [3s] No certain cell found
-> [3s] Suggested guess: (3_7) bomb probability 8.41%, survive it and next move 91.59%, evaluation 91.59% <div id="3_7">
-> [3s] Evaluation: chance to survive the guess and the next move, for the 3 cells with the lowest bomb probability (higher is better)
-> [3s] Candidates by bomb probability:
-> [3s] #1 (3_7) bomb probability 8.41%, survive it and next move 91.59%, evaluation 91.59%  <- suggested <div id="3_7">
-> [3s] #1 (6_7) bomb probability 8.41%, survive it and next move 91.59%, evaluation 91.59% <div id="6_7">
-> [3s] #1 (9_7) bomb probability 8.41%, survive it and next move 91.59%, evaluation 91.59% <div id="9_7">
-> [3s] #4 (2_7) bomb probability 10.58% <div id="2_7">
-> [3s] #5 (7_7) bomb probability 18.99% <div id="7_7">
-> [3s] ...
```

- **bomb probability**: exact chance that the cell is a bomb, given everything on the board
- **survive it and next move**: exact chance to survive this guess and the safest move after it (averaged over the numbers the cell can show); computed for the cells with the lowest bomb probability
- **win chance with best play**: exact chance to win the game when guessing this cell and playing optimally afterwards; computed in endgames (see *endgameSearchMaxUnknowns*)
- **evaluation**: the score the solver ranks guesses by (higher is better); its definition is printed in the *Evaluation:* line and changes as the solver's guess logic is improved

If no bomb configuration fits the board (e.g. a flag set by hand is wrong or there are more flags than bombs), a warning *[!] No bomb configuration fits the board* names the reason and no move is made; the auto sweeper stops. It also stops with a warning when it loses on a move it considered certain, which means the board was not what it assumed (usually a wrong flag set by hand).

The suggestion can be a cell with a slightly higher bomb probability when it is more likely to lead to a safe next move. In an endgame where no unknown cell can give information anymore, a line *Forced: ...* says that the outcome is pure chance. *Cluster* marks cells that share all their neighboring digits (same bomb probability), *Outsider* a cell not next to any digit (the one most likely to open an area). **[w]** / **[shift+w]** print the guess they make in the same format.

## Settings / Configuration:
All settings for the auto sweeper can be found within the global object *autoSweepConfig*.

**doLog**: Determines if the auto sweeper should output its steps to the console\
**isRiddleFinderMode**: If enabled, the auto sweeper stops at positions where a certain move exists that only the full check [3] finds, without showing it, for you to solve\
**isRecordingStepStats**: Keeps the result and time of every step in the stats (see **[o]**)\
**baseIdleTime**: Specifies the time the solver waits for each step in milliseconds\
**gameFinishedIdleTime**:	Specifies the time the solver waits after it has finished a game in milliseconds\
**isVirtualMode**, **virtualGameConfig**, **virtualBatchSize**: Play virtual games in the browser instead of the page's game (development; the headless benchmark below is faster)\
**isAutoSweepEnabled**, **state**: Internal state of the auto sweeper

The solver itself is configured in the global object *solverConfig*:

**firstClickCornerOffset**: First click this many cells in from the top left corner (default 2, i.e. the third cell, and 3 on expert, see *boardSettings*; *null* for the center)\
**guessLookaheadCandidates**: How many of the safest cells are compared by their chance to survive the next move too (default 3; 0 or 1 to always guess the safest cell)\
**guessLookaheadBudget**: Limit for this comparison in bomb combinations per guess, keeps large boards fast (default 20000; *null* for no limit)\
**endgameSearchMaxUnknowns**: Exact search for the guess with the best chance to win when at most this many unknown cells are left (default 28, at most ENDGAME_MAX_MASK_BITS = 30; 0 to switch it off)\
**endgameSearchBudget**: Limit for this search in bomb configurations plus search states per guess; above it the look-ahead decides (default 20000; *null* for no limit)\
**boardSettings**: Values that differ for specific boards, keyed by *"width x height / bombs"*, e.g. `"30x16/99": { firstClickCornerOffset: 3 }` for expert

## Headless benchmark (development):
*bench/* plays seeded games headless in Node.js (no dependencies, no browser). It loads *sweeper.js* unchanged, so the script stays copy/pastable into the browser console. The virtual game places bombs exactly like minesweeperonline.com.

`node bench/run.js [expert|sizes|stress|all] [options]`

- **expert**: primary tuning target, **sizes**: other standard and custom sizes (up to 99x99), **stress**: robustness on extreme sizes and densities
- `--scale <factor>` multiplies the games of every preset (e.g. 0.1 for a quick run), `--games <n>` plays exactly n per preset, `--seed <n>` sets the first seed (default 1), `--only <text>` runs only presets whose name contains the text, `--threads <n>` sets the worker threads (default: all cores)
- `--compare <git revision or file>` runs an older *sweeper.js* on the same boards; win differences are paired, which removes most of the noise
- `--set key=json` overrides a *solverConfig* value (e.g. `--set guessLookaheadCandidates=6`, strings in quotes); `--ablate` re-evaluates every other value of every feature listed in *bench/features.js* (all values of a key with board-specific values) against the current version, `--ablate-key <key>` one feature. A value set this way applies to all boards: it also replaces that key's board-specific values in *boardSettings* (an explicitly set *boardSettings* is used as given)
- Differences (Δ) are against the reference for the current version and against the current version for ablations; the variant list at the top names each base
- The robustness gate fails on any error (including a game over MAX_GAME_TIME, 60 s) or a single step slower than SLOW_STEP_TIME (2 s, in *bench/run.js*). Games with a slower step (up to MAX_REPLAYED_SLOW_GAMES = 20) are replayed alone first, so machine load does not fail the gate
- *Expected win %* counts a game that reaches a forced position (no unknown cell can give information anymore, so every play has the same chance) with that position's exact win chance instead of its coin flips: same expected value, less noise. *Forced games* is the share of games that reach one. On boards with more bombs than cells outside the first click's 3x3 area it is *n/a*, as the website's placement is not uniform there; also for versions before the analysis mode (commit ed131a8), e.g. as *--compare* reference

`node bench/verify-website.js` checks that the virtual game generates the same boards as the website code.

`node bench/verify-analysis.js` checks the look-ahead's analysis of hypothetical boards against brute-force enumeration.

`node bench/verify-forced.js` computes optimal play over all bomb configurations in small endgames of real games and fails if the solver plays any of them below optimal, if a forced position could be played better than 1 / number of configurations, or if the benchmark's forced check disagrees with the brute force.

Evaluation results are logged in *bench/RESULTS.md*; state, findings and next steps are in *ROADMAP.md*.
