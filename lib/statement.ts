// Statement generation engine — deterministic math only.
// All formulas from gemini.md → Statement Formula section.

import type { FormInput, SampleStatement, StatementResult, ApprovalBreakdown } from './types';
import { generateReserveRecommendation } from './reserve';
import {
  HEARTH_MANAGEMENT_FEE_RATE,
  UTILITY_OWNER_RATE,
  UTILITY_SPLIT_RATE,
  RESERVE_RATE,
  RESERVE_FLOOR,
} from './config';

/** Round to 2 decimal places — all monetary calculations */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Calculate utilities estimate based on responsibility */
function calculateUtilities(monthlyRent: number, responsibility: FormInput['utilitiesResponsibility']): number {
  switch (responsibility) {
    case 'tenant':
      return 0;
    case 'owner':
      return round2(monthlyRent * UTILITY_OWNER_RATE);
    case 'split':
      return round2(monthlyRent * UTILITY_SPLIT_RATE);
    default:
      return 0;
  }
}

/** Calculate reserve contribution */
function calculateReserveContribution(monthlyRent: number, reserveTarget?: number): number {
  if (reserveTarget && reserveTarget > 0) {
    return round2(reserveTarget);
  }
  return round2(Math.max(monthlyRent * RESERVE_RATE, RESERVE_FLOOR));
}

/** Generate the sample Monthly Sweep statement */
export function generateStatement(input: FormInput): StatementResult {
  const grossRent = round2(input.monthlyRent);
  const hearthManagementFee = round2(grossRent * HEARTH_MANAGEMENT_FEE_RATE);
  const repairsEstimate = round2(input.avgMonthlyRepairs);
  const reserveContribution = calculateReserveContribution(grossRent, input.reserveTarget);
  const hoaPassthrough = round2(input.hoaPassthrough);
  const utilities = calculateUtilities(grossRent, input.utilitiesResponsibility);

  const totalDeductions = round2(
    hearthManagementFee + repairsEstimate + reserveContribution + hoaPassthrough + utilities
  );
  const netOwnerDistribution = round2(grossRent - totalDeductions);

  const sampleStatement: SampleStatement = {
    grossRent,
    hearthManagementFee,
    repairsEstimate,
    reserveContribution,
    hoaPassthrough,
    utilities,
    totalDeductions,
    netOwnerDistribution,
  };

  const reserveRecommendation = generateReserveRecommendation(input);

  const approvalBreakdown: ApprovalBreakdown = {
    ownerApproves: [
      'Major repairs above threshold',
      'Unusual or non-routine spend',
      'Capital improvements',
      'Policy exceptions',
    ],
    hearthHandles: [
      'Monthly Sweep statement generation',
      'Owner distribution cadence',
      'Pass-through itemization',
      'Routine coordination',
      'Maintenance triage and routing',
      'Vendor communication',
      'Approval requests when needed',
    ],
  };

  return {
    sampleStatement,
    reserveRecommendation,
    approvalBreakdown,
  };
}
