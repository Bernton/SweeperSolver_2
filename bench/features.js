// Solver features that can be switched via solverConfig in sweeper.js.
// `--ablate` re-evaluates every alternative value of every feature against the full current configuration,
// so each feature has to keep earning its place as other features are added.
//
// Entry format: { key: "<solverConfig key>", values: [<all values worth comparing>] }

module.exports = [{ key: "firstClickCornerOffset", values: [null, 1, 2, 3] }];
