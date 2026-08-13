import { Page, expect, Locator } from '@playwright/test';

export class Navbar {

    private readonly page: Page;

    // User profile dropdown trigger in global navigation
    // WARNING: CSS-based selector → fragile if UI classes change
    private readonly userDropdown: Locator;

    // Logout option within dropdown menu (role-based → more stable)
    private readonly logoutButton: Locator;

    constructor(page: Page) {
        this.page = page;

        this.userDropdown = this.page.locator('.oxd-userdropdown-name');

        this.logoutButton = this.page
            .getByRole('menu')
            .getByRole('menuitem', { name: /Logout/i });
    }

    async logout(): Promise<void> {

        // Trigger dropdown menu
        await this.userDropdown.click();

        // Ensure menu is rendered before interacting (prevents flaky failures)
        await expect(this.logoutButton).toBeVisible();

        // Execute logout action
        await this.logoutButton.click();
    }
}