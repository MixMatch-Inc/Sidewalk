'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { persistSession } from '../../lib/auth-storage';
import { getApiBaseUrl } from '../../lib/api';

const CODE_PATTERN = /^\d{6}$/;
const DISTRICT_PATTERN = /^[a-zA-Z0-9 _-]{2,64}$/;

function classifyError(message: string): string {
  if (/expired/i.test(message)) return 'Your OTP has expired. Request a new code.';
  if (/invalid.*code|code.*invalid/i.test(message)) return 'Invalid code. Check the email and try again.';
  if (/district/i.test(message)) return 'District value is not recognised by the server.';
  if (/role/i.test(message)) return 'The selected role is not permitted for this account.';
  if (/session|token/i.test(message)) return 'Session error. Please sign in again.';
  return message;
}

export function VerifyOtpForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [district, setDistrict] = useState('');
  const [role, setRole] = useState<'CITIZEN' | 'AGENCY_ADMIN'>('CITIZEN');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('sidewalk:auth-email') : null;
    if (stored) setEmail(stored);
  }, []);

  const validate = (): string | null => {
    if (!email) return 'Email is required.';
    if (!CODE_PATTERN.test(code)) return 'Code must be exactly 6 digits.';
    if (district && !DISTRICT_PATTERN.test(district)) return 'District contains invalid characters.';
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/verify-otp`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, district: district.trim() || undefined, role, deviceId: 'web-browser', clientType: 'web' }),
      });

      const payload = (await response.json()) as { accessToken?: string; expiresIn?: string; error?: { message?: string } };

      if (!response.ok || !payload.accessToken) {
        throw new Error(payload.error?.message ?? 'Unable to verify OTP');
      }

      persistSession({ accessToken: payload.accessToken, email, expiresIn: payload.expiresIn ?? '15m', role });
      router.replace('/dashboard');
    } catch (err) {
      setError(classifyError(err instanceof Error ? err.message : 'Unable to verify OTP'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-card">
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Email</span>
          <input autoComplete="email" name="email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="citizen@example.com" required />
        </label>

        <label className="field">
          <span>OTP Code</span>
          <input inputMode="numeric" name="code" value={code} maxLength={6}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="123456" required />
        </label>

        <label className="field">
          <span>Role</span>
          <select value={role} onChange={(e) => setRole(e.target.value as 'CITIZEN' | 'AGENCY_ADMIN')}>
            <option value="CITIZEN">Citizen</option>
            <option value="AGENCY_ADMIN">Agency admin</option>
          </select>
        </label>

        <label className="field">
          <span>District</span>
          <input name="district" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Ikeja" />
        </label>

        <button className="button button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Verifying…' : 'Verify OTP'}
        </button>
      </form>

      {error && <p className="status-note error">{error}</p>}

      <p className="helper-copy">
        Need a new code? <Link href="/auth/request-otp">Request OTP</Link>
      </p>
    </section>
  );
}
