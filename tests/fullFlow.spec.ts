// Import Playwright test runner utilities
// 'test' defines test blocks, 'expect' is used for assertions
import {test, expect} from '@playwright/test';


//full flow Scenario challenge:  

test('product cost validation',async({ page }) => {

    // 1. Open: https://react-shopping-cart-67954.firebaseapp.com/
    await page.goto('https://react-shopping-cart-67954.firebaseapp.com/');

    //  2. Filter: Select the size "L".
    await page.locator('span').getByText('L', {exact: true}).click();

    // 3. Find & Add: Locate the "Tropical Wine T-shirt" and click its "Add to cart" button.
    const productCard = page.locator('div').filter({
        has: page.getByText('Tropical Wine T-shirt')
    }).last();

    await productCard.getByText('Add to cart').click();


    // 4. Verify Sidebar: Check that the sidebar opens and contains the text "Tropical Wine T-shirt".
    const sidebar = page.locator('div').filter({
        has: page.getByRole('button',{ name:'X'})
    }).last();

    await sidebar.waitFor({ state: 'visible'});

    await expect(sidebar.getByText('Tropical Wine T-shirt')).toBeVisible();

    // 5. Verify Total: Ensure the Subtotal is exactly "$ 134.90".
    await expect(sidebar.getByText(/\$ 134\.90/)).toBeVisible();

});