const { chromium, open } = require("./lib");
const T = (name, o) => console.log("### " + name + "\n" + (typeof o === "string" ? o : JSON.stringify(o, null, 1)));
const toGuess = (page, skip = 0) => page.evaluate((skip) => { let g = 0; for (let i = 0; i < 500; i++) { let r = sweepPage(true, false); if (isNewGameState(r.state)) return "over"; if (isGuessingSolver(r.solver) && g++ >= skip) return "guess"; executeInteractions(r.interactions, true, false); } }, skip);
(async () => {
    const browser = await chromium.launch();
    // 1. Question marks: marks on; user marks cells "?" that the solver wants to flag
    {
        const { page, logs, paste, click } = await open(browser, "seed=7&rows=16&cols=30&mines=99");
        await paste();
        await page.evaluate(() => $("#marks").attr("checked", "checked"));
        // play until a step with flags exists
        const ids = await page.evaluate(() => { for (let i = 0; i < 300; i++) { let r = sweepPage(true, false); let f = r.interactions.filter(a => a.isFlag); if (f.length) return f.map(a => a.cell.div.id); executeInteractions(r.interactions, true, false); } });
        for (const id of ids) { await click(id, 2); await click(id, 2); } // flag then "?" (marks on)
        const cls0 = await page.evaluate((ids) => ids.map(id => document.getElementById(id).className), ids);
        logs.length = 0;
        await page.keyboard.press("e"); await page.waitForTimeout(50);
        const cls1 = await page.evaluate((ids) => ids.map(id => document.getElementById(id).className), ids);
        await page.keyboard.press("e"); await page.waitForTimeout(50);
        const cls2 = await page.evaluate((ids) => ids.map(id => document.getElementById(id).className), ids);
        T("question marks on cells to flag, then [e], [e]", { ids, before: cls0, afterE1: cls1, afterE2: cls2, logs: logs.slice(0, 4) });
        // and a "?" cell at a guess: does the solver still reveal / count it as unknown?
        await page.close();
    }
    // 2. Wrong user flags: flag a safe cell next to a digit, then run [e] and the auto sweeper
    {
        const { page, logs, paste, click } = await open(browser, "seed=7&rows=16&cols=30&mines=99");
        await paste();
        await page.evaluate(() => { for (let i = 0; i < 3; i++) { let r = sweepPage(true, false); executeInteractions(r.interactions, true, false); } });
        // find a hidden safe cell next to a revealed digit using the site's own knowledge: a cell the solver will reveal next
        const id = await page.evaluate(() => { for (let i = 0; i < 300; i++) { let r = sweepPage(true, false); let rv = r.interactions.filter(a => !a.isFlag); if (rv.length && r.solver === "0") return rv[0].cell.div.id; executeInteractions(r.interactions, true, false); } });
        await click(id, 2);
        logs.length = 0;
        let res = [];
        for (let i = 0; i < 60; i++) {
            await page.keyboard.press("e"); await page.waitForTimeout(20);
            const f = await page.evaluate(() => document.getElementById("face").className);
            if (f !== "facesmile") { res.push(f); break; }
        }
        const errs = logs.filter(l => /ERROR|Error|NaN|Infinity/.test(l));
        T("wrong flag on safe cell " + id + ", then [e] x60", { face: res, errs: errs.slice(0, 5), lastLogs: logs.slice(-8) });
        logs.length = 0;
        await page.evaluate(() => { let r = sweepPage(true, true); });
        T("[shift-e]-like full log at the end", logs.slice(0, 12));
        await page.close();
    }
    // 3. Options changed on the page without starting a new game (bomb amount read from the form)
    {
        const { page, logs, paste } = await open(browser, "seed=7&rows=16&cols=30&mines=99");
        await paste();
        await toGuess(page);
        logs.length = 0;
        await page.keyboard.press("Shift+E"); await page.waitForTimeout(100);
        const a = logs.filter(l => /Suggested|#1 |isolated/.test(l));
        await page.evaluate(() => { document.getElementById("custom").checked = true; });
        logs.length = 0;
        await page.evaluate(() => { window.lastForSweepStepCertainfalse = null; });
        await page.keyboard.press("Shift+E"); await page.waitForTimeout(100);
        const b = logs.filter(l => /Suggested|#1 |isolated|found|Reveal|Flag/.test(l));
        T("custom radio selected (145 mines) but the 99-mine game still running: [E]", { before: a, after: b.slice(0, 4), bombAmountRead: await page.evaluate(() => getBombAmount()) });
        await page.close();
    }
    await browser.close();
})();
