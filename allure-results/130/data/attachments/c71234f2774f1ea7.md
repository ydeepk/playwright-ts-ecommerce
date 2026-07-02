# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api/pim-api.spec.ts >> OrangeHRM - PIM Module REST API Validations >> Should successfully provision a new employee record via POST
- Location: tests/api/pim-api.spec.ts:47:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 401
```

# Test source

```ts
  1  | import { APIRequestContext, expect } from "@playwright/test";
  2  | 
  3  | export class EmployeeClient {
  4  |   // Use Playwright's isolated request context
  5  |   constructor(private request: APIRequestContext) {}
  6  | 
  7  |   /**
  8  |    * Creates a new employee using the internal REST API
  9  |    * @param firstName Employee's first name
  10 |    * @param lastName Employee's last name
  11 |    * @param employeeId Unique tracking identifier
  12 |    */
  13 |   async createEmployee(
  14 |     firstName: string,
  15 |     lastName: string,
  16 |     employeeId: string,
  17 |   ) {
  18 |     const response = await this.request.post(
  19 |       "/web/index.php/api/v2/pim/employees",
  20 |       {
  21 |         data: {
  22 |           firstName,
  23 |           middleName: "",
  24 |           lastName,
  25 |           employeeId,
  26 |         },
  27 |       },
  28 |     );
  29 | 
  30 |     // Assert status codes inside client wrappers for immediate debugging
> 31 |     expect(response.status()).toBe(200);
     |                               ^ Error: expect(received).toBe(expected) // Object.is equality
  32 |     return await response.json();
  33 |   }
  34 | 
  35 |   /**
  36 |    * Fetches employee details by their system internal code
  37 |    */
  38 |   async getEmployeeDetails(empNumber: number) {
  39 |     const response = await this.request.get(
  40 |       `/web/index.php/api/v2/pim/employees/${empNumber}`,
  41 |     );
  42 |     expect(response.ok()).toBeTruthy();
  43 |     return await response.json();
  44 |   }
  45 | }
  46 | 
```