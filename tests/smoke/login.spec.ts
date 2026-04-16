 // Import Playwright test utilities
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

// ==========================
// Test Suite: Login (Smoke)
// ==========================
test.describe('@smoke Login Smoke Suite', () => {

    /**
     * Smoke test to verify successful login functionality
     * Ensures user can authenticate and land on dashboard
     */
    test('should login successfully with valid credentials', async ({ page }) => {

        // Initialize Login Page Object Model
        const loginPage = new LoginPage(page);

        // Step 1: Navigate to application login page
        await test.step('Navigate to login page', async () => {
            await loginPage.navigate();
        });

        // Step 2: Perform login with valid credentials
        await test.step('Login with valid admin credentials', async () => {
            await loginPage.login('Admin', 'admin123');
        });

        // Step 3: Validate successful navigation to dashboard
        await test.step('Verify user is redirected to dashboard', async () => {

            // Ensure URL contains dashboard path
            await expect(page).toHaveURL(/.*dashboard/);

            // Ensure dashboard heading is visible (post-login confirmation)
            await expect(
                page.getByRole('heading', { name: 'Dashboard' })
            ).toBeVisible();
        });
    });

});