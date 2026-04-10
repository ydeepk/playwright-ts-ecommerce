import { Page, Locator, expect } from '@playwright/test';

export class PIMPage {
    private readonly page: Page;
    private readonly addEmployeeButton: Locator;
    private readonly saveButton: Locator;
    private readonly searchButton: Locator;
    private readonly resetButton: Locator;
    private readonly firstNameInput: Locator;
    private readonly lastNameInput: Locator;

    constructor(page: Page) {
        this.page = page;
        this.addEmployeeButton = page.getByRole('button', { name: 'Add' });
        this.saveButton = page.locator('button[type="submit"]');
        this.searchButton = page.getByRole('button', { name: 'Search' });
        this.resetButton = page.getByRole('button', { name: 'Reset' });
        this.firstNameInput = page.getByPlaceholder('First Name');
        this.lastNameInput = page.getByPlaceholder('Last Name');
    }

    private getEmployeeRow(employeeId: string): Locator {
        return this.page.locator('.oxd-table-card').filter({ hasText: employeeId });
    }

    async addNewEmployee(firstName: string, lastName: string): Promise<string> {
    await this.addEmployeeButton.click();
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);

    const idInput = this.page.locator('.oxd-input-group', { hasText: 'Employee Id' }).locator('input');
    await expect(idInput).not.toHaveValue('', { timeout: 10000 });
    const generatedId = await idInput.inputValue();

    await this.saveButton.click();

    // FINAL FIX: Instead of crashing if the toast is missed, 
    // we just wait for the URL change. If the URL changes to PersonalDetails, 
    // we KNOW it saved successfully.
    await expect(this.page).toHaveURL(/.*viewPersonalDetails/, { timeout: 20000 });
    
    return generatedId;
}

    async searchEmployeeById(employeeId: string): Promise<void> {
        if (!this.page.url().includes('viewEmployeeList')) {
            await this.page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/pim/viewEmployeeList');
        }
        await this.resetButton.click();
        await this.page.locator('.oxd-input-group', { hasText: 'Employee Id' }).locator('input').fill(employeeId);
        await this.searchButton.click();
        
        // Wait for specific ID text to appear in the table body
        await expect(this.page.locator('.oxd-table-body')).toContainText(employeeId, { timeout: 10000 });
    }

    async deleteEmployeeById(employeeId: string): Promise<void> {
    await this.searchEmployeeById(employeeId);
    const employeeRow = this.getEmployeeRow(employeeId);
    await expect(employeeRow).toHaveCount(1);
    
    await employeeRow.locator('button i.bi-trash').click();
    await this.page.getByRole('button', { name: 'Yes, Delete' }).click();
    
    // Wait for the deletion toast to disappear
    const toast = this.page.getByText('Successfully Deleted');
    await expect(toast).toBeVisible();
    await expect(toast).toBeHidden();

    // FINAL PIECE: After deleting, we must click Search again 
    // to confirm the table updates to "No Records Found"
    await this.searchButton.click();
}

async verifyEmployeeNotFoundById(employeeId: string): Promise<void> {
    // 1. Wait for any potential loading spinners to disappear
    await this.page.locator('.oxd-loading-spinner').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});

    // 2. Check for "No Records Found" anywhere in the main content area
    // We use a specific class that OrangeHRM uses for the empty state span
    const noRecordsMessage = this.page.locator('.orangehrm-horizontal-padding > .oxd-text--span');
    
    // We expect this to eventually show "No Records Found"
    await expect(noRecordsMessage).toHaveText('No Records Found', { timeout: 10000 });

    // 3. Absolute confirmation: The row with our ID must not exist
    const employeeRow = this.getEmployeeRow(employeeId);
    await expect(employeeRow).toHaveCount(0);

    console.log(`Success: Employee ${employeeId} is officially gone from the system.`);
}

}