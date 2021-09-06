module.exports = {
  rollup(config, options) {
    if (options.format === "esm") {
      // Use .mjs for ESM to force NodeJS ESM loader
      config.output.file = config.output.file.replace(".js", ".mjs");
    }
    return config;
  }
};