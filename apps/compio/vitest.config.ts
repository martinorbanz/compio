import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    // See packages/domain-events/vitest.config.ts for why event-hive is inlined.
    server: { deps: { inline: ["event-hive"] } },
  },
});
