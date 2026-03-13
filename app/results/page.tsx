'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import type { FormInput, StatementResult, ScoreResult } from '@/lib/types';

interface ResultData {
  input: FormInput;
  statement: StatementResult;
  score: ScoreResult;
}

/** Map frustration chip labels to "what that looks like" descriptions */
const FRUSTRATION_DESCRIPTIONS: Record<string, { pain: string; fix: string }> = {
  'Messy statements': {
    pain: 'Scattered PDFs, portal screenshots, and emailed invoices that never add up',
    fix: 'One clean statement, every month. Every dollar accounted for.',
  },
  'Unclear owner payout': {
    pain: 'You\'re never quite sure what you\'ll receive — or when',
    fix: 'A single net distribution line, paid on a predictable cadence.',
  },
  'Approval confusion': {
    pain: 'Surprise charges you didn\'t approve, or repairs that sat waiting for a response',
    fix: 'Clear thresholds. You approve big decisions — Hearth handles the rest.',
  },
  'Too many pass-through surprises': {
    pain: 'Random charges hitting your account with no context',
    fix: 'Every pass-through itemized, categorized, and visible before it hits your bottom line.',
  },
  'No real portfolio visibility': {
    pain: 'Logging into two portals and a spreadsheet just to know where you stand',
    fix: 'One monthly sweep of your entire portfolio, delivered consistently.',
  },
};

