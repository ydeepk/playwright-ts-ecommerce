 // Load Playwright testing utilities
import { test, expect } from '@playwright/test';

// ==========================
// Test: Verify Page Title
// ==========================
test('Verify page title', async ({ page }) => {

    // Navigate to the application under test
    await page.goto('https://react-shopping-cart-67954.firebaseapp.com/');

    // Validate that the page title matches expected pattern
    // Using regex allows flexibility in minor title variations
    await expect(page).toHaveTitle(/Typescript React Shopping cart/);
});