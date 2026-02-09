import { Resend } from "resend";
import { config } from "../config.js";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!config.email.resendApiKey) return null;
  if (!resend) resend = new Resend(config.email.resendApiKey);
  return resend;
}

export async function sendVerificationEmail(to: string, token: string) {
  const client = getResend();
  if (!client) {
    console.log(`[email] Verification email skipped (no RESEND_API_KEY). Token for ${to}: ${token}`);
    return;
  }

  const link = `${config.frontendUrl}/verify-email?token=${token}`;

  await client.emails.send({
    from: config.email.from,
    to,
    subject: "Verify your ImageForge email",
    html: `
      <h2>Welcome to ImageForge!</h2>
      <p>Click the link below to verify your email address:</p>
      <p><a href="${link}">Verify Email</a></p>
      <p>This link expires in 24 hours.</p>
      <p>If you didn't create an account, you can ignore this email.</p>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const client = getResend();
  if (!client) {
    console.log(`[email] Password reset email skipped (no RESEND_API_KEY). Token for ${to}: ${token}`);
    return;
  }

  const link = `${config.frontendUrl}/reset-password?token=${token}`;

  await client.emails.send({
    from: config.email.from,
    to,
    subject: "Reset your ImageForge password",
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password:</p>
      <p><a href="${link}">Reset Password</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request a password reset, you can ignore this email.</p>
    `,
  });
}
