import { test, expect } from '../../fixtures/base.fixture';
import * as allure from 'allure-js-commons';

test.use({storageState: undefined});

test.describe('PIM security & Edge cases', () => { 

    test('Unauthorized Access to PIM Admin Features', async({page,loginPage})=>{

        // --- Allure Labels (non-deprecated way) ---
        await allure.label('epic', 'HR Management');
        await allure.label('feature', 'PIM Module');
        await allure.label('story', 'Unauthorized Access Protection');

        await allure.label('severity', 'critical');

        await allure.label('tag', 'security');
        await allure.label('tag', 'negative');
        await allure.label('tag', 'edge-case');

        await allure.owner('Deepak');
      

        await test.step('Go to Login page', async() => {
            await loginPage.navigate();
        });


        await test.step('User is redirected to login page', async() => {
            await loginPage.redirectToLogin();
        });


        await test.step('Login with credentials', async() => {
            // danny.rails , Active*89@BT
            const nonAdminUser = 'danny.rails';
            const nonAdminPassword = 'Active*89@BT';
            await loginPage.login(nonAdminUser, nonAdminPassword);
        });

        await test.step('Go to PIM page', async () => {
               await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/pim/viewEmployeeList');
        });

        await test.step('Should display Credential required', async() =>{
            const credRequiredText = 'Credential Required';
            await expect(page.locator('.oxd-alert--error').getByText(/credRequiredText/i)).toBeVisible();
        });

        await test.step('Should not display PIM link in Navigation', async() => {
            await expect(page.getByRole('link', { name: 'PIM' })).toBeHidden();
        });

    });

    test('verify Data Masking/Visibility', async({page,loginPage})=>{

       // --- Allure Metadata ---
        await allure.label('epic', 'HR Management');
        await allure.label('feature', 'PIM Module');
        await allure.story('Sensitive Data Protection');

        await allure.label('severity', 'critical');

        await allure.label('tag', 'security');
        await allure.label('tag', 'access-control');
        await allure.label('tag', 'edge-case');

        await allure.label('layer', 'UI');

        await allure.owner('Deepak');

        // Step 1: As an Admin, create an employee with sensitive details (e.g., Date of Birth or SSN if available).
        // Step 2: Login as a different non-admin user.
        // Step 3: Search for that employee.
        // Step 4: Verify that sensitive fields are either hidden, read-only, or masked (asterisks).
      


    });

});