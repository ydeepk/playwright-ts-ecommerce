// Import Playwright test utilities
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

// ==========================
// Test Suite: Login (Smoke)
// ==========================
test.describe('Login Smoke Suite', () => {

    test('should login successfully with valid credentials', async ({ page }) => {

        const loginPage = new LoginPage(page);

        await test.step('Navigate to login page', async () => {
            await loginPage.navigate();
        });

        await test.step('Login with valid admin credentials', async () => {
            await loginPage.login('Admin', 'admin123');
        });

        await test.step('Verify user is redirected to dashboard', async () => {
            await expect(page).toHaveURL(/.*dashboard/);
            await expect(
                page.getByRole('heading', { name: 'Dashboard' })
            ).toBeVisible();
        });
    });

});