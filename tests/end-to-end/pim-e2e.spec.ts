import { test } from '@playwright/test';
import { Navigation } from '../../pages/components/Navigation';
import { PIMPage } from '../../pages/PIMPage';

test.describe('@regression PIM Employee Lifecycle', () => {

    test.beforeEach(async ({ page }) => {
        // Navigate to application root
        // Assumes authenticated session is already available via storageState
        await page.goto('/');
    });

    /**
     * End-to-end validation of employee lifecycle:
     * Add → Delete → Verify deletion
     *
     * Covers:
     * - Employee creation
     * - Data persistence
     * - Deletion workflow
     */
    test('should complete add → search → delete employee flow', async ({ page }) => {

        // Initialize reusable components and page objects
        const navigation = new Navigation(page);
        const pimPage = new PIMPage(page);

        // Navigate to PIM module (post-login state assumed)
        await navigation.goToPIM();

        // Create employee and capture generated ID (critical for downstream steps)
        const employeeId = await test.step('Create new employee', async () => {
            return await pimPage.addNewEmployee('Ayush', 'Yadav');
        });

        await test.step('Delete employee by ID', async () => {
            // Uses captured ID to ensure correct record is targeted
            await pimPage.deleteEmployeeById(employeeId);
        });

        await test.step('Verify employee is no longer present', async () => {
            // Confirms deletion at UI/search level (not just action success)
            await pimPage.verifyEmployeeNotFoundById(employeeId);
        });
    });
});