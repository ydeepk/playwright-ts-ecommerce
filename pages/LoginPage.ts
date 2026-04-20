import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {

    // Playwright page instance (entry point for all browser interactions)
    private readonly page: Page;

    // Login form elements (prefer user-facing selectors over CSS for stability)
    private readonly usernameInput: Locator;
    private readonly passwordInput: Locator;
    private readonly loginButton: Locator;

    constructor(page: Page) {
        this.page = page;

        // Placeholder-based selectors → stable unless UX copy changes
        this.usernameInput = page.getByPlaceholder('Username');
        this.passwordInput = page.getByPlaceholder('Password');

        // Role-based selector → resilient and accessibility-aligned
        this.loginButton = page.getByRole('button', { name: 'Login' });
    }

    async navigate(): Promise<void> {
        // Direct navigation to login route (single source of entry for auth tests)
        await this.page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
    }

    async redirectToLogin(): Promise<void> {
        // Validates navigation to login route
        // NOTE: Strengthen with UI check to avoid false positives (see review below)
        await expect(this.page).toHaveURL(/.*auth\/login/);

        // validation: ensures login form is actually usable
        await expect(this.usernameInput).toBeVisible();
        await expect(this.loginButton).toBeVisible();
    }

    async login(username: string, password: string): Promise<void> {

        // Fill credentials
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);

        // Submit login form
        await this.loginButton.click();

        // Post-login validation:
        // Confirms successful authentication + page render
        await expect(
            this.page.getByRole('heading', { name: 'Dashboard' })
        ).toBeVisible({ timeout: 15000 });
    }
}