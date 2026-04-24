import { test } from '@playwright/test';
import { LoginPage } from '../../pages/Login.page';
import { DashboardPage } from '../../pages/Dashboard.page';

// Ensures test runs in a clean, logged-out state
// Useful if other tests use stored authentication sessions
test.use({ storageState: undefined });

test.describe('@auth Login Smoke Suite', () => {

    test('should login successfully with valid credentials', async ({ page }) => {

        // Initialize Page Objects to encapsulate UI interactions
        const loginPage = new LoginPage(page);
        const dashboardPage = new DashboardPage(page);

        await test.step('Navigate to login page', async () => {
            // Start from a known entry point
            await loginPage.navigate();
        });

        await test.step('Authenticate with valid credentials', async () => {
            // Hardcoded credentials (acceptable for learning/demo)
            // WARNING: Replace with env/config before using in real projects
            await loginPage.login('Admin', 'admin123');
        });

        await test.step('Verify user is redirected to Dashboard', async () => {
            // Reuse POM-level validation to avoid duplicating assertions
            await dashboardPage.isLoaded();
        });
    });

});