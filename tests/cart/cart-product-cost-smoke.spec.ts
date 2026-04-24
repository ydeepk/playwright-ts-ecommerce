 // Import Playwright test utilities
// 'test' defines test cases, 'expect' is used for assertions
import { test, expect } from '../../fixtures/base.fixture';

// Import test data for data-driven testing
import * as data from '../../data/products.json';


// ==========================
// Data-Driven Tests (DDT)
// ==========================
for (const product of data.testData) {

    /**
     * Data-driven test:
     * Validates product selection, cart addition, and subtotal calculation
     * for multiple products defined in external JSON data
     */
    test(`@smoke product subtotal validation - ${product.name}`, async ({ page, cartPage, productPage }) => {


        // Prepare to capture API response for product data
        const productsResponsePromise = page.waitForResponse('**/products.json');

        // Navigate to application under test
        await page.goto('https://react-shopping-cart-67954.firebaseapp.com/');

        // Resolve intercepted API response and parse JSON payload
        const productsResponse = await productsResponsePromise;
        const productsData = await productsResponse.json();

        // Debug log for verification of intercepted product data
        console.log(
            `LOG: Intercepted ${productsData.products.length} products for ${product.name}`
        );

        // Select product size dynamically from test data
        await productPage.selectSize(product.size);

        // Add selected product to cart
        await productPage.addProductToCart(product.name);

        // Validate product is present in cart UI
        await cartPage.verifyProductInCart(product.name);

        // Validate subtotal matches expected price from dataset
        await cartPage.verifySubtotal(product.price);

        // Ensure network stability before ending test execution
        await page.waitForLoadState('networkidle');
    });
}


// ==========================
// Mocking API data for testing
// ==========================
for (const product of data.testData) {

    /**
     * Test with API mocking:
     * Intercepts product API response and modifies product price
     * to validate UI behavior under controlled backend data
     */
    test(`@smoke Mocking and Validating - ${product.name}`, async ({ page, cartPage, productPage,context }) => {


        // Intercept products API response and modify payload
        await page.route(`**/products.json`, async (route) => {

            try {
                const response = await route.fetch();
                const json = await response.json();

                // Validate API structure before modification
                if (json && json.products && json.products.length > 0) {

                    console.log(`LOG: Successfully intercepted ${json.products.length} products.`);

                    // Modify first product price for controlled test scenario
                    json.products[0].price = 0.01;

                    console.log(`LOG: Mocked ${json.products[0].title} price to $0.01`);

                    // Fulfill request with modified payload
                    await route.fulfill({
                        contentType: 'application/json',
                        body: JSON.stringify(json)
                    });
                }
            } catch (e) {
                // Handle network or parsing issues gracefully
                console.log('Network interception settled.');
            }

        });

        // Navigate to application
        await page.goto('https://react-shopping-cart-67954.firebaseapp.com/');

        // Perform product selection and cart actions
        await productPage.selectSize(product.size);
        await productPage.addProductToCart(product.name);

        // Validate mocked subtotal behavior
        await cartPage.verifySubtotal(product.price);

        // Clean up route interception after test execution
        await page.unroute('**/products.json');
    });

}


// ==========================
// Test: Product cost validation (E2E flow)
// ==========================
test('@smoke product cost validation', async ({ page, cartPage }) => {

    // Navigate to application under test
    await page.goto('https://react-shopping-cart-67954.firebaseapp.com/');

    // Select product size (exact match ensures correct option selection)
    await page.locator('span').getByText('L', { exact: true }).click();

    // Locate product card using text-based filtering strategy
    const productCard = page.locator('div')
        .filter({
            has: page.getByText('Tropical Wine T-shirt'),
        })
        .last(); // Used due to multiple DOM matches (temporary workaround)

    // Add product to cart from selected product card
    await productCard.getByText('Add to cart').click();

    // Validate product presence and subtotal correctness in cart
    await cartPage.verifyProductInCart('Tropical Wine T-shirt');
    await cartPage.verifySubtotal('$ 134.90');
});