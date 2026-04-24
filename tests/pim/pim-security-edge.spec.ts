import { test, expect } from '../../fixtures/base.fixture';
import * as allure from 'allure-js-commons';

test.use({storageState: undefined});

test.describe('PIM security & Edge cases', () => { 
    
    test.beforeEach(async({page}) => {
        await page.goto('/');

        // Defensive check: ensures session is still valid
        // If redirected to login → storageState expired or missing
        if (page.url().includes('auth/login')) {

            // Fail fast instead of continuing with broken state
            // Avoids misleading failures later in test steps
            throw new Error("Session expired. Please regenerate auth state.");
        }
    });


    test('verify unauthorise access', async({navbar, navigation, pimPage})=>{

        // --- Allure Labels (non-deprecated way) ---
        await allure.label('epic', 'HR Management');
        await allure.label('feature', 'PIM Module');
        await allure.label('story', 'Unauthorized Access Protection');

        await allure.label('severity', 'critical');

        await allure.label('tag', 'security');
        await allure.label('tag', 'negative');
        await allure.label('tag', 'edge-case');

        await allure.owner('Deepak');
      

        await test.step('Go to PIM page', async () => {
               await navigation.goToPIM();
        });

        

    });

});