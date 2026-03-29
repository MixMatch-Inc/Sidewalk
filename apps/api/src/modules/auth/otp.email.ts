import { logger } from '../../core/logging/logger';
import { getApiEnv } from '../../config/env';

export const sendOtpEmail = async (email: string, otpCode: string): Promise<void> => {
  const { RESEND_API_KEY, OTP_EMAIL_FROM } = getApiEnv();

  if (!RESEND_API_KEY) {
    logger.warn('RESEND_API_KEY is missing, OTP email fallback to log output', {
      email,
      otpCode,
    });
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: OTP_EMAIL_FROM,
      to: [email],
      subject: 'Your Sidewalk login code',
      html: `<p>Your Sidewalk verification code is <strong>${otpCode}</strong>.</p><p>This code expires in 5 minutes.</p>`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OTP email send failed: ${response.status} ${body}`);
  }
};
