import { test } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { Navigation } from '../../pages/components/Navigation';
import { PIMPage } from '../../pages/PIMPage';

test.describe('PIM Employee Lifecycle', () => {

    /**
     * End-to-end test covering full employee lifecycle:
     * Add → Delete → Verify deletion
     * Ensures core PIM functionality works as expected
     */
    test('should complete add → search → delete employee flow', async ({ page }) => {

        // Initialize page object models for test interaction abstraction
        const loginPage = new LoginPage(page);
        const navigation = new Navigation(page);
        const pimPage = new PIMPage(page);

        // Navigate to application and perform login
        await loginPage.navigate();
        await loginPage.login('Admin', 'admin123');

        // Navigate to PIM module after successful login
        await navigation.goToPIM();

        // Step 1: Add a new employee and capture generated employee ID
        const employeeId = await test.step('Add new employee', async () => {
            return await pimPage.addNewEmployee('Ayush', 'Yadav');
        });

        // Step 2: Delete the newly created employee using captured ID
        await test.step('Delete employee', async () => {
            await pimPage.deleteEmployeeById(employeeId);
        });

        // Step 3: Verify that the employee no longer exists in the system
        await test.step('Verify deletion', async () => {
            await pimPage.verifyEmployeeNotFoundById(employeeId);
        });
    });
});