// Import Playwright configuration helpers and device presets
import { chromium, defineConfig, devices } from '@playwright/test';

/**
 * Playwright Test Configuration
 *
 * Designed for:
 * - CI/CD execution (PR + Regression + Nightly)
 * - Controlled parallelism (sharding + workers)
 * - Project-based test segmentation (smoke vs regression)
 * - Debug-friendly artifact collection
 */
export default defineConfig({

  // Root directory for test files
  testDir: './tests',

  // Disable full parallel inside files
  // Parallelism is handled via:
  // - CI sharding
  // - worker threads
  // Prevents over-parallelization issues
  fullyParallel: false,

  // Prevent accidental commits with test.only in CI
  forbidOnly: !!process.env.CI,

  // Retry failed tests only in CI
  // Helps handle transient failures without affecting local debugging
  retries: process.env.CI ? 2 : 0,

  // Worker configuration:
  // - CI: limited workers → stable execution
  // - Local: max workers → faster runs
  workers: process.env.CI ? 2 : undefined,

  // HTML report for debugging and trace visualization
  reporter: [
    ['html'],
    ['allure-playwright', {
      resultsDir: 'allure-results',
      detail: true,
      outputFolder: 'allure-results',
      suiteTitle: false,
      environmentInfo: {
        OS: process.platform,
        NodeVersion: process.version,
        Environment: 'QA-Staging'
      }
    }]
  ],

  // Shared settings across all projects
  use: {

    // Base URL (should ideally come from env variables for multi-env support)
    baseURL: process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com/',

    // Collect trace only when retry happens
    trace: 'on-first-retry',

    // Capture screenshots only on failure
    screenshot: 'only-on-failure',

    // Record video only for failed tests
    video: 'retain-on-failure',
  },

  // ==========================
  // Project Configuration
  // ==========================
  // Controls WHAT tests run and WHERE (browser + tagging)
  projects: [

    {
      // Setup project (runs first)
      // Responsible for generating authentication state
      name: 'setup-chromium',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },


    {
      // Setup project (runs first)
      // Responsible for generating authentication state
      name: 'setup-firefox',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Firefox'] },
    },


    {
      // Setup project (runs first)
      // Responsible for generating authentication state
      name: 'setup-webkit',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Safari'] },
    },

    // ==========================
    // Unauthenticated SMOKE (Login/Logout) PROJECT (PR)
    // ==========================
    {
      name: 'auth-chromium',

      // Runs only smoke-tagged tests
      // Used in PR pipeline for fast feedback
      grep: /@auth\b/,

      use: {
        ...devices['Desktop Chrome'],

        // Reuse login session
        storageState: {cookies: [], origins: []},
      },
    },


        // ==========================
    // SMOKE PROJECT (PR)
    // ==========================
    {
      name: 'smoke-chromium',

      // Runs only smoke-tagged tests
      // Used in PR pipeline for fast feedback
      grep: /@smoke\b/,

      use: {
        ...devices['Desktop Chrome'],

        // Reuse login session
        storageState: `playwright-utils/.auth/chromium-storageState.json`,
      },
      dependencies: ['setup-chromium'],
    },


    // ==========================
    // REGRESSION PROJECTS (MAIN)
    // ==========================

    {
      name: 'regression-chromium',

      // Core regression tests
      grep: /@regression\b/,

      use: {
        ...devices['Desktop Chrome'],

        storageState: 'playwright-utils/.auth/chromium-storageState.json',
      },
      dependencies: ['setup-chromium'],
    },

    {
      name: 'regression-firefox',

      // Cross-browser validation (Firefox)
      grep: /@regression\b/,

      use: {
        ...devices['Desktop Firefox'],

        storageState: 'playwright-utils/.auth/firefox-storageState.json',
      },
      dependencies: ['setup-firefox'],
    },

    {
      name: 'regression-webkit',

      // Cross-browser validation (Safari/WebKit)
      grep: /@regression\b/,

      use: {
        ...devices['Desktop Safari'],
        
        storageState: 'playwright-utils/.auth/webkit-storageState.json',
      },
      dependencies: ['setup-webkit'],
    },

    // ==========================
    // FUTURE EXTENSIONS
    // ==========================

    // Add edge / negative projects if needed:
    // {
    //   name: 'edge-tests',
    //   grep: /@edge/,
    // },

    // {
    //   name: 'negative-tests',
    //   grep: /@negative/,
    // },
  ],

});