import fs from 'fs';
import nodemailer from 'nodemailer';
import path from 'path';

interface TestSuiteStats {
  total: number;
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
  durationMs: number;
}

/**
 * Recursively locates all report.json files within a given directory.
 */
function findReportFiles(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findReportFiles(filePath));
    } else if (file === 'report.json') {
      results.push(filePath);
    }
  }
  return results;
}

/**
 * Recursively extracts test stats from Playwright's JSON report structure.
 */
function extractStatsFromReport(reportData: any): TestSuiteStats {
  let stats: TestSuiteStats = {
    total: 0,
    passed: 0,
    failed: 0,
    flaky: 0,
    skipped: 0,
    durationMs: 0,
  };

  // If top-level stats exist in the report structure
  if (reportData.stats) {
    stats.durationMs += reportData.stats.duration || 0;
  }

  function parseSuites(suites: any[]) {
    if (!suites || !Array.isArray(suites)) return;

    for (const suite of suites) {
      if (suite.specs) {
        for (const spec of suite.specs) {
          stats.total++;
          if (spec.tests && spec.tests.length > 0) {
            const lastOutcome = spec.tests[spec.tests.length - 1].status;
            if (spec.ok) {
              if (spec.tests.some((t: any) => t.status === 'flaky')) {
                stats.flaky++;
              } else {
                stats.passed++;
              }
            } else if (lastOutcome === 'skipped') {
              stats.skipped++;
            } else {
              stats.failed++;
            }
          }
        }
      }
      if (suite.suites) {
        parseSuites(suite.suites);
      }
    }
  }

  if (reportData.suites) {
    parseSuites(reportData.suites);
  }

  return stats;
}

async function sendEmailReport() {
  const baseDir = path.join(process.cwd(), 'test-results');
  const reportFiles = findReportFiles(baseDir);

  if (reportFiles.length === 0) {
    console.error(`❌ No report.json files found under: ${baseDir}`);
    process.exit(1);
  }

  console.log(`🔍 Found ${reportFiles.length} shard report file(s):`);
  reportFiles.forEach((file) => console.log(`  - ${file}`));

  // Aggregate stats across all sharded JSON reports
  const aggregatedStats: TestSuiteStats = {
    total: 0,
    passed: 0,
    failed: 0,
    flaky: 0,
    skipped: 0,
    durationMs: 0,
  };

  for (const filePath of reportFiles) {
    try {
      const rawContent = fs.readFileSync(filePath, 'utf-8');
      const jsonReport = JSON.parse(rawContent);
      const shardStats = extractStatsFromReport(jsonReport);

      aggregatedStats.total += shardStats.total;
      aggregatedStats.passed += shardStats.passed;
      aggregatedStats.failed += shardStats.failed;
      aggregatedStats.flaky += shardStats.flaky;
      aggregatedStats.skipped += shardStats.skipped;
      aggregatedStats.durationMs += shardStats.durationMs;
    } catch (err) {
      console.warn(`⚠️ Warning: Failed to parse ${filePath}:`, err);
    }
  }

  const passRate =
    aggregatedStats.total > 0
      ? ((aggregatedStats.passed / aggregatedStats.total) * 100).toFixed(1)
      : '0.0';

  const durationMin = (aggregatedStats.durationMs / 1000 / 60).toFixed(2);
  const environment = process.env.TEST_ENV || 'QA-Staging';
  const statusColor = aggregatedStats.failed > 0 ? '#d9534f' : '#5cb85c';
  const statusText = aggregatedStats.failed > 0 ? 'FAILED' : 'PASSED';

  console.log('\n📊 Aggregated Results Summary:');
  console.log(`   Environment: ${environment}`);
  console.log(`   Total Tests: ${aggregatedStats.total}`);
  console.log(`   Passed:      ${aggregatedStats.passed}`);
  console.log(`   Failed:      ${aggregatedStats.failed}`);
  console.log(`   Skipped:     ${aggregatedStats.skipped}`);
  console.log(`   Pass Rate:   ${passRate}%`);
  console.log(`   Duration:    ${durationMin} mins\n`);

  // Email Config
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const recipients = process.env.EMAIL_STAKEHOLDERS;

  if (!user || !pass || !recipients) {
    console.error('❌ Missing required SMTP environment variables (SMTP_USER, SMTP_PASS, EMAIL_STAKEHOLDERS).');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: ${statusColor}; color: white; padding: 16px; text-align: center;">
        <h2 style="margin: 0;">Playwright E2E Execution - ${statusText}</h2>
        <p style="margin: 4px 0 0 0; font-size: 14px;">Environment: <strong>${environment}</strong></p>
      </div>
      <div style="padding: 20px;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Total Tests:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${aggregatedStats.total}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #5cb85c;"><strong>Passed:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #5cb85c;">${aggregatedStats.passed}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #d9534f;"><strong>Failed:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #d9534f;">${aggregatedStats.failed}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #f0ad4e;"><strong>Skipped:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #f0ad4e;">${aggregatedStats.skipped}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Pass Rate:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;"><strong>${passRate}%</strong></td>
          </tr>
          <tr>
            <td style="padding: 10px;"><strong>Execution Duration:</strong></td>
            <td style="padding: 10px; text-align: right;">${durationMin} mins</td>
          </tr>
        </table>
        <p style="font-size: 12px; color: #888; text-align: center; margin-top: 20px;">
          Report generated across ${reportFiles.length} execution shard(s).
        </p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"Automation QA Team" <${user}>`,
    to: recipients,
    subject: `[${statusText}] Playwright Test Execution Summary - ${environment}`,
    html: htmlBody,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully! Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('❌ Failed to send email report:', error);
    process.exit(1);
  }
}

sendEmailReport();