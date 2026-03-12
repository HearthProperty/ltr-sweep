// PDF generation via puppeteer-core + @sparticuz/chromium-min
// Renders a branded Monthly Sweep statement as PDF on Vercel serverless.

import type { FormInput, StatementResult, ScoreResult } from './types';

/** Build the HTML template for the PDF statement */
export function buildStatementHTML(
  input: FormInput,
  statement: StatementResult,
  score: ScoreResult
): string {
  const s = statement.sampleStatement;
  const r = statement.reserveRecommendation;
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: #1a1a2e;
      background: #fff;
      padding: 40px;
      font-size: 14px;
      line-height: 1.6;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 2px solid #1a1a2e;
    }
    .brand h1 {
      font-size: 22px;
      font-weight: 700;
      color: #1a1a2e;
      letter-spacing: -0.5px;
    }
    .brand p {
      font-size: 11px;
      color: #666;
      margin-top: 2px;
    }
    .date-block {
      text-align: right;
      font-size: 12px;
      color: #666;
    }
    .date-block strong {
      display: block;
      font-size: 14px;
      color: #1a1a2e;
    }
    .property-info {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .property-info h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #888;
      margin-bottom: 6px;
    }
    .property-info p {
      font-size: 15px;
      font-weight: 600;
    }
    .statement-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .statement-table th {
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #888;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .statement-table td {
      padding: 10px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .statement-table td:last-child {
      text-align: right;
      font-variant-numeric: tabular-nums;
      font-weight: 500;
    }
    .statement-table tr.deduction td { color: #c0392b; }
    .statement-table tr.total {
      border-top: 2px solid #1a1a2e;
      border-bottom: none;
    }
    .statement-table tr.total td {
      font-weight: 700;
      font-size: 16px;
      padding-top: 14px;
      border-bottom: none;
    }
    .statement-table tr.total td:last-child { color: #27ae60; }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 28px 0 12px;
      color: #1a1a2e;
    }
    .reserve-box {
      background: #f0f7ff;
      border-left: 3px solid #3498db;
      padding: 14px 18px;
      border-radius: 0 6px 6px 0;
      margin-bottom: 24px;
      font-size: 13px;
    }
    .reserve-box strong { color: #2c3e50; }
    .two-col {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;
    }
    .col {
      flex: 1;
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px 18px;
    }
    .col h4 {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }
    .col.owner h4 { color: #2c3e50; }
    .col.hearth h4 { color: #27ae60; }
    .col ul { list-style: none; padding: 0; }
    .col li {
      font-size: 12px;
      padding: 3px 0;
      padding-left: 16px;
      position: relative;
    }
    .col li::before {
      content: '•';
      position: absolute;
      left: 0;
      color: #aaa;
    }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
      font-size: 11px;
      color: #999;
      text-align: center;
    }
    .footer a { color: #666; text-decoration: none; }
    .disclaimer {
      font-size: 10px;
      color: #bbb;
      margin-top: 8px;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>Monthly Sweep</h1>
      <p>Hearth Property Management</p>
    </div>
    <div class="date-block">
      <strong>Sample Statement</strong>
      ${today}
    </div>
  </div>

  <div class="property-info">
    <h3>Property</h3>
    <p>${input.propertyAddress}</p>
  </div>

  <table class="statement-table">
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Gross Rental Income</td>
        <td>$${s.grossRent.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr class="deduction">
        <td>Hearth Management Fee (8%)</td>
        <td>−$${s.hearthManagementFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr class="deduction">
        <td>Repairs &amp; Maintenance Estimate</td>
        <td>−$${s.repairsEstimate.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr class="deduction">
        <td>Operating Reserve Contribution</td>
        <td>−$${s.reserveContribution.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>
      ${s.hoaPassthrough > 0 ? `<tr class="deduction">
        <td>HOA / Pass-through</td>
        <td>−$${s.hoaPassthrough.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>` : ''}
      ${s.utilities > 0 ? `<tr class="deduction">
        <td>Utilities (estimated)</td>
        <td>−$${s.utilities.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>` : ''}
      <tr class="total">
        <td>Net Owner Distribution</td>
        <td>$${s.netOwnerDistribution.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">Reserve Recommendation</div>
  <div class="reserve-box">
    <strong>$${r.monthlyContribution.toLocaleString()}/mo</strong> toward a
    <strong>$${r.targetAmount.toLocaleString()}</strong> target<br>
    ${r.rationale}
  </div>

  <div class="section-title">Responsibilities</div>
  <div class="two-col">
    <div class="col owner">
      <h4>You Approve</h4>
      <ul>
        ${statement.approvalBreakdown.ownerApproves.map(item => `<li>${item}</li>`).join('\n        ')}
      </ul>
    </div>
    <div class="col hearth">
      <h4>Hearth Handles</h4>
      <ul>
        ${statement.approvalBreakdown.hearthHandles.map(item => `<li>${item}</li>`).join('\n        ')}
      </ul>
    </div>
  </div>

  <div class="footer">
    <p>Hearth Property Management &middot; hearthproperty.com</p>
    <p class="disclaimer">
      This is a sample statement based on estimated inputs. Actual numbers may vary.
      Not a guarantee of specific financial outcomes.
    </p>
  </div>
</body>
</html>`;
}

/** Generate PDF buffer from HTML using puppeteer-core */
export async function generatePDF(html: string): Promise<Uint8Array> {
  // Dynamic imports for serverless compatibility
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  const chromium = (await import('@sparticuz/chromium-min' as any)).default as any;
  const puppeteer = await import('puppeteer-core');

  const browser = await puppeteer.default.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport ?? { width: 1200, height: 800 },
    executablePath: await chromium.executablePath(
      'https://github.com/nicholasgasior/chromium-arm64/releases/download/v131.0.6778.264/chromium-v131.0.6778.264-pack.tar'
    ),
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
    });

    return new Uint8Array(pdfBuffer);
  } finally {
    await browser.close();
  }
}
