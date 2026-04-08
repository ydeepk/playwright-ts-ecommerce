// Import Playwright core types and assertion utility
import { Page, Locator, expect } from '@playwright/test';

export class PIMPage {
    private readonly page: Page;

    // Buttons used across PIM workflows
    private readonly addEmployeeButton: Locator;
    private readonly saveButton: Locator;
    private readonly searchButton: Locator;
    private readonly resetButton: Locator;

    // Input fields for employee data
    private readonly firstNameInput: Locator;
    private readonly lastNameInput: Locator;
    private readonly employeeIdInput: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize button locators (role-based for better readability and resilience)
        this.addEmployeeButton = page.getByRole('button', { name: 'Add' });
        this.saveButton = page.getByRole('button', { name: 'Save' });
        this.searchButton = page.getByRole('button', { name: 'Search' });
        this.resetButton = page.getByRole('button', { name: 'Reset' });

        // Initialize input field locators
        this.firstNameInput = page.getByPlaceholder('First Name');
        this.lastNameInput = page.getByPlaceholder('Last Name');

        // Employee ID field inside search form
        // Note: index-based locator is fragile if DOM structure changes
        this.employeeIdInput = page.locator('form').getByRole('textbox').nth(1);
    }

    // ==========================
    // Actions
    // ==========================

    async addNewEmployee(firstName: string, lastName: string): Promise<string> {
        // Open "Add Employee" form
        await this.addEmployeeButton.click();

        // Fill mandatory employee details
        await this.firstNameInput.fill(firstName);
        await this.lastNameInput.fill(lastName);

        // Capture auto-generated employee ID before saving
        // Important: ID is generated dynamically by UI
        const generatedEmployeeId = await this.page
            .locator('form')
            .getByRole('textbox')
            .nth(0)
            .inputValue();

        // Submit employee creation form
        await this.saveButton.click();

        // Validate successful navigation to employee details page
        // Ensures form submission did not silently fail
        await expect(this.page).toHaveURL(/.*viewPersonalDetails/);

        return generatedEmployeeId;
    }

    async searchEmployeeById(employeeId: string): Promise<void> {
        // Reset any existing filters to avoid false results
        await this.resetButton.click();

        // Enter employee ID in search field
        // Uses label-based filtering (fragile if UI text changes)
        await this.page
            .locator('div')
            .filter({ hasText: /^Employee Id$/ })
            .locator('input')
            .fill(employeeId);

        // Trigger search action
        await this.searchButton.click();

        // Validate employee appears in search results
        await this.verifyEmployeeIsVisible(employeeId);

        // Wait for network activity to settle
        // Note: not always reliable for modern frontend frameworks
        await this.page.waitForLoadState('networkidle');
    }

    async verifyEmployeeIsVisible(employeeId: string): Promise<void> {
        // Locate table row containing the employee ID
        const employeeRow = this.page
            .locator('.oxd-table-row')
            .filter({ hasText: employeeId });

        // Assert visibility to confirm search success
        await expect(employeeRow).toBeVisible();
    }

    async deleteEmployeeById(employeeId: string): Promise<void> {

        await this.searchEmployeeById(employeeId);
        
        // Locate the employee row in results table
        const employeeRow = this.page
            .locator('.oxd-table-row')
            .filter({ hasText: employeeId });

        // Click delete icon (assumes first button is delete action)
        // Risk: breaks if button order changes
        await employeeRow.getByRole('button').first().click();

        // Confirm deletion in modal/dialog
        await this.page
            .getByRole('button', { name: 'Yes, Delete' })
            .click();

        await this.page.getByText('Successfully Deleted').waitFor({state: 'hidden'})
    }

    async verifyEmployeeNotFoundById(employeeId: string): Promise<void> {
        // Attempt to locate employee row (should not exist)
        const employeeRow = this.page
            .locator('.oxd-table-row')
            .filter({ hasText: employeeId });

        // Assert employee is not visible in table
        await expect(employeeRow).not.toBeVisible();

        // Validate "No Records Found" message is displayed
        // Confirms empty result state is handled correctly
        const noRecordsMessage = this.page.getByText('No Records Found');
        await expect(noRecordsMessage).toBeVisible();
    }
}