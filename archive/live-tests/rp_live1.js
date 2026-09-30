const { chromium, open } = require("./lib");
const T = (name, o) => console.log("### " + name + "\n" + JSON.stringify(o));
(async () => {
    const browser = await chromium.launch();
    for (const [q, ms] of [["seed=11&rows=9&cols=9&mines=10", 8000], ["seed=12&rows=16&cols=16&mines=40", 10000], ["seed=13&rows=16&cols=30&mines=99", 15000]]) {
        const { page, logs, paste } = await open(browser, q, "page.html");
        await paste();
        await page.keyboard.press("s"); await page.waitForTimeout(ms);
        await page.keyboard.press("d"); await page.waitForTimeout(300);
        const r = await page.evaluate(() => ({ gi: autoSweepConfig.state.gameIndex, fin: autoSweepStats.gameStats.filter((g) => g && g.finishState).length, wins: autoSweepStats.gameStats.filter((g) => g && g.finishState === "solved").length }));
        T("long run " + q, { ...r, warnings: logs.filter((l) => /\[!\]|stopped|ERROR|EXCEPTION/.test(l)).slice(0, 5) });
        // re-paste, run again: are the new games recorded?
        await paste();
        const gi0 = await page.evaluate(() => autoSweepConfig.state.gameIndex);
        await page.keyboard.press("s"); await page.waitForTimeout(3000);
        await page.keyboard.press("d"); await page.waitForTimeout(300);
        const r2 = await page.evaluate(() => ({ gi: autoSweepConfig.state.gameIndex, fin: autoSweepStats.gameStats.filter((g) => g && g.finishState).length }));
        T("after re-paste", { gameIndexAfterPaste: gi0, ...r2, finishedBefore: r.fin });
        logs.length = 0; await page.keyboard.press("i"); await page.waitForTimeout(100);
        T("[i] output", logs.slice(0, 3));
        await page.close();
    }
    await browser.close();
})();
