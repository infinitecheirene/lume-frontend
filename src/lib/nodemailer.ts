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
          <style>
            body {
              font-family: Arial, sans-serif;
              background: #0b1d26;
              margin: 0;
              padding: 0;
              text-align: center;
              color: #ffffff;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: #0b1d26;
              border-radius: 12px;
              padding: 30px;
            }
            .logo img {
              width: 100px;
              margin-bottom: 10px;
            }
            .brand {
              font-size: 26px;
              font-weight: bold;
              letter-spacing: 1px;
              margin-bottom: 20px;
              color: #e5a834;
              font-family: 'Playfair Display', serif;
            }
            .content {
              background: #ffffff;
              color: #333;
              border-radius: 10px;
              padding: 30px;
            }
            .content h1 {
              color: #6b4f4f;
              margin-bottom: 10px;
            }
            .button {
              display: inline-block;
              padding: 14px 32px;
              margin-top: 20px;
              background: #0b1d26;
              color: #e5a834;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
            }
            .footer {
              margin-top: 20px;
              font-size: 12px;
              color: #777;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="${appUrl}/logo.jpg" alt="Lumè Bean & Bar Logo" />
            </div>

            <div class="brand">Lumè Bean & Bar</div>

            <div class="content">
              <h1>Welcome, ${name}!</h1>
              <p>Thank you for joining <strong>Lumè Bean & Bar</strong>.</p>
              <p>Please verify your email to continue:</p>

              <a href="${verificationUrl}" class="button">Verify Email</a>

              <p style="margin-top: 25px; font-size: 13px; color: #666;">
                Or copy and paste this link:<br>
                <span style="word-break: break-all;">${verificationUrl}</span>
              </p>

              <div class="footer">
                <p>If you didn’t sign up, you can ignore this email.</p>
                <p>This link will expire in 24 hours.</p>
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
