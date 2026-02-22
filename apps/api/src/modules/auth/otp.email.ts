import { logger } from '../../core/logging/logger';

const resendApiKey = process.env.RESEND_API_KEY;
const otpFromEmail = process.env.OTP_EMAIL_FROM ?? 'no-reply@sidewalk.local';

export const sendOtpEmail = async (email: string, otpCode: string): Promise<void> => {
  if (!resendApiKey) {
    logger.warn('RESEND_API_KEY is missing, OTP email fallback to log output', {
      email,
      otpCode,
    });
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: otpFromEmail,
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
