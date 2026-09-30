// node live.js <sweeper.js> <rows> <cols> <mines> <games>
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const fs = require("fs");
const path = require("path");
const [file, rows, cols, mines, games] = process.argv.slice(2);

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const logs = [];
    page.on("console", (m) => logs.push(m.text()));
    page.on("pageerror", (e) => logs.push("PAGE ERROR: " + e.message));
    await page.goto("file://" + path.join(__dirname, "page.html") + `?seed=7&rows=${rows}&cols=${cols}&mines=${mines}`);
    await page.addScriptTag({ content: fs.readFileSync(file, "utf8") }); // same as pasting into the console

    // 1. Timed synchronous play through the solver's live-mode functions (reads and clicks the real DOM)
    const result = await page.evaluate((n) => {
        let config = autoSweepConfig;
        let outcomes = [];
        let solveTime = 0, clickTime = 0, steps = 0;

        while (outcomes.length < n) {
            let t0 = performance.now();
            let r = sweepPage(true, false, config, autoSweepStats);
            let t1 = performance.now();
            solveTime += t1 - t0;

            if (isNewGameState(r.state)) {
                outcomes.push(r.state === "solved" ? 1 : 0);
                startNewGameForAutoSweep(config);
                continue;
            }

            executeInteractions(r.interactions, true, false);
            clickTime += performance.now() - t1;
            steps++;
        }

        return { outcomes: outcomes.join(""), wins: outcomes.filter((o) => o).length, solveMsPerGame: solveTime / n, clickMsPerGame: clickTime / n, steps: steps };
    }, Number(games));

    // 2. The real keyboard flow: [s] start auto sweeper, [d] stop, [i] log stats
    logs.length = 0;
    await page.keyboard.press("k");
    await page.keyboard.press("s");
    await page.waitForTimeout(3000);
    await page.keyboard.press("d");
    await page.waitForTimeout(200);
    await page.keyboard.press("i");
    await page.waitForTimeout(200);

    console.log(JSON.stringify({ file: path.basename(file), board: `${cols}x${rows}/${mines}`, games: Number(games), wins: result.wins, steps: result.steps, solveMsPerGame: +result.solveMsPerGame.toFixed(1), clickMsPerGame: +result.clickMsPerGame.toFixed(1), outcomes: result.outcomes.slice(0, 60) }));
    console.log("keyboard flow console output:\n  " + logs.join("\n  "));
    await browser.close();
})();
