// Import Playwright test runner utilities
// 'test' is used to define test cases
// 'expect' is used for assertions
import { test, expect } from "@playwright/test";


// ==========================
// Test 1: Using locator chaining + role-based targeting
// ==========================
test('find specific product', async ({ page }) => {

    console.log('Test 1');

    // Navigate to the ecommerce demo site
    await page.goto('https://react-shopping-cart-67954.firebaseapp.com/');

    // Identify the product card containing specific product text
    // Using 'filter + has' ensures we scope to the correct container instead of relying on fragile selectors
    const productCard = page.locator('div').filter({
        has: page.getByText('Black Batman T-shirt')
    }).last(); // 'last()' used to avoid matching multiple similar elements

    // Within the scoped product card, click the "Add to cart" button
    // Using role-based selector improves stability and readability
    await productCard.getByRole('button', { name: 'Add to cart' }).click();


    // Locate the sidebar/cart container by identifying a unique element (Checkout button)
    // This ensures we are validating inside the correct section of the UI
    const sidebar = page.locator('div').filter({
        has: page.getByRole('button', { name: 'Checkout' })
    });

    // Validate that Cart title is visible inside sidebar
    // Ensures UI updated correctly after adding product
    await expect(sidebar.locator('span').getByText('Cart')).toBeVisible();

    // Validate product name appears in cart (nth used due to duplicate occurrences)
    await expect(sidebar.locator('p').getByText('Black Batman T-shirt').nth(1)).toBeVisible();

    // Validate product description (size and type)
    await expect(sidebar.getByText('S | Really Cool T-shirt')).toBeVisible();

    // Validate product price
    await expect(sidebar.getByText('$ 10.90').first()).toBeVisible();
});


// ==========================
// Test 2: Using text-based filtering (alternative approach)
// ==========================
test('find specific product another way', async ({ page }) => {

    console.log('Test 2');

    // Navigate to the ecommerce demo site
    await page.goto('https://react-shopping-cart-67954.firebaseapp.com/');

    // Directly locate product using text filter and chain button locator
    // Faster to write but less controlled compared to scoped locator approach
    await page.locator('div')
        .filter({ hasText: 'Black Batman T-shirt' }) // Matches any div containing the text
        .locator('button:has-text("Add to cart")')   // Finds button inside that div
        .first() // Ensures single element interaction
        .click();
});