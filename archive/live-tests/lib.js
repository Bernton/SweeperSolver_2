const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const fs = require("fs"), path = require("path");
const SRC = fs.readFileSync(path.join(__dirname, process.env.SWEEPER || "sweeper.js"), "utf8");
async function open(browser, q, file = process.env.PAGE || "page2.html") {
    const page = await browser.newPage();
    const logs = [];
    page.on("console", async (m) => {
        const parts = await Promise.all(m.args().map((a) => a.evaluate((v) => (v instanceof Element ? "<div id=" + v.id + ">" : typeof v === "object" ? JSON.stringify(v).slice(0, 200) : String(v))).catch(() => "?")));
        logs.push(parts.join(" "));
    });
    page.on("pageerror", (e) => logs.push("PAGE ERROR: " + e.message));
    await page.goto("file://" + path.join(__dirname, file) + "?" + q);
    const cdp = await page.context().newCDPSession(page);
    // Paste into the console: Chrome DevTools evaluates console input in REPL mode (let redeclaration allowed)
    const paste = async (src = SRC) => {
        const r = await cdp.send("Runtime.evaluate", { expression: src, replMode: true, awaitPromise: false });
        if (r.exceptionDetails) logs.push("PASTE EXCEPTION: " + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text));
        return r;
    };
    const boardState = () => page.evaluate(() => [...document.getElementsByClassName("square")].filter((s) => s.style.display !== "none").map((s) => s.className).join("|"));
    const click = (id, button = 0) => page.evaluate(([id, b]) => { let d = document.getElementById(id); for (let t of ["mousedown", "mouseup"]) d.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true, button: b })); }, [id, button]);
    const face = () => click("face");
    return { page, logs, paste, boardState, click, face, cdp };
}
module.exports = { chromium, open, SRC };
