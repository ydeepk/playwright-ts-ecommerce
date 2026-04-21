import { test } from '@playwright/test';
import { Login } from '../../pages/Login.page';
import { Dashboard } from '../../pages/Dashboard.page';
import { Navbar } from '../../pages/components/Navbar';


test.describe('@smoke-auth Logout Flow', () => {

    test.beforeEach(async ({ page }) => {
        // Navigate to application root
        // Assumes authenticated session is already available via storageState
        await page.goto('/');
    });

    test('should allow user to logout successfully', async ({ page }) => {

        // Initialize Page Objects and shared components
        const loginPage = new Login(page);
        const dashboardPage = new Dashboard(page);
        const navbarComponent = new Navbar(page);

        await test.step('Verify user lands on Dashboard after login', async () => {
            // Confirms successful authentication + page readiness
            await dashboardPage.isLoaded();
        });

        await test.step('Perform logout from global navigation', async () => {
            // Uses reusable Navbar component → avoids duplication across pages
            await navbarComponent.logout();
        });

        await test.step('Validate user is redirected to Login page', async () => {
            // Centralized validation → keeps assertions consistent across tests
            await loginPage.redirectToLogin();
        });

    });
});