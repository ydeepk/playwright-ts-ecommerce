# 🎭 Enterprise Playwright & TypeScript E2E Framework

![Playwright](https://img.shields.io/badge/Playwright-v1.40+-2EAD33?style=for-the-badge&logo=Playwright&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-v5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-CI/CD-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)

> A production-grade end-to-end (E2E) and API test automation architecture built with **Playwright** and **TypeScript**. Designed around deterministic execution, strict separation of concerns, custom fixture injection, and zero-maintenance CI/CD feedback loops.

---

## 🏛️ Framework Architecture & Design Philosophy

Rather than treating test automation as simple browser scripting, this framework approaches test design from a **System Architecture** perspective.

┌──────────────────────────────────────────┐
              │          Spec Files (tests/*)            │
              └────────────────────┬─────────────────────┘
                                   │ (Dependency Injection via Fixtures)
                                   ▼
              ┌──────────────────────────────────────────┐
              │       Custom Fixtures (base.fixture)     │
              └─────────┬──────────────────────┬─────────┘
                        │                      │
   ┌────────────────────▼─────┐          ┌─────▼───────────────────┐
   │   Page & Component Objects│          │    API Service Clients  │
   │   (src/pages, components)│          │        (src/api)        │
   └────────────┬─────────────┘          └─────────────┬───────────┘
                │                                      │
                └──────────────────┬───────────────────┘
                                   │
                                   ▼
              ┌──────────────────────────────────────────┐
              │          Application Under Test          │
              └──────────────────────────────────────────┘


### 🧠 Core Architectural Pillars

1. **Custom Fixture Dependency Injection (`base.fixture.ts`)**
   * Eliminates repetitive page object instantiations in test specs.
   * Automatically initializes and scopes Page Objects, Component Objects, and API clients directly into the test context.
2. **Component Object Model (COM) + Page Object Model (POM)**
   * Reusable UI sub-systems (e.g., `Navbar.component.ts`, `Navigation.components.ts`) are encapsulated separately from full page structures to strictly adhere to the **Single Responsibility Principle (SRP)**.
3. **Global Authentication State Reuse (`.auth/`)**
   * Eliminates UI login overhead for every test. The `auth.setup.ts` routine authenticates once and persists browser session states (`*.storageState.json`) across Chromium, Firefox, and WebKit.
4. **Hybrid UI & API Testing Engine**
   * Uses dedicated API clients (e.g., `EmployeeClient.ts`) to seed data, bypass UI steps, or validate backend state directly alongside UI specs.
5. **Data-Driven Architecture (`src/data/`)**
   * Decouples test code from environment data and test payloads via strict JSON schemas (`products.json`, `login-details.json`, `issue-categories.json`).

---

## 📂 Repository Directory Structure

```text
PLAYWRIGHT-TS-ECOMMERCE/
├── .auth/                        # Persisted multi-browser session states
│   ├── chromium-storageState.json
│   ├── firefox-storageState.json
│   └── webkit-storageState.json
├── .github/
│   └── workflows/
│       └── playwright.yml        # Multi-job CI/CD pipeline configuration
├── scripts/
│   └── send-email-report.ts      # Automated HTML email dispatch engine
├── src/
│   ├── api/                      # Backend API client wrappers
│   │   └── EmployeeClient.ts
│   ├── components/               # Modular UI Component Objects
│   │   ├── Navbar.component.ts
│   │   └── Navigation.components.ts
│   ├── config/                   # Strongly-typed environment credentials
│   │   └── credentials.ts
│   ├── data/                     # Externalized test data fixtures (JSON)
│   │   ├── issue-categories.json
│   │   ├── login-details.json
│   │   └── products.json
│   ├── fixtures/                 # Custom Playwright fixture extensions
│   │   └── base.fixture.ts
│   ├── pages/                    # Page Object Model classes
│   │   ├── Cart.page.ts
│   │   ├── Dashboard.page.ts
│   │   ├── Login.page.ts
│   │   ├── PIM.page.ts
│   │   └── Product.page.ts
│   └── utils/                    # Core framework utility functions
├── tests/                        # Categorized Test Suites
│   ├── api/                      # Pure API integration specs
│   │   ├── auth.api.spec.ts
│   │   ├── employee.api.spec.ts
│   │   └── pim-api.spec.ts
│   ├── cart/                     # Shopping cart functional specs
│   ├── homepage/                 # Landing page smoke specs
│   ├── login-logout/             # Auth workflow specs
│   ├── pim/                      # Personnel Management E2E workflows
│   └── setup/                    # Global session setup routines
│       └── auth.setup.ts
├── .env                          # Local environment variables
├── package.json
├── playwright.config.ts          # Central Playwright runner config
└── tsconfig.json                 # TypeScript compiler setup

## ⚡ Quick Start & Setup Guide

### 📋 Prerequisites
* **Node.js**: `v20.x` or higher
* **npm**: `v10.x` or higher

---

### 1. Installation

Clone the repository and install project dependencies:

```bash
git clone [https://github.com/your-username/playwright-ts-ecommerce.git](https://github.com/your-username/playwright-ts-ecommerce.git)
cd playwright-ts-ecommerce
npm ci

### 🔑 Environment Configuration

Create a `.env` file in the project root:

```env
# Application Base Credentials
BASE_URL=[https://opensource-demo.orangehrmlive.com](https://opensource-demo.orangehrmlive.com)
ADMIN_USER=Admin
ADMIN_PASS=admin123
ESS_USER=ess_username
ESS_PASS=ess_password

# Email Alert Configuration (CI/CD)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
MAIL_USERNAME=automation.bot@company.com
MAIL_PASSWORD=your_app_password

Bash
# View Playwright Built-in HTML Report
npx playwright show-report

# View Allure Dashboard (if generated)
npx allure serve allure-results
🔄 CI/CD & Automated Stakeholder Reporting
The framework utilizes GitHub Actions (.github/workflows/playwright.yml) structured into isolated workflow stages:

[ Code Push / Schedule ]
          │
          ▼
┌───────────────────┐
│  Run Playwright   │  ──► Matrix execution across Chromium / Firefox / WebKit
│   Test Matrix     │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Aggregate Reports │  ──► Merges JSON stats & deploys Allure Dashboard to GitHub Pages
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Send Notification │  ──► Parses execution metrics and dispatches dynamic
│   (ts-node/tsx)   │      HTML status emails directly to stakeholders
└─────────┬─────────┘

### ⚙️ Key CI/CD Pipeline Features

* **Fail-Fast State Retention:** Screenshots, Playwright trace files (`.zip`), and execution videos are captured automatically on test failure and uploaded as GitHub Actions workflow artifacts for rapid debugging.
* **Dynamic Stakeholder Email Dispatch:** Executes `scripts/send-email-report.ts` post-run to parse `report.json` and dispatch dynamic HTML reports (pass/fail metrics, execution duration, and log links) directly to configured stakeholders.

## 🎯 Framework Enhancements & Roadmap

The following core patterns are implemented, with ongoing architectural refactoring and ecosystem expansions planned across phases:

### ✅ Implemented Core Architecture
- [x] **Custom Fixture Dependency Injection:** Centralized page/API initialization via `src/fixtures/base.fixture.ts`.
- [x] **Global Session State Reuse:** Fast multi-browser auth session caching via `.auth/*.storageState.json`.
- [x] **Component Object Model (COM):** Modular UI sub-system encapsulation in `src/components/`.
- [x] **Automated Stakeholder Reporting:** Custom TypeScript email dispatch script (`scripts/send-email-report.ts`).

---

### 🚧 Phase 1: Structural Refactoring & Design Patterns (In Progress)
- [ ] **Dedicated Locators Layer:** Extract selectors into `src/locators/*.locators.ts` to strictly separate DOM locators from Page Object business logic.
- [ ] **Centralized Constants Engine:** Establish `src/constants/` (`routes`, `messages`, `timeouts`) to eliminate magic strings and hardcoded waits across specs.
- [ ] **Type-Safe Environment Config:** Implement a fail-fast env loader with strict TypeScript schema validation for early CI configuration checks.

---

### 🚀 Phase 2: Hybrid Testing & Quality Audits (Next Up)
- [ ] **Expanded API Suite & Schema Validation:** Add runtime response payload schema checks (`zod`/`ajv`) and utilize API clients for fast UI data seeding.
- [ ] **Automated Accessibility Audits:** Integrate `@axe-core/playwright` to run automated WCAG accessibility scans on core pages.
- [ ] **Network Virtualization & Mocking:** Utilize `page.route` for network mocking to test edge cases, error states, and slow API responses.

---

### 📱 Phase 3: Advanced Capabilities & Cross-Platform (Roadmap)
- [ ] **Visual Regression Testing:** Integrate Playwright native snapshot matching / Applitools for layout bug detection.
- [ ] **Performance Auditing:** Automated Web Vitals and Lighthouse performance metrics collection during E2E runs.
- [ ] **Dedicated Appium Mobile Suite:** Build a standalone Appium + TypeScript framework repository targeting native mobile apps (10 core E2E workflows).

## 🤝 Author & Engineering Standard

Architected with a focus on **enterprise reliability**, **maintainability**, and **scalable automation engineering**. Built to demonstrate production-grade testing practices across complex Web and API applications.

---

### ⚡ Quick Git Commands to Commit & Push

```bash
git add README.md
git commit -m "docs: update framework roadmap and architectural enhancements"
git push origin main