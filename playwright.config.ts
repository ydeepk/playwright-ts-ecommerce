// Import Playwright test runner utilities and built-in device presets
import { chromium, defineConfig, devices } from '@playwright/test';

// Load environment variables from .env into process.env
// NOTE: Ensure `.env` is excluded from version control (.gitignore)
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Playwright Test Configuration
 *
 * Key Design Goals:
 * - CI/CD friendly (PR validation + regression + nightly runs)
 * - Deterministic execution (controlled parallelism & retries)
 * - Scalable project structure (multi-browser + tagging strategy)
 * - Debuggability (trace, video, screenshots, reporting)
 *
 *  Important:
 * Avoid putting secrets directly in config. Use env validation where possible.
 */
export default defineConfig({

  // Root directory containing all test specs
  testDir: './tests',

  /**
   * Disable full parallel execution within a single test file.
   *
   * Why:
   * - Prevents race conditions in stateful flows (e.g., shared users, sessions)
   * - Keeps execution predictable when tests are not fully isolated
   *
   * Parallelism is instead controlled via:
   * - CI sharding (horizontal scaling)
   * - Worker processes (vertical scaling)
   */
  fullyParallel: false,

  /**
   * Fail the build if `test.only` is accidentally committed.
   * Critical for CI safety.
   */
  forbidOnly: !!process.env.CI,

  /**
   * Retry strategy:
   * - CI: retries flaky tests (network, timing issues)
   * - Local: no retries → faster feedback + easier debugging
   *
   *  If retries hide real bugs, consider lowering this.
   */
  retries: process.env.CI ? 2 : 0,

  /**
   * Worker configuration:
   * - CI: limit workers for stability (avoid resource contention)
   * - Local: use all cores for speed
   *
   * Tip: Tune based on CI machine size.
   */
  workers: process.env.CI ? 2 : undefined,

  /**
   * Reporting configuration
   *
   * - HTML: built-in Playwright report (quick debugging)
   * - Allure: advanced reporting (history, trends, CI integration)
   */
reporter: [
  // HTML report for debugging (opens locally or via artifact)
  ['html', { outputFolder: 'playwright-report', open: 'never' }],

  // JSON report REQUIRED for pipeline metrics aggregation
  ['json', { outputFile: 'playwright-report/report.json' }],

  // Allure report integration (for rich reporting + history)
  ['allure-playwright', {
    resultsDir: 'allure-results',

    // Enables step-level reporting (good for debugging)
    detail: true,

    // Keep consistent with pipeline artifact path
    outputFolder: 'allure-results',

    // Avoid duplicate suite names in Allure UI
    suiteTitle: false,

    // Execution metadata visible in Allure dashboard
    environmentInfo: {
      OS: process.platform,
      NodeVersion: process.version,

      // Better: inject via env (CI/CD flexibility)
      Environment: process.env.TEST_ENV || 'QA-Staging'
    }
  }]
],

  /**
   * Shared settings applied to all projects
   */
  use: {

    /**
     * Base URL for tests
     *
     * Best Practice:
     * - Always override via ENV in CI/CD
     * - Avoid hardcoding environment-specific URLs
     */
    baseURL: process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com/',

    /**
     * Trace collection:
     * - Captured only on retry → balances debugging vs storage cost
     */
    trace: 'on-first-retry',

    /**
     * Screenshot strategy:
     * - Captured only on failure → reduces noise
     */
    screenshot: 'only-on-failure',

    /**
     * Video recording:
     * - Retained only for failed tests
     * - Useful for debugging flaky UI behavior
     */
    video: 'retain-on-failure',
  },

  // ==========================
  // Project Configuration
  // ==========================
  // Defines WHAT runs (tags) and WHERE (browser/device)
  projects: [

    /**
     * ==========================
     * AUTH SETUP PROJECTS
     * ==========================
     *
     * Purpose:
     * - Generate authenticated storage state
     * - Avoid repeated login in every test
     *
     *  These must run before dependent projects
     */

    {
      name: 'setup-chromium',

      // Matches authentication setup test file
      testMatch: /auth\.setup\.ts/,

      // Use Chrome desktop profile
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'setup-firefox',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'setup-webkit',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Safari'] },
    },

    /**
     * ==========================
     * AUTH (UNAUTHENTICATED) TESTS
     * ==========================
     *
     * Covers:
     * - Login
     * - Logout
     *
     * Runs without storage state
     */
    {
      name: 'auth-chromium',

      // Tag-based filtering
      grep: /@auth\b/,

      use: {
        ...devices['Desktop Chrome'],

        // Explicit empty state ensures no session leakage
        storageState: { cookies: [], origins: [] },
      },
    },

    /**
     * ==========================
     * SMOKE TESTS (PR PIPELINE)
     * ==========================
     *
     * Purpose:
     * - Fast feedback on critical flows
     * - Runs on every PR
     */
    {
      name: 'smoke-chromium',

      grep: /@smoke\b/,

      use: {
        ...devices['Desktop Chrome'],

        /**
         * Reuse authenticated session
         *
         *  Ensure this file is:
         * - Generated in setup phase
         * - Not stale/expired
         */
        storageState: `playwright-utils/.auth/chromium-storageState.json`,
      },

      // Ensures auth setup runs first
      dependencies: ['setup-chromium'],
    },

    /**
     * ==========================
     * REGRESSION TESTS (FULL SUITE)
     * ==========================
     *
     * Purpose:
     * - Comprehensive validation
     * - Typically runs on main branch or nightly
     */

    {
      name: 'regression-chromium',

      grep: /@regression\b/,

      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright-utils/.auth/chromium-storageState.json',
      },

      dependencies: ['setup-chromium'],
    },

    {
      name: 'regression-firefox',

      // Cross-browser coverage (important for compatibility bugs)
      grep: /@regression\b/,

      use: {
        ...devices['Desktop Firefox'],
        storageState: 'playwright-utils/.auth/firefox-storageState.json',
      },

      dependencies: ['setup-firefox'],
    },

    {
      name: 'regression-webkit',

      // Safari/WebKit coverage (often catches CSS/layout issues)
      grep: /@regression\b/,

      use: {
        ...devices['Desktop Safari'],
        storageState: 'playwright-utils/.auth/webkit-storageState.json',
      },

      dependencies: ['setup-webkit'],
    },

    /**
     * ==========================
     * FUTURE EXTENSIONS
     * ==========================
     *
     * Ideas:
     * - Edge case testing
     * - Negative testing
     * - Performance or accessibility suites
     */

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