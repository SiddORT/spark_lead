import nodemailer from "nodemailer";
import { logger } from "./logger";

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendPasswordSetupEmail(params: {
  toEmail: string;
  userName: string;
  setPasswordUrl: string;
}): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.info({ to: params.toEmail }, "Email not configured, skipping send");
    return;
  }
  try {
    const transport = createTransport();
    await transport.sendMail({
      from: `"Spark Lead Hub" <${process.env.SMTP_USER}>`,
      to: params.toEmail,
      subject: "You've been invited to Spark Lead Hub — Set your password",
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0e1118; color: #d1d9e8; padding: 40px; border-radius: 12px;">
          <h1 style="color: #1de9b6; font-size: 24px; margin-bottom: 8px;">Welcome to Spark Lead Hub</h1>
          <p style="color: #7a8aaa;">Hi ${params.userName},</p>
          <p>You've been invited to join Spark Lead Hub. Click the button below to set your password and activate your account.</p>
          <div style="margin: 32px 0; text-align: center;">
            <a href="${params.setPasswordUrl}" 
               style="background: #1de9b6; color: #0e1118; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              Set Your Password
            </a>
          </div>
          <p style="color: #7a8aaa; font-size: 14px;">This link expires in 24 hours and can only be used once.</p>
          <p style="color: #7a8aaa; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });
    logger.info({ to: params.toEmail }, "Password setup email sent");
  } catch (err) {
    logger.error({ err, to: params.toEmail }, "Failed to send password setup email");
  }
}

export async function sendActivityAlertEmail(params: {
  recipientEmail: string;
  leadName: string;
  changeDetails: string;
  actorName: string;
}): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.info({ to: params.recipientEmail }, "Email not configured, skipping activity alert");
    return;
  }
  try {
    const transport = createTransport();
    await transport.sendMail({
      from: `"Spark Lead Hub" <${process.env.SMTP_USER}>`,
      to: params.recipientEmail,
      subject: `Update on lead: ${params.leadName}`,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0e1118; color: #d1d9e8; padding: 40px; border-radius: 12px;">
          <h1 style="color: #1de9b6; font-size: 20px; margin-bottom: 8px;">Lead Activity Alert</h1>
          <p style="color: #7a8aaa;">Lead: <strong style="color: #d1d9e8;">${params.leadName}</strong></p>
          <p style="color: #7a8aaa;">Changed by: <strong style="color: #d1d9e8;">${params.actorName}</strong></p>
          <div style="background: #161b27; border: 1px solid #252d3d; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <pre style="color: #d1d9e8; white-space: pre-wrap; font-family: monospace; font-size: 14px;">${params.changeDetails}</pre>
          </div>
          <p style="color: #7a8aaa; font-size: 12px;">Spark Lead Hub — Activity Notification</p>
        </div>
      `,
    });
    logger.info({ to: params.recipientEmail }, "Activity alert email sent");
  } catch (err) {
    logger.error({ err, to: params.recipientEmail }, "Failed to send activity alert email");
  }
}
