import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/tests/vitest/globalSetup.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
    testTimeout: 30000, // 30 seconds for database operations
    hookTimeout: 30000, // 30 seconds for setup/teardown
  },
});
