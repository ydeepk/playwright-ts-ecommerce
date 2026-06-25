import { test, expect } from "@playwright/test";
import { EmployeeClient } from "../../api/EmployeeClient";

test.describe("OrangeHRM - PIM Module REST API Validations", () => {
  let apiContext: any;
  let empClient: EmployeeClient;

  // Setup authentication state before executing the suite
  test.beforeAll(async ({ playwright, baseURL }) => {
    // 1. Launch a silent, headless browser instance to manage cookies automatically
    const browser = await playwright.chromium.launch();
    const context = await browser.newContext({ baseURL });

    // 2. Derive the api request context straight from the browser session
    apiContext = context.request;

    // 3. Fire the login POST request(the browser context will ensure the cookies)
    const loginResponse = await apiContext.post(
      "/web/index.php/auth/validate",
      {
        form: {
          username: "Admin",
          password: "admin123",
        },
      },
    );
    // 4. verify login handshake passed
    expect(loginResponse.status()).toBeLessThan(400);

    const cookies = await context.cookies();

    const csrfCookie = cookies.find(c => c.name.includes('csrf') || c.name.includes('XSRF'));
    const csrfToken = csrfCookie ? csrfCookie.value : '';

    const authenticatedContext = await playwright.request.newContext({
      baseURL: baseURL,
      extraHTTPHeaders: {
        'X-XSRF-TOKEN': csrfToken,
        'Cookie': cookies.map(c => {`${c.name}=${c.value}`}).join(';') 
      }
    });

    // 5. Instantiate our client wrapper with the session-aware context
    empClient = new EmployeeClient(authenticatedContext);
  });

  test("Should successfully provision a new employee record via POST", async () => {
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

  test.afterAll(async () => {
    await apiContext.dispose();
  });
});
