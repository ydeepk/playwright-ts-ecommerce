import { Page, Locator, expect } from '@playwright/test';

export class PIM {

    // ==========================
    // Properties
    // ==========================

    // Playwright Page instance for interacting with the PIM module
    private readonly page: Page;

    // UI action buttons
    private readonly addEmployeeButton: Locator; // Triggers employee creation flow
    private readonly saveButton: Locator;        // Submits employee form
    private readonly searchButton: Locator;      // Executes employee search
    private readonly resetButton: Locator;       // Clears search filters

    // Employee input fields
    private readonly firstNameInput: Locator;    // Input for employee first name
    private readonly lastNameInput: Locator;     // Input for employee last name

    // ==========================
    // Constructor
    // ==========================
    constructor(page: Page) {
        // Initialize Playwright page reference
        this.page = page;

        // Initialize UI element locators using accessible roles and placeholders
        this.addEmployeeButton = page.getByRole('button', { name: 'Add' });
        this.saveButton = page.locator('button[type="submit"]');
        this.searchButton = page.getByRole('button', { name: 'Search' });
        this.resetButton = page.getByRole('button', { name: 'Reset' });
        this.firstNameInput = page.getByPlaceholder('First Name');
        this.lastNameInput = page.getByPlaceholder('Last Name');
    }

    /**
     * Returns a locator for a specific employee row based on employee ID
     * Uses text filtering to match the correct table row
     * @param employeeId - Unique identifier of the employee
     */
    private getEmployeeRow(employeeId: string): Locator {
        return this.page.locator('.oxd-table-card').filter({ hasText: employeeId });
    }

    /**
     * Adds a new employee and returns the auto-generated employee ID
     * Relies on URL change as a stable success indicator instead of transient UI elements
     * @param firstName - Employee's first name
     * @param lastName - Employee's last name
     * @returns Generated employee ID
     */
    async addNewEmployee(firstName: string, lastName: string): Promise<string> {
        // Navigate to add employee form
        await this.addEmployeeButton.click();

        // Fill mandatory fields
        await this.firstNameInput.fill(firstName);
        await this.lastNameInput.fill(lastName);

        // Locate Employee ID input dynamically based on label grouping
        const idInput = this.page.locator('.oxd-input-group', { hasText: 'Employee Id' }).locator('input');

        // Wait until system-generated ID is populated
        await expect(idInput).not.toHaveValue('', { timeout: 10000 });

        // Capture generated employee ID for later validation
        const generatedId = await idInput.inputValue();

        // Submit the form
        await this.saveButton.click();

        // Validate successful save via URL change instead of relying on toast notifications
        await expect(this.page).toHaveURL(/.*viewPersonalDetails/, { timeout: 20000 });

        return generatedId;
    }

    /**
     * Searches for an employee using their ID
     * Ensures navigation to correct page and resets filters before searching
     * @param employeeId - Employee ID to search for
     */
    async searchEmployeeById(employeeId: string): Promise<void> {
        // Ensure correct page context before performing search
        if (!this.page.url().includes('viewEmployeeList')) {
            await this.page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/pim/viewEmployeeList');
        }

        // Reset any existing filters to ensure clean search state
        await this.resetButton.click();

        // Enter employee ID into search field
        await this.page.locator('.oxd-input-group', { hasText: 'Employee Id' }).locator('input').fill(employeeId);

        // Trigger search action
        await this.searchButton.click();

        // Validate that the table contains the expected employee ID
        await expect(this.page.locator('.oxd-table-body')).toContainText(employeeId, { timeout: 10000 });
    }

    /**
     * Deletes an employee based on employee ID
     * Includes validation of deletion via toast and table refresh
     * @param employeeId - Employee ID to delete
     */
    async deleteEmployeeById(employeeId: string): Promise<void> {

        // Search for the target employee first
        await this.searchEmployeeById(employeeId);

        // Locate the specific employee row
        const employeeRow = this.getEmployeeRow(employeeId);

        // Ensure exactly one matching record is found
        await expect(employeeRow).toHaveCount(1);

        // Click delete icon within the row
        await employeeRow.locator('button i.bi-trash').click();

        // Confirm deletion in modal dialog
        await this.page.getByRole('button', { name: 'Yes, Delete' }).click();

        // Validate deletion via toast notification visibility lifecycle
        const toast = this.page.getByText('Successfully Deleted');
        await expect(toast).toBeVisible();
        await expect(toast).toBeHidden();

        // Re-run search to refresh table state after deletion
        await this.searchButton.click();
    }

    /**
     * Verifies that an employee is no longer present in the system
     * Combines UI empty state validation with strict row absence check
     * @param employeeId - Employee ID expected to be absent
     */
    async verifyEmployeeNotFoundById(employeeId: string): Promise<void> {

        // Wait for any loading indicators to disappear to ensure stable DOM state
        await this.page.locator('.oxd-loading-spinner')
            .waitFor({ state: 'detached', timeout: 5000 })
            .catch(() => {});

        // Locate "No Records Found" message in the UI
        const noRecordsMessage = this.page.locator('.orangehrm-horizontal-padding > .oxd-text--span');

        // Validate empty state message
        await expect(noRecordsMessage).toHaveText('No Records Found', { timeout: 10000 });

        // Confirm that no row exists with the given employee ID
        const employeeRow = this.getEmployeeRow(employeeId);
        await expect(employeeRow).toHaveCount(0);

        // Log confirmation for debugging and traceability
        console.log(`Success: Employee ${employeeId} is officially gone from the system.`);
    }

    async verifyPIMHeader(): Promise<void> {
        await expect(this.page).toHaveURL(/.*pim\/viewEmployeeList/);
        await expect(this.page.getByRole('heading', { name: 'Employee Information' })).toBeVisible();
    }

    async verifyDataTableVisibility(): Promise<void> {
        const employeeTable = this.page.locator('.oxd-table');
        await expect(employeeTable).toBeVisible();
    }

    async verifyRecordExistsInTable(): Promise<void> {
        const recordCount = this.page.getByText(/\(\d+\)\s+Records\s+Found/i);
        await expect(recordCount).toBeVisible();
    }

    async verifyIfEnabledButton(): Promise<void> {
        await expect(this.addEmployeeButton).toBeEnabled();
        await expect(this.searchButton).toBeEnabled();
    }

}