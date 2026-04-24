import { test, expect } from '../../fixtures/base.fixture';


test.use({storageState: undefined});

test.describe('PIM security & Edge cases', () => { 
    
    test.beforeEach(async({page}) => {
        await page.goto('/');
    });


    test('verify unauthorise access', async({navbar, pimPage})=>{



        await navComponent.goToPIM;
      

        test.step('verify redirected to Login', async () => {

        });

    });

});