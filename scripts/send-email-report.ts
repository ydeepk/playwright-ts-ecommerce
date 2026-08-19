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
  flaky: number;
  failed: number;
  skipped: number;
}

interface ModuleSummary {
  name: string;
  scenarios: Set<string>;
  passed: number;
  failed: number;
  skipped: number;
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
  let flakyTests = 0;
  let failedTests = 0;
  let skippedTests = 0;

  const projectMap: Record<string, ProjectMetrics> = {};
  const moduleMap: Record<string, ModuleSummary> = {
    Authentication: { name: 'Authentication & Access Security', scenarios: new Set(), passed: 0, failed: 0, skipped: 0 },
    Admin: { name: 'Admin Portal & System User Management', scenarios: new Set(), passed: 0, failed: 0, skipped: 0 },
    ESS: { name: 'Employee Self Service (ESS) & Profile', scenarios: new Set(), passed: 0, failed: 0, skipped: 0 },
    Core: { name: 'Core Workflows & Navigation', scenarios: new Set(), passed: 0, failed: 0, skipped: 0 },
  };

  jsonFiles.forEach((file) => {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const data: PlaywrightJSONReport = JSON.parse(content);

      if (data.stats?.duration) {
        totalDurationMs += data.stats.duration;
      }

      function processSuite(suite: Suite) {
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
                projectMap[proj] = { total: 0, passed: 0, flaky: 0, failed: 0, skipped: 0 };
              }

              totalTests++;
              projectMap[proj].total++;

              const isPass = test.status === 'expected';
              const isFlaky = test.status === 'flaky';
              const isFail = test.status === 'unexpected';
              const isSkip = test.status === 'skipped';

              if (isPass) {
                passedTests++;
                projectMap[proj].passed++;
                moduleMap[targetModuleKey].passed++;
              } else if (isFlaky) {
                flakyTests++;
                passedTests++; // Flaky tests eventually passed
                projectMap[proj].flaky++;
                projectMap[proj].passed++;
                moduleMap[targetModuleKey].passed++;
              } else if (isFail) {
                failedTests++;
                projectMap[proj].failed++;
                moduleMap[targetModuleKey].failed++;
              } else if (isSkip) {
                skippedTests++;
                projectMap[proj].skipped++;
                moduleMap[targetModuleKey].skipped++;
              } else {
                // Unexpected states (timedOut, interrupted) -> treat as failed
                failedTests++;
                projectMap[proj].failed++;
                moduleMap[targetModuleKey].failed++;
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

  const passRateNum = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
  const passRate = passRateNum.toFixed(1);
  const durationMinutes = (totalDurationMs / 60000).toFixed(2);

  return {
    totalTests,
    passedTests,
    flakyTests,
    failedTests,
    skippedTests,
    passRateNum,
    passRate,
    durationMinutes,
    projectMap,
    moduleMap,
  };
}

// ==============================================================================
// 2. CONTEXT & DYNAMIC QA LEAD INSIGHTS ENGINE
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

function generateQaLeadInsights(metrics: ReturnType<typeof parseReports>): string[] {
  const insights: string[] = [];
  const { totalTests, passedTests, flakyTests, failedTests, skippedTests, passRateNum, durationMinutes, moduleMap } = metrics;

  const explicitRunType = (process.env.TEST_RUN_TYPE || '').toLowerCase();
  let scaleText = 'Targeted Run';
  if (explicitRunType.includes('regression')) scaleText = 'Full Regression Suite';
  else if (explicitRunType.includes('smoke')) scaleText = 'Smoke Verification';
  else if (explicitRunType.includes('nightly')) scaleText = 'Nightly Scheduled Build';
  else {
    scaleText = totalTests >= 150 ? 'Full Mass Regression' : totalTests >= 50 ? 'Standard Regression' : 'Targeted Smoke/Sanity';
  }

  const failedModules = Object.values(moduleMap)
    .filter((m) => m.failed > 0)
    .map((m) => m.name);

  if (totalTests === 0) {
    insights.push(`<b>🚨 NO TEST ARTIFACTS FOUND:</b> Pipeline completed without generating test results. Verify artifact paths.`);
    return insights;
  }

  // CONDITION 1: Global Blocker
  if (passedTests === 0 && failedTests > 0) {
    insights.push(`<b>🚨 CRITICAL ENVIRONMENT BLOCKER (${scaleText}):</b> 100% of tests failed (${failedTests}/${totalTests}). Check environment connectivity or base setup.`);
  } 
  // CONDITION 2: Hard Regressions
  else if (failedTests > 0) {
    insights.push(`<b>⚠️ REGRESSION DETECTED (${scaleText} — ${metrics.passRate}% Pass Rate):</b> Execution completed in <b>${durationMinutes} mins</b> with ${failedTests} hard failure(s).`);
    if (failedModules.length > 0) {
      insights.push(`<b>📍 IMPACTED MODULES:</b> Failures isolated to <b>${failedModules.join(', ')}</b>.`);
    }
  } 
  // CONDITION 3: All Passed, but Flaky Retries Occurred
  else if (flakyTests > 0) {
    insights.push(`<b>⚠️ STABLE WITH FLAKINESS (${scaleText}):</b> All test scenarios eventually passed, but <b>${flakyTests} test(s)</b> required execution retries.`);
    insights.push(`<b>🔍 RECOMMENDATION:</b> Review WebKit trace logs to resolve intermittent locator or network timeouts.`);
  } 
  // CONDITION 4: Clean Green Build
  else {
    insights.push(`<b>✅ STABLE GREEN BUILD (${scaleText}):</b> 100% clean pass rate achieved across ${totalTests} test scenarios.`);
    insights.push(`<b>⚡ PERFORMANCE:</b> Multi-machine runner optimized suite runtime down to <b>${durationMinutes} minutes</b>.`);
    insights.push(`<b>🚀 DEPLOYMENT CLEARED:</b> Zero regressions or flaky tests detected.`);
  }

  if (skippedTests > 0) {
    insights.push(`<b>⏭️ SKIPPED TESTS:</b> ${skippedTests} test(s) skipped.`);
  }

  return insights;
}

// ==============================================================================
// 3. HTML EMAIL BUILDER
// ==============================================================================
function buildHtmlReport(metrics: ReturnType<typeof parseReports>) {
  const envName = process.env.TEST_ENV || 'QA-Staging';
  const trigger = getExecutionTrigger();

  const isCleanPass = metrics.failedTests === 0 && metrics.flakyTests === 0 && metrics.totalTests > 0;
  const isFlakyPass = metrics.failedTests === 0 && metrics.flakyTests > 0;
  
  const overallStatus = isCleanPass ? 'PASSED' : isFlakyPass ? 'PASSED (FLAKY)' : metrics.passedTests === 0 ? 'BLOCKED' : 'REGRESSION DETECTED';
  const headerBg = isCleanPass ? '#1e8e3e' : isFlakyPass ? '#f9ab00' : '#d93025';
  const badgeBg = isCleanPass ? '#e6f4ea' : isFlakyPass ? '#fef7e0' : '#fce8e6';
  const badgeTextColor = isCleanPass ? '#137333' : isFlakyPass ? '#b06000' : '#c5221f';

  const repoFullName = process.env.GITHUB_REPOSITORY || 'ydeepk/playwright-ts-ecommerce';
  const [repoOwner, repoName] = repoFullName.split('/');

  const allureBaseUrl = `https://${repoOwner}.github.io/${repoName}`;
  const githubRepoUrl = `${process.env.GITHUB_SERVER_URL || 'https://github.com'}/${repoFullName}`;

  const insightsList = generateQaLeadInsights(metrics)
    .map((item) => `<li style="margin-bottom: 8px; color: #3c4043; font-size: 13px; line-height: 1.5;">${item}</li>`)
    .join('');

  const projectRows = Object.entries(metrics.projectMap)
    .map(([proj, stats]) => {
      const rate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(0) : '0';
      const failColor = stats.failed > 0 ? '#d93025' : '#5f6368';
      const passText = stats.flaky > 0 ? `${stats.passed} <span style="font-size:10px; color:#b06000;">(${stats.flaky} flaky)</span>` : `${stats.passed}`;
      
      return `
        <tr>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e8eaed; font-size: 13px; color: #202124;">
            <b>${getBrowserFriendlyName(proj)}</b> <span style="font-size: 11px; color: #70757a;">(${proj})</span>
          </td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e8eaed; text-align: center; font-size: 13px; color: #202124;">${stats.total}</td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e8eaed; text-align: center; font-size: 13px; color: #1e8e3e; font-weight: 600;">${passText}</td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e8eaed; text-align: center; font-size: 13px; color: ${failColor}; font-weight: 600;">${stats.failed}</td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e8eaed; text-align: center; font-size: 13px; color: #5f6368;">${stats.skipped}</td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e8eaed; text-align: center; font-size: 13px; font-weight: 600; color: #202124;">${rate}%</td>
        </tr>`;
    })
    .join('');

  const moduleRows = Object.values(metrics.moduleMap)
    .filter((m) => m.scenarios.size > 0)
    .map((m) => {
      const statusPill = m.failed === 0 
        ? '<span style="background-color: #e6f4ea; color: #137333; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">PASSED</span>' 
        : '<span style="background-color: #fce8e6; color: #c5221f; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">FAILED</span>';
      return `
        <tr>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e8eaed; font-size: 13px; color: #202124;"><b>${m.name}</b></td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e8eaed; font-size: 12px; color: #5f6368;">${Array.from(m.scenarios).slice(0, 3).join(', ')}${m.scenarios.size > 3 ? '...' : ''}</td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e8eaed; text-align: center;">${statusPill}</td>
        </tr>`;
    })
    .join('');

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OrangeHRM Automation Execution Report</title>
    <style>
      body { font-family: 'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, Arial, sans-serif; background-color: #f8f9fa; color: #202124; margin: 0; padding: 16px; -webkit-font-smoothing: antialiased; }
      .wrapper { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #dadce0; box-shadow: 0 1px 3px rgba(60,64,67,0.08); }
      .top-bar { height: 6px; background-color: ${headerBg}; }
      .header { padding: 24px 24px 16px 24px; border-bottom: 1px solid #f1f3f4; }
      .header-title { font-size: 20px; font-weight: 600; color: #202124; margin: 0 0 6px 0; letter-spacing: -0.2px; }
      .header-meta { font-size: 13px; color: #5f6368; margin: 0; }
      .badge { display: inline-block; padding: 6px 14px; font-weight: 600; border-radius: 16px; font-size: 12px; background-color: ${badgeBg}; color: ${badgeTextColor}; margin-top: 12px; letter-spacing: 0.3px; }
      
      .content { padding: 20px 24px; }
      .card-grid { display: table; width: 100%; table-layout: fixed; margin-bottom: 20px; }
      .card { display: table-cell; background: #f8f9fa; padding: 14px 8px; text-align: center; border-radius: 8px; border: 1px solid #e8eaed; }
      .card-val { font-size: 22px; font-weight: 700; color: #202124; }
      .card-lbl { font-size: 10px; color: #70757a; text-transform: uppercase; font-weight: 600; margin-top: 4px; letter-spacing: 0.5px; }

      .section-header { font-size: 13px; font-weight: 700; color: #1a73e8; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 24px; margin-bottom: 12px; padding-bottom: 4px; border-bottom: 2px solid #e8f0fe; }

      table { width: 100%; border-collapse: collapse; margin-top: 4px; }
      th { background-color: #f8f9fa; color: #5f6368; font-weight: 600; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #dadce0; }

      .btn-container { margin: 16px 0; }
      .btn-primary { display: inline-block; padding: 10px 20px; background-color: #1a73e8; color: #ffffff !important; text-decoration: none; border-radius: 20px; font-weight: 500; font-size: 13px; box-shadow: 0 1px 2px rgba(60,64,67,0.3); margin-right: 8px; margin-bottom: 8px; }
      .btn-secondary { display: inline-block; padding: 10px 20px; background-color: #ffffff; color: #1a73e8 !important; text-decoration: none; border-radius: 20px; font-weight: 500; font-size: 13px; border: 1px solid #dadce0; margin-bottom: 8px; }

      .insights-box { background-color: #f8f9fa; border-left: 4px solid #1a73e8; padding: 16px 16px 8px 16px; border-radius: 0 8px 8px 0; margin-top: 8px; }

      .footer { background-color: #f8f9fa; padding: 20px 24px; border-top: 1px solid #f1f3f4; font-size: 12px; color: #5f6368; }
      .signature { margin-top: 16px; padding-top: 12px; border-top: 1px solid #e8eaed; }
      .signature-name { font-weight: 600; color: #202124; font-size: 13px; margin: 0; }
      .signature-title { color: #5f6368; font-size: 12px; margin: 2px 0 0 0; }

      @media only screen and (max-width: 600px) {
        body { padding: 8px; }
        .wrapper { border-radius: 8px; }
        .header, .content, .footer { padding: 16px; }
        .card-grid { display: block; }
        .card { display: block; width: 100%; box-sizing: border-box; margin-bottom: 8px; }
        .btn-primary, .btn-secondary { display: block; text-align: center; margin-right: 0; }
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="top-bar"></div>
      
      <div class="header">
        <h1 class="header-title">OrangeHRM E2E Automation Report</h1>
        <p class="header-meta">Environment: <b>${envName}</b> &nbsp;|&nbsp; Trigger: <b>${trigger.description}</b></p>
        <div class="badge">${overallStatus} — ${metrics.passRate}% Pass Rate</div>
      </div>

      <div class="content">
        <div class="card-grid">
          <div class="card">
            <div class="card-val">${metrics.totalTests}</div>
            <div class="card-lbl">Total Tests</div>
          </div>
          <div class="card" style="margin-left: 6px;">
            <div class="card-val" style="color: #1e8e3e;">${metrics.passedTests}</div>
            <div class="card-lbl">Passed</div>
          </div>
          <div class="card" style="margin-left: 6px;">
            <div class="card-val" style="color: ${metrics.failedTests > 0 ? '#d93025' : '#202124'};">${metrics.failedTests}</div>
            <div class="card-lbl">Failed</div>
          </div>
          <div class="card" style="margin-left: 6px;">
            <div class="card-val" style="color: #5f6368;">${metrics.skippedTests}</div>
            <div class="card-lbl">Skipped</div>
          </div>
          <div class="card" style="margin-left: 6px;">
            <div class="card-val">${metrics.durationMinutes}m</div>
            <div class="card-lbl">Duration</div>
          </div>
        </div>

        <div class="section-header">Allure & Trace Dashboards</div>
        <p style="font-size: 13px; color: #5f6368; margin: 0 0 12px 0;">Access interactive Allure report, video recordings, and step-by-step trace viewer logs:</p>
        <div class="btn-container">
          <a href="${allureBaseUrl}/allure-results/" class="btn-primary" target="_blank">📊 View Allure Test Report</a>
          <a href="${allureBaseUrl}/" class="btn-secondary" target="_blank">📈 Historical Trends</a>
        </div>

        <div class="section-header">QA Lead Insights</div>
        <div class="insights-box">
          <ul style="margin: 0; padding-left: 18px;">
            ${insightsList}
          </ul>
        </div>

        <div class="section-header">Functional Modules Coverage</div>
        <table>
          <thead>
            <tr>
              <th>Module Name</th>
              <th>Scenarios</th>
              <th style="text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${moduleRows}
          </tbody>
        </table>

        <div class="section-header">Browser Platform Matrix</div>
        <table>
          <thead>
            <tr>
              <th>Browser / Engine</th>
              <th style="text-align: center;">Total</th>
              <th style="text-align: center;">Pass</th>
              <th style="text-align: center;">Fail</th>
              <th style="text-align: center;">Skip</th>
              <th style="text-align: center;">Pass Rate</th>
            </tr>
          </thead>
          <tbody>
            ${projectRows}
          </tbody>
        </table>
      </div>

      <div class="footer">
        Automated report generated by <b>Playwright CI/CD Pipeline</b>.<br>
        Repository: <a href="${githubRepoUrl}" style="color: #1a73e8; text-decoration: none;">${repoFullName}</a>
        
        <div class="signature">
          <p class="signature-name">Deepak Yadav</p>
          <p class="signature-title">QA Lead, Automation Team</p>
        </div>
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

  console.log(`📊 Aggregated Metrics: ${metrics.passedTests}/${metrics.totalTests} Passed (${metrics.flakyTests} Flaky) in ${metrics.durationMinutes} mins.`);

  const htmlContent = buildHtmlReport(metrics);
  const trigger = getExecutionTrigger();
  const envName = process.env.TEST_ENV || 'QA-Staging';
  
  const isCleanPass = metrics.failedTests === 0 && metrics.flakyTests === 0 && metrics.totalTests > 0;
  const isFlakyPass = metrics.failedTests === 0 && metrics.flakyTests > 0;
  const overallStatus = isCleanPass ? 'PASSED' : isFlakyPass ? 'PASSED (FLAKY)' : metrics.passedTests === 0 ? 'BLOCKED' : 'FAILED';

  const subject = `[${overallStatus}] OrangeHRM E2E Test Summary — ${envName} (${trigger.label})`;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const recipients = process.env.EMAIL_STAKEHOLDERS || 'yadavdeepak@outlook.com,kozonhq@gmail.com';

  console.log(`✉️ Sending email report from Deepak Yadav (QA Lead) to: ${recipients}...`);

  await transporter.sendMail({
    from: `"Deepak Yadav (QA Lead, Automation Team)" <${process.env.SMTP_USER}>`,
    to: recipients,
    subject: subject,
    html: htmlContent,
  });

  console.log('✅ Google Modern email report successfully sent!');
}

main().catch((err) => {
  console.error('❌ Failed to send email report:', err);
  process.exit(1);
});