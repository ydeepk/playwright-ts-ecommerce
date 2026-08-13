import fs from 'fs';
import nodemailer from 'nodemailer';
import path from 'path';

async function sendDailyReport() {
  // Points directly to our consolidated test-results folder
  const resultsPath = path.join(__dirname, '../test-results/report.json');

  if (!fs.existsSync(resultsPath)) {
    console.error(`❌ Report file not found at: ${resultsPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(resultsPath, 'utf-8');
  const results = JSON.parse(rawData);

  // Extract Playwright execution stats
  const stats = results.stats;
  const passed = stats.expected || 0;
  const flaky = stats.flaky || 0;
  const failed = stats.unexpected || 0;
  const skipped = stats.skipped || 0;
  const total = passed + flaky + failed + skipped;

  const durationMin = (stats.duration / 1000 / 60).toFixed(1);
  const passRate = total > 0 ? (((passed + flaky) / total) * 100).toFixed(1) : "0.0";

  // UI styling based on execution status
  const statusColor = failed > 0 ? '#d9534f' : flaky > 0 ? '#f0ad4e' : '#28a745';
  const statusBadge = failed > 0 ? 'FAILED' : flaky > 0 ? 'PASSED (WITH RETRIES)' : 'PASSED';

  const envName = process.env.TEST_ENV || "QA-Staging";
  const runUrl = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;

  // Build HTML Email Body
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #24292e; line-height: 1.5; }
        .container { max-width: 650px; margin: 0 auto; border: 1px solid #e1e4e8; border-radius: 6px; overflow: hidden; }
        .header { background-color: ${statusColor}; color: white; padding: 16px 20px; font-size: 18px; font-weight: bold; }
        .content { padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e1e4e8; }
        th { background-color: #f6f8fa; font-size: 13px; color: #586069; }
        .btn { display: inline-block; background-color: #0366d6; color: #ffffff !important; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          [Automation Update] Playwright Suite &mdash; ${statusBadge} (${passRate}%)
        </div>
        <div class="content">
          <p>Hi Team,</p>
          <p>Here is the automated daily execution report for our Playwright test suite running against <strong>${envName}</strong>.</p>

          <h3>📊 Execution Metrics</h3>
          <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Total Executed</td><td><strong>${total}</strong></td></tr>
            <tr><td>Passed (Direct)</td><td><span style="color: #28a745; font-weight: bold;">${passed}</span></td></tr>
            <tr><td>Flaky (Passed on Retry)</td><td><span style="color: #f0ad4e; font-weight: bold;">${flaky}</span></td></tr>
            <tr><td>Failed</td><td><span style="color: #d9534f; font-weight: bold;">${failed}</span></td></tr>
            <tr><td>Execution Duration</td><td>${durationMin} minutes</td></tr>
          </table>

          <p style="margin-top: 20px;">
            <a href="${runUrl}" class="btn">View CI Execution Logs & Artifacts</a>
          </p>

          <p style="margin-top: 25px; font-size: 12px; color: #6a737d;">
            Generated automatically by KozonHQ Playwright Framework
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Configure Nodemailer Transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"QA Automation Bot" <${process.env.SMTP_USER}>`,
    to: process.env.EMAIL_STAKEHOLDERS,
    subject: `[Automation Status] ${envName} | ${statusBadge} (${passRate}%)`,
    html: htmlBody,
  });

  console.log('✅ Daily Automation Email sent successfully!');
}

sendDailyReport().catch((err) => {
  console.error('❌ Failed to send email report:', err);
  process.exit(1);
});