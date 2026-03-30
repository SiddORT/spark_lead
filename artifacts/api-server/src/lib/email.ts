import nodemailer from "nodemailer";
import { logger } from "./logger";

// ─── Transporter ────────────────────────────────────────────────────────────

function createTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10_000,
    greetingTimeout: 5_000,
    socketTimeout: 10_000,
  });
}

let transporter = createTransporter();

/** Call at server startup to log SMTP connectivity status (non-blocking). */
export async function verifyEmailConnection(): Promise<boolean> {
  if (!transporter) {
    logger.warn(
      "Email service not configured — SMTP_USER / SMTP_PASS missing in Secrets. Emails will be skipped.",
    );
    return false;
  }
  try {
    await transporter.verify();
    logger.info({ host: process.env.SMTP_HOST }, "✅ Email service connected");
    return true;
  } catch (err: any) {
    logger.error(
      {
        err: err.message,
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        hint: "For Gmail: use an App Password (https://myaccount.google.com/apppasswords). Try port 465 if 587 fails.",
      },
      "❌ Email service connection failed",
    );
    return false;
  }
}

// ─── Core send helper ────────────────────────────────────────────────────────

async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  if (!transporter) {
    logger.info({ to: opts.to }, "Email not configured, skipping send");
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Spark Lead Hub" <${process.env.SMTP_USER}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text || opts.html.replace(/<[^>]+>/g, ""),
    });
    logger.info({ to: opts.to, messageId: info.messageId }, "✅ Email sent");
    return true;
  } catch (err: any) {
    logger.error({ err: err.message, to: opts.to }, "❌ Email send failed");
    return false;
  }
}

// ─── Email Templates ─────────────────────────────────────────────────────────

const LOGO_HEADER = `
<tr>
  <td style="background:#0a1a18;padding:24px 36px;border-bottom:1px solid #1e2433;">
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="background:#0d2e28;border-radius:8px;width:36px;height:36px;text-align:center;vertical-align:middle;">
        <span style="color:#2dd4bf;font-size:18px;">⚡</span>
      </td>
      <td style="padding-left:10px;">
        <span style="font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:#e8eaf0;letter-spacing:-0.5px;">LeadFlow</span>
      </td>
    </tr></table>
  </td>
</tr>`;

const EMAIL_WRAPPER_OPEN = `
<!DOCTYPE html><html><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0d0f14;font-family:'DM Sans',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0f14;padding:40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0"
  style="background:#12151e;border:1px solid #1e2433;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
${LOGO_HEADER}`;

const EMAIL_WRAPPER_CLOSE = (year: number) => `
<tr>
  <td style="padding:16px 36px;border-top:1px solid #1e2433;background:#0d1117;">
    <p style="margin:0;font-size:12px;color:#4a5568;text-align:center;">
      © ${year} Spark Lead Hub. All rights reserved.
    </p>
  </td>
</tr>
</table></td></tr></table></body></html>`;

// ── Invite / Set-password email ──────────────────────────────────────────────

export async function sendPasswordSetupEmail(params: {
  toEmail: string;
  userName: string;
  setPasswordUrl: string;
  invitedByName?: string;
  role?: string;
}): Promise<boolean> {
  const roleLabel: Record<string, string> = {
    admin: "Admin",
    lead_owner: "Lead Owner",
    deal_handler: "Deal Handler",
    manager: "Manager",
    member: "Member",
  };
  const rl = params.role ? (roleLabel[params.role] || params.role) : "Team Member";

  const html = `${EMAIL_WRAPPER_OPEN}
<tr><td style="padding:36px;">
  <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#e8eaf0;letter-spacing:-0.5px;">
    You've been invited! 🎉
  </h1>
  <p style="margin:0 0 24px;font-size:15px;color:#8892a4;line-height:1.6;">
    ${params.invitedByName
      ? `<strong style="color:#e8eaf0;">${params.invitedByName}</strong> has invited you to join`
      : "You have been invited to join"}
    <strong style="color:#2dd4bf;">Spark Lead Hub</strong>
    ${params.role ? `as a <strong style="color:#e8eaf0;">${rl}</strong>` : ""}.
  </p>

  <div style="background:#0d1117;border:1px solid #1e2433;border-radius:10px;padding:20px;margin-bottom:28px;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#4a5568;text-transform:uppercase;letter-spacing:0.08em;">Your account email</p>
    <p style="margin:0;font-size:15px;color:#2dd4bf;font-weight:600;">${params.toEmail}</p>
  </div>

  <p style="margin:0 0 20px;font-size:14px;color:#8892a4;line-height:1.6;">
    Click the button below to set your password. This link expires in <strong style="color:#e8eaf0;">24 hours</strong>.
  </p>

  <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
    <a href="${params.setPasswordUrl}"
       style="display:inline-block;background:#2dd4bf;color:#0d0f14;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none;">
      Set Your Password →
    </a>
  </td></tr></table>

  <p style="margin:24px 0 0;font-size:12px;color:#4a5568;line-height:1.6;text-align:center;">
    Or copy this link into your browser:<br>
    <span style="color:#2dd4bf;word-break:break-all;">${params.setPasswordUrl}</span>
  </p>
</td></tr>
${EMAIL_WRAPPER_CLOSE(new Date().getFullYear())}`;

  return sendEmail({
    to: params.toEmail,
    subject: "You've been invited to Spark Lead Hub — Set your password",
    html,
  });
}

