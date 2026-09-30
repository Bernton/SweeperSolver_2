const { chromium, open } = require("./lib");
(async () => {
    const browser = await chromium.launch();
    const { page, logs, paste } = await open(browser, `seed=3&rows=99&cols=99&mines=1960`);
    await paste();
    logs.length = 0; await page.keyboard.press("i"); await page.waitForTimeout(100);
    const iEmpty = logs.length;
    await page.evaluate(() => { for (let i = 0; i < 500; i++) { let r = sweepPage(true, false); if (isGuessingSolver(r.solver) && i > 20) return; executeInteractions(r.interactions, true, false); } });
    logs.length = 0;
    let t = Date.now();
    await page.keyboard.press("Shift+E"); await page.waitForTimeout(500);
    console.log(JSON.stringify({ iOutputLinesWithNoGames: iEmpty, shiftELines: logs.length, head: logs.slice(0, 6) }, null, 1));
    await browser.close();
})();
