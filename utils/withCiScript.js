const { withDangerousMod } = require("@expo/config-plugins");
const path = require("path");
const fs = require("fs");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

module.exports = function withCiScript(config, options = {}) {
  const destFileName = options.destFileName ?? "postbuild.sh";

  // Put your source script here (example)
  const sourceScriptPath =
    options.sourceScriptPath ?? path.join(__dirname, "../assets/ios/ci_scripts/postbuild.sh");

  return withDangerousMod(config, [
    "ios",
    (modConfig) => {
      const projectRoot = modConfig.modRequest.projectRoot;

      const src = path.resolve(sourceScriptPath);
      if (!fs.existsSync(src)) {
        throw new Error(`[withCiScript] Source script not found: ${src}`);
      }

      const destDir = path.join(projectRoot, "ios", "ci_scripts");
      const dest = path.join(destDir, destFileName);

      ensureDir(destDir);
      fs.copyFileSync(src, dest);
      fs.chmodSync(dest, 0o755);

      return modConfig;
    },
  ]);
};
