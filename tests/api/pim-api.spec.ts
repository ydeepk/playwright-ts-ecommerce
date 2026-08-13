import { expect, test } from "@playwright/test";
import { EmployeeClient } from "../../src/api/EmployeeClient";

test.describe("OrangeHRM - PIM Module REST API Validations", () => {

  test("Should successfully provision a new employee record via POST", async ({request}) => {
    const empClient = new EmployeeClient(request);

    const uniqueId = `EMP_${Date.now().toString().slice(-4)}`;

    const jsonResponse = await empClient.createEmployee(
      "Deepak",
      "QA Test",
      uniqueId,
    );

    // Pro-Level Validations: Assert payload structures schema-wise
    expect(jsonResponse).toHaveProperty("data");
    expect(jsonResponse.data.firstName).toBe("Deepak");
    expect(jsonResponse.data.lastName).toBe("QA Test");
    expect(jsonResponse.data.employeeId).toBe(uniqueId);
  });
  
});