import { Page, Locator, expect } from '@playwright/test';

export class CartPage {

    // ===========================
    // Properties
    // ===========================

    // Playwright Page instance used for cart interactions
    private readonly page: Page;

    // Root container representing the cart sidebar/modal
    private readonly cartContainer: Locator;

    // Primary cart actions
    private readonly checkoutButton: Locator; // Initiates checkout flow
    private readonly closeButton: Locator;    // Closes cart sidebar
    private readonly cartTitle: Locator;      // Cart header/title element

    // Pricing section
    private readonly subtotalSection: Locator; // Container holding subtotal information

    // ==========================
    // Constructor
    // ==========================
    constructor(page: Page) {
        // Initialize Playwright page reference
        this.page = page;

        // Identify cart container using Checkout button as a stable anchor element
        this.cartContainer = this.page.locator('div')
            .filter({
                has: this.page.getByRole('button', { name: 'Checkout' })
            })
            .first();

        // Scope all cart-related elements within the cart container for stability
        this.checkoutButton = this.cartContainer
            .getByRole('button', { name: 'Checkout' });

        this.closeButton = this.cartContainer
            .getByRole('button', { name: 'X' });

        this.cartTitle = this.cartContainer
            .getByText('Cart');

        this.subtotalSection = this.cartContainer
            .getByText('SUBTOTAL').locator('..');
    }

    // ==========================
    // Validations / Actions
    // ==========================

    /**
     * Validates that the cart sidebar is visible on screen
     * Ensures cart has been successfully opened after user action
     */
    async verifyCartVisible(): Promise<void> {
        await expect(this.cartTitle).toBeVisible();
    }

    /**
     * Validates that a specific product exists inside the cart
     * Uses exact text matching for strict verification
     * @param productName - Exact product name expected in cart
     */
    async verifyProductInCart(productName: string): Promise<void> {

        // Locate product within cart container with strict match
        const product = this.cartContainer
            .getByText(productName, { exact: true })
            .first();

        // Assert product visibility in cart UI
        await expect(product).toBeVisible();
    }

    /**
     * Validates subtotal amount displayed in cart
     * Handles formatting inconsistencies using flexible regex matching
     * @param expectedAmount - Expected subtotal value (e.g. "134.90")
     */
    async verifySubtotal(expectedAmount: string): Promise<void> {

        // Normalize input by removing currency symbols and trimming spaces
        const normalizedAmount = expectedAmount.replace('$', '').trim();

        // Build regex to match subtotal value with optional spacing variations
        const subtotalValue = this.subtotalSection
            .getByText(new RegExp(`\\$\\s*${normalizedAmount}`));

        // Assert subtotal visibility
        await expect(subtotalValue).toBeVisible();
    }

    /**
     * Retrieves subtotal text from cart UI
     * Useful for assertions at test layer when value comparison is needed
     */
    async getSubtotalText(): Promise<string> {
        return await this.cartContainer.locator('p').last().innerText();
    }

    /**
     * Closes the cart sidebar/modal
     */
    async closeCart(): Promise<void> {
        await this.closeButton.click();
    }
}