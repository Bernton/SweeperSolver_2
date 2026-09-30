const { chromium, open } = require("./lib");
(async () => {
    const browser = await chromium.launch();
    const { page, logs, paste } = await open(browser, `seed=3&rows=16&cols=30&mines=99`);
    await paste();
    await page.evaluate(() => { autoSweepConfig.isRiddleFinderMode = true; });
    let stops = 0; let firstLogs = null;
    for (let i = 0; i < 40; i++) {
        logs.length = 0;
        await page.keyboard.press("s");
        for (let k = 0; k < 100; k++) { await page.waitForTimeout(20); if (!(await page.evaluate(() => autoSweepConfig.isAutoSweepEnabled))) break; }
        stops++;
        if (!firstLogs) firstLogs = logs.slice(0, 12);
    }
    const games = await page.evaluate(() => autoSweepConfig.state.gameIndex);
    console.log(JSON.stringify({ stops, gamesStarted: games, firstStopOutput: firstLogs }, null, 1));
    // [l] + riddle: what does the log show at a stop
    await page.keyboard.press("l"); logs.length = 0;
    await page.keyboard.press("s");
    for (let k = 0; k < 100; k++) { await page.waitForTimeout(20); if (!(await page.evaluate(() => autoSweepConfig.isAutoSweepEnabled))) break; }
    console.log("with [l]:\n" + logs.slice(-10).join("\n"));
    await browser.close();
})();
