module.exports = function(config) {
  config.set({
    mutator: "javascript",
    mutate: [ 'lib/*.js' ],
    packageManager: "npm",
    reporters: ["html", "clear-text", "progress"],
    testRunner: "command",
    transpilers: [],
    coverageAnalysis: "all"
  });
};
