const { chromium, open } = require("./lib");
(async () => {
    const browser = await chromium.launch();
    const { page, logs, paste, boardState } = await open(browser, `seed=3&rows=16&cols=30&mines=99`);
    await paste();
    await page.keyboard.press("s"); await page.waitForTimeout(1500);
    await page.evaluate(() => { document.getElementById("custom").checked = true; ch.value = 9; cw.value = 9; cm.value = 10; });
    await page.waitForTimeout(1000);
    const b1 = await boardState(); await page.waitForTimeout(1000); const b2 = await boardState();
    const st = await page.evaluate(() => ({ en: autoSweepConfig.isAutoSweepEnabled, last: { s: autoSweepConfig.state.lastSweepResult.state, solver: autoSweepConfig.state.lastSweepResult.solver, n: autoSweepConfig.state.lastSweepResult.interactions.length }, face: document.getElementById("face").className, hidden: document.querySelectorAll(".square.blank:not([style])").length, flags: document.querySelectorAll(".square.bombflagged").length }));
    await page.keyboard.press("d"); await page.waitForTimeout(100);
    logs.length = 0; await page.keyboard.press("Shift+E"); await page.waitForTimeout(200);
    console.log(JSON.stringify({ boardChanging: b1 !== b2, st, E: logs.slice(0, 8) }, null, 1));
    await browser.close();
})();
