//load the tools
import {test, expect} from '@playwright/test';

//start the test
test('Verify page title', async({page}) => {

    // goto URL
    await page.goto('https://react-shopping-cart-67954.firebaseapp.com/');

    // check if page has the right title
    await expect(page).toHaveTitle(/Typescript React Shopping cart/);
});