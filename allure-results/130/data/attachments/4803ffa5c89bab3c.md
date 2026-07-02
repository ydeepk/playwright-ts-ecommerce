# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pim/pim-security-edge.spec.ts >> @edge PIM Security & Edge Cases >> ESS user should see masked sensitive employee data and restricted edit access
- Location: tests/pim/pim-security-edge.spec.ts:52:9

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Add' })

```

# Test source

```ts
  3   | export class PIMPage {
  4   | 
  5   |     // ==========================
  6   |     // Core
  7   |     // ==========================
  8   |     private readonly page: Page;
  9   | 
  10  |     // ==========================
  11  |     // Action Buttons
  12  |     // ==========================
  13  |     private readonly addButton: Locator;
  14  |     private readonly saveButton: Locator;
  15  |     private readonly searchButton: Locator;
  16  |     private readonly resetButton: Locator;
  17  | 
  18  |     // ==========================
  19  |     // Form Inputs
  20  |     // ==========================
  21  |     private readonly firstNameInput: Locator;
  22  |     private readonly lastNameInput: Locator;
  23  |     private readonly employeeIdInput: Locator;
  24  |     private readonly ssnInput: Locator;
  25  | 
  26  |     // ==========================
  27  |     // UI Elements / Containers
  28  |     // ==========================
  29  |     private readonly headerTitle: Locator;
  30  |     private readonly employeeTable: Locator;
  31  |     private readonly tableRecords: Locator;
  32  |     private readonly recordsFoundText: Locator;
  33  | 
  34  |     // ==========================
  35  |     // Feedback / State Elements
  36  |     // ==========================
  37  |     private readonly spinner: Locator;
  38  |     private readonly noRecordsMessage: Locator;
  39  |     private readonly successToast: Locator;
  40  | 
  41  |     // ==========================
  42  |     // Constructor
  43  |     // ==========================
  44  |     constructor(page: Page) {
  45  |         this.page = page;
  46  | 
  47  |         // Buttons
  48  |         this.addButton = page.getByRole('button', { name: 'Add' });
  49  |         this.saveButton = page.getByRole('button', { name: 'Save' });
  50  |         this.searchButton = page.getByRole('button', { name: 'Search' });
  51  |         this.resetButton = page.getByRole('button', { name: 'Reset' });
  52  | 
  53  |         // Inputs
  54  |         this.firstNameInput = page.getByPlaceholder('First Name');
  55  |         this.lastNameInput = page.getByPlaceholder('Last Name');
  56  | 
  57  |         this.employeeIdInput = page
  58  |             .locator('.oxd-input-group', { hasText: 'Employee Id' })
  59  |             .locator('input');
  60  | 
  61  |         this.ssnInput = page
  62  |             .locator('label:has-text("SSN Number")')
  63  |             .locator('xpath=./../..//input');
  64  | 
  65  |         // Containers
  66  |         this.headerTitle = page.locator('.oxd-topbar-header-title');
  67  |         this.employeeTable = page.locator('.orangehrm-container');
  68  |         this.tableRecords = page.locator('.oxd-table-card');
  69  | 
  70  |         this.recordsFoundText = page
  71  |             .locator('span.oxd-text--span')
  72  |             .filter({ hasText: /Records Found/ });
  73  | 
  74  |         // State / feedback
  75  |         this.spinner = page.locator('.oxd-loading-spinner');
  76  |         this.noRecordsMessage = page.locator('.orangehrm-horizontal-padding > .oxd-text--span');
  77  |         this.successToast = page.getByText('Successfully Updated');
  78  |     }
  79  | 
  80  |     /**
  81  |      * Returns a specific employee row by ID
  82  |      * Uses row-level filtering to avoid matching incorrect cells
  83  |      */
  84  |     private getEmployeeRow(employeeId: string): Locator {
  85  |         return this.tableRecords.filter({ hasText: employeeId });
  86  |     }
  87  | 
  88  |     /**
  89  |      * Navigates to employee list page
  90  |      * Explicit navigation avoids hidden dependencies between methods
  91  |      */
  92  |     async navigateToEmployeeList(): Promise<void> {
  93  |         await this.page.goto('/web/index.php/pim/viewEmployeeList');
  94  |         await expect(this.page).toHaveURL(/viewEmployeeList/);
  95  |     }
  96  | 
  97  |     /**
  98  |      * Creates a new employee and returns generated ID
  99  |      * Combines form interaction with minimal validation
  100 |      */
  101 |     async addNewEmployee(firstName: string, lastName: string): Promise<string> {
  102 | 
> 103 |         await this.addButton.click();
      |                              ^ Error: locator.click: Test timeout of 30000ms exceeded.
  104 |         await expect(this.page).toHaveURL(/addEmployee/);
  105 | 
  106 |         await this.firstNameInput.fill(firstName);
  107 |         await this.lastNameInput.fill(lastName);
  108 | 
  109 |         await expect(this.employeeIdInput).not.toHaveValue('', { timeout: 10000 });
  110 | 
  111 |         const uniqueId = (Date.now().toString(36) + Math.random().toString(36).slice(2, 6)).slice(-10);
  112 |         await this.employeeIdInput.fill(uniqueId);
  113 | 
  114 |         const generatedId = await this.employeeIdInput.inputValue();
  115 | 
  116 |         await this.saveButton.click();
  117 | 
  118 |         await expect(this.page).toHaveURL(/viewPersonalDetails/i, { timeout: 20000 });
  119 | 
  120 |         return generatedId;
  121 |     }
  122 | 
  123 |     /**
  124 |      * Performs search action only
  125 |      * Does not assert results to allow reuse for positive and negative scenarios
  126 |      */
  127 |     async searchEmployeeById(employeeId: string): Promise<void> {
  128 | 
  129 |         await expect(this.page).toHaveURL(/viewEmployeeList/);
  130 | 
  131 |         await this.resetButton.click();
  132 |         await this.employeeIdInput.fill(employeeId);
  133 |         await this.searchButton.click();
  134 |     }
  135 | 
  136 |     /**
  137 |      * Verifies employee exists in search results
  138 |      */
  139 |     async verifyEmployeePresent(employeeId: string): Promise<void> {
  140 |         await expect(this.getEmployeeRow(employeeId)).toHaveCount(1, { timeout: 10000 });
  141 |     }
  142 | 
  143 |     /**
  144 |      * Deletes employee by ID
  145 |      * Assumes search has already been performed or row is visible
  146 |      */
  147 |     async deleteEmployeeById(employeeId: string): Promise<void> {
  148 | 
  149 |         await expect(this.page).toHaveURL(/viewEmployeeList/);
  150 | 
  151 |         const employeeRow = this.getEmployeeRow(employeeId);
  152 | 
  153 |         await expect(employeeRow).toHaveCount(1);
  154 | 
  155 |         await employeeRow.locator('.bi-trash').click();
  156 |         await this.page.getByRole('button', { name: 'Yes, Delete' }).click();
  157 | 
  158 |         await this.searchButton.click();
  159 |         await expect(this.getEmployeeRow(employeeId)).toHaveCount(0);
  160 |     }
  161 | 
  162 |     /**
  163 |      * Verifies employee does not exist in results
  164 |      * Assumes search has already been performed
  165 |      */
  166 |     async verifyEmployeeNotFound(employeeId: string): Promise<void> {
  167 | 
  168 |         if (await this.spinner.isVisible()) {
  169 |             await this.spinner.waitFor({ state: 'detached', timeout: 10000 });
  170 |         }
  171 | 
  172 |         await expect(this.noRecordsMessage).toHaveText('No Records Found');
  173 |         await expect(this.getEmployeeRow(employeeId)).toHaveCount(0);
  174 |     }
  175 | 
  176 |     /**
  177 |      * Navigates to employee details page
  178 |      * ID must be defined; undefined indicates test issue
  179 |      */
  180 |     async navigateToEmployeeDetails(id: string): Promise<void> {
  181 | 
  182 |         await this.page.goto(`/web/index.php/pim/viewPersonalDetails/empNumber/${id}`);
  183 | 
  184 |         await expect(this.page).toHaveURL(new RegExp(`.*${id}`));
  185 |         await expect(this.page.locator('.orangehrm-edit-employee-content')).toBeVisible();
  186 |     }
  187 | 
  188 |     /**
  189 |      * Updates SSN value
  190 |      * Uses toast only as secondary confirmation signal
  191 |      */
  192 |     async updateSSN(ssnValue: string): Promise<void> {
  193 | 
  194 |         await this.ssnInput.fill(ssnValue);
  195 |         await this.page.getByRole('button', { name: 'Save' }).first().click();
  196 | 
  197 |         await expect(this.successToast).toBeVisible();
  198 |     }
  199 | 
  200 |     /**
  201 |      * Validates PIM header visibility
  202 |      */
  203 |     async verifyPIMHeader(): Promise<void> {
```