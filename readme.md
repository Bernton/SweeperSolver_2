# Sweeper Solver 2
Designed to work on: [http://minesweeperonline.com/](http://minesweeperonline.com/)

For use beyond keybinds minimal technical skill in javascript is needed.

Finds all certain results and if a guess has to be made, it calculates the probability of candidates being bombs and picks the guess most likely to survive both itself and the next move; in endgames it searches all bomb configurations exactly for the guess with the best chance to win. Reaches a win rating of about 53.5% on expert with an average of roughly 2.5 guesses per game (10,000 seeded games in the headless benchmark, see below). Works on all board sizes the website offers (up to 99x99).

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
 Starts the auto sweeper, that will execute steps automatically until stopped.
 
 
 stop auto sweeper **[d]**:\
 Stops the auto sweeper.

format log game stats **[i]**:\
Outputs the stats for the auto sweeper to the console.

format log game stats with raw **[o]**:\
Outputs the stats for the auto sweeper to the console with raw data included.

reset game stats **[k]**:\
Resets the game stats for the auto sweeper.

toggle log **[l]**:\
Toggles if the auto sweeper should output its steps to the console.

The functionality that is offered with keybinds and more can also be called directly in the console as functions.

## Reading the output:
Cells are named *(row_column)*, like the ids of the squares on the website, and each line ends with the square's element (hover it in the console to highlight it on the board).
When no certain move is left, **[e]** / **[shift+e]** show:

```
-> [3s] No certain cell found
-> [3s] Suggested guess: (12_6) bomb probability 6.02%, survive it and next move 90.47%, evaluation 90.47% <div id="12_6">
-> [3s] Evaluation: chance to survive the guess and the next move, for the 3 cells with the lowest bomb probability (higher is better)
-> [3s] Candidates by bomb probability:
-> [3s] #1 (12_5) bomb probability 5.81%, survive it and next move 89.15%, evaluation 89.15% <div id="12_5">
-> [3s] #2 (12_6) bomb probability 6.02%, survive it and next move 90.47%, evaluation 90.47%  <- suggested <div id="12_6">
-> [3s] #3 (1_17) bomb probability 10.75%, survive it and next move 89.25%, evaluation 89.25% <div id="1_17">
-> [3s] #3 (4_17) bomb probability 10.75% <div id="4_17">
-> [3s] ...
```

- **bomb probability**: exact chance that the cell is a bomb, given everything on the board
- **survive it and next move**: exact chance to survive this guess and the safest move after it (averaged over the numbers the cell can show); computed for the cells with the lowest bomb probability
- **win chance with best play**: exact chance to win the game when guessing this cell and playing optimally afterwards; computed in endgames (see *endgameSearchMaxUnknowns*)
- **evaluation**: the score the solver ranks guesses by (higher is better); its definition is printed in the *Evaluation:* line and changes as the solver's guess logic is improved

The suggestion can be a cell with a slightly higher bomb probability when it is more likely to lead to a safe next move. In an endgame where no unknown cell can give information anymore, a line *Forced: ...* says that the outcome is pure chance. *Cluster* marks cells that share all their neighboring digits (same bomb probability), *Outsider* a cell not next to any digit (the one most likely to open an area). **[w]** / **[shift+w]** print the guess they make in the same format.

## Settings / Configuration:
All settings for the auto sweeper can be found within the global object *autoSweepConfig*.

**doLog**: Determines if the auto sweeper should output its steps to the console\
**isRiddleFinderMode**: If enabled, the sweeper will stop on difficult problems for you to solve\
**baseIdleTime**: Specifies the time the solver waits for each step in milliseconds\
**gameFinishedIdleTime**:	Specifies the time the solver waits after it has finished a game in milliseconds

The solver itself is configured in the global object *solverConfig*:

**firstClickCornerOffset**: First click this many cells in from the top left corner (default 2, i.e. the third cell; *null* for the center)\
**guessLookaheadCandidates**: How many of the safest cells are compared by their chance to survive the next move too (default 3; 0 to always guess the safest cell)\
**guessLookaheadBudget**: Limit for this comparison in bomb combinations per guess, keeps large boards fast (default 20000; *null* for no limit)\
**endgameSearchMaxUnknowns**: Exact search for the guess with the best chance to win when at most this many unknown cells are left (default 28, at most 30; 0 to switch it off)\
**endgameSearchBudget**: Limit for this search in bomb configurations plus search states per guess; above it the look-ahead decides (default 20000)

## Headless benchmark (development):
*bench/* plays seeded games headless in Node.js (no dependencies, no browser). It loads *sweeper.js* unchanged, so the script stays copy/pastable into the browser console. The virtual game places bombs exactly like minesweeperonline.com.

`node bench/run.js [expert|sizes|stress|all] [--scale 0.1] [--compare HEAD] [--set key=value] [--ablate]`

- **expert**: primary tuning target, **sizes**: other standard and custom sizes (up to 99x99), **stress**: robustness on extreme sizes and densities
- `--compare <git revision or file>` runs an older *sweeper.js* on the same boards; win differences are paired, which removes most of the noise
- `--set` overrides a *solverConfig* value, `--ablate` re-evaluates every feature listed in *bench/features.js* against the full configuration
- The robustness gate fails on any error, NaN or a single step slower than SLOW_STEP_TIME (2 s, in *bench/run.js*)
- *Expected win %* counts a game that reaches a forced position (no unknown cell can give information anymore, so every play has the same chance) with that position's exact win chance instead of its coin flips: same expected value, less noise. *Forced games* is the share of games that reach one

`node bench/verify-website.js` checks that the virtual game generates the same boards as the website code.

`node bench/verify-analysis.js` checks the look-ahead's analysis of hypothetical boards against brute-force enumeration.

`node bench/verify-forced.js` checks that forced positions cannot be played better than the solver does (exact optimal play over all bomb configurations) and reports how far the solver is from optimal in other small endgames.

Evaluation results are logged in *bench/RESULTS.md*; state, findings and next steps are in *ROADMAP.md*.
