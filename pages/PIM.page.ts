import { Page, Locator, expect } from '@playwright/test';

export class PIMPage {

    // ==========================
    // Properties
    // ==========================

    private readonly page: Page;

    // Role-based locators → resilient and readable
    private readonly addButton: Locator;
    private readonly saveButton: Locator;
    private readonly searchButton: Locator;
    private readonly resetButton: Locator;

    private readonly firstNameInput: Locator;
    private readonly lastNameInput: Locator;

    // Centralized locators improve reuse and reduce duplication
    private readonly headerTitle: Locator;
    private readonly employeeTable: Locator;
    private readonly tableRecords: Locator;
    private readonly recordsFoundText: Locator;
  
    // ==========================
    // Constructor
    // ==========================
    constructor(page: Page) {
        this.page = page;

        this.addButton = page.getByRole('button', { name: 'Add' });
        this.saveButton = page.getByRole('button', { name: 'Save' });
        this.searchButton = page.getByRole('button', { name: 'Search' });
        this.resetButton = page.getByRole('button', { name: 'Reset' });

        this.firstNameInput = page.getByPlaceholder('First Name');
        this.lastNameInput = page.getByPlaceholder('Last Name');

        this.headerTitle = page.locator('.oxd-topbar-header-title');
        this.employeeTable = page.locator('.orangehrm-container');

        // Row-level locator reused across validations → good design
        this.tableRecords = page.locator('.oxd-table-card');

        this.recordsFoundText = page
            .locator('span.oxd-text--span')
            .filter({ hasText: /Records Found/ });
    }

    /**
     * Returns a specific employee row by ID
     * Scoped locator → avoids false positives across table
     */
    private getEmployeeRow(employeeId: string): Locator {
        return this.tableRecords.filter({ hasText: employeeId });
    }

    /**
     * Explicit navigation method
     * Removes hidden coupling from other methods
     */
    async navigateToEmployeeList(): Promise<void> {
        await this.page.goto('/web/index.php/pim/viewEmployeeList');
        await expect(this.page).toHaveURL(/viewEmployeeList/);
    }

    /**
     * Adds a new employee
     * Clean flow with minimal assumptions
     */
    async addNewEmployee(firstName: string, lastName: string): Promise<string> {

        await this.addButton.click();

        await this.firstNameInput.fill(firstName);
        await this.lastNameInput.fill(lastName);

        // Label-based targeting → acceptable but still slightly brittle
        const idInput = this.page
            .locator('.oxd-input-group', { hasText: 'Employee Id' })
            .locator('input');

        await expect(idInput).not.toHaveValue('', { timeout: 10000 });

        // Better uniqueness vs simple timestamp
        const uniqueId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
        await idInput.fill(uniqueId);

        const generatedId = await idInput.inputValue();

        await this.saveButton.click();

        // URL validation is stable vs toast-based validation
        await expect(this.page).toHaveURL(/viewPersonalDetails/, { timeout: 20000 });

        return generatedId;
    }

    /**
     * Search employee by ID
     * Enforces page precondition explicitly
     */
    async searchEmployeeById(employeeId: string): Promise<void> {

        await expect(this.page).toHaveURL(/viewEmployeeList/);

        await this.resetButton.click();

        await this.page
            .locator('.oxd-input-group', { hasText: 'Employee Id' })
            .locator('input')
            .fill(employeeId);

        await this.searchButton.click();

        // Row-level assertion → avoids false positives from table text
        await expect(this.getEmployeeRow(employeeId)).toHaveCount(1, { timeout: 10000 });
    }

    /**
     * Delete employee
     * Flow is explicit, no hidden dependencies
     */
    async deleteEmployeeById(employeeId: string): Promise<void> {

        await expect(this.page).toHaveURL(/viewEmployeeList/);

        const employeeRow = this.getEmployeeRow(employeeId);

        await expect(employeeRow).toHaveCount(1);

        // NOTE: Assumes single actionable button in row → refine if UI evolves
        await employeeRow.getByRole('button').click();

        await this.page.getByRole('button', { name: 'Yes, Delete' }).click();

        // State validation instead of toast → correct approach
        await this.searchButton.click();
        await expect(this.getEmployeeRow(employeeId)).toHaveCount(0);
    }

    /**
     * Verify employee absence
     * Handles async loading safely
     */
    async verifyEmployeeNotFoundById(employeeId: string): Promise<void> {

        const spinner = this.page.locator('.oxd-loading-spinner');

        // Conditional wait avoids unnecessary timeout failures
        if (await spinner.isVisible()) {
            await spinner.waitFor({ state: 'detached', timeout: 5000 });
        }

        const noRecordsMessage = this.page.locator('.orangehrm-horizontal-padding > .oxd-text--span');

        await expect(noRecordsMessage).toHaveText('No Records Found');

        await expect(this.getEmployeeRow(employeeId)).toHaveCount(0);
    }

    /**
     * Navigate to employee details
     * Clean, deterministic navigation
     */
    async navigateToEmployeeDetails(id: string | undefined): Promise<void> {

        await this.page.goto(`/web/index.php/pim/viewPersonalDetails/empNumber/${id}`);

        await expect(this.page).toHaveURL(new RegExp(`.*${id}`));

        await expect(this.page.locator('.orangehrm-edit-employee-content')).toBeVisible();
    }

    /**
     * Update SSN
     * Keeps POM focused on actions, not test reporting
     */
    async updateSSN(ssnValue: string): Promise<void> {

        const ssnInput = this.page
            .locator('label:has-text("SSN Number")')
            .locator('xpath=./../..//input');

        await ssnInput.fill(ssnValue);

        await this.page.getByRole('button', { name: 'Save' }).first().click();

        // NOTE: Toast used as secondary signal only (acceptable fallback)
        const successToast = this.page.getByText('Successfully Updated');
        await expect(successToast).toBeVisible();
    }

    async verifyPIMHeader(): Promise<void> {
        // High-level UI validation (smoke-level check)
        await expect(this.headerTitle).toBeVisible();
        await expect(this.headerTitle).toContainText('PIM');
    }

    async verifyDataTableVisibility(): Promise<void> {
        // Validates table container presence (page readiness indicator)
        await expect(this.employeeTable).toBeVisible();
    }
    
    async verifyRecordExistsInTable(): Promise<void> {
        // Combines UI indicator + DOM validation for stronger confidence
        await expect(this.recordsFoundText).toBeVisible();
        
        const count = await this.tableRecords.count();
        expect(count).toBeGreaterThan(0);
    }

    async verifyIfEnabledButton(): Promise<void> {
        // Validates critical actions are interactive (sanity check)
        await expect(this.addButton).toBeEnabled();
        await expect(this.searchButton).toBeEnabled();
    }
}