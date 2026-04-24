import { test, expect } from '../../fixtures/base.fixture';
import * as allure from 'allure-js-commons';

// Regression suite for PIM employee lifecycle
// Assumes authenticated session is already handled externally (e.g., storageState)
test.describe('@regression PIM Employee Lifecycle', () => {

    test.beforeEach(async ({ page }) => {

        await page.goto('/');

        // Defensive check: ensures session is still valid
        // If redirected to login → storageState expired or missing
        if (page.url().includes('auth/login')) {

            // Fail fast instead of continuing with broken state
            // Avoids misleading failures later in test steps
            throw new Error("Session expired. Please regenerate auth state.");
        }
    });

    /**
     * End-to-end validation of employee lifecycle:
     * Add → Delete → Verify deletion
     *
     * Validates:
     * - Employee creation flow
     * - Correct data persistence (ID-based targeting)
     * - Deletion workflow
     * - Post-deletion verification via UI search
     */
    test('should complete add → search → delete employee flow', async ({ pimPage, navigation }) => {

        // --- Allure Metadata ---
        await allure.label('epic', 'HR Management');
        await allure.label('feature', 'PIM Module');
        await allure.label('story', 'Employee Lifecycle Management');

        await allure.label('severity', 'critical');

        await allure.label('tag', 'regression');
        await allure.label('tag', 'e2e');
        await allure.label('tag', 'data-integrity');

        await allure.owner('Deepak');
        
        await test.step('Navigate to PIM', async()=> {
            // Navigate to PIM module (requires valid session)
            await navigation.goToPIM();
        });

        // Create employee and capture system-generated ID
        // ID is critical to avoid flaky name-based operations
        const employeeId = await test.step('Create new employee', async () => {
            return await pimPage.addNewEmployee(`Ayush ${Date.now()}`, 'Yadav');
        });

        await test.step('Delete employee by ID', async () => {
            // Ensures correct record is deleted (no ambiguity)
            await pimPage.deleteEmployeeById(employeeId);
        });

        await test.step('Verify employee is no longer present', async () => {
            // UI-level validation (not just API/action success)
            await pimPage.verifyEmployeeNotFoundById(employeeId);
        });
    });
});