// Import required Playwright types and assertion utility
// Locator: represents element handles
// Page: browser page instance
// expect: assertion library
import { Locator, Page, expect } from '@playwright/test';

export class CartPage {

    // ==========================
    // Element definitions
    // ==========================

    readonly page: Page;

    // Sidebar container that represents cart panel
    // Current strategy: locate a div that contains a button named "X" (close button)
    // NOTE: This is NOT a stable locator → depends on UI text/icon
    readonly sidebar: Locator;

    // Checkout button inside cart
    readonly checkoutButton: Locator;

    // Close button (X icon)
    readonly closeButton: Locator;

    constructor(page: Page) {
        this.page = page;

        // Identify cart sidebar by presence of "X" button
        // Risk: if icon/text changes → locator breaks
        // Better: anchor using Checkout button or test-id
        this.sidebar = page.locator('div').filter({
    has: page.getByRole('button', { name: 'Checkout' })
}).first();

        // Scope child elements within sidebar to avoid global DOM search
        this.checkoutButton = this.sidebar.getByRole('button', { name: 'Checkout' });

        this.closeButton = this.sidebar.getByRole('button', { name: 'X' });
    }

    // ==========================
    // Business validations
    // ==========================

    async verifyProductAdded(productName: string) {

        // Explicit wait for sidebar visibility
        // NOTE: Playwright auto-waits in expect → this can be removed in optimized version
        await this.sidebar.waitFor({ state: 'visible' });

        // Locate product inside cart
        // Using first() assumes duplicates → not ideal, but acceptable for demo
        const productInCart = this.sidebar.getByText(productName).first();

        // Assertion: product should be visible in cart
        await expect(productInCart).toBeVisible();
    }

    async verifySubTotal(amount: string) {

        // Convert input amount into regex-safe format
        // Removes "$" and trims spaces to normalize input
        // Example: "$ 134.90" → "134.90"
        const priceRegex = new RegExp(`\\$ ${amount.replace('$', '').trim()}`);

        // Assertion: subtotal value is visible in cart
        // Regex used to match formatted currency string reliably
        await expect(this.sidebar.getByText(priceRegex)).toBeVisible();
    }
}