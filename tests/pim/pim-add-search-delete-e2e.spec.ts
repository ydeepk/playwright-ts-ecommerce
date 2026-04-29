import { test, expect } from '../../fixtures/base.fixture';
import * as allure from 'allure-js-commons';

// Regression suite for PIM employee lifecycle
// Assumes authenticated session is handled via storageState
test.describe('@regression PIM Employee Lifecycle', () => {

    test.beforeEach(async ({ page }) => {

        await page.goto('/');

        // Ensures session validity before test execution
        // Fails early to prevent cascading false failures
        if (page.url().includes('auth/login')) {
            throw new Error('Session expired. Regenerate auth state.');
        }
    });

    /**
     * End-to-end employee lifecycle validation:
     * Create → Delete → Verify deletion
     *
     * Covers:
     * - Data creation
     * - Record targeting via unique ID
     * - Deletion workflow
     * - Post-deletion UI validation
     */
    test('should complete employee lifecycle: create → delete → verify absence', async ({ pimPage, navigation }) => {

        // Allure metadata for reporting and traceability
        await allure.label('epic', 'HR Management');
        await allure.label('feature', 'PIM Module');
        await allure.label('story', 'Employee Lifecycle Management');
        await allure.label('severity', 'critical');

        await allure.label('tag', 'regression');
        await allure.label('tag', 'e2e');
        await allure.label('tag', 'data-integrity');

        await allure.owner('Deepak');

        await test.step('Navigate to PIM module', async () => {
            await navigation.goToPIM();
        });

        // Create employee with unique identifier to avoid collisions
        const employeeId = await test.step('Create new employee', async () => {
            return await pimPage.addNewEmployee(`Ayush ${Date.now()}`, 'Yadav');
        });

        await test.step('Navigate to employee list', async () => {
            await pimPage.navigateToEmployeeList();
        });

        await test.step('Delete employee by ID', async () => {
            await pimPage.deleteEmployeeById(employeeId);
        });

        await test.step('Search employee by ID', async () => {
            // Action only; no assertion inside search method
            await pimPage.searchEmployeeById(employeeId);
        });

        await test.step('Verify employee is not present in results', async () => {
            // Validates UI state after deletion
            await pimPage.verifyEmployeeNotFound(employeeId);
        });
    });
});