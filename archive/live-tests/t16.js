const { chromium, open } = require("./lib");
(async () => {
    const browser = await chromium.launch();
    const { page, logs, paste } = await open(browser, "seed=5&rows=16&cols=30&mines=99", "page.html");
    await paste();
    // Auto sweeper running; its last move (a certain one, solver 0) ended in a death
    const r = await page.evaluate(async () => {
        autoSweepConfig.isAutoSweepEnabled = true;
        window.autoSweepRunId = 99;
        autoSweepConfig.state.lastSweepResult = { state: "death", solver: "0", interactions: [] };
        autoSweep(autoSweepConfig, autoSweepStats, 99);
        return { running: autoSweepConfig.isAutoSweepEnabled, gameIndex: autoSweepConfig.state.gameIndex };
    });
    logs.push("--- then [s]");
    await page.keyboard.press("s"); await page.waitForTimeout(400); await page.keyboard.press("d");
    console.log(JSON.stringify(r), "\n" + logs.join("\n").slice(0, 600), "\ngames after [s]:", await page.evaluate(() => autoSweepConfig.state.gameIndex));
    await browser.close();
})();
