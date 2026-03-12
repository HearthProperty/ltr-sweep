'use client';

import { useState } from 'react';

interface FormData {
  ownerName: string;
  email: string;
  phone: string;
  propertyAddress: string;
  monthlyRent: string;
  managementFeeCurrent: string;
  managementType: 'self-managed' | 'current_pm' | '';
  numUnits: string;
  hasCleanStatement: boolean | null;
  avgMonthlyRepairs: string;
  reserveTarget: string;
  utilitiesResponsibility: 'owner' | 'tenant' | 'split' | '';
  hoaPassthrough: string;
  passthroughCategories: string[];
  desiredSwitchDate: string;
  switchTimeline: '< 30 days' | '30-60 days' | '60-90 days' | '90+ days' | '';
  primaryProblem: string;
}

const PASSTHROUGH_OPTIONS = [
  'HOA dues',
  'Insurance',
  'Property taxes',
  'Landscaping',
  'Pest control',
  'Pool maintenance',
  'Other',
];

const PRIMARY_PROBLEMS = [
  'Messy statements',
  'Unclear owner payout',
  'Approval confusion',
  'Too many pass-through surprises',
  'No real portfolio visibility',
];

export default function SweepForm() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<FormData>({
    ownerName: '',
    email: '',
    phone: '',
    propertyAddress: '',
    monthlyRent: '',
    managementFeeCurrent: '',
    managementType: '',
    numUnits: '1',
    hasCleanStatement: null,
    avgMonthlyRepairs: '',
    reserveTarget: '',
    utilitiesResponsibility: '',
    hoaPassthrough: '0',
    passthroughCategories: [],
    desiredSwitchDate: '',
    switchTimeline: '',
    primaryProblem: '',
  });

  const update = (field: keyof FormData, value: string | boolean | null | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const togglePassthrough = (cat: string) => {
    setForm((prev) => {
      const cats = prev.passthroughCategories.includes(cat)
        ? prev.passthroughCategories.filter((c) => c !== cat)
        : [...prev.passthroughCategories, cat];
      return { ...prev, passthroughCategories: cats };
    });
  };

  // --- Step validation ---
  const canAdvance = (): boolean => {
    if (step === 1) {
      return !!(form.ownerName && form.email && form.phone);
    }
    if (step === 2) {
      return !!(
        form.propertyAddress &&
        form.monthlyRent &&
        form.managementFeeCurrent &&
        form.managementType &&
        form.numUnits &&
        form.hasCleanStatement !== null
      );
    }
    if (step === 3) {
      return !!(
        form.avgMonthlyRepairs !== '' &&
        form.utilitiesResponsibility &&
        form.desiredSwitchDate &&
        form.switchTimeline &&
        form.primaryProblem
      );
    }
    return false;
  };

  const handleSubmit = async () => {
    if (!canAdvance()) return;
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        ownerName: form.ownerName,
        email: form.email,
        phone: form.phone,
        propertyAddress: form.propertyAddress,
        monthlyRent: parseFloat(form.monthlyRent),
        managementFeeCurrent: parseFloat(form.managementFeeCurrent),
        managementType: form.managementType,
        numUnits: parseInt(form.numUnits, 10),
        hasCleanStatement: form.hasCleanStatement,
        avgMonthlyRepairs: parseFloat(form.avgMonthlyRepairs) || 0,
        reserveTarget: form.reserveTarget ? parseFloat(form.reserveTarget) : undefined,
        utilitiesResponsibility: form.utilitiesResponsibility,
        hoaPassthrough: parseFloat(form.hoaPassthrough) || 0,
        passthroughCategories: form.passthroughCategories,
        desiredSwitchDate: form.desiredSwitchDate,
        switchTimeline: form.switchTimeline,
        primaryProblem: form.primaryProblem,
      };

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Submission failed');
      }

      // Redirect to results
      const resultData = encodeURIComponent(
        btoa(JSON.stringify({
          input: payload,
          statement: data.statement,
          score: data.score,
        }))
      );
      window.location.href = `/results?data=${resultData}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      {/* Progress bar */}
      <div className="progress-bar">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${(step / 3) * 100}%` }} />
        </div>
        <div className="progress-steps">
          {['You', 'Property', 'Estimates'].map((label, i) => (
            <button
              key={label}
              className={`progress-step ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'done' : ''}`}
              onClick={() => step > i + 1 && setStep(i + 1)}
              type="button"
            >
              <span className="step-num">{step > i + 1 ? '✓' : i + 1}</span>
              <span className="step-label">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 1: Contact Info */}
      {step === 1 && (
        <div className="form-step" key="step1">
          <h2 className="step-title">Let&apos;s start with you</h2>
          <p className="step-subtitle">We&apos;ll use this to prepare your personalized Monthly Sweep statement.</p>

          <div className="field-group">
            <label htmlFor="ownerName">Full Name</label>
            <input
              id="ownerName"
              type="text"
              placeholder="Jane Smith"
              value={form.ownerName}
              onChange={(e) => update('ownerName', e.target.value)}
              autoFocus
            />
          </div>

          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="jane@example.com"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </div>

          <div className="field-group">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Step 2: Property Info */}
      {step === 2 && (
        <div className="form-step" key="step2">
          <h2 className="step-title">About your property</h2>
          <p className="step-subtitle">We&apos;ll use these details to model your Monthly Sweep statement.</p>

          <div className="field-group">
            <label htmlFor="propertyAddress">Property Address</label>
            <input
              id="propertyAddress"
              type="text"
              placeholder="1234 Main St, Austin TX 78701"
              value={form.propertyAddress}
              onChange={(e) => update('propertyAddress', e.target.value)}
              autoFocus
            />
          </div>

          <div className="field-row">
            <div className="field-group">
              <label htmlFor="monthlyRent">Monthly Rent</label>
              <div className="input-prefix">
                <span>$</span>
                <input
                  id="monthlyRent"
                  type="number"
                  placeholder="2,500"
                  value={form.monthlyRent}
                  onChange={(e) => update('monthlyRent', e.target.value)}
                />
              </div>
            </div>
            <div className="field-group">
              <label htmlFor="managementFeeCurrent">Current Mgmt Fee</label>
              <div className="input-prefix">
                <span>$</span>
                <input
                  id="managementFeeCurrent"
                  type="number"
                  placeholder="200"
                  value={form.managementFeeCurrent}
                  onChange={(e) => update('managementFeeCurrent', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="field-group">
            <label>Management Situation</label>
            <div className="toggle-group">
              <button
                type="button"
                className={`toggle-btn ${form.managementType === 'self-managed' ? 'active' : ''}`}
                onClick={() => update('managementType', 'self-managed')}
              >
                Self-Managed
              </button>
              <button
                type="button"
                className={`toggle-btn ${form.managementType === 'current_pm' ? 'active' : ''}`}
                onClick={() => update('managementType', 'current_pm')}
              >
                Have a PM
              </button>
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="numUnits">Number of Units</label>
            <input
              id="numUnits"
              type="number"
              min="1"
              value={form.numUnits}
              onChange={(e) => update('numUnits', e.target.value)}
            />
          </div>

          <div className="field-group">
            <label>Do you currently receive a clean monthly statement?</label>
            <div className="toggle-group">
              <button
                type="button"
                className={`toggle-btn ${form.hasCleanStatement === true ? 'active' : ''}`}
                onClick={() => update('hasCleanStatement', true)}
              >
                Yes
              </button>
              <button
                type="button"
                className={`toggle-btn ${form.hasCleanStatement === false ? 'active' : ''}`}
                onClick={() => update('hasCleanStatement', false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Estimates */}
      {step === 3 && (
        <div className="form-step" key="step3">
          <h2 className="step-title">Quick estimates</h2>
          <p className="step-subtitle">These help us model your statement. Best guesses are fine.</p>

          <div className="field-row">
            <div className="field-group">
              <label htmlFor="avgMonthlyRepairs">Avg. Monthly Repairs</label>
              <div className="input-prefix">
                <span>$</span>
                <input
                  id="avgMonthlyRepairs"
                  type="number"
                  placeholder="150"
                  value={form.avgMonthlyRepairs}
                  onChange={(e) => update('avgMonthlyRepairs', e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="field-group">
              <label htmlFor="reserveTarget">Reserve Target <span className="optional">(optional)</span></label>
              <div className="input-prefix">
                <span>$</span>
                <input
                  id="reserveTarget"
                  type="number"
                  placeholder="Auto-calculated"
                  value={form.reserveTarget}
                  onChange={(e) => update('reserveTarget', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="field-group">
            <label>Who pays utilities?</label>
            <div className="toggle-group triple">
              {(['tenant', 'owner', 'split'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`toggle-btn ${form.utilitiesResponsibility === opt ? 'active' : ''}`}
                  onClick={() => update('utilitiesResponsibility', opt)}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="hoaPassthrough">HOA / Monthly Pass-throughs</label>
            <div className="input-prefix">
              <span>$</span>
              <input
                id="hoaPassthrough"
                type="number"
                placeholder="0"
                value={form.hoaPassthrough}
                onChange={(e) => update('hoaPassthrough', e.target.value)}
              />
            </div>
          </div>

          <div className="field-group">
            <label>Pass-through Categories <span className="optional">(select all that apply)</span></label>
            <div className="chip-group">
              {PASSTHROUGH_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`chip ${form.passthroughCategories.includes(cat) ? 'active' : ''}`}
                  onClick={() => togglePassthrough(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="field-row">
            <div className="field-group">
              <label htmlFor="desiredSwitchDate">Desired Switch Date</label>
              <input
                id="desiredSwitchDate"
                type="date"
                value={form.desiredSwitchDate}
                onChange={(e) => update('desiredSwitchDate', e.target.value)}
              />
            </div>
            <div className="field-group">
              <label>Switch Timeline</label>
              <select
                value={form.switchTimeline}
                onChange={(e) => update('switchTimeline', e.target.value)}
                className="select-field"
              >
                <option value="">Select...</option>
                <option value="< 30 days">&lt; 30 days</option>
                <option value="30-60 days">30–60 days</option>
                <option value="60-90 days">60–90 days</option>
                <option value="90+ days">90+ days</option>
              </select>
            </div>
          </div>

          <div className="field-group">
            <label>What&apos;s your biggest frustration right now?</label>
            <div className="radio-group">
              {PRIMARY_PROBLEMS.map((problem) => (
                <label key={problem} className={`radio-option ${form.primaryProblem === problem ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="primaryProblem"
                    value={problem}
                    checked={form.primaryProblem === problem}
                    onChange={(e) => update('primaryProblem', e.target.value)}
                  />
                  <span className="radio-dot" />
                  {problem}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && <div className="form-error">{error}</div>}

      {/* Navigation */}
      <div className="form-nav">
        {step > 1 && (
          <button
            type="button"
            className="btn-back"
            onClick={() => setStep(step - 1)}
          >
            ← Back
          </button>
        )}
        <div className="nav-spacer" />
        {step < 3 ? (
          <button
            type="button"
            className="btn-next"
            disabled={!canAdvance()}
            onClick={() => setStep(step + 1)}
          >
            Continue →
          </button>
        ) : (
          <button
            type="button"
            className="btn-submit"
            disabled={!canAdvance() || submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Generating...' : 'See My Monthly Sweep'}
          </button>
        )}
      </div>
    </div>
  );
}
