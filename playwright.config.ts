import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  testDir: "./tests",

  // Run files sequentially to avoid cross-test state pollution on shared test envs
  fullyParallel: false,

  // Guard against committing accidental .only blocks into CI pipeline
  forbidOnly: !!process.env.CI,

  // Keep local runs fast for quick feedback; allow retries in CI for transient infra noise
  retries: process.env.CI ? 2 : 1,

  // Cap CI workers to avoid resource starvation on GitHub/GitLab runners
  workers: process.env.CI ? 2 : 2,

  reporter: [
    ["html", { outputFolder: "test-results/html-report", open: "never" }],
    ["json", { outputFile: "test-results/report.json" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
    ["list"],
    [
      "allure-playwright",
      {
        resultsDir: "test-results/allure-results",
        detail: true,
        outputFolder: "allure-results",
        suiteTitle: false,
        environmentInfo: {
          OS: process.platform,
          NodeVersion: process.version,
          Environment: process.env.TEST_ENV || "QA-Staging",
        },
      },
    ],
  ],

  use: {
    // Override via BASE_URL env var in pipeline triggers
    baseURL: process.env.BASE_URL || "https://opensource-demo.orangehrmlive.com/",
    
    actionTimeout: 20000,
    navigationTimeout: 60000,

    // Capture diagnostic artifacts on failure to save disk space on runner nodes
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  timeout: 120000,

  projects: [
    // -------------------------------------------------------------------------
    // Global Auth Setup
    // Generates session state files consumed by down-stream specs
    // -------------------------------------------------------------------------
    {
      name: "setup-chromium",
      testMatch: /.*\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "setup-firefox",
      testMatch: /.*\.setup\.ts/,
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "setup-webkit",
      testMatch: /.*\.setup\.ts/,
      use: { ...devices["Desktop Safari"] },
    },

    // Unauthenticated flows (login, password reset, etc.)
    {
      name: "auth-chromium",
      grep: /@auth\b/,
      dependencies:["smoke-chromium","regression-chromium"],
      use: {
        ...devices["Desktop Chrome"],
        // Purge session to prevent state leakage from setup project
        storageState: { cookies: [], origins: [] },
      },
    },

    // PR gate check suite
    {
      name: "smoke-chromium",
      grep: /@smoke\b/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: `.auth/chromium-storageState.json`,
      },
      dependencies: ["setup-chromium"],
    },

    // -------------------------------------------------------------------------
    // Full Regression Suite (Nightly / Main Branch)
    // -------------------------------------------------------------------------
    {
      name: "regression-chromium",
      grep: /@regression\b/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/chromium-storageState.json",
      },
      dependencies: ["setup-chromium"],
    },
    {
      name: "regression-firefox",
      grep: /@regression\b/,
      use: {
        ...devices["Desktop Firefox"],
        storageState: ".auth/firefox-storageState.json",
      },
      dependencies: ["setup-firefox"],
    },
    {
      name: "regression-webkit",
      grep: /@regression\b/,
      use: {
        ...devices["Desktop Safari"],
        storageState: ".auth/webkit-storageState.json",
      },
      dependencies: ["setup-webkit"],
    },

    // Edge case specs
    {
      name: "edge-chromium",
      grep: /@edge\b/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/chromium-storageState.json",
      },
      dependencies: ["setup-chromium"],
    },
    {
      name: "edge-firefox",
      grep: /@edge\b/,
      use: {
        ...devices["Desktop Firefox"],
        storageState: ".auth/firefox-storageState.json",
      },
      dependencies: ["setup-firefox"],
    },
    {
      name: "edge-webkit",
      grep: /@edge\b/,
      use: {
        ...devices["Desktop Safari"],
        storageState: ".auth/webkit-storageState.json",
      },
      dependencies: ["setup-webkit"],
    },

    // Isolated API testing project; skips UI auth dependencies entirely
    {
      name: "api-only",
      testMatch: /.*api\.spec\.ts/,
      dependencies:['setup-chromium'],
      use: {
        baseURL: "https://opensource-demo.orangehrmlive.com",
        extraHTTPHeaders: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        storageState: ".auth/chromium-storageState.json",
      },
    },
  ],
});