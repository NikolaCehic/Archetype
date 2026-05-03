import { defineConfig } from "@playwright/test";
import { mkdirSync } from "node:fs";

mkdirSync("tmp/workbench-ui-e2e", { recursive: true });

export default defineConfig({
  testDir: "./tests/workbench",
  timeout: 45_000,
  expect: {
    timeout: 8_000
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  outputDir: "tmp/playwright-results",
  reporter: [
    ["list"],
    ["json", { outputFile: "tmp/workbench-ui-e2e/playwright-results.json" }],
    ["html", { outputFolder: "tmp/playwright-report", open: "never" }]
  ],
  use: {
    baseURL: "http://127.0.0.1:4175",
    browserName: "chromium",
    channel: "chrome",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    permissions: ["clipboard-read", "clipboard-write"],
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure"
  },
  webServer: {
    command: "npm run workbench:build && npx vite preview --config vite.workbench.config.ts --host 127.0.0.1 --port 4175 --strictPort",
    url: "http://127.0.0.1:4175",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe"
  }
});
