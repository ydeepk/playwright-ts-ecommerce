import { test, expect } from '../../fixtures/base.fixture';
import * as allure from 'allure-js-commons';

test.use({storageState: undefined});

test.describe('PIM security & Edge cases', () => { 
    
    test.beforeEach(async({page}) => {
        await page.goto('/');
    });


    test('verify unauthorise access', async({navbar, pimPage})=>{

        // --- Allure Labels (non-deprecated way) ---
        await allure.label('epic', 'HR Management');
        await allure.label('feature', 'PIM Module');
        await allure.label('story', 'Unauthorized Access Protection');

        await allure.label('severity', 'critical');

        await allure.label('tag', 'security');
        await allure.label('tag', 'negative');
        await allure.label('tag', 'edge-case');

        await allure.owner('Deepak');

        await navComponent.goToPIM;
      

        test.step('verify redirected to Login', async () => {

        });

    });

});