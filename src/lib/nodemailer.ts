// ===== FINAL lib/nodemailer.ts =====
// Lumè Bean & Bar themed email template

import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  debug: false,
  logger: false,
})

export async function verifyEmailConfig() {
  try {
    await transporter.verify()
    return true
  } catch {
    return false
  }
}

export function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationToken: string
) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP credentials are not configured.')
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`

  const mailOptions = {
    from: process.env.SMTP_FROM || `"Lumè Bean & Bar" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verify Your Email - Lumè Bean & Bar',
    html: `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body { margin: 0; padding: 0; background: #f5f0e8; font-family: Georgia, serif; }
        a { color: inherit; text-decoration: none; }
      </style>
    </head>
    <body>
      <div style="background:#f5f0e8;padding:40px 20px;">
        <div style="max-width:560px;margin:0 auto;">

          <!-- Header -->
          <div style="text-align:center;margin-bottom:32px;">
            <div style="font-size:11px;letter-spacing:3px;color:#8a6a3a;text-transform:uppercase;font-family:Arial,sans-serif;">
              Lumè Bean &amp; Bar
            </div>
          </div>

          <!-- Card -->
          <div style="background:#1a0f0a;border-radius:16px;overflow:hidden;">

            <!-- Greeting -->
            <div style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #2e1e12;">
              <div style="font-size:22px;color:#f5e6c8;font-weight:400;margin-bottom:8px;">
                Welcome, ${name}!
              </div>
              <div style="font-size:13px;color:#8a7060;font-family:Arial,sans-serif;line-height:1.6;">
                Your table is almost ready.
              </div>
            </div>

            <!-- Body -->
            <div style="padding:36px 40px;">
              <p style="font-size:14px;color:#c4a882;font-family:Arial,sans-serif;line-height:1.8;margin:0 0 24px;">
                Thank you for joining us at Lumè Bean &amp; Bar. Before we pull your first shot,
                we just need to confirm your email address.
              </p>

              <div style="text-align:center;margin:32px 0;">
                <a href="${verificationUrl}"
                   style="display:inline-block;background:#c8974a;color:#1a0f0a;font-family:Arial,sans-serif;
                          font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;
                          padding:16px 40px;border-radius:4px;">
                  Verify my email
                </a>
              </div>

              <div style="border-top:1px solid #2e1e12;margin-top:32px;padding-top:24px;">
                <p style="font-size:12px;color:#5a4535;font-family:Arial,sans-serif;line-height:1.7;
                           margin:0;text-align:center;">
                  Or paste this link in your browser:<br>
                  <span style="color:#8a6a3a;word-break:break-all;font-size:11px;">${verificationUrl}</span>
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background:#110a06;padding:24px 40px;text-align:center;">
              <p style="font-size:11px;color:#4a3528;font-family:Arial,sans-serif;
                         margin:0;line-height:1.8;letter-spacing:0.3px;">
                This link expires in 24 hours &nbsp;·&nbsp; If you didn't sign up, ignore this email<br>
                © 2025 Lumè Bean &amp; Bar
              </p>
            </div>

          </div>
        </div>
      </div>
    </body>
  </html>
`,
    text: `
      Welcome to Lumè Bean & Bar, ${name}!

      Please verify your email:

      ${verificationUrl}

      If you didn't create an account, ignore this email.
      This link expires in 24 hours.
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Invalid login')) {
        throw new Error('Invalid email credentials.')
      }
      if (error.message.includes('ECONNREFUSED')) {
        throw new Error('Cannot connect to email server.')
      }
      if (error.message.includes('EAUTH')) {
        throw new Error('Authentication failed. Check your Gmail App Password.')
      }
    }
    throw error
  }
}
