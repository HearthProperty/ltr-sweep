'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/** Format phone as (XXX) XXX-XXXX */
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

interface FormData {
  ownerName: string;
  email: string;
  phone: string;
  propertyAddress: string;
  monthlyRent: string;
  managementFeeCurrent: string;
  leasingFeeCurrent: string;
  managementType: 'self-managed' | 'current_pm' | '';
  numUnits: string;
  hasCleanStatement: boolean | null;
  utilitiesResponsibility: 'owner' | 'tenant' | '';
  desiredSwitchDate: string;
  switchTimeline: '< 30 days' | '30-60 days' | '60-90 days' | '90+ days' | '';
  primaryProblem: string;
}

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
  const [feeMode, setFeeMode] = useState<'percent' | 'flat'>('percent');
  const [leasingFeeMode, setLeasingFeeMode] = useState<'percent' | 'flat'>('percent');
  const [hasMultipleUnits, setHasMultipleUnits] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const [form, setForm] = useState<FormData>({
    ownerName: '',
    email: '',
    phone: '',
    propertyAddress: '',
    monthlyRent: '',
    managementFeeCurrent: '',
    leasingFeeCurrent: '',
    managementType: '',
    numUnits: '1',
    hasCleanStatement: null,
    utilitiesResponsibility: '',
    desiredSwitchDate: new Date().toISOString().split('T')[0],
    switchTimeline: '< 30 days',
    primaryProblem: '',
  });

  const update = (field: keyof FormData, value: string | boolean | null | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    update('phone', formatPhone(e.target.value));
  };

  // Initialize Google Places Autocomplete when step 2 becomes active
  const initAutocomplete = useCallback(() => {
    if (
      !addressInputRef.current ||
      autocompleteRef.current ||
      typeof google === 'undefined' ||
      !google.maps?.places
    ) return;

    autocompleteRef.current = new google.maps.places.Autocomplete(
      addressInputRef.current,
      {
        types: ['address'],
        componentRestrictions: { country: 'us' },
        fields: ['formatted_address'],
      }
    );

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      if (place?.formatted_address) {
        update('propertyAddress', place.formatted_address);
      }
    });
  }, []);

  useEffect(() => {
    if (step === 2) {
      // Small delay to let the DOM render 
      const timer = setTimeout(initAutocomplete, 100);
      return () => clearTimeout(timer);
    } else {
      // Reset ref when leaving step 2 so it re-initializes
      autocompleteRef.current = null;
    }
  }, [step, initAutocomplete]);



  // --- Step validation ---
  const canAdvance = (): boolean => {
    if (step === 1) {
      return !!(form.ownerName && form.email && form.phone);
    }
    if (step === 2) {
      return !!(
        form.propertyAddress &&
        form.monthlyRent &&
        (form.managementType === 'self-managed' || form.managementFeeCurrent) &&
        form.managementType &&
        form.numUnits &&
        form.hasCleanStatement !== null
      );
    }
    if (step === 3) {
      return !!(
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
        managementFeeCurrent: feeMode === 'percent'
          ? Math.round(parseFloat(form.monthlyRent) * (parseFloat(form.managementFeeCurrent) / 100) * 100) / 100
          : parseFloat(form.managementFeeCurrent),
        leasingFeeCurrent: leasingFeeMode === 'percent'
          ? Math.round(parseFloat(form.monthlyRent) * (parseFloat(form.leasingFeeCurrent || '0') / 100) * 100) / 100
          : parseFloat(form.leasingFeeCurrent || '0'),
        managementType: form.managementType,
        numUnits: parseInt(form.numUnits, 10),
        hasCleanStatement: form.hasCleanStatement,
        utilitiesResponsibility: form.utilitiesResponsibility,
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
              onChange={handlePhoneChange}
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
              ref={addressInputRef}
              type="text"
              placeholder="Start typing an address..."
              value={form.propertyAddress}
              onChange={(e) => update('propertyAddress', e.target.value)}
              autoFocus
              autoComplete="off"
            />
          </div>

          <div className="field-group">
            <label>Management Situation</label>
            <div className="toggle-group">
              <button
                type="button"
                className={`toggle-btn ${form.managementType === 'self-managed' ? 'active' : ''}`}
                onClick={() => {
                  update('managementType', 'self-managed');
                  update('managementFeeCurrent', '0');
                }}
              >
                Self-Managed
              </button>
              <button
                type="button"
                className={`toggle-btn ${form.managementType === 'current_pm' ? 'active' : ''}`}
                onClick={() => {
                  update('managementType', 'current_pm');
                  update('managementFeeCurrent', '');
                }}
              >
                Have a PM
              </button>
            </div>
          </div>

          <div className={`field-row ${form.managementType === 'current_pm' ? 'field-row-triple' : 'field-row-single'}`}>
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
            {form.managementType === 'current_pm' && (
              <div className="field-group">
                <label htmlFor="managementFeeCurrent">
                  Mgmt Fee
                  <button
                    type="button"
                    className="fee-mode-toggle"
                    onClick={() => {
                      setFeeMode(feeMode === 'percent' ? 'flat' : 'percent');
                      update('managementFeeCurrent', '');
                    }}
                  >
                    {feeMode === 'percent' ? '$' : '%'}
                  </button>
                </label>
                <div className="input-prefix">
                  <span>{feeMode === 'percent' ? '%' : '$'}</span>
                  <input
                    id="managementFeeCurrent"
                    type="number"
                    placeholder={feeMode === 'percent' ? '10' : '200'}
                    value={form.managementFeeCurrent}
                    onChange={(e) => update('managementFeeCurrent', e.target.value)}
                  />
                </div>
              </div>
            )}
            {form.managementType === 'current_pm' && (
              <div className="field-group">
                <label htmlFor="leasingFeeCurrent">
                  Leasing Fee
                  <button
                    type="button"
                    className="fee-mode-toggle"
                    onClick={() => {
                      setLeasingFeeMode(leasingFeeMode === 'percent' ? 'flat' : 'percent');
                      update('leasingFeeCurrent', '');
                    }}
                  >
                    {leasingFeeMode === 'percent' ? '$' : '%'}
                  </button>
                </label>
                <div className="input-prefix">
                  <span>{leasingFeeMode === 'percent' ? '%' : '$'}</span>
                  <input
                    id="leasingFeeCurrent"
                    type="number"
                    placeholder={leasingFeeMode === 'percent' ? '50' : '1250'}
                    value={form.leasingFeeCurrent}
                    onChange={(e) => update('leasingFeeCurrent', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="field-group">
            <label>Multiple units?</label>
            <div className="toggle-group">
              <button
                type="button"
                className={`toggle-btn ${!hasMultipleUnits ? 'active' : ''}`}
                onClick={() => {
                  setHasMultipleUnits(false);
                  update('numUnits', '1');
                }}
              >
                No — Single Unit
              </button>
              <button
                type="button"
                className={`toggle-btn ${hasMultipleUnits ? 'active' : ''}`}
                onClick={() => {
                  setHasMultipleUnits(true);
                  update('numUnits', '2');
                }}
              >
                Yes
              </button>
            </div>
          </div>
          {hasMultipleUnits && (
            <div className="field-group">
              <label htmlFor="numUnits">How many units?</label>
              <input
                id="numUnits"
                type="number"
                min="2"
                value={form.numUnits}
                onChange={(e) => update('numUnits', e.target.value)}
              />
            </div>
          )}

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
          <h2 className="step-title">A few more details</h2>
          <p className="step-subtitle">Almost done — this helps us model your statement accurately.</p>

          <div className="field-group">
            <label>Who pays utilities?</label>
            <div className="toggle-group">
              {(['tenant', 'owner'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`toggle-btn ${form.utilitiesResponsibility === opt ? 'active' : ''}`}
                  onClick={() => update('utilitiesResponsibility', opt)}
                >
                  {opt === 'tenant' ? 'Tenant Pays' : 'Owner Pays'}
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
