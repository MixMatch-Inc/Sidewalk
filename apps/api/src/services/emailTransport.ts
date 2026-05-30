/**
 * Pluggable email transport for auth messages.
 *
 * MAIL_TRANSPORT=log   → prints links to stdout (default; zero setup)
 * MAIL_TRANSPORT=smtp  → sends via SMTP (point at Mailpit for local dev)
 *
 * To start Mailpit locally:
 *   docker run -d -p 1025:1025 -p 8025:8025 axllent/mailpit
 *   Open http://localhost:8025 to inspect captured emails.
 */

export type AuthEmail =
  | { type: "verify"; to: string; token: string }
  | { type: "reset"; to: string; token: string };

export interface EmailTransport {
  send(email: AuthEmail): Promise<void>;
}

class LogTransport implements EmailTransport {
  async send(email: AuthEmail): Promise<void> {
    const label = email.type === "verify" ? "verify token" : "reset token";
    console.log(`[mail:log] ${label} for ${email.to}: ${email.token}`);
  }
}

class SmtpTransport implements EmailTransport {
  private readonly host: string;
  private readonly port: number;
  private readonly from: string;

  constructor(host: string, port: number, from: string) {
    this.host = host;
    this.port = port;
    this.from = from;
  }

  async send(email: AuthEmail): Promise<void> {
    // Nodemailer is not yet installed; log and surface a clear setup message.
    // To enable: `pnpm --filter @sidewalk/api add nodemailer`
    // and replace this stub with a real nodemailer transporter.
    console.warn(
      `[mail:smtp] SMTP transport not yet wired (${this.host}:${this.port} from ${this.from}). ` +
        `Install nodemailer and implement the send method. Token for ${email.to}: ${email.token}`
    );
  }
}

function buildTransport(): EmailTransport {
  const transport = process.env.MAIL_TRANSPORT ?? "log";
  if (transport === "smtp") {
    return new SmtpTransport(
      process.env.MAIL_SMTP_HOST ?? "localhost",
      Number(process.env.MAIL_SMTP_PORT ?? "1025"),
      process.env.MAIL_FROM ?? "noreply@sidewalk.local"
    );
  }
  return new LogTransport();
}

export const emailTransport: EmailTransport = buildTransport();
