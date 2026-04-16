// Import Playwright test runner and assertion library
// 'test' defines test cases, 'expect' is used for validations
import { test, expect } from '@playwright/test';

// Import Login Page Object (encapsulates UI interactions)
import { LoginPage } from '../../pages/LoginPage';

// Override global authenticated state for this test file
// Forces tests to run in a logged-out context
// Critical for validating login functionality independently
test.use({ storageState: { cookies: [], origins: [] } });

// ==========================
// Test Suite: Login (Smoke)
// ==========================
test.describe('@smoke Login Smoke Suite', () => {

    /**
     * Smoke Test: Valid Login Flow
     *
     * Purpose:
     * - Verify authentication is working for valid users
     * - Acts as a critical gate for PR validation
     *
     * Risk Covered:
     * - Broken login blocks entire application access
     *
     * Notes:
     * - Runs without stored session (forced logout state)
     * - Uses UI validation instead of API shortcuts for realism
     */
    test('should login successfully with valid credentials', async ({ page }) => {

        // Initialize Login Page Object
        // Keeps test logic clean and separates UI interaction concerns
        const loginPage = new LoginPage(page);

        // Step 1: Navigate to login page
        // Ensures test starts from a known entry point
        await test.step('Navigate to login page', async () => {
            await loginPage.navigate();
        });

        // Step 2: Perform login
        // Uses valid credentials (hardcoded for demo → should be env-driven in production)
        await test.step('Login with valid admin credentials', async () => {
            await loginPage.login('Admin', 'admin123');
        });

        // Step 3: Validate successful login
        await test.step('Verify user is redirected to dashboard', async () => {

            // URL assertion ensures correct navigation happened
            // Regex used to handle dynamic URL variations
            await expect(page).toHaveURL(/.*dashboard/);

            // UI assertion confirms page is fully loaded and user is authenticated
            // Prevents false positives where URL changes but UI fails
            await expect(
                page.getByRole('heading', { name: 'Dashboard' })
            ).toBeVisible();
        });
    });

});