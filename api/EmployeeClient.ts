import { APIRequestContext, expect } from "@playwright/test";

export class EmployeeClient {
  // Use Playwright's isolated request context
  constructor(private request: APIRequestContext) {}

  /**
   * Creates a new employee using the internal REST API
   * @param firstName Employee's first name
   * @param lastName Employee's last name
   * @param employeeId Unique tracking identifier
   */
  async createEmployee(
    firstName: string,
    lastName: string,
    employeeId: string,
  ) {
    const response = await this.request.post(
      "/web/index.php/api/v2/pim/employees",
      {
        data: {
          firstName,
          middleName: "",
          lastName,
          employeeId,
        },
      },
    );

    // Assert status codes inside client wrappers for immediate debugging
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Fetches employee details by their system internal code
   */
  async getEmployeeDetails(empNumber: number) {
    const response = await this.request.get(
      `/web/index.php/api/v2/pim/employees/${empNumber}`,
    );
    expect(response.ok()).toBeTruthy();
    return await response.json();
  }
}
