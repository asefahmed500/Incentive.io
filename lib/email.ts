import nodemailer from "nodemailer";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 1500, // 1.5s connection timeout (fail-fast in sandbox environments)
  greetingTimeout: 1500,   // 1.5s greeting timeout
  socketTimeout: 3000,     // 3s socket timeout
});

const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<EmailResult> {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || "Incentive.io <noreply@incentive.io>",
      to,
      subject,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Email error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function sendNotificationEmail(to: string, title: string, message: string): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: `[Incentive.io] ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">Incentive.io</h2>
        <h3>${escapeHtml(title)}</h3>
        <p>${message}</p>
        <p style="color: #666; font-size: 12px;">This is an automated notification from Incentive.io.</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(to: string, name: string): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: "Welcome to Incentive.io",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">Welcome to Incentive.io!</h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>Your account has been created. You can now log in and start managing your sales team commissions.</p>
        <p>Login at: <a href="${baseUrl}/login">${baseUrl}/login</a></p>
        <hr />
        <p style="color: #666; font-size: 12px;">This is an automated message from Incentive.io.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: "Reset Your Incentive.io Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">Incentive.io</h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <p><a href="${resetUrl}" style="background: #0ea5e9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
        <p style="color: #666; font-size: 12px;">This link will expire in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}

export async function testEmailConnection(): Promise<EmailResult> {
  try {
    await transporter.verify();
    return { success: true, error: "SMTP connected successfully" };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}
