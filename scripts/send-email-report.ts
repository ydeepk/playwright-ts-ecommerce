import fs from 'fs';
import nodemailer from 'nodemailer';
import path from 'path';

// ==============================================================================
// TYPES & INTERFACES
// ==============================================================================
interface TestResult {
  status: string;
  duration: number;
}

interface SpecTest {
  projectName: string;
  results: TestResult[];
  status: string; // 'expected' | 'unexpected' | 'flaky' | 'skipped'
}

interface Spec {
  title: string;
  ok: boolean;
  tests: SpecTest[];
}

interface Suite {
  title: string;
  file?: string;
  suites?: Suite[];
  specs?: Spec[];
}

interface PlaywrightJSONReport {
  stats?: {
    startTime?: string;
    duration?: number;
  };
  suites?: Suite[];
}

interface ProjectMetrics {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}

interface ModuleSummary {
  name: string;
  scenarios: Set<string>;
  passed: number;
  failed: number;
}

// ==============================================================================
// 1. JSON REPORT PARSER & AGGREGATOR
// ==============================================================================
function findJsonReportFiles(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findJsonReportFiles(filePath));
    } else if (file.endsWith('.json')) {
      results.push(filePath);
    }
  });
  return results;
}

function parseReports(resultsDir: string) {
  const jsonFiles = findJsonReportFiles(resultsDir);
  
  let totalDurationMs = 0;
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let skippedTests = 0;

  const projectMap: Record<string, ProjectMetrics> = {};
  const moduleMap: Record<string, ModuleSummary> = {
    Authentication: { name: 'Authentication & Access Security', scenarios: new Set(), passed: 0, failed: 0 },
    Admin: { name: 'Admin Portal & System User Management', scenarios: new Set(), passed: 0, failed: 0 },
    ESS: { name: 'Employee Self Service (ESS) & Profile', scenarios: new Set(), passed: 0, failed: 0 },
    Core: { name: 'Core Workflows & Navigation', scenarios: new Set(), passed: 0, failed: 0 }
  };

  jsonFiles.forEach((file) => {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const data: PlaywrightJSONReport = JSON.parse(content);

      if (data.stats?.duration) {
        totalDurationMs += data.stats.duration;
      }

      function processSuite(suite: Suite) {
        // Module categorizer based on file paths
        const filePath = suite.file || '';
        let targetModuleKey = 'Core';
        if (filePath.includes('auth') || filePath.includes('login')) targetModuleKey = 'Authentication';
        else if (filePath.includes('admin')) targetModuleKey = 'Admin';
        else if (filePath.includes('ess') || filePath.includes('employee')) targetModuleKey = 'ESS';

        if (suite.specs) {
          suite.specs.forEach((spec) => {
            const specTitle = spec.title;
            moduleMap[targetModuleKey].scenarios.add(specTitle);

            spec.tests.forEach((test) => {
              const proj = test.projectName || 'default';
              if (!projectMap[proj]) {
                projectMap[proj] = { total: 0, passed: 0, failed: 0, skipped: 0 };
              }

              totalTests++;
              projectMap[proj].total++;

              const isPass = test.status === 'expected';
              const isFail = test.status === 'unexpected';
              const isSkip = test.status === 'skipped';

              if (isPass) {
                passedTests++;
                projectMap[proj].passed++;
                moduleMap[targetModuleKey].passed++;
              } else if (isFail) {
                failedTests++;
                projectMap[proj].failed++;
                moduleMap[targetModuleKey].failed++;
              } else if (isSkip) {
                skippedTests++;
                projectMap[proj].skipped++;
              }
            });
          });
        }

        if (suite.suites) {
          suite.suites.forEach(processSuite);
        }
      }

      if (data.suites) {
        data.suites.forEach(processSuite);
      }
    } catch (e) {
      console.warn(`Could not parse JSON report at ${file}:`, e);
    }
  });

  const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0.0';
  const durationMinutes = (totalDurationMs / 60000).toFixed(2);

  return {
    totalTests,
    passedTests,
    failedTests,
    skippedTests,
    passRate,
    durationMinutes,
    projectMap,
    moduleMap
  };
}

// ==============================================================================
// 2. CONTEXT & TRIGGER RESOLUTION
// ==============================================================================
function getExecutionTrigger(): { label: string; description: string } {
  const eventName = process.env.GITHUB_EVENT_NAME || 'workflow_dispatch';
  switch (eventName) {
    case 'schedule':
      return { label: 'Scheduled Nightly Build', description: 'Automated Nightly Schedule (Cron)' };
    case 'pull_request':
      return { label: 'Pull Request Gate Check', description: 'PR Verification Pipeline' };
    case 'push':
      return { label: 'Post-Merge Regression', description: 'Main Branch Commit Trigger' };
    default:
      return { label: 'Manual Execution', description: 'On-Demand Pipeline Dispatch' };
  }
}

