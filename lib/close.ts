// Close CRM integration — creates a lead via POST /api/v1/lead/
// Close is the critical path — if Close fails, the submission fails.

import type { FormInput, ScoreResult, StatementResult } from './types';

interface CloseLeadResponse {
  id: string;
  [key: string]: unknown;
}

function getCloseConfig() {
  const apiKey = process.env.CLOSE_API_KEY;
  const leadStatusId = process.env.CLOSE_LEAD_STATUS_ID;
  const cfPropertyAddress = process.env.CLOSE_CF_PROPERTY_ADDRESS;
  const cfAskingRent = process.env.CLOSE_CF_ASKING_RENT;
  const cfDaysOnMarket = process.env.CLOSE_CF_DAYS_ON_MARKET;
  const cfUrgencyScore = process.env.CLOSE_CF_URGENCY_SCORE;
  const cfAuditSummary = process.env.CLOSE_CF_AUDIT_SUMMARY;
  const cfLeadSource = process.env.CLOSE_CF_LEAD_SOURCE;

  if (!apiKey || !leadStatusId) {
    return null;
  }

  return {
    apiKey,
    leadStatusId,
    cf: {
      propertyAddress: cfPropertyAddress,
      askingRent: cfAskingRent,
      daysOnMarket: cfDaysOnMarket,
      urgencyScore: cfUrgencyScore,
      auditSummary: cfAuditSummary,
      leadSource: cfLeadSource,
    },
  };
}

/** Build a summary string for the Close CRM audit summary field */
function buildSummaryString(input: FormInput, statement: StatementResult, score: ScoreResult): string {
  const mgmtLabel = input.managementType === 'self-managed' ? 'Self-managed' : 'Has PM';
  const lines = [
    `Monthly Rent: $${input.monthlyRent.toLocaleString()}`,
    `Current Fee: $${input.managementFeeCurrent.toLocaleString()}`,
    `Management: ${mgmtLabel}`,
    `Effective Rate: ${statement.sampleStatement.effectiveManagementRate}%`,
    `Net Distribution: $${statement.sampleStatement.netOwnerDistribution.toLocaleString()}`,
    `Reserve: $${statement.reserveRecommendation.monthlyContribution.toLocaleString()}/mo`,
    `Units: ${input.numUnits}`,
    `Clean Statement: ${input.hasCleanStatement ? 'Yes' : 'No'}`,
    `Switch: ${input.switchTimeline}`,
    `Primary Problem: ${input.primaryProblem}`,
    `Score: ${score.leadScore}/${score.maxScore} — ${score.scoreClassification}`,
  ];
  return lines.join(' | ');
}

/** Convert switch timeline label to a numeric day estimate */
function timelineToDays(timeline: string): number {
  switch (timeline) {
    case '< 30 days': return 30;
    case '30-60 days': return 45;
    case '60-90 days': return 75;
    case '90+ days': return 120;
    default: return 60;
  }
}

export async function createLead(
  input: FormInput,
  statement: StatementResult,
  score: ScoreResult
): Promise<string | undefined> {
  const closeConfig = getCloseConfig();

  if (!closeConfig) {
    console.log('[Close CRM] Skipped — credentials not configured');
    return undefined;
  }

  const customFields: Record<string, unknown> = {};
  if (closeConfig.cf.propertyAddress) customFields[`custom.${closeConfig.cf.propertyAddress}`] = input.propertyAddress;
  if (closeConfig.cf.askingRent) customFields[`custom.${closeConfig.cf.askingRent}`] = input.monthlyRent;
  if (closeConfig.cf.daysOnMarket) customFields[`custom.${closeConfig.cf.daysOnMarket}`] = timelineToDays(input.switchTimeline);
  if (closeConfig.cf.urgencyScore) customFields[`custom.${closeConfig.cf.urgencyScore}`] = `${score.leadScore}/${score.maxScore} — ${score.scoreClassification}`;
  if (closeConfig.cf.auditSummary) customFields[`custom.${closeConfig.cf.auditSummary}`] = buildSummaryString(input, statement, score);
  if (closeConfig.cf.leadSource) customFields[`custom.${closeConfig.cf.leadSource}`] = 'Monthly Sweep Simulator';

  const payload = {
    name: `Monthly Sweep Lead: ${input.ownerName} — ${input.propertyAddress}`,
    status_id: closeConfig.leadStatusId,
    contacts: [
      {
        name: input.ownerName,
        emails: [{ type: 'office', email: input.email }],
        phones: [{ type: 'mobile', phone: input.phone }],
      },
    ],
    ...customFields,
  };

  const credentials = Buffer.from(`${closeConfig.apiKey}:`).toString('base64');

  const response = await fetch('https://api.close.com/api/v1/lead/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Close CRM] Failed to create lead:', response.status, errorText);
    throw new Error(`Close CRM error: ${response.status}`);
  }

  const data = (await response.json()) as CloseLeadResponse;
  console.log('[Close CRM] Lead created:', data.id);
  return data.id;
}
