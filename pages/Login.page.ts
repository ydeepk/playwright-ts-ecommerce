import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {

    // ==========================
    // Core
    // ==========================
    private readonly page: Page;

    // ==========================
    // Form Elements
    // ==========================
    private readonly usernameInput: Locator;
    private readonly passwordInput: Locator;
    private readonly loginButton: Locator;

    // ==========================
    // Constructor
    // ==========================
    constructor(page: Page) {
        this.page = page;

        // Placeholder-based selectors → readable and stable unless UX copy changes
        this.usernameInput = page.getByPlaceholder('Username');
        this.passwordInput = page.getByPlaceholder('Password');

        // Role-based selector → accessibility-aligned and resilient
        this.loginButton = page.getByRole('button', { name: 'Login' });
    }

    /**
     * Navigates to login page
     * Uses baseURL-relative path for environment flexibility
     */
    async navigate(): Promise<void> {
        await this.page.goto('/web/index.php/auth/login');
    }

    /**
     * Validates that user is on login page
     * Ensures both URL and UI readiness
     */
    async verifyLoginPageLoaded(): Promise<void> {

        await expect(this.page).toHaveURL(/auth\/login/);

        // Ensures form is interactable (not just URL match)
        await expect(this.usernameInput).toBeVisible();
        await expect(this.loginButton).toBeVisible();
    }

    /**
     * Performs login action
     * Assumes login page is already loaded
     */
    async login(username: string, password: string): Promise<void> {

        // Optional but safer: ensure fields are ready before interaction
        await expect(this.usernameInput).toBeVisible();

        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);

        await this.loginButton.click();

        // Validates successful login via dashboard presence
        await expect(
            this.page.getByRole('heading', { name: 'Dashboard' })
        ).toBeVisible({ timeout: 15000 });
    }
}