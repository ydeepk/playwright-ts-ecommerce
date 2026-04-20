// Import Playwright test runner (aliased as 'setup' for clarity)
// This distinguishes setup tests from regular test cases
import { test as setup } from '@playwright/test';

// Import shared storage state path from config
// Ensures consistency between setup and test execution
import { STORAGE_STATE } from '../playwright.config';

// Import Login Page Object
// Encapsulates login logic and locators
import { LoginPage } from '../pages/LoginPage';

// Setup test responsible for authentication
// This runs BEFORE other tests and generates reusable session state
setup('Authenticate', async ({ page }) => {

    // Initialize login page object
    const loginPage = new LoginPage(page);

    // Navigate to login page
    // Must succeed → otherwise all dependent tests will fail
    await loginPage.navigate();

    // Perform login with valid credentials
    // Hardcoded for demo → should be replaced with env variables in real projects
    await loginPage.login('Admin', 'admin123');

    // Validate successful login by checking dashboard URL
    // Acts as guard to ensure authentication actually worked
    await page.waitForURL('**/dashboard/index');

    // Persist authenticated session to file
    // This file is reused by all other tests via storageState
    // Eliminates need to login in every test → improves speed significantly
    await page.context().storageState({ path: STORAGE_STATE });

});