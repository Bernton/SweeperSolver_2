const { chromium, open } = require("./lib");
(async () => {
    const browser = await chromium.launch();
    const T = (name, o) => console.log("### " + name + "\n" + (typeof o === "string" ? o : JSON.stringify(o, null, 1)));

    // 1. Paste twice (idle)
    {
        const { page, logs, paste } = await open(browser, "seed=5&rows=16&cols=30&mines=99");
        await paste(); await paste();
        const n = await page.evaluate(() => typeof sweepKeyDown);
        await page.keyboard.press("w"); await page.waitForTimeout(100);
        const opened = await page.evaluate(() => document.querySelectorAll(".square[class*=open]").length);
        T("paste twice idle", { logs: logs.filter(l => /EXCEPTION|ERROR/.test(l)), handler: n, openedAfterW: opened });
        await page.close();
    }
    // 2. Paste twice while the auto sweeper runs, then [d]
    {
        const { page, logs, paste, boardState } = await open(browser, "seed=5&rows=16&cols=30&mines=99");
        await paste();
        await page.keyboard.press("s"); await page.waitForTimeout(500);
        await paste();
        await page.keyboard.press("d"); await page.waitForTimeout(300);
        const a = await page.evaluate(() => autoSweepConfig.state.gameIndex);
        const b1 = await boardState(); await page.waitForTimeout(1000); const b2 = await boardState();
        await page.keyboard.press("i"); await page.waitForTimeout(100);
        T("paste twice while running, then [d]", { stillRunningAfterD: b1 !== b2, newConfigGameIndex: a, iOutput: logs.slice(-6) , errs: logs.filter(l => /EXCEPTION|ERROR/.test(l)) });
        await page.close();
    }
    // 3. [w] once for the first click, play on manually until game over, new game, [w] again
    {
        const { page, logs, paste, boardState, click, face } = await open(browser, "seed=5&rows=16&cols=30&mines=99");
        await paste();
        await page.keyboard.press("w"); await page.waitForTimeout(100);
        // manually click hidden cells until death/win
        for (let i = 0; i < 200; i++) {
            const id = await page.evaluate(() => { let c = [...document.querySelectorAll(".square.blank")].filter(s => s.style.display !== "none"); return c.length ? c[Math.floor(c.length / 2)].id : null; });
            const over = await page.evaluate(() => /dead|win/.test(document.getElementById("face").className));
            if (over || !id) break;
            await click(id);
        }
        const faceState = await page.evaluate(() => document.getElementById("face").className);
        await face();
        const before = await boardState();
        await page.keyboard.press("w"); await page.waitForTimeout(100);
        const after = await boardState();
        await page.keyboard.press("w"); await page.waitForTimeout(100);
        const after2 = await boardState();
        T("[w] once, manual play to " + faceState + ", new game, [w]", { firstWDidSomething: before !== after, secondWDidSomething: after !== after2 });
        await page.close();
    }
    // 4. Lose with [w], then [s]
    {
        const { page, logs, paste, boardState } = await open(browser, "seed=5&rows=16&cols=30&mines=99");
        await paste();
        for (let i = 0; i < 400; i++) {
            const over = await page.evaluate(() => /dead|win/.test(document.getElementById("face").className));
            if (over) break;
            await page.keyboard.press("w");
        }
        const faceState = await page.evaluate(() => document.getElementById("face").className);
        logs.length = 0;
        await page.keyboard.press("s"); await page.waitForTimeout(500);
        const g1 = await page.evaluate(() => autoSweepConfig.state.gameIndex);
        await page.keyboard.press("s"); await page.waitForTimeout(500);
        const g2 = await page.evaluate(() => autoSweepConfig.state.gameIndex);
        T("game over by [w] (" + faceState + "), then [s], [s]", { gamesPlayedAfterS: g1, afterSecondS: g2, logs: logs.slice(0, 5), state: await page.evaluate(() => autoSweepConfig.state.lastSweepResult) });
        await page.close();
    }
    // 5. Stop mid-game with [d], lose manually, then [s]
    {
        const { page, logs, paste, click } = await open(browser, "seed=11&rows=16&cols=30&mines=99");
        await paste();
        await page.keyboard.press("s"); await page.waitForTimeout(40); await page.keyboard.press("d");
        await page.waitForTimeout(50);
        await page.evaluate(() => { let f = document.getElementById("face"); if (/dead|win/.test(f.className)) { simulate(f, "mousedown"); simulate(f, "mouseup"); } });
        // reveal a bomb manually: find a mine via the next trivial flag... use the website's own reveal on hidden squares until dead
        for (let i = 0; i < 300; i++) {
            const over = await page.evaluate(() => /dead/.test(document.getElementById("face").className));
            if (over) break;
            const id = await page.evaluate(() => { let c = [...document.querySelectorAll(".square.blank")].filter(s => s.style.display !== "none"); return c.length ? c[(c.length * 7) % c.length >> 1].id : null; });
            if (!id) break; await click(id);
        }
        logs.length = 0;
        const last = await page.evaluate(() => JSON.stringify(autoSweepConfig.state.lastSweepResult));
        await page.keyboard.press("s"); await page.waitForTimeout(500);
        T("[d] mid-game, manual loss, [s]", { lastBefore: last, gameIndex: await page.evaluate(() => autoSweepConfig.state.gameIndex), logs: logs.slice(0, 4) });
        await page.close();
    }
    await browser.close();
})();
