// Import Playwright test runner utilities
// 'test' defines test blocks, 'expect' is used for assertions
import { test, expect } from '@playwright/test';


// ==========================
// Test: Verify Add to Cart functionality
// ==========================
test('add to cart functionality', async ({ page }) => {

    // Navigate to the ecommerce application
    await page.goto('https://react-shopping-cart-67954.firebaseapp.com/');

    // Select product size 'S'
    // Using text-based locator here, but note: this is not very stable if multiple 'S' elements exist
    // In real projects, prefer scoped locator within a product card or use test-id
    await page.getByText('S').first().click();
    
    // Click on "Add to cart" button
    // Again using first() assumes the first product is selected → risky if UI order changes
    await page.getByText('Add to cart').first().click();

    // Identify cart sidebar container
    // Strategy: find a container that uniquely contains the 'Checkout' button
    // This scopes all further validations within the correct UI section
    const sidebar = page.locator('div').filter({
        has: page.getByRole('button', { name: 'Checkout' })
    });

    // Validate that Cart title is visible → confirms cart UI is opened/updated
    await expect(sidebar.locator('span').getByText('Cart')).toBeVisible();
    
    // Validate that cart total is NOT $0.00
    // This is a business validation ensuring item was added successfully
    // Using negative assertion here instead of exact value keeps test flexible
    await expect(sidebar.getByText('$ 0.00')).not.toBeVisible();
});