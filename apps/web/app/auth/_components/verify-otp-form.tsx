'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { persistSession } from '../../lib/auth-storage';
import { getApiBaseUrl } from '../../lib/api';

const defaultDeviceId = 'web-browser';

export function VerifyOtpForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [district, setDistrict] = useState('');
  const [role, setRole] = useState<'CITIZEN' | 'AGENCY_ADMIN'>('CITIZEN');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedEmail = window.localStorage.getItem('sidewalk:auth-email');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/verify-otp`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code,
          district: district || undefined,
          role,
          deviceId: defaultDeviceId,
          clientType: 'web',
        }),
      });

      const payload = (await response.json()) as {
        accessToken?: string;
        expiresIn?: string;
        error?: { message?: string };
      };

      if (!response.ok || !payload.accessToken) {
        throw new Error(payload.error?.message ?? 'Unable to verify OTP');
      }

      persistSession({
        accessToken: payload.accessToken,
        email,
        expiresIn: payload.expiresIn ?? '15m',
        role,
      });

      router.replace('/dashboard');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to verify OTP');
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

        <label className="field">
          <span>OTP Code</span>
          <input
            inputMode="numeric"
            name="code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="123456"
            required
          />
        </label>

        <label className="field">
          <span>Role</span>
          <select value={role} onChange={(event) => setRole(event.target.value as 'CITIZEN' | 'AGENCY_ADMIN')}>
            <option value="CITIZEN">Citizen</option>
            <option value="AGENCY_ADMIN">Agency admin</option>
          </select>
        </label>

        <label className="field">
          <span>District</span>
          <input
            name="district"
            value={district}
            onChange={(event) => setDistrict(event.target.value)}
            placeholder="Ikeja"
          />
        </label>

        <button className="button button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Verifying…' : 'Verify OTP'}
        </button>
      </form>

      {error ? <p className="status-note error">{error}</p> : null}

      <p className="helper-copy">
        Need a new code? <Link href="/auth/request-otp">Request OTP</Link>
      </p>
    </section>
  );
}
