import { Page, Locator, expect } from '@playwright/test';

export class CartPage {

    // ==========================
    // Properties
    // ==========================

    // Playwright page instance
    private readonly page: Page;

    // Main cart container (sidebar)
    private readonly cartContainer: Locator;

    // Key elements inside cart
    private readonly checkoutButton: Locator;
    private readonly closeButton: Locator;
    private readonly cartTitle: Locator;

    // subtotal inside subsection
    private readonly subtotalSection: Locator;

    // ==========================
    // Constructor
    // ==========================
    constructor(page: Page) {
        this.page = page;

        // Use "Checkout" button as stable anchor to uniquely identify cart
        this.cartContainer = this.page.locator('div')
            .filter({
                has: this.page.getByRole('button', { name: 'Checkout' })
            })
            .first();

        // Scope all elements within cart container
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
     * Validate cart is visible
     * Ensures cart UI is opened after adding product
     */
    async verifyCartVisible(): Promise<void> {
        await expect(this.cartTitle).toBeVisible();
    }

    /**
     * Validate specific product is present in cart
     * @param productName - exact product name
     */
    async verifyProductInCart(productName: string): Promise<void> {

        // No explicit wait → expect() handles auto-waiting
        const product = this.cartContainer.getByText(productName, { exact: true }).first();

        await expect(product).toBeVisible();
    }

    /**
     * Validate subtotal value
     * @param expectedAmount - e.g. "134.90"
     */
    async verifySubtotal(expectedAmount: string): Promise<void> {

        const normalizedAmount = expectedAmount.replace('$','').trim();
        // Flexible regex to handle UI spacing inconsistencies
        const subtotalValue = this.subtotalSection.getByText(new RegExp(`\\$\\s*${normalizedAmount}`));

        await expect(subtotalValue).toBeVisible();
    }

    /**
     * Get subtotal text (preferred for assertion in test layer)
     */
    async getSubtotalText(): Promise<string> {
        return await this.cartContainer.locator('p').last().innerText();
    }

    /**
     * Close cart sidebar
     */
    async closeCart(): Promise<void> {
        await this.closeButton.click();
    }
}