//load the tools
import {test, expect} from '@playwright/test';

//start the test
test('Verify page title', async({page}) => {

    // goto URL
    await page.goto('/');

    // check if page has the right title
    await expect(page).toHaveTitle(/Typescript React Shopping cart/);
});