// Reserve recommendation engine — deterministic logic.
// Default: 5% of monthly rent, $250 floor.
// If repairs or pass-through complexity is high, recommend higher band.
// Label: "Suggested operating reserve" (not exact accounting).

import type { FormInput, ReserveRecommendation } from './types';
import { RESERVE_RATE, RESERVE_FLOOR } from './config';

/** Round to 2 decimal places */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Determine if the property has high complexity */
function isHighComplexity(input: FormInput): boolean {
  const repairs = input.avgMonthlyRepairs ?? (input.monthlyRent * 0.02);
  const highRepairs = repairs > input.monthlyRent * 0.10; // >10% of rent
  const categories = input.passthroughCategories ?? [];
  const manyPassthroughs = categories.length >= 3;
  const hasHoa = (input.hoaPassthrough ?? 0) > 0;
  return highRepairs || manyPassthroughs || (hasHoa && manyPassthroughs);
}

export function generateReserveRecommendation(input: FormInput): ReserveRecommendation {
  const baseReserve = Math.max(input.monthlyRent * RESERVE_RATE, RESERVE_FLOOR);
  const highComplexity = isHighComplexity(input);

  // High complexity → recommend 1.5x the base reserve
  const multiplier = highComplexity ? 1.5 : 1.0;
  const monthlyContribution = round2(baseReserve * multiplier);

  // Target = 3 months of contributions for standard, 4 months for high complexity
  const months = highComplexity ? 4 : 3;
  const targetAmount = round2(monthlyContribution * months);

  let rationale: string;
  if (highComplexity) {
    const reasons: string[] = [];
    if ((input.avgMonthlyRepairs ?? 0) > input.monthlyRent * 0.10) reasons.push('above-average repair costs');
    if ((input.passthroughCategories ?? []).length >= 3) reasons.push('multiple pass-through categories');
    if ((input.hoaPassthrough ?? 0) > 0) reasons.push('HOA obligations');

    rationale = `Based on ${reasons.join(', ')}, we recommend a higher operating reserve. ` +
      `A monthly contribution of $${monthlyContribution.toLocaleString()} builds toward a ` +
      `$${targetAmount.toLocaleString()} target over ${months} months, providing a stronger buffer ` +
      `for unexpected expenses.`;
  } else {
    rationale = `A standard operating reserve of $${monthlyContribution.toLocaleString()}/month ` +
      `builds toward a $${targetAmount.toLocaleString()} target over ${months} months. ` +
      `This covers routine surprises without straining monthly cash flow.`;
  }

  return {
    targetAmount,
    monthlyContribution,
    rationale,
  };
}
