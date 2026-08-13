import { expect, test } from '../../src/fixtures/fixtures';

/**
 * PIM Security & Role-Based Access Control (RBAC) Test Suite
 * Validates data masking, field authorization limits, and privilege separation
 * between Administrative users and Employee Self-Service (ESS) users.
 */
test.describe('PIM Security & Data Masking', () => {

  test('ESS user should see masked sensitive employee data and restricted edit access', async ({ createPageForRole }) => {
    const firstName = 'Secure';
    const lastName = 'User';
    const ssnValue = '999-66-1111';
    let generatedId: string;

    // =========================================================================
    // STAGE 1: Admin User Action Phase
    // Leverages Admin storage state context to perform privileged data setup.
    // =========================================================================
    await test.step('Admin: Create employee record with sensitive SSN data', async () => {
      const { pimPage, page } = await createPageForRole('admin');

      await pimPage.navigate();
      generatedId = await pimPage.addNewEmployee(firstName, lastName);
      
      await pimPage.navigateToEmployeeDetails(generatedId);
      await pimPage.updateSSN(ssnValue);

      // Verify Administrative privilege allows unmasked data access
      const ssnInput = page.locator('label:has-text("SSN Number")').locator('xpath=./../..//input');
      await expect(ssnInput).toHaveValue(ssnValue);
    });

    // =========================================================================
    // STAGE 2: ESS User Security Verification Phase
    // Switches to an isolated ESS storage state context to evaluate security controls.
    // =========================================================================
    await test.step('ESS User: Verify SSN field is masked and write access is restricted', async () => {
      const { pimPage: essPimPage, page: essPage } = await createPageForRole('ess');

      // Navigate directly via ID to test authorization headers and UI rendering
      await essPimPage.navigateToEmployeeDetails(generatedId);

      const essSsnInput = essPage.locator('label:has-text("SSN Number")').locator('xpath=./../..//input');

      // 1. Data Masking Validation: Ensure raw SSN value is not exposed to non-admin roles
      const actualValue = await essSsnInput.inputValue();
      expect(actualValue).not.toBe(ssnValue); 
      expect(actualValue).toContain('*'); 

      // 2. UI-Level Authorization Check: Verify edit access is revoked for ESS role
      await expect(essSsnInput).toBeDisabled();
    });

    // Note: Secondary browser contexts are automatically torn down post-test execution by the fixture framework.
  });

});