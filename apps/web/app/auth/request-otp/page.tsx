import { RequestOtpForm } from '../_components/request-otp-form';

export default function RequestOtpPage() {
  return (
    <main className="page-shell">
      <section className="hero compact">
        <p className="eyebrow">Web Auth</p>
        <h1>Request a login code.</h1>
        <p className="lede">
          Start a passwordless session for citizen or agency dashboards using the existing
          OTP endpoints in the API.
        </p>
      </section>
      <section className="panel-stack">
        <RequestOtpForm />
      </section>
    </main>
  );
}
