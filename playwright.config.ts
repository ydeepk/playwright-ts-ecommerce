// Import Playwright configuration helpers and device presets
import { defineConfig, devices } from '@playwright/test';

// Path to persist authenticated session state
// Used to bypass login across tests → improves execution speed significantly
// Must be generated via auth.setup.ts before dependent tests run
export const STORAGE_STATE = 'playwright/.auth/user.json';

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
  reporter: 'html',

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
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // ==========================
    // SMOKE PROJECT (PR)
    // ==========================
    {
      name: 'smoke-chromium',

      // Runs only smoke-tagged tests
      // Used in PR pipeline for fast feedback
      grep: /@smoke/,

      use: {
        ...devices['Desktop Chrome'],

        // Reuse login session
        storageState: STORAGE_STATE,
      },
    },

    // ==========================
    // REGRESSION PROJECTS (MAIN)
    // ==========================

    {
      name: 'regression-chromium',

      // Core regression tests
      grep: /@regression/,

      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
      },
    },

    {
      name: 'regression-firefox',

      // Cross-browser validation (Firefox)
      grep: /@regression/,

      use: {
        ...devices['Desktop Firefox'],
        storageState: STORAGE_STATE,
      },
    },

    {
      name: 'regression-webkit',

      // Cross-browser validation (Safari/WebKit)
      grep: /@regression/,

      use: {
        ...devices['Desktop Safari'],
        storageState: STORAGE_STATE,
      },
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