function getBrowserFriendlyName(projName: string): string {
  if (projName.includes('chromium')) return 'Google Chrome';
  if (projName.includes('firefox')) return 'Mozilla Firefox';
  if (projName.includes('webkit')) return 'Apple Safari (WebKit)';
  return projName;
}

// ==============================================================================
// 3. HTML EMAIL TEMPLATE BUILDER
// ==============================================================================
function buildHtmlReport(metrics: ReturnType<typeof parseReports>) {
  const envName = process.env.TEST_ENV || 'QA-Staging';
  const trigger = getExecutionTrigger();
  const overallStatus = metrics.failedTests === 0 && metrics.totalTests > 0 ? 'PASSED' : 'FAILED';
  const statusColor = overallStatus === 'PASSED' ? '#2e7d32' : '#d32f2f';
  const statusBg = overallStatus === 'PASSED' ? '#e8f5e9' : '#ffebee';

  const allureBaseUrl = 'https://yadavdeepak.github.io/playwright-e2e';
  const githubRepoUrl = process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY 
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}` 
    : 'https://github.com/yadavdeepak/playwright-e2e';

  // Build Project Breakdown Rows
  const projectRows = Object.entries(metrics.projectMap)
    .map(([proj, stats]) => {
      const rate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(0) : '0';
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;"><b>${getBrowserFriendlyName(proj)}</b> (<code>${proj}</code>)</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${stats.total}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center; color: #2e7d32; font-weight: bold;">${stats.passed}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center; color: ${stats.failed > 0 ? '#d32f2f' : '#757575'}; font-weight: bold;">${stats.failed}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${rate}%</td>
        </tr>`;
    })
    .join('');

  // Build Module Rows
  const moduleRows = Object.values(metrics.moduleMap)
    .filter(m => m.scenarios.size > 0)
    .map(m => {
      const status = m.failed === 0 ? '<span style="color: #2e7d32; font-weight: bold;">PASSED</span>' : '<span style="color: #d32f2f; font-weight: bold;">FAILED</span>';
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;"><b>${m.name}</b></td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${Array.from(m.scenarios).slice(0, 3).join(', ')}${m.scenarios.size > 3 ? '...' : ''}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${status}</td>
        </tr>`;
    })
    .join('');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333333; background-color: #f4f6f8; margin: 0; padding: 20px; }
      .container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid #e0e0e0; }
      .header { background: #1a237e; color: #ffffff; padding: 24px; text-align: left; }
      .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
      .header p { margin: 4px 0 0 0; font-size: 13px; opacity: 0.85; }
      .badge { display: inline-block; padding: 6px 14px; font-weight: bold; border-radius: 20px; font-size: 13px; background-color: ${statusBg}; color: ${statusColor}; margin-top: 10px; }
      .content { padding: 24px; }
      .section-title { font-size: 15px; font-weight: 700; color: #1a237e; border-bottom: 2px solid #1a237e; padding-bottom: 6px; margin-top: 24px; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
      .metrics-grid { display: table; width: 100%; table-layout: fixed; margin-bottom: 15px; }
      .metric-card { display: table-cell; background: #f8f9fa; padding: 12px; text-align: center; border-radius: 6px; border: 1px solid #e9ecef; }
      .metric-value { font-size: 20px; font-weight: bold; color: #111827; }
      .metric-label { font-size: 11px; color: #6b7280; text-transform: uppercase; margin-top: 2px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px; }
      th { background-color: #f3f4f6; color: #374151; font-weight: 600; text-align: left; padding: 10px; border-bottom: 2px solid #e5e7eb; }
      .btn { display: inline-block; padding: 10px 18px; background-color: #1a237e; color: #ffffff !important; text-decoration: none; border-radius: 5px; font-weight: 600; font-size: 13px; margin-right: 10px; margin-bottom: 10px; }
      .btn-secondary { background-color: #4b5563; }
      .footer { background-color: #f9fafb; padding: 16px 24px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>OrangeHRM E2E Automation Report</h1>
        <p>Environment: <b>${envName}</b> | Trigger: <b>${trigger.description}</b></p>
        <div class="badge">STATUS: ${overallStatus} (${metrics.passRate}% Pass Rate)</div>
      </div>

      <div class="content">
        <!-- METRICS CARDS -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${metrics.totalTests}</div>
            <div class="metric-label">Total Tests</div>
          </div>
          <div class="metric-card" style="margin-left: 8px;">
            <div class="metric-value" style="color: #2e7d32;">${metrics.passedTests}</div>
            <div class="metric-label">Passed</div>
          </div>
          <div class="metric-card" style="margin-left: 8px;">
            <div class="metric-value" style="color: ${metrics.failedTests > 0 ? '#d32f2f' : '#111827'};">${metrics.failedTests}</div>
            <div class="metric-label">Failed</div>
          </div>
          <div class="metric-card" style="margin-left: 8px;">
            <div class="metric-value">${metrics.durationMinutes}m</div>
            <div class="metric-label">Duration</div>
          </div>
        </div>

        <!-- DASHBOARD LINKS -->
        <div class="section-title">Interactive Dashboards</div>
        <p style="font-size: 13px; margin-bottom: 12px; color: #4b5563;">Access full step-by-step traces, failure screenshots, and historical trends:</p>
        <div>
          <a href="${allureBaseUrl}/allure-results/" class="btn" target="_blank">📊 View Latest Allure Run</a>
          <a href="${allureBaseUrl}/" class="btn btn-secondary" target="_blank">📈 View Multi-Day Trends</a>
        </div>

        <!-- MODULES TESTED -->
        <div class="section-title">Application Modules Tested</div>
        <table>
          <thead>
            <tr>
              <th>Functional Module</th>
              <th>Scenarios Covered</th>
              <th style="text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${moduleRows}
          </tbody>
        </table>

        <!-- BROWSER COVERAGE -->
        <div class="section-title">Browser & Platform Coverage</div>
        <table>
          <thead>
            <tr>
              <th>Browser / Engine</th>
              <th style="text-align: center;">Total</th>
              <th style="text-align: center;">Passed</th>
              <th style="text-align: center;">Failed</th>
              <th style="text-align: center;">Pass Rate</th>
            </tr>
          </thead>
          <tbody>
            ${projectRows}
          </tbody>
        </table>

        <!-- QA LEAD NOTES -->
        <div class="section-title">QA Lead Insights</div>
        <ul style="font-size: 13px; color: #374151; padding-left: 18px; margin: 0;">
          <li><b>Execution Strategy:</b> Parallel execution across cloud nodes reduced total suite duration to <b>${metrics.durationMinutes} minutes</b>.</li>
          <li><b>Regression Status:</b> ${metrics.failedTests === 0 ? 'Zero regressions observed across core Admin and ESS workflows.' : `${metrics.failedTests} failing tests detected. Check Allure traces for root cause.`}</li>
        </ul>
      </div>

      <div class="footer">
        Automated report dispatched by <b>Playwright CI/CD Pipeline</b>.<br>
        Repository: <a href="${githubRepoUrl}" style="color: #1a237e;">${process.env.GITHUB_REPOSITORY || 'yadavdeepak/playwright-e2e'}</a>
      </div>
    </div>
  </body>
  </html>
  `;
}

// ==============================================================================
// 4. MAIN DISPATCHER
// ==============================================================================
async function main() {
  console.log('🔍 Scanning for Playwright JSON test artifacts...');
  const resultsDir = path.join(process.cwd(), 'test-results');
  const metrics = parseReports(resultsDir);

  console.log(`📊 Aggregated Metrics: ${metrics.passedTests}/${metrics.totalTests} Passed (${metrics.passRate}%) in ${metrics.durationMinutes} mins.`);

  const htmlContent = buildHtmlReport(metrics);
  const trigger = getExecutionTrigger();
  const envName = process.env.TEST_ENV || 'QA-Staging';
  const overallStatus = metrics.failedTests === 0 && metrics.totalTests > 0 ? 'PASSED' : 'FAILED';

  const subject = `[${overallStatus}] OrangeHRM E2E Test Summary — ${envName} (${trigger.label})`;

  // Transporter configuration from environment variables
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const recipients = process.env.EMAIL_STAKEHOLDERS || 'yadavdeepak@outlook.com,kozonhq@gmail.com';

  console.log(`✉️ Sending email to: ${recipients}...`);

  await transporter.sendMail({
    from: `"Automation QA Team" <${process.env.SMTP_USER}>`,
    to: recipients,
    subject: subject,
    html: htmlContent,
  });

  console.log('✅ Email report successfully sent!');
}

main().catch((err) => {
  console.error('❌ Failed to send email report:', err);
  process.exit(1);
});