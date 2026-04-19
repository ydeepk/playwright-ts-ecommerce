import { test } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { NavbarComponent } from '../../pages/components/NavbarComponent';

// Forces test to start without any persisted authentication
// Useful when other suites rely on stored sessions (auth fixtures, storageState files)
test.use({ storageState: undefined });

test.describe('@smoke Logout Flow', () => {

    test('should allow user to logout successfully', async ({ page }) => {

        // Initialize Page Objects and shared components
        const loginPage = new LoginPage(page);
        const dashboardPage = new DashboardPage(page);
        const navbarComponent = new NavbarComponent(page);

        await test.step('Authenticate user with valid credentials', async () => {
            // Direct login action; assumes credentials are valid and stable
            await loginPage.login('Admin', 'admin123');
        });

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