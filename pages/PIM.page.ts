import { Page, Locator, expect } from '@playwright/test';

export class PIMPage {

    // ==========================
    // Core
    // ==========================
    private readonly page: Page;

    // ==========================
    // Action Buttons
    // ==========================
    private readonly addButton: Locator;
    private readonly saveButton: Locator;
    private readonly searchButton: Locator;
    private readonly resetButton: Locator;

    // ==========================
    // Form Inputs
    // ==========================
    private readonly firstNameInput: Locator;
    private readonly lastNameInput: Locator;
    private readonly employeeIdInput: Locator;
    private readonly ssnInput: Locator;

    // ==========================
    // UI Elements / Containers
    // ==========================
    private readonly headerTitle: Locator;
    private readonly employeeTable: Locator;
    private readonly tableRecords: Locator;
    private readonly recordsFoundText: Locator;

    // ==========================
    // Feedback / State Elements
    // ==========================
    private readonly spinner: Locator;
    private readonly noRecordsMessage: Locator;
    private readonly successToast: Locator;

    // ==========================
    // Constructor
    // ==========================
    constructor(page: Page) {
        this.page = page;

        // Buttons
        this.addButton = page.getByRole('button', { name: 'Add' });
        this.saveButton = page.getByRole('button', { name: 'Save' });
        this.searchButton = page.getByRole('button', { name: 'Search' });
        this.resetButton = page.getByRole('button', { name: 'Reset' });

        // Inputs
        this.firstNameInput = page.getByPlaceholder('First Name');
        this.lastNameInput = page.getByPlaceholder('Last Name');

        this.employeeIdInput = page
            .locator('.oxd-input-group', { hasText: 'Employee Id' })
            .locator('input');

        this.ssnInput = page
            .locator('label:has-text("SSN Number")')
            .locator('xpath=./../..//input');

        // Containers
        this.headerTitle = page.locator('.oxd-topbar-header-title');
        this.employeeTable = page.locator('.orangehrm-container');
        this.tableRecords = page.locator('.oxd-table-card');

        this.recordsFoundText = page
            .locator('span.oxd-text--span')
            .filter({ hasText: /Records Found/ });

        // State / feedback
        this.spinner = page.locator('.oxd-loading-spinner');
        this.noRecordsMessage = page.locator('.orangehrm-horizontal-padding > .oxd-text--span');
        this.successToast = page.getByText('Successfully Updated');
    }

    /**
     * Returns a specific employee row by ID
     * Uses row-level filtering to avoid matching incorrect cells
     */
    private getEmployeeRow(employeeId: string): Locator {
        return this.tableRecords.filter({ hasText: employeeId });
    }

    /**
     * Navigates to employee list page
     * Explicit navigation avoids hidden dependencies between methods
     */
    async navigateToEmployeeList(): Promise<void> {
        await this.page.goto('/web/index.php/pim/viewEmployeeList');
        await expect(this.page).toHaveURL(/viewEmployeeList/);
    }

    /**
     * Creates a new employee and returns generated ID
     * Combines form interaction with minimal validation
     */
    async addNewEmployee(firstName: string, lastName: string): Promise<string> {

        await this.addButton.click();
        await expect(this.page).toHaveURL(/addEmployee/);

        await this.firstNameInput.fill(firstName);
        await this.lastNameInput.fill(lastName);

        await expect(this.employeeIdInput).not.toHaveValue('', { timeout: 10000 });

        const uniqueId = (Date.now().toString(36) + Math.random().toString(36).slice(2, 6)).slice(-10);
        await this.employeeIdInput.fill(uniqueId);

        const generatedId = await this.employeeIdInput.inputValue();

        await this.saveButton.click();

        await expect(this.page).toHaveURL(/viewPersonalDetails/i, { timeout: 20000 });

        return generatedId;
    }

    /**
     * Performs search action only
     * Does not assert results to allow reuse for positive and negative scenarios
     */
    async searchEmployeeById(employeeId: string): Promise<void> {

        await expect(this.page).toHaveURL(/viewEmployeeList/);

        await this.resetButton.click();
        await this.employeeIdInput.fill(employeeId);
        await this.searchButton.click();
    }

    /**
     * Verifies employee exists in search results
     */
    async verifyEmployeePresent(employeeId: string): Promise<void> {
        await expect(this.getEmployeeRow(employeeId)).toHaveCount(1, { timeout: 10000 });
    }

    /**
     * Deletes employee by ID
     * Assumes search has already been performed or row is visible
     */
    async deleteEmployeeById(employeeId: string): Promise<void> {

        await expect(this.page).toHaveURL(/viewEmployeeList/);

        const employeeRow = this.getEmployeeRow(employeeId);

        await expect(employeeRow).toHaveCount(1);

        await employeeRow.locator('.bi-trash').click();
        await this.page.getByRole('button', { name: 'Yes, Delete' }).click();

        await this.searchButton.click();
        await expect(this.getEmployeeRow(employeeId)).toHaveCount(0);
    }

    /**
     * Verifies employee does not exist in results
     * Assumes search has already been performed
     */
    async verifyEmployeeNotFound(employeeId: string): Promise<void> {

        if (await this.spinner.isVisible()) {
            await this.spinner.waitFor({ state: 'detached', timeout: 10000 });
        }

        await expect(this.noRecordsMessage).toHaveText('No Records Found');
        await expect(this.getEmployeeRow(employeeId)).toHaveCount(0);
    }

    /**
     * Navigates to employee details page
     * ID must be defined; undefined indicates test issue
     */
    async navigateToEmployeeDetails(id: string): Promise<void> {

        await this.page.goto(`/web/index.php/pim/viewPersonalDetails/empNumber/${id}`);

        await expect(this.page).toHaveURL(new RegExp(`.*${id}`));
        await expect(this.page.locator('.orangehrm-edit-employee-content')).toBeVisible();
    }

    /**
     * Updates SSN value
     * Uses toast only as secondary confirmation signal
     */
    async updateSSN(ssnValue: string): Promise<void> {

        await this.ssnInput.fill(ssnValue);
        await this.page.getByRole('button', { name: 'Save' }).first().click();

        await expect(this.successToast).toBeVisible();
    }

    /**
     * Validates PIM header visibility
     */
    async verifyPIMHeader(): Promise<void> {
        await expect(this.headerTitle).toBeVisible();
        await expect(this.headerTitle).toContainText('PIM');
    }

    /**
     * Validates employee table is visible
     */
    async verifyDataTableVisibility(): Promise<void> {
        await expect(this.employeeTable).toBeVisible();
    }
    
    /**
     * Validates at least one record exists in table
     */
    async verifyRecordExistsInTable(): Promise<void> {
        await expect(this.recordsFoundText).toBeVisible();

        const count = await this.tableRecords.count();
        expect(count).toBeGreaterThan(0);
    }

    /**
     * Validates primary actions are enabled
     */
    async verifyIfEnabledButton(): Promise<void> {
        await expect(this.addButton).toBeEnabled();
        await expect(this.searchButton).toBeEnabled();
    }
}