// ── Access approved email ────────────────────────────────────────────────────

export async function sendAccessApprovedEmail(params: {
  toEmail: string;
  displayName: string;
  setPasswordUrl: string;
  reviewedByName: string;
}): Promise<boolean> {
  const html = `${EMAIL_WRAPPER_OPEN}
<tr><td style="padding:36px;">
  <div style="background:#0a1f14;border:1px solid #1a4a2e;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
    <span style="font-size:14px;font-weight:600;color:#4ade80;">✅ Access Approved</span>
  </div>

  <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#e8eaf0;letter-spacing:-0.5px;">
    Welcome to Spark Lead Hub!
  </h1>
  <p style="margin:0 0 24px;font-size:15px;color:#8892a4;line-height:1.6;">
    Hi <strong style="color:#e8eaf0;">${params.displayName}</strong>, your access request has been
    approved by <strong style="color:#e8eaf0;">${params.reviewedByName}</strong>.
  </p>

  <p style="margin:0 0 20px;font-size:14px;color:#8892a4;line-height:1.6;">
    Set your password to get started. This link expires in <strong style="color:#e8eaf0;">24 hours</strong>.
  </p>

  <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
    <a href="${params.setPasswordUrl}"
       style="display:inline-block;background:#2dd4bf;color:#0d0f14;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none;">
      Set Password &amp; Get Started →
    </a>
  </td></tr></table>

  <p style="margin:24px 0 0;font-size:12px;color:#4a5568;line-height:1.6;text-align:center;">
    Link: <span style="color:#2dd4bf;word-break:break-all;">${params.setPasswordUrl}</span>
  </p>
</td></tr>
${EMAIL_WRAPPER_CLOSE(new Date().getFullYear())}`;

  return sendEmail({
    to: params.toEmail,
    subject: "Your access to Spark Lead Hub has been approved",
    html,
  });
}

// ── Activity alert email ─────────────────────────────────────────────────────

export async function sendActivityAlertEmail(params: {
  recipientEmail: string;
  leadName: string;
  changeDetails: string;
  actorName: string;
}): Promise<boolean> {
  const html = `${EMAIL_WRAPPER_OPEN}
<tr><td style="padding:32px 36px;">
  <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#4a5568;text-transform:uppercase;letter-spacing:0.08em;">Lead Update</p>
  <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#2dd4bf;">${params.leadName}</h2>
  <div style="background:#0d1117;border:1px solid #1e2433;border-radius:8px;padding:16px;margin-bottom:20px;">
    <p style="margin:0;font-size:14px;color:#8892a4;line-height:1.7;white-space:pre-line;">${params.changeDetails}</p>
  </div>
  <p style="margin:0;font-size:13px;color:#4a5568;">
    Updated by <strong style="color:#e8eaf0;">${params.actorName}</strong>
  </p>
</td></tr>
${EMAIL_WRAPPER_CLOSE(new Date().getFullYear())}`;

  return sendEmail({
    to: params.recipientEmail,
    subject: `Update on lead: ${params.leadName}`,
    html,
  });
}

// ── Test helper ──────────────────────────────────────────────────────────────

export async function sendTestEmail(
  to: string,
  type: "password" | "activity",
): Promise<boolean> {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  if (type === "password") {
    return sendPasswordSetupEmail({
      toEmail: to,
      userName: "Test User",
      setPasswordUrl: `${frontendUrl}/set-password?token=test-token-123`,
      invitedByName: "System Admin",
      role: "deal_handler",
    });
  }
  return sendActivityAlertEmail({
    recipientEmail: to,
    leadName: "Test Lead — ACME Corp",
    changeDetails: "Stage: Discovery → Qualification\nDeal Value: ₹5,00,000",
    actorName: "System Admin",
  });
}
