import { defineConfig } from "@playwright/test";

const WEB = process.env.WEB_URL ?? "http://localhost:3000";

/**
 * Phase 1 smoke E2E. Requires the web dev server up (and the API for
 * anything past the signed-out checks). Run: npm run test:e2e --workspace=@intervibe/web
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: { baseURL: WEB },
});
