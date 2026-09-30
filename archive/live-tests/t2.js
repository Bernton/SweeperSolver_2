const { chromium, open } = require("./lib");
const T = (name, o) => console.log("### " + name + "\n" + (typeof o === "string" ? o : JSON.stringify(o, null, 1)));
const over = (page) => page.evaluate(() => /dead|win/.test(document.getElementById("face").className));
(async () => {
    const browser = await chromium.launch();
    // 1. Brick then click face manually, [s]
    {
        const { page, logs, paste, face } = await open(browser, "seed=5&rows=16&cols=30&mines=99");
        await paste();
        for (let i = 0; i < 400 && !(await over(page)); i++) await page.keyboard.press("w");
        await page.keyboard.press("s"); await page.waitForTimeout(200);
        await face(); logs.length = 0;
        await page.keyboard.press("s"); await page.waitForTimeout(500);
        T("brick, face click, [s]", { gameIndex: await page.evaluate(() => autoSweepConfig.state.gameIndex), logs: logs.slice(0, 3), opened: await page.evaluate(() => document.querySelectorAll(".square[class*=open]").length) });
        await page.close();
    }
    // 2. Keybinds: typing in a text input, ctrl+s, caps lock-ish, key repeat of [s]
    {
        const { page, logs, paste, boardState } = await open(browser, "seed=5&rows=16&cols=30&mines=99");
        await paste();
        await page.focus("#cm");
        await page.keyboard.type("s");
        await page.waitForTimeout(300);
        const enabled1 = await page.evaluate(() => autoSweepConfig.isAutoSweepEnabled);
        const games1 = await page.evaluate(() => autoSweepConfig.state.gameIndex);
        await page.keyboard.press("d"); // also typed into the input
        const inputVal = await page.evaluate(() => document.getElementById("cm").value);
        await page.evaluate(() => document.activeElement.blur());
        await page.keyboard.press("Control+s"); await page.waitForTimeout(100);
        const enabled2 = await page.evaluate(() => autoSweepConfig.isAutoSweepEnabled);
        await page.keyboard.press("Control+d"); await page.waitForTimeout(50);
        const enabled3 = await page.evaluate(() => autoSweepConfig.isAutoSweepEnabled);
        T("keybinds in input / with ctrl", { typingSInInputStartedAuto: enabled1, gamesDuring300ms: games1, inputValue: inputVal, ctrlSStartsAuto: enabled2, ctrlDStops: !enabled3 });
        await page.close();
    }
    // 3. [s] pressed 3 times: how many loops? games in 2s vs pressed once
    for (const presses of [1, 3]) {
        const { page, paste } = await open(browser, "seed=5&rows=16&cols=30&mines=99");
        await paste();
        for (let i = 0; i < presses; i++) await page.keyboard.press("s");
        await page.waitForTimeout(3000);
        await page.keyboard.press("d");
        T("[s] x" + presses + ": games in 3 s", await page.evaluate(() => autoSweepConfig.state.gameIndex));
        await page.close();
    }
    // 4. [e]/[E] twice at a stuck position
    {
        const { page, logs, paste } = await open(browser, "seed=7&rows=16&cols=30&mines=99");
        await paste();
        await page.evaluate(() => { for (let i = 0; i < 500; i++) { let r = sweepPage(true, false); if (isGuessingSolver(r.solver)) return; executeInteractions(r.interactions, true, false); } });
        logs.length = 0; await page.keyboard.press("e"); await page.waitForTimeout(100);
        const n1 = logs.length; logs.length = 0;
        await page.keyboard.press("e"); await page.waitForTimeout(100);
        const n2 = logs.length; logs.length = 0;
        await page.keyboard.press("Shift+E"); await page.waitForTimeout(100);
        const n3 = logs.length; logs.length = 0;
        await page.keyboard.press("Shift+E"); await page.waitForTimeout(100);
        T("[e] twice / [E] twice at a guess position: lines printed", [n1, n2, n3, logs.length]);
        await page.close();
    }
    await browser.close();
})();
