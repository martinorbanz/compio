// Root eslint config: delegates to per-package flat configs via each package's own eslint.config.js.
// This root file only lints top-level scripts/config files.
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/.turbo/**", "**/coverage/**"],
  },
];
