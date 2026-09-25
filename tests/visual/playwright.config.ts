import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: ".",
  testMatch: [
    "parity.spec.ts",
    "modals.spec.ts",
    "disclosure.spec.ts",
    "controls.spec.ts",
    "popover.spec.ts",
    "select.spec.ts",
  ],
  outputDir: "test-results",
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    ...devices["Desktop Chrome"],
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  },
})
