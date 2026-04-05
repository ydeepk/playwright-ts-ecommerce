import { Page, Locator } from '@playwright/test';

export class ProductPage {

    // ==========================
    // Properties
    // ==========================

    // Playwright page instance
    private readonly page: Page;

    // Size filter section
    private readonly sizeFilterSection: Locator;

    // ==========================
    // Constructor
    // ==========================
    constructor(page: Page) {
        this.page = page;

        // Scope to size filter container instead of using global 'span'
        // Improves locator stability and avoids accidental matches
        this.sizeFilterSection = this.page.locator('label');
    }

    // ==========================
    // Actions
    // ==========================

    /**
     * Select product size dynamically (e.g. S, M, L, XL)
     * Avoid hardcoding → reusable + data-driven friendly
     */
    async selectSize(size: string): Promise<void> {
        await this.sizeFilterSection
            .getByText(size, { exact: true })
            .click();
    }

    /**
     * Add a specific product to cart
     * @param productName - exact product name
     */
    async addProductToCart(productName: string): Promise<void> {

        // Locate product card by product name
        // filter + hasText scopes correctly but still not ideal if duplicates exist
        const productCard = this.page.locator('div')
            .filter({ hasText: productName })
            .first(); // safer than last(), still not perfect

        // Click "Add to cart" within the scoped product card
        await productCard.getByRole('button', { name: 'Add to cart' }).click();
    }

    /**
     * Combined action: select size + add product
     * Useful for test readability
     */
    async addProductWithSize(productName: string, size: string): Promise<void> {
        await this.selectSize(size);
        await this.addProductToCart(productName);
    }
}