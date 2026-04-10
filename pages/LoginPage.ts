import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {

    // ==========================
    // Properties
    // ==========================

    // Playwright Page instance used for browser interactions
    private readonly page: Page;

    // Login form elements
    private readonly usernameInput: Locator; // Input field for username
    private readonly passwordInput: Locator; // Input field for password
    private readonly loginButton: Locator;   // Button to submit login form

    // ==========================
    // Constructor
    // ==========================
    constructor(page: Page) {
        // Initialize page reference
        this.page = page;

        // Initialize locators using stable selectors (placeholders + role-based)
        this.usernameInput = page.getByPlaceholder('Username');
        this.passwordInput = page.getByPlaceholder('Password');
        this.loginButton = page.getByRole('button', { name: 'Login' });
    }

    /**
     * Navigates to the application login page
     */
    async navigate(): Promise<void> {
        await this.page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
    }

    /**
     * Performs login with provided credentials
     * Waits for Dashboard visibility to confirm successful authentication
     * @param username - User login name
     * @param password - User login password
     */
    async login(username: string, password: string): Promise<void> {

        // Fill login credentials
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);

        // Submit login form
        await this.loginButton.click();

        // Validate successful login by checking Dashboard visibility
        // Acts as a reliable post-authentication state confirmation
        await expect(
            this.page.getByRole('heading', { name: 'Dashboard' })
        ).toBeVisible({ timeout: 15000 });
    }
}