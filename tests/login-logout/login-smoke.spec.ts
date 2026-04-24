import { test, expect } from '../../fixtures/base.fixture';
import * as allure from 'allure-js-commons';

// Ensures test runs in a clean, logged-out state
// Useful if other tests use stored authentication sessions
test.use({ storageState: undefined });

test.describe('@auth Login Smoke Suite', () => {

    test('should login successfully with valid credentials', async ({ loginPage, dashboardPage }) => {

        // --- Allure Metadata ---
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
            // Start from a known entry point
            await loginPage.navigate();
        });

        await test.step('Authenticate with valid credentials', async () => {
            // Hardcoded credentials (acceptable for learning/demo)
            // WARNING: Replace with env/config before using in real projects
            await loginPage.login('Admi', 'admin123');
        });

        await test.step('Verify user is redirected to Dashboard', async () => {
            // Reuse POM-level validation to avoid duplicating assertions
            await dashboardPage.isLoaded();
        });
    });

});