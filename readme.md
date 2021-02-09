# Sweeper Solver 2
Designed to work on: [http://minesweeperonline.com/](http://minesweeperonline.com/)

Use beyond keybinds require minimal technical skills in javascript.

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
Executes a single step for solving the game, stops when there is no certain interaction and outputs step details in that case.

sweep step guessing without board interaction **[shift+e]**:\
Determines a single step and outputs the certain interactions to the console.
 
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

## Settings / Configuration:
All settings for the auto sweeper can be found within the global object *autoSweepConfig*.

**doLog**: Determines if the auto sweeper should output its steps to the console\
**isRiddleFinderMode**: If enabled, the sweeper will stop on difficult problems for you to solve\
**baseIdleTime**: Specifies the time the solver waits for each step in milliseconds\
**gameFinishedIdleTime**:	Specifies the time the solver waits after it has finished a game in milliseconds
