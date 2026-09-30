const { chromium, open } = require("./lib");
(async () => {
    const browser = await chromium.launch();
    const { page, paste } = await open(browser, `seed=3&rows=99&cols=99&mines=1960`);
    await paste();
    const r = await page.evaluate(() => {
        for (let i = 0; i < 30; i++) { let r = sweepPage(true, false); executeInteractions(r.interactions, true, false); }
        const N = 50; let t = performance.now();
        for (let i = 0; i < N; i++) getBombAmount();
        let bomb = (performance.now() - t) / N;
        t = performance.now();
        for (let i = 0; i < N; i++) { for (let y = 1; y <= 99; y++) for (let x = 1; x <= 99; x++) { let d = document.getElementById(y + "_" + x); if (d.style.display === "none") break; d.className; } }
        let read = (performance.now() - t) / N;
        let divs = []; for (let y = 1; y <= 99; y++) for (let x = 1; x <= 99; x++) divs.push(document.getElementById(y + "_" + x));
        t = performance.now();
        for (let i = 0; i < N; i++) for (const d of divs) d.className;
        let cached = (performance.now() - t) / N;
        t = performance.now();
        for (let i = 0; i < N; i++) sweepPage(true, false);
        let sp = (performance.now() - t) / N;
        return { getBombAmountMs: bomb, readByIdMs: read, readCachedDivsMs: cached, sweepPageMs: sp };
    });
    console.log(JSON.stringify(r));
    await browser.close();
})();
