import { Page, Locator, expect } from '@playwright/test';

export class PIMPage {

    // ==========================
    // Properties
    // ==========================

    private readonly page: Page;

    // Use role-based locators (more stable than CSS)
    private readonly addEmployeeButton: Locator;
    private readonly saveButton: Locator;
    private readonly searchButton: Locator;
    private readonly resetButton: Locator;

    private readonly firstNameInput: Locator;
    private readonly lastNameInput: Locator;

    // ==========================
    // Constructor
    // ==========================
    constructor(page: Page) {
        this.page = page;

        // Prefer accessible roles → resilient to UI changes
        this.addEmployeeButton = page.getByRole('button', { name: 'Add' });
        this.saveButton = page.getByRole('button', { name: 'Save' });
        this.searchButton = page.getByRole('button', { name: 'Search' });
        this.resetButton = page.getByRole('button', { name: 'Reset' });

        this.firstNameInput = page.getByPlaceholder('First Name');
        this.lastNameInput = page.getByPlaceholder('Last Name');
    }

    /**
     * Returns a specific employee row by ID
     * Scoped locator → avoids false positives across table
     */
    private getEmployeeRow(employeeId: string): Locator {
        return this.page.locator('.oxd-table-card').filter({ hasText: employeeId });
    }

    /**
     * Explicit navigation method
     * Avoids hidden navigation side-effects in other methods
     */
    async navigateToEmployeeList(): Promise<void> {
        await this.page.goto('/web/index.php/pim/viewEmployeeList');
        await expect(this.page).toHaveURL(/viewEmployeeList/);
    }

    /**
     * Adds a new employee
     * NOTE: Only performs action + minimal success validation
     * No hidden dependencies or extra flows
     */
    async addNewEmployee(firstName: string, lastName: string): Promise<string> {

        await this.addEmployeeButton.click();

        await this.firstNameInput.fill(firstName);
        await this.lastNameInput.fill(lastName);

        // Locate Employee ID field via label grouping (still slightly fragile)
        const idInput = this.page
            .locator('.oxd-input-group', { hasText: 'Employee Id' })
            .locator('input');

        // Wait for auto-generated ID to be populated
        await expect(idInput).not.toHaveValue('', { timeout: 10000 });

        // Better uniqueness (avoid collision in parallel runs)
        const uniqueId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
        await idInput.fill(uniqueId);

        const generatedId = await idInput.inputValue();

        await this.saveButton.click();

        // URL-based validation → more stable than toast
        await expect(this.page).toHaveURL(/viewPersonalDetails/, { timeout: 20000 });

        return generatedId;
    }

    /**
     * Search employee by ID
     * No hidden navigation → caller must control flow
     */
    async searchEmployeeById(employeeId: string): Promise<void> {

        // Explicit failure instead of silent navigation
        await expect(this.page).toHaveURL(/viewEmployeeList/);

        await this.resetButton.click();

        await this.page
            .locator('.oxd-input-group', { hasText: 'Employee Id' })
            .locator('input')
            .fill(employeeId);

        await this.searchButton.click();

        // Row-level validation (not full table text)
        await expect(this.getEmployeeRow(employeeId)).toHaveCount(1, { timeout: 10000 });
    }

    /**
     * Delete employee
     * No hidden dependency → flow is explicit
     */
    async deleteEmployeeById(employeeId: string): Promise<void> {

        // Caller must ensure navigation + search
        await expect(this.page).toHaveURL(/viewEmployeeList/);

        const employeeRow = this.getEmployeeRow(employeeId);

        await expect(employeeRow).toHaveCount(1);

        // Avoid fragile icon selector
        await employeeRow.getByRole('button').click(); // Assumes only one action button; refine if needed

        await this.page.getByRole('button', { name: 'Yes, Delete' }).click();

        // Avoid relying on toast → verify actual system state
        await this.searchButton.click();
        await expect(this.getEmployeeRow(employeeId)).toHaveCount(0);
    }

    /**
     * Verify employee absence
     * No silent error swallowing
     */
    async verifyEmployeeNotFoundById(employeeId: string): Promise<void> {

        const spinner = this.page.locator('.oxd-loading-spinner');

        // Controlled optional wait (no silent failure)
        if (await spinner.isVisible()) {
            await spinner.waitFor({ state: 'detached', timeout: 5000 });
        }

        const noRecordsMessage = this.page.locator('.orangehrm-horizontal-padding > .oxd-text--span');

        await expect(noRecordsMessage).toHaveText('No Records Found');

        await expect(this.getEmployeeRow(employeeId)).toHaveCount(0);
    }

    /**
     * Navigate to employee details
     * No test.step → POM stays framework-agnostic
     */
    async navigateToEmployeeDetails(id: string): Promise<void> {

        await this.page.goto(`/web/index.php/pim/viewPersonalDetails/empNumber/${id}`);

        await expect(this.page).toHaveURL(new RegExp(`.*${id}`));

        await expect(this.page.locator('.orangehrm-edit-employee-content')).toBeVisible();
    }

    /**
     * Update SSN
     * No test.step → reporting belongs to test layer
     */
    async updateSSN(ssnValue: string): Promise<void> {

        const ssnInput = this.page
            .locator('label:has-text("SSN Number")')
            .locator('xpath=./../..//input');

        await ssnInput.fill(ssnValue);

        await this.page.getByRole('button', { name: 'Save' }).first().click();

        // Still uses toast → acceptable as secondary signal, not primary validation
        const successToast = this.page.getByText('Successfully Updated');
        await expect(successToast).toBeVisible();
    }
}