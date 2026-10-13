import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { inviteEmail } from "../emails/inviteEmail.js";
import { resetEmail } from "../emails/resetEmail.js";

let transport = null;
let isEthereal = false;

/**
 * Resets the transport singleton (useful for testing).
 */
export function resetTransport() {
  transport = null;
  isEthereal = false;
}

/**
 * Lazy singleton transport.
 */
export async function getTransport() {
  if (transport) return transport;

  if (env.SMTP_HOST) {
    transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: env.SMTP_SECURE || false,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? {
              user: env.SMTP_USER,
              pass: env.SMTP_PASS,
            }
          : undefined,
    });
    isEthereal = false;
    return transport;
  }

  if (env.NODE_ENV !== "production") {
    const testAccount = await nodemailer.createTestAccount();
    transport = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    isEthereal = true;
    logger.info(`Ethereal test email account created: ${testAccount.user}`);
    return transport;
  }

  throw new Error("SMTP configuration is missing in production");
}

export function buildResetUrl(token) {
  const baseUrl = (env.APP_BASE_URL || "http://localhost:5173").replace(/\/+$/, "");
  return `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

export async function sendEmail({ to, subject, html, text }) {
  const transporter = await getTransport();
  const mailOptions = {
    from: env.MAIL_FROM || "no-reply@homeroom.local",
    to,
    subject,
    text,
    html,
  };

  const info = await transporter.sendMail(mailOptions);

  if (isEthereal && env.NODE_ENV !== "production") {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info(`Email preview URL: ${previewUrl}`);
    }
  }

  return info;
}

export async function sendInviteEmail({ email, firstName, token }) {
  const resetUrl = buildResetUrl(token);
  const { subject, html, text } = inviteEmail({ firstName, resetUrl });
  return sendEmail({ to: email, subject, html, text });
}

export async function sendResetEmail({ email, firstName, token }) {
  const resetUrl = buildResetUrl(token);
  const { subject, html, text } = resetEmail({ firstName, resetUrl });
  return sendEmail({ to: email, subject, html, text });
}