import { test } from '@playwright/test';
import { Login } from '../../pages/Login.page';
import { PIM } from '../../pages/PIM.page';
import { Navigation } from '../../pages/components/Navigation';


test.use({storageState: undefined});

test.describe('PIM security & Edge cases', () => { 
    
    test.beforeEach(async({page}) => {
        await page.goto('/');
    });


    test('verify unauthorise access', async({page})=>{

        const pimpage = new PIM(page);
        const loginPage = new Login(page);
        const navComponent = new Navigation(page);

        await navComponent.goToPIM;
      

        test.step('verify redirected to Login', async () => {

        });

    });

});