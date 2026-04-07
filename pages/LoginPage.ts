// Import Playwright core types
import { Page, Locator } from '@playwright/test';

export class LoginPage {
    private readonly page: Page;

    // Input fields
    private readonly usernameInput: Locator;
    private readonly passwordInput: Locator;

    // Buttons
    private readonly loginButton: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators
        this.usernameInput = page.getByPlaceholder('Username');
        this.passwordInput = page.getByPlaceholder('Password');
        this.loginButton = page.getByRole('button', { name: 'Login' });
    }

    // ==========================
    // Actions
    // ==========================

    async navigate(): Promise<void> {
        await this.page.goto(
            'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login'
        );
    }

    async login(username: string, password: string): Promise<void> {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }
}