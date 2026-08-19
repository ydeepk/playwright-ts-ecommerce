// Import Playwright test runner (aliased as 'setup' for clarity)
// This distinguishes setup tests from regular test cases
import { USERS } from '../../src/config/credentials';
import { test as setup } from '../../src/fixtures/base.fixture';

// Setup test responsible for authentication
// This runs BEFORE other tests and generates reusable session state
setup('Authenticate', async ({ page, loginPage ,browserName }) => {

    const authFile = `.auth/${browserName}-storageState.json`;

    // Navigate to login page
    // Must succeed → otherwise all dependent tests will fail
    await loginPage.navigate();

    await page.waitForLoadState('networkidle');

    // Perform login with valid credentials
    // Hardcoded for demo → should be replaced with env variables in real projects
    await loginPage.login(USERS.ADMIN.username, USERS.ADMIN.password);

    // Validate successful login by checking dashboard URL
    // Acts as guard to ensure authentication actually worked
    await page.waitForURL('**/dashboard/index');

    // Persist authenticated session to file
    // This file is reused by all other tests via storageState
    // Eliminates need to login in every test → improves speed significantly
    await page.context().storageState({ path: authFile });

});