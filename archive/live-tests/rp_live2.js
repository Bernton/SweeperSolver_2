const { chromium, open } = require("./lib");
(async () => {
    const browser = await chromium.launch();
    const { page, logs, paste } = await open(browser, "seed=5&rows=16&cols=30&mines=99", "page.html");
    await page.addStyleTag({ content: "#face{width:26px;height:26px;display:block} .square{width:16px;height:16px;float:left} .borderlr,.bordertb,.bordertl,.bordertr,.borderbl,.borderbr{display:none} #game{width:600px} .square:nth-child(1){clear:none}" });
    await paste();
    const opened = () => page.evaluate(() => document.querySelectorAll(".square[class*=open]").length);
    const act = () => page.evaluate(() => document.activeElement.tagName + "#" + document.activeElement.id + ":" + document.activeElement.type);
    await page.click("#marks");
    const f0 = await act();
    await page.click("[id='8_15']");
    const a = await opened(); const f1 = await act();
    await page.keyboard.press("w"); await page.waitForTimeout(100);
    const b = await opened();
    await page.click("[id='face']"); const f2 = await act();
    await page.keyboard.press("w"); await page.waitForTimeout(100);
    console.log(JSON.stringify({ focusAfterMarks: f0, focusAfterBoardClick: f1, openedByHand: a, openedAfterW: b, focusAfterFace: f2, openedAfterFaceAndW: await opened(), errs: logs.filter((l) => /ERROR|EXCEPTION/.test(l)) }));
    await browser.close();
})();
