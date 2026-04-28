import { test, expect } from '../../fixtures/base.fixture';
import * as allure from 'allure-js-commons';
import { USERS } from '../../config/credentials';

// Clear storage to ensure a clean login state for security testing
test.use({ storageState: undefined });

test.describe('PIM Security & Edge Cases', () => {

    test('Unauthorized Access to PIM Admin Features', async ({ page, loginPage, pimPage }) => {
        // --- Metadata ---
        await allure.label('epic', 'HR Management');
        await allure.label('feature', 'PIM Module');
        await allure.label('story', 'Unauthorized Access Protection');
        await allure.label('severity', 'critical');
        await allure.owner('Deepak');

        await test.step('Login with ESS credentials', async () => {
            await loginPage.navigate();
            // Moved credentials to variables or constants
            await loginPage.login(USERS.ESS.username, USERS.ESS.password);
        });

        await test.step('Attempt direct navigation to PIM list', async () => {
            // Using POM method instead of raw page.goto
            await pimPage.navigateToEmployeeList(); 
        });

        await test.step('Verify "Credential Required" error is displayed', async () => {
            const errorMsg = 'Credential Required';
            // Correct way to use variable in Regex
            await expect(page.locator('.oxd-alert--error').getByText(new RegExp(errorMsg, 'i')))
                .toBeVisible();
        });

        await test.step('Verify PIM link is hidden from side navigation', async () => {
            // This is a great check for UI-level security
            await expect(page.getByRole('link', { name: 'PIM' })).toBeHidden();
        });
    });

    test('should mask sensitive employee data for non-admin users', async ({ page, browser, pimPage, loginPage }) => {
        const firstName = 'Secure';
        const lastName = 'User';
        const ssnValue = '999-66-1111';
        let generatedId: string;

        await test.step('Admin: Create employee with SSN', async () => {
            // Note: This assumes current state is Admin (from your base fixture/auth)
            generatedId = await pimPage.addNewEmployee(firstName, lastName);
            
            // POM method for navigation
            await pimPage.navigateToEmployeeDetails(generatedId);
            
            // Logic to fill SSN should be inside pimPage.fillPersonalDetails({...})
            await pimPage.updateSSN(ssnValue);
            await expect(page.getByText('Successfully Updated')).toBeVisible();
        });

        // Simulating the second user
        const essContext = await browser.newContext();
        const essPage = await essContext.newPage();

        await test.step('ESS User: Verify SSN is masked', async () => {
            // You can wrap this in a helper or keep it as is for context switching
            await essPage.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
            await essPage.fill('input[name="username"]', USERS.ESS.username); 
            await essPage.fill('input[name="password"]', USERS.ESS.password);
            await essPage.click('button[type="submit"]');

            await essPage.goto(`/web/index.php/pim/viewPersonalDetails/empNumber/${generatedId}`);
            
            const ssnField = essPage.locator('label:has-text("SSN Number")').locator('xpath=./../..//input');
            const actualValue = await ssnField.inputValue();
            
            expect(actualValue).not.toBe(ssnValue); 
            expect(actualValue).toContain('*'); 
            await expect(ssnField).toBeDisabled();
        });

        await essContext.close();
    });
});