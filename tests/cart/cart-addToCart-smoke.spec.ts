 // Import Playwright test runner utilities
// 'test' defines test blocks, 'expect' is used for assertions
import { test, expect } from '@playwright/test';


// ==========================
// Test: Verify Add to Cart functionality
// ==========================
test('@smoke add to cart functionality', async ({ page }) => {

    // Navigate to the ecommerce application under test
    await page.goto('https://react-shopping-cart-67954.firebaseapp.com/');

    // Select product size 'S'
    // NOTE: This locator is text-based and may not be stable if multiple elements contain 'S'
    // Prefer scoped locators within product card or data-testid in production frameworks
    await page.getByText('S').first().click();
    
    // Click "Add to cart" button for the selected product
    // Using first() assumes default product selection order which may change in UI updates
    await page.getByText('Add to cart').first().click();

    // Locate cart sidebar container
    // Strategy: identify parent container that uniquely contains the Checkout button
    // This ensures all cart validations are scoped correctly
    const sidebar = page.locator('div').filter({
        has: page.getByRole('button', { name: 'Checkout' })
    });

    // Validate that Cart title is visible
    // Confirms that cart UI has been successfully opened/updated
    await expect(sidebar.locator('span').getByText('Cart')).toBeVisible();
    
    // Validate that cart total is not $0.00
    // Business validation: ensures at least one item has been added to cart
    // Using negative assertion keeps test flexible across pricing changes
    await expect(sidebar.getByText('$ 0.00')).not.toBeVisible();
});