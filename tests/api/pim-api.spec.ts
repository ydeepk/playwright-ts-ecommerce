import { test, expect } from "@playwright/test";
import { EmployeeClient } from "../../src/api/EmployeeClient";

test.describe("OrangeHRM - PIM Module REST API Validations", () => {
  let empClient: EmployeeClient;

  // Setup authentication state before executing the suite
  test.beforeAll(async ({ playwright }) => {
    // 1. Create a fresh request context to simulate a clean browser session
    const apiContext = await playwright.request.newContext({
      baseURL: "https://opensource-demo.orangehrmlive.com",
    });

    // 2. Perform the authentication handshake
    const loginResponse = await apiContext.post(
      "/web/index.php/auth/validate",
      {
        form: {
          username: "Admin",
          password: "admin123",
        },
      },
    );
    expect(loginResponse.ok()).toBeTruthy();

    // 3. Initialize our API wrapper with the authenticated context
    empClient = new EmployeeClient(apiContext);
  });

  test("TC-API-001: Should successfully provision a new employee record via POST", async () => {
    const uniqueId = `EMP_${Date.now().toString().slice(-4)}`;

    const jsonResponse = await empClient.createEmployee(
      "Deepak",
      "Automation",
      uniqueId,
    );

    // Pro-Level Validations: Assert payload structures schema-wise
    expect(jsonResponse).toHaveProperty("data");
    expect(jsonResponse.data.firstName).toBe("Deepak");
    expect(jsonResponse.data.lastName).toBe("Automation");
    expect(jsonResponse.data.employeeId).toBe(uniqueId);
  });
});
