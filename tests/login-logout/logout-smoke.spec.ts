import { test, expect } from '../../fixtures/base.fixture';
import * as allure from 'allure-js-commons';

test.describe('@auth Logout Flow', () => {

    test('should logout user and invalidate session', async ({ loginPage, dashboardPage, navbar }) => {

        // Allure metadata for traceability
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
            // Establish known entry point
            await loginPage.navigate();
        });

        await test.step('Login with valid credentials', async () => {
            // Credentials should be externalized for real environments
            await loginPage.login('Admin', 'admin123');
        });

        await test.step('Verify dashboard is loaded after login', async () => {
            // Confirms authentication success and page readiness
            await dashboardPage.isLoaded();
        });

        await test.step('Logout via navigation menu', async () => {
            // Uses shared navbar component to perform logout action
            await navbar.logout();
        });

        await test.step('Verify user is redirected to login page', async () => {
            // Validates logout effect instead of navigating manually
            await loginPage.verifyLoginPageLoaded();
        });

    });
});