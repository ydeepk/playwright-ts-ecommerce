// Import Playwright core types and assertion utility
import { Page, Locator, expect } from '@playwright/test';

export class PIMPage {
    private readonly page: Page;

    // Buttons
    private readonly addEmployeeButton: Locator;
    private readonly saveButton: Locator;
    private readonly searchButton: Locator;

    // Input fields
    private readonly firstNameInput: Locator;
    private readonly lastNameInput: Locator;
    private readonly employeeIdInput: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators
        this.addEmployeeButton = page.getByRole('button', { name: 'Add' });
        this.saveButton = page.getByRole('button', { name: 'Save' });
        this.searchButton = page.getByRole('button', { name: 'Search' });

        this.firstNameInput = page.getByPlaceholder('First Name');
        this.lastNameInput = page.getByPlaceholder('Last Name');

        // Employee ID field (used for search)
        this.employeeIdInput = page.locator('form').getByRole('textbox').nth(1);
    }

    // ==========================
    // Actions
    // ==========================

    async addNewEmployee(firstName: string, lastName: string): Promise<string> {
        await this.addEmployeeButton.click();

        await this.firstNameInput.fill(firstName);
        await this.lastNameInput.fill(lastName);

        // Capture auto-generated employee ID before saving
        const generatedEmployeeId = await this.page
            .locator('form')
            .getByRole('textbox')
            .nth(0)
            .inputValue();

        await this.saveButton.click();

        // Validate navigation to employee details page
        await expect(this.page).toHaveURL(/.*viewPersonalDetails/);

        return generatedEmployeeId;
    }

    async deleteEmployeeById(employeeId: string): Promise<void> {
        const employeeRow = this.page
            .locator('.oxd-table-row')
            .filter({ hasText: employeeId });

        // Click delete icon (first button in row)
        await employeeRow.getByRole('button').first().click();

        // Confirm deletion
        await this.page
            .getByRole('button', { name: 'Yes, Delete' })
            .click();
    }
}