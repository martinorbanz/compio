import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // jsdom has no canvas backend, so canvas drawing is exercised through a
    // hand-rolled fake CanvasFactory in tests, not jsdom's own 2D context.
    environment: "jsdom",
    setupFiles: ["./src/setup-tests.ts"],
    // See packages/domain-events/vitest.config.ts for why event-hive is inlined.
    server: { deps: { inline: ["event-hive"] } },
  },
});
