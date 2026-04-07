import { Page, Locator } from '@playwright/test';

export class ProductPage {

    // ==========================
    // Properties
    // ==========================

    // Playwright page instance
    private readonly page: Page;

    // Size filter container (scoped to avoid global matches)
    private readonly sizeFilterSection: Locator;

    // ==========================
    // Constructor
    // ==========================
    constructor(page: Page) {
        this.page = page;

        // Scope size filters to label elements for better stability
        this.sizeFilterSection = this.page.locator('label');
    }

    // ==========================
    // Actions
    // ==========================

    /**
     * Select product size dynamically (e.g. S, M, L, XL)
     * @param size - size value to select
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

        // Locate product card containing the given product name
        // Scoped within main container to reduce incorrect matches
        const productCard = this.page.locator('main >> div')
            .filter({
                has: this.page.locator('p', { hasText: productName })
            })
            .last();

        // Click "Add to cart" button within the located product card
        await productCard.getByRole('button', { name: 'Add to cart' }).click();
    }

    /**
     * Combined action: select size and add product to cart
     * Improves readability in test cases
     * @param productName - product to add
     * @param size - size to select
     */
    async addProductWithSize(productName: string, size: string): Promise<void> {
        await this.selectSize(size);
        await this.addProductToCart(productName);
    }
}