function fmt(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const [showAllHearth, setShowAllHearth] = useState(false);

  const dataParam = searchParams.get('data');
  if (!dataParam) {
    return (
      <div className="results-error">
        <h2>No results found</h2>
        <p>Please complete the Monthly Sweep form first.</p>
        <a href="/" className="btn-primary">Start Over</a>
      </div>
    );
  }

  let data: ResultData;
  try {
    data = JSON.parse(atob(decodeURIComponent(dataParam)));
  } catch {
    return (
      <div className="results-error">
        <h2>Invalid results data</h2>
        <p>The results link appears to be corrupted.</p>
        <a href="/" className="btn-primary">Start Over</a>
      </div>
    );
  }

  const { input, statement, score } = data;
  const s = statement.sampleStatement;
  const r = statement.reserveRecommendation;

  // Determine which frustrations the user selected
  const selectedFrustrations = (input.primaryProblems || []).filter(
    (p: string) => FRUSTRATION_DESCRIPTIONS[p]
  );

  // Build "current reality" line items for the chaos side
  const currentMgmtType = input.managementType === 'self-managed'
    ? 'Self-managed (you\'re doing it all)'
    : 'Current PM';

  const scoreColor =
    score.scoreClassification === 'immediate' ? '#e74c3c' :
    score.scoreClassification === 'high' ? '#e67e22' :
    score.scoreClassification === 'moderate' ? '#f1c40f' : '#2ecc71';

  return (
    <div className="results-page">

      {/* Hero — net distribution callout */}
      <section className="results-hero">
        <div className="hero-label">Your Estimated Monthly Net Distribution</div>
        <div className="hero-amount">
          ${fmt(s.netOwnerDistribution)}
        </div>
        <div className="hero-sublabel">
          from ${fmt(s.grossRent)}/mo gross rent at {input.propertyAddress}
        </div>
      </section>

      {/* === THE COMPARISON === */}
      <section className="results-section comparison-section">
        <h2 className="section-heading">What Changes With Hearth</h2>
        <p className="comparison-intro">
          Here&apos;s the difference between what most owners deal with today —
          and what your financial picture looks like under a Monthly Sweep.
        </p>

        <div className="comparison-grid">
          {/* LEFT: The Chaos (Current Reality) */}
          <div className="comparison-col chaos-col">
            <div className="comparison-col-header">
              <span className="comparison-icon">📋</span>
              <h3>What You&apos;re Getting Now</h3>
            </div>
            <div className="comparison-col-body">
              <div className="chaos-item">
                <span className="chaos-icon">✕</span>
                <span>{currentMgmtType === 'Self-managed (you\'re doing it all)'
                  ? 'No owner statement at all — you\'re reconciling everything yourself'
                  : 'A portal login, scattered PDFs, or emailed invoices that don\'t add up'
                }</span>
              </div>
              <div className="chaos-item">
                <span className="chaos-icon">✕</span>
                <span>No clear net distribution — you calculate it yourself each month</span>
              </div>
              <div className="chaos-item">
                <span className="chaos-icon">✕</span>
                <span>No operating reserve strategy — one big repair wipes you out</span>
              </div>
              {input.managementType === 'current_pm' && (
                <div className="chaos-item">
                  <span className="chaos-icon">✕</span>
                  <span>
                    Paying {s.effectiveManagementRate}% in combined management + leasing fees
                    (${fmt(s.hearthManagementFee)}/mo effective)
                  </span>
                </div>
              )}
              {selectedFrustrations.map((problem: string) => (
                <div className="chaos-item" key={problem}>
                  <span className="chaos-icon">✕</span>
                  <span>{FRUSTRATION_DESCRIPTIONS[problem].pain}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: The Sweep (Hearth Reality) */}
          <div className="comparison-col sweep-col">
            <div className="comparison-col-header">
              <span className="comparison-icon">✦</span>
              <h3>Your Monthly Sweep</h3>
            </div>
            <div className="comparison-col-body">
              {/* Mini statement preview */}
              <div className="sweep-mini-statement">
                <div className="sweep-line sweep-line-income">
                  <span>Gross Rental Income</span>
                  <span>${fmt(s.grossRent)}</span>
                </div>
                <div className="sweep-line sweep-line-deduction">
                  <span>Management Fee ({s.effectiveManagementRate}%)</span>
                  <span>−${fmt(s.hearthManagementFee)}</span>
                </div>
                <div className="sweep-line sweep-line-deduction">
                  <span>Repairs &amp; Maintenance</span>
                  <span>−${fmt(s.repairsEstimate)}</span>
                </div>
                <div className="sweep-line sweep-line-reserve">
                  <span>Operating Reserve</span>
                  <span>${fmt(s.reserveContribution)}</span>
                </div>
                {s.hoaPassthrough > 0 && (
                  <div className="sweep-line sweep-line-deduction">
                    <span>HOA / Pass-through</span>
                    <span>−${fmt(s.hoaPassthrough)}</span>
                  </div>
                )}
                {s.utilities > 0 && (
                  <div className="sweep-line sweep-line-deduction">
                    <span>Utilities (estimated)</span>
                    <span>−${fmt(s.utilities)}</span>
                  </div>
                )}
                <div className="sweep-line sweep-line-total">
                  <span>Net Owner Distribution</span>
                  <span>${fmt(s.netOwnerDistribution)}</span>
                </div>
              </div>

              {/* Hearth fixes for their frustrations */}
              {selectedFrustrations.length > 0 && (
                <div className="sweep-fixes">
                  {(showAllHearth ? selectedFrustrations : selectedFrustrations.slice(0, 2)).map((problem: string) => (
                    <div className="sweep-fix-item" key={problem}>
                      <span className="sweep-fix-icon">✓</span>
                      <span>{FRUSTRATION_DESCRIPTIONS[problem].fix}</span>
                    </div>
                  ))}
                  {selectedFrustrations.length > 2 && !showAllHearth && (
                    <button
                      className="sweep-show-more"
                      onClick={() => setShowAllHearth(true)}
                      type="button"
                    >
                      + {selectedFrustrations.length - 2} more
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Reserve Recommendation */}
      <section className="results-section">
        <h2 className="section-heading">Reserve Recommendation</h2>
        <div className="reserve-card">
          <div className="reserve-numbers">
            <div className="reserve-stat">
              <div className="reserve-value">${r.monthlyContribution.toLocaleString()}</div>
              <div className="reserve-label">Monthly Contribution</div>
            </div>
            <div className="reserve-divider" />
            <div className="reserve-stat">
              <div className="reserve-value">${r.targetAmount.toLocaleString()}</div>
              <div className="reserve-label">Target Reserve</div>
            </div>
          </div>
          <p className="reserve-rationale">{r.rationale}</p>
        </div>
      </section>

      {/* Approval Breakdown */}
      <section className="results-section">
        <h2 className="section-heading">What You Approve vs. What Hearth Handles</h2>
        <div className="approval-grid">
          <div className="approval-col owner-col">
            <h3>You Approve</h3>
            <ul>
              {statement.approvalBreakdown.ownerApproves.map((item) => (
                <li key={item}>
                  <span className="approval-icon">✋</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="approval-col hearth-col">
            <h3>Hearth Handles</h3>
            <ul>
              {statement.approvalBreakdown.hearthHandles.map((item) => (
                <li key={item}>
                  <span className="approval-icon">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Score (subtle) */}
      <section className="results-section score-section">
        <div className="score-badge" style={{ borderColor: scoreColor }}>
          <span className="score-number" style={{ color: scoreColor }}>{score.leadScore}</span>
          <span className="score-max">/{score.maxScore}</span>
        </div>
        <p className="score-desc">
          Switch readiness: <strong style={{ color: scoreColor }}>
            {score.scoreClassification.charAt(0).toUpperCase() + score.scoreClassification.slice(1)}
          </strong>
        </p>
      </section>

      {/* CTA */}
      <section className="results-actions">
        <div className="cta-block">
          <h2>Ready to make this real?</h2>
          <p>
            Stop reconciling invoices. Stop wondering where your money went.
            This is what your monthly owner statement could look like under Hearth — clean,
            transparent, and completely hands-free.
          </p>
          <div className="cta-buttons">
            <a
              href="https://calendly.com/hearthproperty/30min"
              className="btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a Switch Call
            </a>
            <a
              href="https://app.hearthproperty.com/onboarding"
              className="btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Start Onboarding →
            </a>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <footer className="results-footer">
        <p>
          This is a sample statement based on your estimated inputs. Actual numbers will vary
          based on real expenses, timing, and property-specific factors. Not a guarantee of
          specific financial outcomes.
        </p>
        <p>© {new Date().getFullYear()} Hearth Property Management</p>
      </footer>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="results-loading">
        <div className="loading-spinner" />
        <p>Loading your Monthly Sweep results...</p>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
