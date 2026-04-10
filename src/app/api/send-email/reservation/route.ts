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

      <style>
        @media screen and (max-width: 600px) {
          .container {
            width: 100% !important;
            border-radius: 0 !important;
          }

          .padding {
            padding: 20px !important;
          }

          .header {
            padding: 30px 20px !important;
          }

          .title {
            font-size: 22px !important;
          }

          .subtitle {
            font-size: 13px !important;
          }

          .content h2 {
            font-size: 18px !important;
          }

          .content p {
            font-size: 14px !important;
          }

          .stack td {
            display: block !important;
            width: 100% !important;
            text-align: left !important;
          }

          .stack td.label {
            font-weight: bold;
            padding-bottom: 4px !important;
          }

          .stack td.value {
            padding-bottom: 12px !important;
          }
        }
      </style>
    </head>

    <body style="margin:0; padding:0; background-color:#f5f5f5; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">

      <table role="presentation" width="100%" style="border-collapse:collapse;">
        <tr>
          <td style="padding:20px;">

            <!-- Container -->
            <table role="presentation" width="100%" class="container" style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden;">

              <!-- Header -->
              <tr>
                <td class="header" style="background:#162a3a; padding:40px 30px; text-align:center;">
                  <h1 class="title" style="margin:0; color:#e5a834; font-size:28px;">Reservation Confirmation</h1>
                  <p class="subtitle" style="margin:10px 0 0; color:#e5a834; font-size:14px;">
                    Thank you for choosing Lumè Bean and Bar.
                  </p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td class="padding content" style="padding:40px 30px;">
                  <h2 style="margin:0 0 20px; color:#111827; font-size:22px;">
                    Hello ${name},
                  </h2>

                  <p style="color:#4b5563; font-size:16px; line-height:1.6;">
                    ${message}
                  </p>

                  <!-- Reservation Details -->
                  <table role="presentation" width="100%" class="stack" style="margin-top:25px; border-collapse:collapse;">
                    <tr>
                      <td class="label" style="padding:10px 0; font-weight:700; color:#374151; width:40%;">Reservation Date</td>
                      <td class="value" style="padding:10px 0; color:#111827;">${date}</td>
                    </tr>
                    <tr>
                      <td class="label" style="padding:10px 0; font-weight:700; color:#374151;">Reservation Time</td>
                      <td class="value" style="padding:10px 0; color:#111827;">${time}</td>
                    </tr>
                    <tr>
                      <td class="label" style="padding:10px 0; font-weight:700; color:#374151;">Guests</td>
                      <td class="value" style="padding:10px 0; color:#111827;">${guests}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f9fafb; padding:25px 20px; text-align:center; border-top:1px solid #e5e7eb;">
                  <p style="margin:0 0 10px; color:#6b7280; font-size:13px;">
                    If you need to make changes, just reply to this email.
                  </p>
                  <p style="margin:0; color:#9ca3af; font-size:12px;">
                    © ${new Date().getFullYear()} Lumè Bean and Bar
                  </p>
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
