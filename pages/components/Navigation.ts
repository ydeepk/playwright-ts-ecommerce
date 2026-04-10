import { Page, Locator, expect } from '@playwright/test';

export class Navigation {
    private readonly page: Page;
    private readonly pimLink: Locator;

    constructor(page: Page) {
        this.page = page;
        this.pimLink = page.getByRole('link', { name: 'PIM' });
    }

    async goToPIM(): Promise<void> {
        // FINAL FIX: Ensure link is visible and attached before clicking
        await this.pimLink.waitFor({ state: 'visible' });
        await this.pimLink.click();
        // Verify we actually arrived
        await expect(this.page).toHaveURL(/.*pim\/viewEmployeeList/);
    }
}