import { test } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { Navigation } from '../../pages/components/Navigation';
import { PIMPage } from '../../pages/PIMPage';

test.describe('PIM Employee Lifecycle', () => {
    test('should complete add → search → delete employee flow', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const navigation = new Navigation(page);
        const pimPage = new PIMPage(page);

        await loginPage.navigate();
        await loginPage.login('Admin', 'admin123');
        await navigation.goToPIM();

        const employeeId = await test.step('Add new employee', async () => {
            return await pimPage.addNewEmployee('Ayush', 'Yadav');
        });

        await test.step('Delete employee', async () => {
            await pimPage.deleteEmployeeById(employeeId);
        });

        await test.step('Verify deletion', async () => {
            await pimPage.verifyEmployeeNotFoundById(employeeId);
        });
    });
});