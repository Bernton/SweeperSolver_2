// Solver features that can be switched via solverConfig in sweeper.js.
// `--ablate` re-evaluates every alternative value of every feature against the full current configuration,
// so each feature has to keep earning its place as other features are added.
//
// Entry format: { key: "<solverConfig key>", values: [<all values worth comparing>] }

module.exports = [
    { key: "firstClickCornerOffset", values: [null, 1, 2, 3] },
    { key: "guessLookaheadCandidates", values: [0, 3, 6, 12] },
    { key: "guessLookaheadBudget", values: [5000, 20000, 100000] },
    { key: "endgameSearchMaxUnknowns", values: [0, 12, 16, 20, 24, 28] },
    { key: "endgameSearchBudget", values: [20000, 100000, 500000, 2000000] }
];
