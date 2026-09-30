const { chromium, open } = require("./lib");
const [rows, cols, mines, secs] = process.argv.slice(2).map(Number);
(async () => {
    const browser = await chromium.launch();
    const { page, logs, paste } = await open(browser, `seed=3&rows=${rows}&cols=${cols}&mines=${mines}`);
    await paste();
    await page.evaluate(() => {
        window.__t = { solve: 0, click: 0, steps: 0, maxSolve: 0, maxClick: 0, maxStep: 0, longTasks: [], frames: [] };
        const sp = sweepPage, ei = executeInteractions;
        window.sweepPage = function () { let t = performance.now(); let r = sp.apply(this, arguments); let d = performance.now() - t; __t.solve += d; __t.maxSolve = Math.max(__t.maxSolve, d); __t.steps++; __t.lastSolve = d; return r; };
        window.executeInteractions = function () { let t = performance.now(); let r = ei.apply(this, arguments); let d = performance.now() - t; __t.click += d; __t.maxClick = Math.max(__t.maxClick, d); __t.maxStep = Math.max(__t.maxStep, d + (__t.lastSolve || 0)); return r; };
        new PerformanceObserver((l) => l.getEntries().forEach((e) => __t.longTasks.push(e.duration))).observe({ entryTypes: ["longtask"] });
        let last = performance.now();
        (function f() { let n = performance.now(); __t.frames.push(n - last); last = n; requestAnimationFrame(f); })();
    });
    const t0 = Date.now();
    await page.keyboard.press("s");
    await page.waitForTimeout(secs * 1000);
    await page.keyboard.press("d");
    const wall = (Date.now() - t0) / 1000;
    await page.waitForTimeout(300);
    logs.length = 0;
    await page.keyboard.press("i"); await page.waitForTimeout(100);
    const r = await page.evaluate(() => { let f = __t.frames.slice(5).sort((a, b) => b - a); let lt = __t.longTasks.sort((a, b) => b - a); return { games: autoSweepConfig.state.gameIndex, steps: __t.steps, solveMs: +__t.solve.toFixed(0), clickMs: +__t.click.toFixed(0), maxSolve: +__t.maxSolve.toFixed(0), maxClick: +__t.maxClick.toFixed(0), maxStep: +__t.maxStep.toFixed(0), longTasks: lt.length, longTaskTop: lt.slice(0, 3).map(Math.round), worstFrameGaps: f.slice(0, 3).map(Math.round), frames: __t.frames.length }; });
    console.log(JSON.stringify({ board: `${cols}x${rows}/${mines}`, wallS: wall, ...r, busyShare: +((r.solveMs + r.clickMs) / (wall * 1000)).toFixed(2), gamesPerS: +(r.games / wall).toFixed(2) }));
    console.log(logs.join("\n"));
    await browser.close();
})();
