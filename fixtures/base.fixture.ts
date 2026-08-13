// Base Playwright test + assertion library
// We extend this to inject custom fixtures (POMs)
import { test as base, BrowserContext, Page } from '@playwright/test';
import path from 'path';

// Page Object Models (each represents a screen or feature)
import { LoginPage } from '../pages/Login.page';
import { DashboardPage } from '../pages/Dashboard.page';
import { PIMPage } from '../pages/PIM.page';
import { ProductPage } from '../pages/Product.page';

// Reusable UI components (shared across multiple pages)
import { Navbar } from '../pages/components/Navbar';
import { Navigation } from '../pages/components/Navigation';

// Feature-specific page (cart flows)
import { CartPage } from '../pages/Cart.page';

// Type definition for all custom fixtures
// This enables:
// - IntelliSense (auto-complete in tests)
// - Type safety (prevents wrong usage)
type MyFixtures = {
    loginPage: LoginPage;
    dashboardPage: DashboardPage;
    pimPage: PIMPage;
    productPage: ProductPage;
    navbar: Navbar;
    navigation: Navigation;
    cartPage: CartPage;
    createPageForRole: (role: 'admin' | 'ess') => Promise<{ 
        page: Page; 
        pimPage: PIMPage; 
        loginPage: LoginPage
    }> ;
}

// Extend Playwright's base test to include custom fixtures
// Each fixture:
// - receives Playwright's `page`
// - creates a POM instance
// - injects it into test context
export const test = base.extend<MyFixtures>({

    loginPage: async ({ page }, use) => {
        // Provides LoginPage instance to tests
        await use(new LoginPage(page));
    },

    dashboardPage: async ({ page }, use) => {
        await use(new DashboardPage(page));
    },

    pimPage: async ({ page }, use) => {
        await use(new PIMPage(page));
    },

    productPage: async ({ page }, use) => {
        await use(new ProductPage(page));
    },

    navbar: async ({ page }, use) => {
        // Shared component → avoids duplication across pages
        await use(new Navbar(page));
    },

    navigation: async ({ page }, use) => {
        await use(new Navigation(page));
    },

    cartPage: async ({ page }, use) => {
        await use(new CartPage(page));
    },

    createPageForRole: async({ browser }, use, testInfo) => {
    
    const createdContexts: BrowserContext[] = [];

    const factory = async(role: 'admin' | 'ess') => {

        const rawProjectName = testInfo.project.name.toLowerCase();

        let browserType = 'chromium';
        if(rawProjectName.includes('firefox')) browserType = 'firefox';
        if(rawProjectName.includes('webkit')) browserType = 'webkit';

        const storagePath = path.join(__dirname,`playwright-utils/.auth/${role}-${browserType}-storageState.json`);
        const context = await browser.newContext({storageState: storagePath});
        createdContexts.push(context);

        const page = await context.newPage();

        return {
            page, pimPage: 
            new PIMPage(page), 
            loginPage: new LoginPage(page)
        };
    
    };

    await use(factory);

    for(const context of createdContexts) {
        await context.close();
    }
}

});

// Re-export expect so tests can import from this file instead of Playwright directly
export { expect } from '@playwright/test';