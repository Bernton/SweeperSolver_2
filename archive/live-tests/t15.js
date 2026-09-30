const { chromium, open } = require("./lib");
(async () => {
    const browser = await chromium.launch();
    const { page, logs, paste, boardState } = await open(browser, "seed=5&rows=16&cols=30&mines=99", "page.html");
    await paste();
    await page.evaluate(() => document.addEventListener("keydown", (e) => (window.__keys = (window.__keys || []).concat(e.key + (e.repeat ? "*" : "")))));
    await page.keyboard.press("w"); await page.waitForTimeout(100);
    let states = [await boardState()];
    await page.keyboard.down("w");
    for (let i = 0; i < 10; i++) { await page.keyboard.down("w"); states.push(await boardState()); }
    await page.keyboard.up("w");
    console.log(await page.evaluate(() => __keys.join(" ")), new Set(states).size, "distinct board states over", states.length);
    await browser.close();
})();
