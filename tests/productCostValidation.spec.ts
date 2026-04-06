// Import Playwright test utilities
// 'test' defines test cases, 'expect' is used for assertions
import { test, expect } from '@playwright/test';
import { CartPage } from '../pages/CartPage';
import { ProductPage } from '../pages/ProductPage';

// Import test data for data-driven testing
import * as data from '../data/products.json';


// ==========================
// Data-Driven Tests (DDT)
// ==========================
for (const product of data.testData) {

    test(`product subtotal validation - ${product.name}`, async ({ page }) => {

        const cartPage = new CartPage(page);
        const productPage = new ProductPage(page);

        // Prepare to capture products API response
        const productsResponsePromise = page.waitForResponse('**/products.json');

        // Navigate to base URL (configured in playwright.config.ts)
        await page.goto('/');

        // Resolve API response and parse JSON
        const productsResponse = await productsResponsePromise;
        const productsData = await productsResponse.json();

        console.log(
            `LOG: Intercepted ${productsData.products.length} products for ${product.name}`
        );

        // Select product size
        await productPage.selectSize(product.size);

        // Add product to cart
        await productPage.addProductToCart(product.name);

        // Validate product presence in cart
        await cartPage.verifyProductInCart(product.name);

        // Validate subtotal value
        await cartPage.verifySubtotal(product.price);

        // Wait for network to be idle (stability step)
        await page.waitForLoadState('networkidle');
    });
}


// ==========================
// Test: Product cost validation (E2E flow)
// ==========================
test('product cost validation', async ({ page }) => {

    const cartPage = new CartPage(page);

    // Navigate to application
    await page.goto('/');

    // Select size "L"
    // Exact match avoids selecting similar values like "XL"
    await page.locator('span').getByText('L', { exact: true }).click();

    // Locate product card using text-based filtering
    const productCard = page.locator('div')
        .filter({
            has: page.getByText('Tropical Wine T-shirt'),
        })
        .last(); // Used due to multiple matches (not ideal for long-term)

    // Click "Add to cart" within selected product
    await productCard.getByText('Add to cart').click();

    // Validate product presence and subtotal in cart
    await cartPage.verifyProductInCart('Tropical Wine T-shirt');
    await cartPage.verifySubtotal('$ 134.90');
});