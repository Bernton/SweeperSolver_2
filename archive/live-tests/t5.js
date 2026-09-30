const { chromium, open } = require("./lib");
(async () => {
    const browser = await chromium.launch();
    for (const variant of ["overflag", "manyFlags"]) {
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
            }
            return [...document.querySelectorAll(".square.blank")].filter(s => s.style.display !== "none").slice(-100).map(s => s.id);
        }, variant);
        for (const id of ids) await click(id, 2);
        const out = await page.evaluate(() => {
            let seen = [];
            for (let i = 0; i < 300; i++) {
                let r;
                try { r = sweepPage(true, false); } catch (e) { return seen.concat("THROW " + e.message); }
                seen.push(r.state + "/" + r.solver + "/" + r.interactions.length);
                if (r.state !== "solving" && r.state !== "start") break;
                executeInteractions(r.interactions, true, false);
                if (!r.interactions.length) { seen.push("no interactions"); break; }
            }
            return seen;
        });
        console.log(variant, JSON.stringify(out.slice(-6)), logs.filter(l => /ERROR/.test(l)));
        logs.length = 0;
        await page.evaluate(() => sweepPage(true, true));
        console.log(logs.slice(0, 8).join("\n"));
        await page.close();
    }
    await browser.close();
})();
