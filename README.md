
# 🚀 Playwright & TypeScript Automation Framework
**Automation Architecture**

## 📌 Project Strategy
This repository demonstrates a transition from basic script-writing to a **Production-Grade Automation Framework**. The goal is to build "Immortal" tests—scripts that are resilient to UI changes, handle complex asynchronous states, and follow the **Page Object Model (POM)** to minimize maintenance debt.

---

## 🛠️ Phase 1: Robust Locators & Scoping
**Core Focus:** Solving the "Flakiness" that kills 90% of automation projects.
* **Anchor-Based Filtering:** Solved **Strict Mode Violations** by using parent-child scoping. Instead of searching the whole page, we isolate specific containers (e.g., finding a unique "Product Card" in a grid of 16).
* **Semantic Selectors:** Eliminated brittle CSS/XPath selectors. Implemented **User-Centric Locators** (Roles, Text, Labels) that align with how a human interacts with the web.
* **RegEx Assertions:** Used Regular Expressions for price and data validation to handle dynamic spacing and currency symbols, ensuring tests don't fail over "invisible" character changes.

---

## 🏗️ Phase 2: Design Patterns & Scaling
**Core Focus:** Architectural integrity for 100+ test suites.
* **Page Object Model (POM):** Decoupling **Test Logic** from **UI Locators**. All selectors and actions are moved into Class-based libraries.
    * *Interview Value:* Demonstrates an understanding of **DRY (Don't Repeat Yourself)** principles.
* **TypeScript Integration:** Leveraging static typing to catch errors during coding rather than at runtime.
* **Synchronization Mastery:** Implemented smart waits (`waitFor({ state: 'visible' })`) to handle React/Angular animations, replacing "hard sleeps" with intent-based waiting.

---

## 📡 Phase 3: API & Advanced Workflows
**Core Focus:** Moving beyond the "Surface" of the browser.
* **API Interception & Mocking:** Using `page.route` to intercept network calls, verify JSON payloads, and mock server responses for faster, isolated testing.
* **Authentication State Persistence:** Implementation of `storageState` to bypass login flows for every test, cutting execution time by up to 50%.
* **CI/CD Integration:** Setting up GitHub Actions to run tests on every "Push," simulating a real-world DevOps environment.

---

## 📈 Key Technical Skills Gained
| Principle | Technical Implementation |
| :--- | :--- |
| **Stability** | Actionability Checks, Web-First Assertions, Retries |
| **Maintenance** | Page Object Model (POM), Centralized Configs |
| **Data Handling** | JSON Fixtures, RegEx Validation, Dynamic Filtering |
| **Performance** | Non-blocking Async/Await, Parallel Execution |

---

## 💡 The "Engineer" Mindset
> *"Automation is not just 'clicking buttons.' It is a software engineering discipline. This project focuses on reducing the 'Maintenance Burden'—ensuring that when the UI changes, the framework only needs a 10-second fix in one location."*

---

### **How to Run the Suite**
1. **Setup:** `npm install`
2. **Execute:** `npx playwright test`
3. **Debug:** `npx playwright test --debug` (To step through the logic)
4. **Trace:** `npx playwright show-report` (To see the execution timeline)
