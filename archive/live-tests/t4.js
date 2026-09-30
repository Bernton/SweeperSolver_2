const { chromium, open } = require("./lib");
const T = (name, o) => console.log("### " + name + "\n" + (typeof o === "string" ? o : JSON.stringify(o, null, 1)));
(async () => {
    const browser = await chromium.launch();
    // Impossible flags: a digit with more flagged neighbors than its value
    for (const variant of ["overflag", "tooManyFlagsTotal"]) {
        const { page, logs, paste, click } = await open(browser, "seed=7&rows=16&cols=30&mines=99");
        await paste();
        await page.evaluate(() => { for (let i = 0; i < 4; i++) { let r = sweepPage(true, false); executeInteractions(r.interactions, true, false); } });
        const ids = await page.evaluate((variant) => {
            let sq = (y, x) => document.getElementById(y + "_" + x);
            if (variant === "overflag") {
                for (let y = 1; y <= 16; y++) for (let x = 1; x <= 30; x++) {
                    let d = sq(y, x); if (d.className !== "square open1") continue;
                    let hid = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { let n = sq(y + dy, x + dx); if (n && n.style.display !== "none" && n.className === "square blank") hid.push(n.id); }
                    if (hid.length >= 2) return hid.slice(0, 2);
                }
            } else {
                // flag 100 far-away hidden cells: more flags than bombs
                return [...document.querySelectorAll(".square.blank")].filter(s => s.style.display !== "none").slice(-100).map(s => s.id);
            }
        }, variant);
        for (const id of ids) await click(id, 2);
        logs.length = 0;
        await page.keyboard.press("Shift+E"); await page.waitForTimeout(200);
        await page.keyboard.press("Shift+W"); await page.waitForTimeout(200);
        T("impossible flags (" + variant + ", " + ids.length + " flags)", logs.slice(0, 14));
        await page.close();
    }
    await browser.close();
})();
