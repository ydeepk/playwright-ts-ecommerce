// Import Playwright core types
import { Page, Locator } from '@playwright/test';

export class Navigation {
    private readonly page: Page;

    // Navigation links
    private readonly pimLink: Locator;
    private readonly adminLink: Locator;
    private readonly leaveLink: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize navigation locators
        this.pimLink = page.getByRole('link', { name: 'PIM' });
        this.adminLink = page.getByRole('link', { name: 'Admin' });
        this.leaveLink = page.getByRole('link', { name: 'Leave' });
    }

    // ==========================
    // Navigation Actions
    // ==========================

    async goToPIM(): Promise<void> {
        await this.pimLink.click();
    }

    async goToAdmin(): Promise<void> {
        await this.adminLink.click();
    }

    async goToLeave(): Promise<void> {
        await this.leaveLink.click();
    }
}