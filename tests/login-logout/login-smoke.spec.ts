import { test, expect } from '../../fixtures/base.fixture';
import * as allure from 'allure-js-commons';

// Ensures test runs in a clean, logged-out state
// Prevents interference from stored authentication sessions
test.use({ storageState: undefined });

test.describe('@auth Login Smoke Suite', () => {

    test('should login successfully with valid credentials', async ({ loginPage, dashboardPage }) => {

        // Allure metadata for reporting and traceability
        await allure.label('epic', 'Authentication');
        await allure.label('feature', 'Login');
        await allure.story('Valid User Login');
        await allure.label('severity', 'blocker');

        await allure.label('tag', 'smoke');
        await allure.label('tag', 'auth');
        await allure.label('tag', 'ui');

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
            // Confirms successful authentication and page readiness
            await dashboardPage.isLoaded();
        });
    });

});