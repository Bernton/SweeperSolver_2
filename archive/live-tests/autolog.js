const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const fs = require("fs"), path = require("path");
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const logs = [];
    page.on("console", async (m) => { const p = await Promise.all(m.args().map((a) => a.evaluate((v) => (v instanceof Element ? "<div id=" + v.id + ">" : String(v))).catch(() => "?"))); logs.push(p.join(" ")); });
    page.on("pageerror", (e) => logs.push("PAGE ERROR: " + e.message));
    await page.goto("file://" + path.join(__dirname, "page.html") + "?seed=3&rows=16&cols=30&mines=99");
    await page.addScriptTag({ content: fs.readFileSync("cur_sweeper.js", "utf8") });
    await page.keyboard.press("l"); await page.keyboard.press("s"); await page.waitForTimeout(1500); await page.keyboard.press("d");
    await page.waitForTimeout(200);
    const guessLines = logs.filter((l) => /Reveal|guessing|PAGE ERROR|isolated/.test(l));
    console.log(logs.length + " log lines, guess related:\n" + guessLines.slice(0, 12).join("\n"));
    await browser.close();
})();
