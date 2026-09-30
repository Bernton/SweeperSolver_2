const { chromium, open } = require("./lib");
(async () => {
    const browser = await chromium.launch();
    const { page, paste } = await open(browser, `seed=3&rows=16&cols=30&mines=99`);
    await paste();
    const r = await page.evaluate(() => {
        let games = 0, riddles = 0, gamesWithRiddle = 0, cur = 0;
        while (games < 100) {
            let r = sweepPage(true, false);
            if (isNewGameState(r.state)) { games++; if (cur) gamesWithRiddle++; cur = 0; startNewGameForAutoSweep(autoSweepConfig); continue; }
            if (r.solver === "3") { riddles++; cur++; }
            executeInteractions(r.interactions, true, false);
        }
        return { games, riddlesPerGame: riddles / games, shareOfGamesWithRiddle: gamesWithRiddle / games };
    });
    console.log(JSON.stringify(r));
    await browser.close();
})();
