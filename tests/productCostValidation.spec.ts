// Import Playwright test runner utilities
// 'test' defines test cases, 'expect' is used for assertions
import { test, expect } from '@playwright/test';
import { CartPage } from '../pages/CartPage';


// ==========================
// Test: Product cost validation (end-to-end flow)
// ==========================
test('product cost validation', async ({ page }) => {

    const cartPage = new CartPage(page);


    // Step 1: Navigate to ecommerce application
    await page.goto('/');

    // Step 2: Apply filter for size "L"
    // Using exact match to avoid partial matches (e.g., "XL")
    // Still generic (span locator) → should ideally be scoped or use test-id
    await page.locator('span').getByText('L', { exact: true }).click();

    // Step 3: Locate specific product card using text-based scoping
    // 'filter + has' ensures we interact with the correct container
    const productCard = page.locator('div').filter({
        has: page.getByText('Tropical Wine T-shirt')
    }).last(); // 'last()' used due to multiple matches → not ideal long-term

    // Click "Add to cart" within scoped product card
    // Text-based locator works but role-based or test-id would be more stable
    await productCard.getByText('Add to cart').click();

    await cartPage.verifyProductInCart('Tropical Wine T-shirt');
    await cartPage.verifySubtotal('$ 134.90');
});