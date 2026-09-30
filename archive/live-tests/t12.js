const { chromium, open } = require("./lib");
(async () => {
    const browser = await chromium.launch();
    const { page, logs, paste } = await open(browser, `seed=3&rows=16&cols=30&mines=99`);
    await paste();
    await page.keyboard.press("s"); await page.waitForTimeout(1500);
    const g0 = await page.evaluate(() => autoSweepConfig.state.gameIndex);
    await page.evaluate(() => { document.getElementById("custom").checked = true; ch.value = 9; cw.value = 9; cm.value = 10; });
    await page.waitForTimeout(1500);
    const g1 = await page.evaluate(() => autoSweepConfig.state.gameIndex);
    await page.evaluate(() => { ch.value = 99; cw.value = 99; cm.value = 1500; });
    await page.waitForTimeout(8000);
    const g2 = await page.evaluate(() => autoSweepConfig.state.gameIndex);
    const n = await page.evaluate(() => document.querySelectorAll(".square").length);
    await page.keyboard.press("d"); await page.waitForTimeout(300);
    logs.length = 0; await page.keyboard.press("i"); await page.waitForTimeout(100);
    console.log(JSON.stringify({ g0, g1, g2, squares: n, errors: logs.filter(l => /ERROR/.test(l)), stats: logs }));
    await browser.close();
})();
