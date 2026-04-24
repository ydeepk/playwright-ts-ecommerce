import { test, expect } from '../../fixtures/base.fixture';
import * as allure from 'allure-js-commons';

test.describe('@auth Logout Flow', () => {

    test('should allow user to logout successfully', async ({ loginPage, dashboardPage, navbar }) => {

        // --- Allure Metadata ---
        await allure.label('epic', 'Authentication');
        await allure.label('feature', 'Session Management');
        await allure.story('User Logout Flow');

        await allure.label('severity', 'critical');

        await allure.label('tag', 'auth');
        await allure.label('tag', 'e2e');
        await allure.label('tag', 'session');

        await allure.label('layer', 'UI');

        await allure.owner('Deepak');

        await test.step('Navigate to login page', async () => {
            // Start from a known entry point
            await loginPage.navigate();
        });

        await test.step('Authenticate with valid credentials', async () => {
            // Hardcoded credentials (acceptable for learning/demo)
            // WARNING: Replace with env/config before using in real projects
            await loginPage.login('Admin', 'admin123');
        });

        await test.step('Verify user lands on Dashboard after login', async () => {
            // Confirms successful authentication + page readiness
            await dashboardPage.isLoaded();
        });

        await test.step('Perform logout from global navigation', async () => {
            // Uses reusable Navbar component → avoids duplication across pages
            await navbar.logout();
        });

        await test.step('Validate user is redirected to Login page', async () => {
            // Centralized validation → keeps assertions consistent across tests
            await loginPage.redirectToLogin();
        });

    });
});