const { chromium, open } = require("./lib");
const T = (name, o) => console.log("### " + name + "\n" + JSON.stringify(o));
const opened = (page) => page.evaluate(() => document.querySelectorAll(".square[class*=open]").length);
(async () => {
    const browser = await chromium.launch();
    // Modifier keys and typing in an input
    {
        const { page, logs, paste } = await open(browser, "seed=5&rows=16&cols=30&mines=99", "page2.html");
        await paste();
        for (const k of ["Control+s", "Control+w", "Control+e", "Alt+w", "Meta+w"]) await page.keyboard.press(k);
        await page.waitForTimeout(300);
        const afterMods = { opened: await opened(page), running: await page.evaluate(() => autoSweepConfig.isAutoSweepEnabled) };
        await page.click("#textbox"); await page.keyboard.type("sweep"); await page.waitForTimeout(300);
        const afterTyping = { opened: await opened(page), running: await page.evaluate(() => autoSweepConfig.isAutoSweepEnabled), text: await page.evaluate(() => textbox.value) };
        await page.evaluate(() => document.activeElement.blur());
        await page.keyboard.press("w"); await page.waitForTimeout(100);
        T("modifiers and typing do nothing, plain [w] works", { afterMods, afterTyping, afterW: await opened(page) });
        await page.close();
    }
    // Held keys: [shift+e] held prints once, [w] held keeps playing, [s] held starts one loop
    {
        const { page, logs, paste } = await open(browser, "seed=5&rows=16&cols=30&mines=99", "page.html");
        await paste();
        await page.keyboard.press("w"); await page.waitForTimeout(100);
        logs.length = 0;
        await page.keyboard.down("Shift"); await page.keyboard.down("E");
        for (let i = 0; i < 5; i++) await page.keyboard.down("E"); // repeats
        await page.keyboard.up("E"); await page.keyboard.up("Shift");
        const heldShiftE = logs.filter((l) => /Interactions:|No certain cell/.test(l)).length;
        const o0 = await opened(page);
        await page.keyboard.down("w"); for (let i = 0; i < 10; i++) await page.keyboard.down("w"); await page.keyboard.up("w");
        const o1 = await opened(page);
        await page.keyboard.down("s"); for (let i = 0; i < 10; i++) await page.keyboard.down("s"); await page.keyboard.up("s");
        await page.waitForTimeout(300);
        const runId = await page.evaluate(() => window.autoSweepRunId);
        await page.keyboard.press("d"); await page.waitForTimeout(200);
        const b1 = await page.evaluate(() => autoSweepConfig.state.gameIndex); await page.waitForTimeout(500); const b2 = await page.evaluate(() => autoSweepConfig.state.gameIndex);
        T("held keys", { heldShiftEOutputs: heldShiftE, heldWOpenedMore: o1 > o0, runIdAfterHeldS: runId, stoppedByD: b1 === b2, errors: logs.filter((l) => /ERROR|EXCEPTION/.test(l)) });
        await page.close();
    }
    // Invalid board while the auto sweeper runs: it stops and warns once
    {
        const { page, logs, paste, click } = await open(browser, "seed=7&rows=16&cols=30&mines=99", "page.html");
        await paste();
        await page.evaluate(() => { for (let i = 0; i < 4; i++) { let r = sweepPage(true, false); executeInteractions(r.interactions, true, false); } });
        const ids = await page.evaluate(() => [...document.querySelectorAll(".square.blank")].filter((s) => s.style.display !== "none").slice(-100).map((s) => s.id));
        for (const id of ids) await click(id, 2);
        logs.length = 0;
        await page.keyboard.press("s"); await page.waitForTimeout(500);
        T("[s] on an invalid board", { running: await page.evaluate(() => autoSweepConfig.isAutoSweepEnabled), warnings: logs.length, first: (logs[0] || "").slice(0, 120) });
        await page.close();
    }
    await browser.close();
})();
