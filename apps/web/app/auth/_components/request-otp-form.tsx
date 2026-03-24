'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { getApiBaseUrl } from '../../lib/api';

export function RequestOtpForm() {
  const [email, setEmail] = useState('');
  const [expiresInSeconds, setExpiresInSeconds] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setExpiresInSeconds(null);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json()) as {
        expiresInSeconds?: number;
        error?: { message?: string };
      };

      if (!response.ok) {
        throw new Error(payload.error?.message ?? 'Unable to request OTP');
      }

      setExpiresInSeconds(payload.expiresInSeconds ?? null);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('sidewalk:auth-email', email);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to request OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-card">
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Email</span>
          <input
            autoComplete="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="citizen@example.com"
            required
          />
        </label>

        <button className="button button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Sending…' : 'Request OTP'}
        </button>
      </form>

      {expiresInSeconds ? (
        <p className="status-note success">
          OTP issued. It expires in about {Math.ceil(expiresInSeconds / 60)} minutes.
        </p>
      ) : null}
      {error ? <p className="status-note error">{error}</p> : null}

      <p className="helper-copy">
        Already have a code? <Link href="/auth/verify-otp">Verify OTP</Link>
      </p>
    </section>
  );
}
