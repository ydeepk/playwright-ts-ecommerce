import { test } from '@playwright/test';
import { Navigation } from '../../pages/components/Navigation';
import { PIMPage } from '../../pages/PIMPage';

test.describe('@regression PIM Employee Lifecycle', () => {


    test.beforeEach(async ({ page }) => {
        // This 'wakes up' the browser and takes it to the site
        // Because of Storage State, it will skip the login screen automatically
        await page.goto('/'); 
    });
    
    /**
     * End-to-end test covering full employee lifecycle:
     * Add → Delete → Verify deletion
     * Ensures core PIM functionality works as expected
     */
    test('should complete add → search → delete employee flow', async ({ page }) => {

        // Initialize page object models for test interaction abstraction
        const navigation = new Navigation(page);
        const pimPage = new PIMPage(page);

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