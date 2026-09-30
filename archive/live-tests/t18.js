const { chromium, open } = require("./lib");
(async () => {
    const browser = await chromium.launch();
    const { page, logs, paste } = await open(browser, "seed=3&rows=16&cols=30&mines=99", "page.html");
    await paste();
    await page.evaluate(() => { for (let i = 0; i < 500; i++) { let r = sweepPage(true, false); if (isGuessingSolver(r.solver) && r.solver === "3g" && i > 3) return; executeInteractions(r.interactions, true, false); } });
    logs.length = 0; await page.keyboard.press("Shift+E"); await page.waitForTimeout(300);
    console.log(logs.slice(0, 14).join("\n"));
    await browser.close();
})();
