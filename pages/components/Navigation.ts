import { Page, Locator, expect } from '@playwright/test';

export class Navigation {

    // ==========================
    // Properties
    // ==========================

    // Playwright Page instance used for navigation actions
    private readonly page: Page;

    // Navigation link for PIM module
    private readonly pimLink: Locator;

    // ==========================
    // Constructor
    // ==========================
    constructor(page: Page) {
        // Initialize page reference
        this.page = page;

        // Locate PIM navigation link using accessible role selector
        this.pimLink = page.getByRole('link', { name: 'PIM' });
    }

    // ==========================
    // Actions
    // ==========================

    /**
     * Navigates to the PIM (Personnel Information Management) module
     * Ensures element visibility before interaction and validates successful navigation
     */
    async goToPIM(): Promise<void> {

        // Ensure the PIM link is visible and ready for interaction
        await this.pimLink.waitFor({ state: 'visible' });

        // Click on the PIM navigation link
        await this.pimLink.click();

        // Validate successful navigation by checking URL pattern
        await expect(this.page).toHaveURL(/.*pim\/viewEmployeeList/);
    }
}