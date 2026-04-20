import { Page, expect, Locator } from '@playwright/test';

export class Dashboard {

    private readonly page: Page;

    // Page identity element used to confirm Dashboard is loaded
    private readonly dashboardHeading: Locator;

    constructor(page: Page) {
        this.page = page;

        // Combines container + text to reduce false positives
        this.dashboardHeading = this.page
            .locator('.oxd-topbar-header-breadcrumb')
            .getByText(/Dashboard/i);
    }

    async isLoaded(): Promise<void> {
        // URL check ensures correct route (fast failure if navigation breaks)
        await expect(this.page).toHaveURL(/.*dashboard/);

        // UI check ensures page rendering is complete and visible to user
        await expect(this.dashboardHeading).toBeVisible();
    }

}