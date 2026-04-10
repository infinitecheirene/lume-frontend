import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const to = body.to || body.email
    const name = body.name || "Guest"
    const rawDate = body.date || "Unknown date"
    const time = body.time || "Unknown time"
    const guests = body.guests || "N/A"
    const subject = body.subject || `Reservation Confirmation for ${name}`
    const message =
      body.message ||
      `Hello ${name},\n\nYour reservation for ${guests} guest(s) on ${rawDate} at ${time} has been received. We will follow up with confirmation details shortly.`

    const date = rawDate !== "Unknown date" ? new Date(rawDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : rawDate

    if (!to) {
      return NextResponse.json({ success: false, message: "Missing recipient email address" }, { status: 400 })
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                <tr>
                  <td style="background: #162a3a; padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #e5a834; font-size: 28px; font-weight: bold;">Reservation Confirmation</h1>
                    <p style="margin: 10px 0 0 0; color: #e5a834; font-size: 14px; opacity: 0.9;">Thank you for choosing Lumè Bean and Bar.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 22px; font-weight: 600;">Hello ${name},</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.75; white-space: pre-wrap;">${message}</p>
                    <table role="presentation" style="width: 100%; margin-top: 25px; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 12px 0; font-weight: 700; color: #374151; width: 30%; font-size: 18px;">Reservation Date</td>
                        <td style="padding: 12px 0; color: #111827; font-size: 16px; text-align: center;">${date}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; font-weight: 700; color: #374151; font-size: 18px;">Reservation Time</td>
                        <td style="padding: 12px 0; color: #111827; font-size: 16px; text-align: center;">${time}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; font-weight: 700; color: #374151; font-size: 18px;">Guests</td>
                        <td style="padding: 12px 0; color: #111827; font-size: 16px; text-align: center;">${guests}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">If you need to make changes, please reply to this email or contact us directly.</p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} Lumè Bean and Bar. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text: message,
      html: htmlContent,
    })

    return NextResponse.json({ success: true, message: "Email sent successfully" })
  } catch (error) {
    console.error("[API] Error sending email:", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 },
    )
  }
}
