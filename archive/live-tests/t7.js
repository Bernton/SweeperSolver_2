const { chromium, open } = require("./lib");
const [rows, cols, mines, games] = process.argv.slice(2).map(Number);
(async () => {
    const browser = await chromium.launch();
    const { page, paste } = await open(browser, `seed=3&rows=${rows}&cols=${cols}&mines=${mines}`);
    await paste();
    const r = await page.evaluate((games) => {
        let s = { sweepPage: 0, sweepOnly: 0, clicks: 0, clickMs: 0, alreadyOpen: 0, alreadyOpenMs: 0, steps: 0, boardStateMs: 0 };
        const sw = sweep;
        window.sweep = function () { let t = performance.now(); let r = sw.apply(this, arguments); if (sweepDepth === 0) s.sweepOnly += performance.now() - t; return r; };
        let done = 0;
        while (done < games) {
            let t = performance.now();
            let r = sweepPage(true, false);
            s.sweepPage += performance.now() - t; s.steps++;
            if (isNewGameState(r.state)) { done++; startNewGameForAutoSweep(autoSweepConfig); continue; }
            for (const a of r.interactions) {
                let open = !a.isFlag && a.cell.div.className.startsWith("square open");
                let t1 = performance.now();
                executeInteractions([a], true, false);
                let d = performance.now() - t1;
                s.clicks++; s.clickMs += d;
                if (open) { s.alreadyOpen++; s.alreadyOpenMs += d; }
            }
        }
        // cost of the [w]/[e] board-state string
        let t = performance.now();
        let st = ""; let q = document.getElementsByClassName("square"); for (let i = 0; i < q.length; i++) if (q[i].style.display !== "none") st += q[i].className;
        s.boardStateMs = performance.now() - t;
        for (let k in s) s[k] = +s[k].toFixed(1);
        return s;
    }, games);
    console.log(`${cols}x${rows}/${mines}`, JSON.stringify(r));
    await browser.close();
})();
