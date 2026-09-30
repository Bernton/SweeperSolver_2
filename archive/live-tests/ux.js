// node ux.js <sweeper.js> [seed] : plays to the first guess step on the site code, then shows what [E] and [W] print
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const fs = require("fs"), path = require("path");
const [file, seed = "7", skip = "0"] = process.argv.slice(2);
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const logs = [];
    page.on("console", async (m) => {
        const parts = await Promise.all(m.args().map((a) => a.evaluate((v) => (v instanceof Element ? "<div id=" + v.id + ">" : String(v))).catch(() => "?")));
        logs.push(parts.join(" "));
    });
    page.on("pageerror", (e) => logs.push("PAGE ERROR: " + e.message));
    await page.goto("file://" + path.join(__dirname, "page.html") + `?seed=${seed}&rows=16&cols=30&mines=99`);
    await page.addScriptTag({ content: fs.readFileSync(file, "utf8") });
    await page.evaluate((skip) => {
        let guesses = 0;
        for (let i = 0; i < 500; i++) {
            let r = sweepPage(true, false);
            if (isNewGameState(r.state)) { startNewGameForAutoSweep(autoSweepConfig); continue; }
            if (isGuessingSolver(r.solver) && guesses++ >= skip) return;
            executeInteractions(r.interactions, true, false);
        }
    }, Number(skip));
    await page.waitForTimeout(100);
    logs.length = 0;
    await page.keyboard.press("Shift+E");
    await page.waitForTimeout(300);
    console.log("===== [E] (shift+e): certain step without board interaction\n" + logs.join("\n"));
    logs.length = 0;
    await page.keyboard.press("Shift+W");
    await page.waitForTimeout(300);
    console.log("===== [W] (shift+w): guessing step without board interaction\n" + logs.join("\n"));
    await browser.close();
})();
