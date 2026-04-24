import { test } from '@playwright/test';
import { LoginPage } from '../../pages/Login.page';
import { PIMPage } from '../../pages/PIM.page';
import { Navigation } from '../../pages/components/Navigation';


test.use({storageState: undefined});

test.describe('PIM security & Edge cases', () => { 
    
    test.beforeEach(async({page}) => {
        await page.goto('/');
    });


    test('verify unauthorise access', async({page})=>{

        const pimpage = new PIMPage(page);
        const loginPage = new LoginPage(page);
        const navComponent = new Navigation(page);

        await navComponent.goToPIM;
      

        test.step('verify redirected to Login', async () => {

        });

    });

});