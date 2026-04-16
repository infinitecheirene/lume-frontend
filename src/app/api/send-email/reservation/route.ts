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
      `Thank you for choosing Lumè Bean & Bar. We look forward to welcoming you!`

    const date =
      rawDate !== "Unknown date"
        ? new Date(rawDate).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : rawDate

    if (!to) {
      return NextResponse.json(
        { success: false, message: "Missing recipient email address" },
        { status: 400 }
      )
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
<body style="margin:0;padding:0;background-color:#f0f0ed;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">

<table role="presentation" width="100%" style="border-collapse:collapse;">
  <tr>
    <td style="padding:32px 16px;">

      <table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;border:1px solid #e0dfd9;overflow:hidden;border-collapse:collapse;">

        <!-- Header navbar -->
        <tr>
          <td style="background:#1c2b3a;padding:0 28px;">
            <table role="presentation" width="100%" style="border-collapse:collapse;min-height:72px;">
              <tr>
                <td style="padding:20px 0;vertical-align:middle;">
                  <table role="presentation" style="border-collapse:collapse;">
                    <tr>
                      <td style="vertical-align:middle;padding-right:12px;">
                        <div style="width:34px;height:34px;border-radius:8px;background:#e05c30;display:inline-block;text-align:center;line-height:34px;">
                          <span style="color:#ffffff;font-size:15px;font-weight:700;">L</span>
                        </div>
                      </td>
                      <td style="vertical-align:middle;">
                        <p style="margin:0;color:#ffffff;font-size:15px;font-weight:500;line-height:1.2;">Lumè Bean & Bar</p>
                        <p style="margin:0;color:#7a8fa0;font-size:12px;">Reservation Confirmation</p>
                      </td>
                    </tr>
                  </table>
                </td>
                <td style="text-align:right;vertical-align:middle;padding:20px 0;">
                  <span style="font-size:11px;color:#7a8fa0;letter-spacing:1px;">lumèbeanandbar.com</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Orange accent bar -->
        <tr>
          <td style="background:#e05c30;height:3px;font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 28px 24px;">

            <h2 style="margin:0 0 6px;font-size:19px;font-weight:500;color:#111827;">${subject}</h2>
            <p style="margin:0 0 24px;font-size:13px;color:#9ca3af;">Sent to ${to}</p>

            <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.7;">
              ${message}
            </p>

            <!-- Details block with left border accent -->
            <table role="presentation" width="100%" style="border-collapse:collapse;border-radius:0 8px 8px 0;overflow:hidden;margin-bottom:24px;">
              <tr>
                <td width="4" style="background:#e05c30;border-radius:4px 0 0 4px;">&nbsp;</td>
                <td style="background:#fdf2ee;padding:16px 18px;">
                  <table role="presentation" width="100%" style="border-collapse:collapse;font-size:14px;">
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;width:45%;">Reservation date</td>
                      <td style="padding:6px 0;color:#111827;font-weight:500;">${date}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;">Reservation time</td>
                      <td style="padding:6px 0;color:#111827;font-weight:500;">${time}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;">Guests</td>
                      <td style="padding:6px 0;color:#111827;font-weight:500;">${guests}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
              If you have questions or need to make changes, simply reply to this email.
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="border-top:1px solid #e5e7eb;background:#f9fafb;padding:16px 28px;">
            <table role="presentation" width="100%" style="border-collapse:collapse;">
              <tr>
                <td style="font-size:12px;color:#9ca3af;">This email was sent from Lumè Bean & Bar</td>
                <td style="text-align:right;font-size:12px;color:#c5c9ce;">© ${new Date().getFullYear()} Lumè Bean & Bar</td>
              </tr>
            </table>
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
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to send email",
      },
      { status: 500 }
    )
  }
}