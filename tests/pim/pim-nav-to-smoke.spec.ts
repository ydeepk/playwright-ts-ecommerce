import { test, expect } from '../../fixtures/base.fixture';

test.describe('@smoke Navigation to PIM', () => {

    test.beforeEach(async ({ page }) => {
        // This 'wakes up' the browser and takes it to the site
        // Because of Storage State, it will skip the login screen automatically
        await page.goto('/'); 

        // Defensive check: ensures session is still valid
        // If redirected to login → storageState expired or missing
        if (page.url().includes('auth/login')) {

            // Fail fast instead of continuing with broken state
            // Avoids misleading failures later in test steps
            throw new Error("Session expired. Please regenerate auth state.");
        }
    });

    test('Verify that the PIM (Personnel Information Management) module loads correctly', async ({ pimPage, navigation }) => {


        // Step 1: Navigate to PIM module
        await test.step('Navigate to PIM module', async () => {
            await navigation.goToPIM();
        });

        // Step 2: Verify the header contains page title or header says the PIM
        await test.step('Verify PIM page header', async () => { 
            await pimPage.verifyPIMHeader();
        });

        // Step 3: Verify Data Table Visibility: Check that the employee list table is visible.
        await test.step('Verify Data Table Visibility', async () => {
            await pimPage.verifyDataTableVisibility();
        });

        // Step 4: Verify Records Exist: 
        // (Crucial for Smoke) Check that at least one row exists or the "Records Found" text is present. This proves the database connection is active.
        await test.step('verify at least one record exists', async() => {
            await pimPage.verifyRecordExistsInTable();
        });

        // Step 5: Verify Action Buttons: Ensure the "Add" and "Search" buttons are enabled.
        await test.step('Verify action buttons enabled - Add & Search', async() => {
            await pimPage.verifyIfEnabledButton();
        });
    });
});