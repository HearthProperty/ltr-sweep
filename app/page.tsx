import Image from 'next/image';
import SweepForm from './components/SweepForm';

export default function HomePage() {
  return (
    <main className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero-logo">
          <Image
            src="/hearth-logo.png"
            alt="Hearth Property Management"
            width={160}
            height={45}
            priority
          />
        </div>
        <div className="hero-inner">
          <div className="hero-badge">Monthly Sweep Simulator</div>
          <h1>See What Your Monthly Owner Statement Should Look Like</h1>
          <p className="hero-sub">
            Preview a clean Monthly Sweep with fees, reserves, pass-throughs,
            and expected owner distribution — before you switch managers.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="form-section" id="simulator">
        <SweepForm />
      </section>

      {/* Trust strip */}
      <section className="trust-strip">
        <div className="trust-inner">
          <div className="trust-item">
            <span className="trust-icon">📊</span>
            <div>
              <strong>Real Numbers</strong>
              <p>Based on your actual rent and expenses</p>
            </div>
          </div>
          <div className="trust-item">
            <span className="trust-icon">🔒</span>
            <div>
              <strong>Transparent Fees</strong>
              <p>8% management fee, no hidden charges</p>
            </div>
          </div>
          <div className="trust-item">
            <span className="trust-icon">🤲</span>
            <div>
              <strong>Hands-Free</strong>
              <p>We handle the sweep, you approve what matters</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} Hearth Property Management</p>
      </footer>
    </main>
  );
}
