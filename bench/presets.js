// Board presets grouped into suites. Games are played with seeds firstSeed..firstSeed+games-1,
// so every variant and every run sees the same boards.

const expert = { name: "expert 30x16/99", width: 30, height: 16, bombs: 99, games: 10000 };

const suites = {
    // Primary tuning target
    expert: [expert],

    // Generalization: standard sizes plus custom sizes and densities
    sizes: [
        { name: "beginner 9x9/10", width: 9, height: 9, bombs: 10, games: 5000 },
        { name: "intermediate 16x16/40", width: 16, height: 16, bombs: 40, games: 5000 },
        { name: "wide 60x16/198", width: 60, height: 16, bombs: 198, games: 1000 },
        { name: "square 24x24/115", width: 24, height: 24, bombs: 115, games: 2000 },
        { name: "big 50x50/500", width: 50, height: 50, bombs: 500, games: 400 },
        { name: "max 99x99/1960", width: 99, height: 99, bombs: 1960, games: 40 }
    ],

    // Robustness: no errors, no NaN, no runaway step times. Win rates are secondary here.
    stress: [
        { name: "max 99x99/2450 (25%)", width: 99, height: 99, bombs: 2450, games: 16 },
        { name: "max 99x99/2940 (30%)", width: 99, height: 99, bombs: 2940, games: 16 },
        { name: "max 99x99/3920 (40%)", width: 99, height: 99, bombs: 3920, games: 16 },
        { name: "max 99x99/8820 (90%)", width: 99, height: 99, bombs: 8820, games: 8 },
        { name: "max 99x99/9795 (overfull)", width: 99, height: 99, bombs: 9795, games: 8 },
        { name: "dense 30x16/200", width: 30, height: 16, bombs: 200, games: 500 },
        { name: "overfull 9x9/75", width: 9, height: 9, bombs: 75, games: 200 },
        { name: "line 1x30/5", width: 30, height: 1, bombs: 5, games: 500 },
        { name: "tiny 2x2/3", width: 2, height: 2, bombs: 3, games: 100 },
        { name: "empty 10x10/0", width: 10, height: 10, bombs: 0, games: 20 }
    ]
};

suites.all = [...suites.expert, ...suites.sizes, ...suites.stress];

module.exports = { suites };
