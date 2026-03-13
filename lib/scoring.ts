// Lead scoring engine — deterministic rules from gemini.md.
// Used to prioritize follow-up, not to show off fake precision.

import type { FormInput, ScoreResult, ScoreClassification } from './types';

interface ScoringSignal {
  signal: string;
  points: number;
  test: (input: FormInput) => boolean;
}

const SCORING_SIGNALS: ScoringSignal[] = [
  {
    signal: 'Self-managed property',
    points: 15,
    test: (input) => input.managementType === 'self-managed',
  },
  {
    signal: 'Currently using a PM',
    points: 10,
    test: (input) => input.managementType === 'current_pm',
  },
  {
    signal: 'No clean statement today',
    points: 20,
    test: (input) => !input.hasCleanStatement,
  },
  {
    signal: 'Switch planned within 60 days',
    points: 20,
    test: (input) => input.switchTimeline === '< 30 days' || input.switchTimeline === '30-60 days',
  },
  {
    signal: '2+ units',
    points: 15,
    test: (input) => input.numUnits >= 2,
  },
];

function classify(score: number): ScoreClassification {
  if (score >= 75) return 'immediate';
  if (score >= 50) return 'high';
  if (score >= 25) return 'moderate';
  return 'low';
}

export function calculateScore(input: FormInput): ScoreResult {
  const breakdown = SCORING_SIGNALS.map((signal) => ({
    signal: signal.signal,
    points: signal.points,
    triggered: signal.test(input),
  }));

  const leadScore = breakdown
    .filter((b) => b.triggered)
    .reduce((sum, b) => sum + b.points, 0);

  // Max possible depends on management type (mutually exclusive)
  const maxScore = input.managementType === 'self-managed' ? 70 : 65;

  return {
    leadScore,
    maxScore,
    scoreClassification: classify(leadScore),
    breakdown,
  };
}
