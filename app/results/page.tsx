'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useCallback } from 'react';
import type { FormInput, StatementResult, ScoreResult } from '@/lib/types';

interface ResultData {
  input: FormInput;
  statement: StatementResult;
  score: ScoreResult;
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const [downloading, setDownloading] = useState(false);

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

  const handleDownloadPDF = useCallback(async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, statement, score }),
      });

      if (!res.ok) throw new Error('PDF generation failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monthly-sweep-${input.propertyAddress.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download failed:', err);
      alert('PDF generation failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  }, [input, statement, score]);

  const scoreColor =
    score.scoreClassification === 'immediate' ? '#e74c3c' :
    score.scoreClassification === 'high' ? '#e67e22' :
    score.scoreClassification === 'moderate' ? '#f1c40f' : '#2ecc71';

  return (
    <div className="results-page">
      {/* Header */}
      <header className="results-header">
        <a href="/" className="results-brand">
          <img src="/hearth-logo.png" alt="Hearth" className="results-logo" />
          <div>
            <h1>Monthly Sweep</h1>
            <p>Hearth Property Management</p>
          </div>
        </a>
      </header>

      {/* Hero Summary */}
      <section className="results-hero">
        <div className="hero-label">Your Estimated Monthly Net Distribution</div>
        <div className="hero-amount">
          ${s.netOwnerDistribution.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
        <div className="hero-sublabel">
          from ${s.grossRent.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mo gross rent at {input.propertyAddress}
        </div>
      </section>

      {/* Statement */}
      <section className="results-section">
        <h2 className="section-heading">Sample Monthly Sweep Statement</h2>
        <div className="statement-card">
          <div className="statement-line income">
            <span>Gross Rental Income</span>
            <span>${s.grossRent.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="statement-line deduction">
            <span>Hearth Management Fee (8%)</span>
            <span>−${s.hearthManagementFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="statement-line deduction">
            <span>Repairs &amp; Maintenance</span>
            <span>−${s.repairsEstimate.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="statement-line reserve">
            <span>Operating Reserve</span>
            <span>${s.reserveContribution.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          {s.hoaPassthrough > 0 && (
            <div className="statement-line deduction">
              <span>HOA / Pass-through</span>
              <span>−${s.hoaPassthrough.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          {s.utilities > 0 && (
            <div className="statement-line deduction">
              <span>Utilities (estimated)</span>
              <span>−${s.utilities.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="statement-line total">
            <span>Net Owner Distribution</span>
            <span>${s.netOwnerDistribution.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </section>

      {/* Reserve */}
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

      {/* Score (subtle, not prominent) */}
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

      {/* Actions */}
      <section className="results-actions">
        <button
          className="btn-download"
          onClick={handleDownloadPDF}
          disabled={downloading}
        >
          {downloading ? 'Generating PDF...' : '📄 Download Statement PDF'}
        </button>

        <div className="cta-block">
          <h2>Ready to make this real?</h2>
          <p>
            This is what your monthly owner statement could look like under Hearth — clean,
            transparent, and hands-free. Take the next step.
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
