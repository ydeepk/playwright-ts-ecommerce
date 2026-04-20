 // Import Playwright test runner utilities
// 'test' is used to define test cases
// 'expect' is used for assertions
import { test, expect } from "@playwright/test";


// ==========================
// Test 1: Using locator chaining + role-based targeting
// ==========================
test('find specific product', async ({ page }) => {

    console.log('Test 1');

    // Navigate to the ecommerce demo application
    await page.goto('https://react-shopping-cart-67954.firebaseapp.com/');

    // Locate product card containing specific product text
    // Strategy: filter parent container using child text to ensure correct scoping
    const productCard = page.locator('div').filter({
        has: page.getByText('Black Batman T-shirt')
    }).last(); // 'last()' avoids duplicate matches in repeated UI elements

    // Click "Add to cart" button within the scoped product card
    // Role-based selector improves accessibility alignment and stability
    await productCard.getByRole('button', { name: 'Add to cart' }).click();


    // Locate cart/sidebar container using a unique anchor element (Checkout button)
    // This ensures assertions are scoped to the correct UI section
    const sidebar = page.locator('div').filter({
        has: page.getByRole('button', { name: 'Checkout' })
    });

    // Validate cart title visibility
    await expect(sidebar.locator('span').getByText('Cart')).toBeVisible();

    // Validate product name appears in cart
    // nth(1) is used due to duplicate occurrences in DOM structure
    await expect(
        sidebar.locator('p').getByText('Black Batman T-shirt').nth(1)
    ).toBeVisible();

    // Validate product description (size and category/type)
    await expect(
        sidebar.getByText('S | Really Cool T-shirt')
    ).toBeVisible();

    // Validate product price visibility
    await expect(
        sidebar.getByText('$ 10.90').first()
    ).toBeVisible();
});


// ==========================
// Test 2: Using text-based filtering (alternative locator strategy)
// ==========================
test('find specific product another way', async ({ page }) => {

    console.log('Test 2');

    // Navigate to ecommerce demo application
    await page.goto('https://react-shopping-cart-67954.firebaseapp.com/');

    // Alternative locator strategy using text-based filtering
    // Simpler approach but less precise compared to scoped locators
    await page.locator('div')
        .filter({ hasText: 'Black Batman T-shirt' }) // Matches any div containing product text
        .locator('button:has-text("Add to cart")')   // Finds nested button inside matched container
        .first() // Ensures a single element is targeted for interaction
        .click();
});