import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

// Resolves @compio/* imports straight to sibling packages' src via tsconfig
// path aliases, so tests never depend on those packages having been built.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // event-hive's compiled output re-exports "./Events" (an extensionless
    // directory import), which Node's native ESM resolver rejects. Inlining
    // it routes the import through Vite's more lenient bundler-style
    // resolution instead of Node's loader. Upstream fix: event-hive's
    // lib/index.js should re-export "./Events/index.js" explicitly.
    server: { deps: { inline: ["event-hive"] } },
  },
});
