import { Page, Locator } from '@playwright/test';

export class Product {

    // ==========================
    // Properties
    // ==========================

    // Playwright Page instance used for all interactions on the product page
    private readonly page: Page;

    // Locator targeting all label elements, used to scope size filter interactions
    private readonly sizeFilterSection: Locator;

    // ==========================
    // Constructor
    // ==========================
    constructor(page: Page) {
        // Initialize Playwright page reference
        this.page = page;

        // Initialize locator for size filter labels to ensure stable element targeting
        this.sizeFilterSection = this.page.locator('label');
    }

    // ==========================
    // Actions
    // ==========================

    /**
     * Selects a product size dynamically (e.g., S, M, L, XL)
     * Uses exact text matching to avoid incorrect selections
     * @param size - The visible size label to be selected
     */
    async selectSize(size: string): Promise<void> {
        await this.sizeFilterSection
            .getByText(size, { exact: true }) // Ensures precise match for size label
            .click(); // Triggers size selection
    }

    /**
     * Adds a specific product to the cart based on product name
     * Uses scoped filtering to avoid selecting incorrect product cards
     * @param productName - Exact visible name of the product
     */
    async addProductToCart(productName: string): Promise<void> {

        // Locate the product card containing the specified product name
        // Scoped within 'main' container to reduce risk of false positives
        const productCard = this.page.locator('main >> div')
            .filter({
                has: this.page.locator('p', { hasText: productName }) // Matches product name within paragraph tag
            })
            .last(); // Uses the last match in case of duplicates

        // Click the "Add to cart" button within the identified product card
        await productCard.getByRole('button', { name: 'Add to cart' }).click();
    }

    /**
     * Combines size selection and add-to-cart action into a single reusable step
     * Improves readability and reduces duplication in test cases
     * @param productName - Name of the product to be added
     * @param size - Size to be selected before adding to cart
     */
    async addProductWithSize(productName: string, size: string): Promise<void> {
        await this.selectSize(size); // Select desired size
        await this.addProductToCart(productName); // Add selected product to cart
    }
}