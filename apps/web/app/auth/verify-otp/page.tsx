import { VerifyOtpForm } from '../_components/verify-otp-form';

export default function VerifyOtpPage() {
  return (
    <main className="page-shell">
      <section className="hero compact">
        <p className="eyebrow">Web Auth</p>
        <h1>Verify your login code.</h1>
        <p className="lede">
          Complete OTP verification, store the session locally, and bootstrap protected
          dashboard routes without relying on future auth work.
        </p>
      </section>
      <section className="panel-stack">
        <VerifyOtpForm />
      </section>
    </main>
  );
}
