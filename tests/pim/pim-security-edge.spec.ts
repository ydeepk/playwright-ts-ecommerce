import { test, expect } from '../../fixtures/base.fixture';
import * as allure from 'allure-js-commons';
import { USERS } from '../../config/credentials';
import { LoginPage } from '../../pages/Login.page';
import { PIMPage } from '../../pages/PIM.page';

// Clear storage to ensure a clean login state for security testing
// Good use for security scenarios to avoid session leakage between tests
test.use({ storageState: undefined });

test.describe('PIM Security & Edge Cases', () => {

    let generatedId: string | undefined;

    test.afterEach(async ({ pimPage }) => {
    if (generatedId) {
        await pimPage.navigateToEmployeeList();
        await pimPage.searchEmployeeById(generatedId);
        await pimPage.deleteEmployeeById(generatedId);
        generatedId = undefined; // critical reset
    }
});

    test('Employee Self Service user should not access PIM via UI or direct URL', async ({ page, loginPage, pimPage }) => {
        // --- Metadata ---
        // Well-structured Allure metadata improves traceability and reporting
        await allure.label('epic', 'HR Management');
        await allure.label('feature', 'PIM Module');
        await allure.label('story', 'Unauthorized Access Protection');
        await allure.label('severity', 'critical');
        await allure.owner('Deepak');

        await test.step('Login with ESS credentials', async () => {
            // Using POM instead of raw navigation keeps abstraction clean
            await loginPage.navigate();
            await loginPage.login(USERS.ESS.username, USERS.ESS.password);
        });

        await test.step('Verify direct access to PIM is blocked', async () => {
            // Direct URL validation ensures backend-level authorization, not just UI restriction
            await pimPage.navigateToEmployeeList(); 
            await expect(page.getByText(/Credential Required/i)).toBeVisible();
            // Consider adding URL assertion for stronger validation of access denial
        });

        await test.step('Verify PIM link is hidden in sidebar', async () => {
            // UI-level validation complements backend check; ensures proper role-based rendering
            await expect(page.getByRole('link', { name: 'PIM' })).toBeHidden();
        });
    });

    test('ESS user should see masked sensitive employee data and restricted edit access', async ({ page, browser, pimPage, loginPage }) => {
        const firstName = 'Secure';
        const lastName = 'User';
        const ssnValue = '999-66-1111';
       

        await test.step('Admin: Create employee with SSN', async () => {
            // Good reuse of POM for entity creation
            generatedId = await pimPage.addNewEmployee(firstName, lastName);
            
            // Explicit navigation ensures deterministic state before update
            await pimPage.navigateToEmployeeDetails(generatedId);
            
            // Encapsulated update logic in POM improves maintainability
            await pimPage.updateSSN(ssnValue);
            
            const ssnField = page
                .locator('label:has-text("SSN Number")')
                .locator('xpath=./../..//input');
            // State-based validation (field value) is more reliable than toast checks

            await expect(ssnField).toHaveValue(ssnValue);
        });

        // Simulating the second user
        const essContext = await browser.newContext();
        const essPage = await essContext.newPage();
        const essLoginPage = new LoginPage(essPage);
        const essPIMPage = new PIMPage(essPage);
        // Correct multi-context isolation to simulate different user roles

        await test.step('ESS User: Verify SSN is masked', async () => {
            // Reusing POM in new context avoids duplication and keeps logic consistent
            await essLoginPage.navigate();
            await essLoginPage.login(USERS.ESS.username, USERS.ESS.password);

            await essPIMPage.navigateToEmployeeDetails(generatedId);
            
            const ssnField = essPage
                .locator('label:has-text("SSN Number")')
                .locator('xpath=./../..//input');

            const actualValue = await ssnField.inputValue();
            
            // Validates masking behavior rather than exact value
            expect(actualValue).not.toBe(ssnValue); 
            expect(actualValue).toContain('*'); 
            // Consider stricter masking validation (e.g., no digits exposed)

            await expect(ssnField).toBeDisabled();
            // Field disabled check ensures UI-level restriction on sensitive data editing
        });

        await essContext.close();
        // Explicit context cleanup prevents resource leakage in parallel runs
    });
});