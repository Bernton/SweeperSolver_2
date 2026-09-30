const { chromium, open } = require("./lib");
(async () => {
    const browser = await chromium.launch();
    {
        const { page, logs, paste } = await open(browser, "seed=3&rows=16&cols=30&mines=99", "page.html");
        await paste();
        logs.length = 0; await page.keyboard.press("i"); await page.waitForTimeout(100);
        console.log("### [i] before any game:", logs);
        await page.keyboard.press("s"); await page.waitForTimeout(3000); await page.keyboard.press("d"); await page.waitForTimeout(200);
        logs.length = 0; await page.keyboard.press("i"); await page.waitForTimeout(100);
        console.log("### [i] after games:\n" + logs.join("\n"));
        await page.close();
    }
    {
        const { page, logs, paste } = await open(browser, "seed=3&rows=16&cols=30&mines=99", "page.html");
        await paste();
        await page.evaluate(() => { autoSweepConfig.isRiddleFinderMode = true; });
        logs.length = 0;
        await page.keyboard.press("s");
        for (let k = 0; k < 200; k++) { await page.waitForTimeout(20); if (!(await page.evaluate(() => autoSweepConfig.isAutoSweepEnabled))) break; }
        console.log("### riddle mode:", JSON.stringify({ running: await page.evaluate(() => autoSweepConfig.isAutoSweepEnabled), logs: logs.slice(-3) }));
        await page.close();
    }
    {
        const { page, logs, paste, click } = await open(browser, "seed=7&rows=16&cols=30&mines=99", "page.html");
        await paste();
        await page.evaluate(() => $("#marks").attr("checked", "checked"));
        const ids = await page.evaluate(() => { for (let i = 0; i < 300; i++) { let r = sweepPage(true, false); let f = r.interactions.filter((a) => a.isFlag); if (f.length) return f.map((a) => a.cell.div.id); executeInteractions(r.interactions, true, false); } });
        for (const id of ids) { await click(id, 2); await click(id, 2); } // blank -> flag -> question mark
        const before = await page.evaluate((ids) => ids.map((id) => document.getElementById(id).className), ids);
        await page.keyboard.press("e"); await page.waitForTimeout(100);
        const after = await page.evaluate((ids) => ids.map((id) => document.getElementById(id).className), ids);
        console.log("### question marks, one [e]:", JSON.stringify({ before, after }));
        await page.close();
    }
    await browser.close();
})();
