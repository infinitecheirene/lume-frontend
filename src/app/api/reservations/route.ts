import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// ─── Admin Notification Email ─────────────────────────────────────────────────

async function sendAdminNotification(reservationData: any) {
  try {
    const isWalkIn = reservationData.is_walkin === "1" || reservationData.is_walkin === true

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: process.env.ADMIN_EMAIL,
      subject: `${isWalkIn ? "Walk-In Guest" : "New Reservation"} — ${reservationData.name}`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${isWalkIn ? "Walk-In Guest" : "New Reservation"}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f0ed;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table role="presentation" width="100%" style="border-collapse:collapse;">
  <tr>
    <td style="padding:32px 16px;">
      <table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;border:1px solid #e0dfd9;overflow:hidden;border-collapse:collapse;">

        <!-- Header -->
        <tr>
          <td style="background:#1a2e3b;padding:24px 28px;">
            <table role="presentation" width="100%" style="border-collapse:collapse;">
              <tr>
                <td style="vertical-align:middle;">
                  <p style="margin:0;color:#c9943d;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">
                    ${isWalkIn ? "Walk-in guest" : "New reservation"}
                  </p>
                  <h1 style="margin:4px 0 0;color:#ffffff;font-size:18px;font-weight:500;">
                    ${reservationData.name} — ${isWalkIn ? "Arrived now" : "Table booked"}
                  </h1>
                </td>
                <td style="vertical-align:middle;text-align:right;">
                  <span style="background:${isWalkIn ? "#3b82f6" : "#c9943d"};color:#ffffff;font-size:11px;font-weight:700;padding:5px 14px;border-radius:20px;letter-spacing:0.5px;white-space:nowrap;">
                    ${isWalkIn ? "Walk-in" : "Action needed"}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Date/Time/Guests/Dining Grid -->
        <tr>
          <td style="padding:24px 28px 0;">
            <table role="presentation" width="100%" style="border-collapse:collapse;">
              <tr>
                <td width="50%" style="padding:0 6px 12px 0;">
                  <table role="presentation" width="100%" style="background:#f7f6f2;border-radius:10px;border-collapse:collapse;">
                    <tr><td style="padding:14px 16px;">
                      <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;">Date</p>
                      <p style="margin:0;font-size:15px;font-weight:500;color:#1a2e3b;">${new Date(reservationData.date).toDateString()}</p>
                    </td></tr>
                  </table>
                </td>
                <td width="50%" style="padding:0 0 12px 6px;">
                  <table role="presentation" width="100%" style="background:#f7f6f2;border-radius:10px;border-collapse:collapse;">
                    <tr><td style="padding:14px 16px;">
                      <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;">Time</p>
                      <p style="margin:0;font-size:15px;font-weight:500;color:#1a2e3b;">${reservationData.time}</p>
                    </td></tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td width="50%" style="padding:0 6px 0 0;">
                  <table role="presentation" width="100%" style="background:#f7f6f2;border-radius:10px;border-collapse:collapse;">
                    <tr><td style="padding:14px 16px;">
                      <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;">Guests</p>
                      <p style="margin:0;font-size:15px;font-weight:500;color:#1a2e3b;">${reservationData.guests} persons</p>
                    </td></tr>
                  </table>
                </td>
                <td width="50%" style="padding:0 0 0 6px;">
                  <table role="presentation" width="100%" style="background:#f7f6f2;border-radius:10px;border-collapse:collapse;">
                    <tr><td style="padding:14px 16px;">
                      <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;">Dining</p>
                      <p style="margin:0;font-size:15px;font-weight:500;color:#1a2e3b;">${reservationData.dining_preference || "N/A"}</p>
                    </td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Customer Details -->
        <tr>
          <td style="padding:20px 28px 0;">
            <table role="presentation" width="100%" style="border:1px solid #e5e5e2;border-radius:10px;border-collapse:collapse;overflow:hidden;">
              <tr>
                <td colspan="2" style="padding:12px 16px;background:#f7f6f2;border-bottom:1px solid #e5e5e2;">
                  <p style="margin:0;font-size:11px;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;font-weight:500;">Customer</p>
                </td>
              </tr>
              <tr style="border-bottom:1px solid #f0f0ed;">
                <td style="padding:10px 16px;color:#9ca3af;font-size:14px;width:40%;">Name</td>
                <td style="padding:10px 16px;color:#1a2e3b;font-size:14px;font-weight:500;">${reservationData.name}</td>
              </tr>
              <tr style="border-bottom:1px solid #f0f0ed;">
                <td style="padding:10px 16px;color:#9ca3af;font-size:14px;">Email</td>
                <td style="padding:10px 16px;color:#1a2e3b;font-size:14px;">${reservationData.email || "N/A"}</td>
              </tr>
              <tr style="border-bottom:1px solid #f0f0ed;">
                <td style="padding:10px 16px;color:#9ca3af;font-size:14px;">Phone</td>
                <td style="padding:10px 16px;color:#1a2e3b;font-size:14px;">${reservationData.phone || "N/A"}</td>
              </tr>
              <tr style="border-bottom:1px solid #f0f0ed;">
                <td style="padding:10px 16px;color:#9ca3af;font-size:14px;">Occasion</td>
                <td style="padding:10px 16px;color:#1a2e3b;font-size:14px;">${reservationData.occasion || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;color:#9ca3af;font-size:14px;">Package</td>
                <td style="padding:10px 16px;color:#1a2e3b;font-size:14px;">${reservationData.package || "Custom"}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Payment Details -->
        <tr>
          <td style="padding:16px 28px 0;">
            <table role="presentation" width="100%" style="border:1px solid #e5e5e2;border-radius:10px;border-collapse:collapse;overflow:hidden;">
              <tr>
                <td colspan="2" style="padding:12px 16px;background:#f7f6f2;border-bottom:1px solid #e5e5e2;">
                  <p style="margin:0;font-size:11px;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;font-weight:500;">Payment</p>
                </td>
              </tr>
              <tr style="border-bottom:1px solid #f0f0ed;">
                <td style="padding:10px 16px;color:#9ca3af;font-size:14px;width:40%;">Reservation fee</td>
                <td style="padding:10px 16px;color:#1a2e3b;font-size:14px;">₱${reservationData.reservation_fee || 0}</td>
              </tr>
              <tr style="border-bottom:1px solid #f0f0ed;">
                <td style="padding:10px 16px;color:#9ca3af;font-size:14px;width:40%;">Remaining balance</td>
                <td style="padding:10px 16px;color:#1a2e3b;font-size:14px;">₱${reservationData.remaining_balance || 0}</td>
              </tr>
              <tr style="border-bottom:1px solid #f0f0ed;">
                <td style="padding:10px 16px;color:#9ca3af;font-size:14px;">Service charge</td>
                <td style="padding:10px 16px;color:#1a2e3b;font-size:14px;">₱${reservationData.service_charge || 0}</td>
              </tr>
              <tr style="border-bottom:1px solid #f0f0ed;">
                <td style="padding:10px 16px;color:#6b7280;font-size:14px;font-weight:600;">Total <span style="font-size: 10px"><br>(Remaining Balance + Service Charge)</span></td>
                <td style="padding:10px 16px;color:#c9943d;font-size:15px;font-weight:700;">₱${reservationData.total_fee || 0} </td>
              </tr>
              <tr style="border-bottom:1px solid #f0f0ed;">
                <td style="padding:10px 16px;color:#9ca3af;font-size:14px;">Method</td>
                <td style="padding:10px 16px;color:#1a2e3b;font-size:14px;">${reservationData.payment_method || "N/A"}</td>
              </tr>
              <tr style="border-bottom:1px solid #f0f0ed;">
                <td style="padding:10px 16px;color:#9ca3af;font-size:14px;">Reference</td>
                <td style="padding:10px 16px;color:#1a2e3b;font-size:14px;">${reservationData.payment_reference || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;color:#9ca3af;font-size:14px;">Status</td>
                <td style="padding:10px 16px;">
                  <span style="background:${reservationData.payment_status === "paid" ? "#d1fae5" : "#fef3c7"};color:${reservationData.payment_status === "paid" ? "#065f46" : "#92400e"};font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;">
                    ${reservationData.payment_status || "pending"}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${reservationData.special_requests ? `
        <tr>
          <td style="padding:16px 28px 0;">
            <table role="presentation" width="100%" style="background:#fffbf2;border:1px solid #e8d9b0;border-radius:10px;border-collapse:collapse;">
              <tr><td style="padding:14px 16px;">
                <p style="margin:0 0 6px;font-size:11px;color:#a07828;letter-spacing:1.5px;text-transform:uppercase;font-weight:500;">Special requests</p>
                <p style="margin:0;font-size:14px;color:#7a6030;line-height:1.6;">${reservationData.special_requests}</p>
              </td></tr>
            </table>
          </td>
        </tr>` : ""}

        <!-- Footer -->
        <tr>
          <td style="padding:24px 28px;border-top:1px solid #e5e5e2;margin-top:20px;text-align:center;background:#f7f6f2;">
            <p style="margin:0;font-size:12px;color:#aaaaaa;">Lumè Bean &amp; Bar · Reservation System</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`,
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}

// ─── Online Reservation Confirmation Email ────────────────────────────────────

async function sendCustomerConfirmation(reservationData: any) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: reservationData.email,
      subject: `Reservation Received — Lumè Bean & Bar`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reservation Received</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f0ed;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table role="presentation" width="100%" style="border-collapse:collapse;">
  <tr>
    <td style="padding:32px 16px;">
      <table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;border:1px solid #e0dfd9;overflow:hidden;border-collapse:collapse;">

        <!-- Header -->
        <tr>
          <td style="background:#1a2e3b;padding:36px 30px;text-align:center;">
            <div style="width:52px;height:52px;border-radius:50%;background:#c9943d;margin:0 auto 16px;display:inline-flex;align-items:center;justify-content:center;">
              <span style="color:#ffffff;font-size:22px;font-weight:700;">✓</span>
            </div>
            <h1 style="margin:0 0 6px;color:#ffffff;font-size:20px;font-weight:500;">Reservation received</h1>
            <p style="margin:0;color:#9ba8b0;font-size:13px;">We'll confirm your booking shortly</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 28px 20px;">
            <p style="margin:0 0 6px;color:#1a2e3b;font-size:15px;">Hi <strong>${reservationData.name}</strong>,</p>
            <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.7;">
              Thank you for booking at Lumè Bean &amp; Bar. Your reservation request has been received and is currently <strong style="color:#d97706;">pending review</strong>. We'll send you a confirmation once payment has been verified.
            </p>

            <!-- Booking Details -->
            <table role="presentation" width="100%" style="background:#f7f6f2;border-radius:12px;border-collapse:collapse;margin-bottom:16px;">
              <tr>
                <td style="padding:16px 18px 8px;" colspan="2">
                  <p style="margin:0;font-size:11px;color:#aaaaaa;letter-spacing:1.5px;text-transform:uppercase;">Booking details</p>
                </td>
              </tr>
              <tr>
                <td width="50%" style="padding:6px 18px 14px;vertical-align:top;">
                  <p style="margin:0 0 3px;font-size:11px;color:#9ca3af;">Reservation no.</p>
                  <p style="margin:0;font-size:14px;font-weight:700;color:#c9943d;letter-spacing:0.5px;">${reservationData.reservation_number}</p>
                </td>
                <td width="50%" style="padding:6px 18px 14px;vertical-align:top;">
                  <p style="margin:0 0 3px;font-size:11px;color:#9ca3af;">Occasion</p>
                  <p style="margin:0;font-size:14px;color:#1a2e3b;">${reservationData.occasion || "N/A"}</p>
                </td>
              </tr>
              <tr>
                <td width="50%" style="padding:6px 18px 14px;vertical-align:top;">
                  <p style="margin:0 0 3px;font-size:11px;color:#9ca3af;">Date</p>
                  <p style="margin:0;font-size:14px;color:#1a2e3b;">${new Date(reservationData.date).toDateString()}</p>
                </td>
                <td width="50%" style="padding:6px 18px 14px;vertical-align:top;">
                  <p style="margin:0 0 3px;font-size:11px;color:#9ca3af;">Time</p>
                  <p style="margin:0;font-size:14px;color:#1a2e3b;">${reservationData.time}</p>
                </td>
              </tr>
              <tr>
                <td width="50%" style="padding:6px 18px 18px;vertical-align:top;">
                  <p style="margin:0 0 3px;font-size:11px;color:#9ca3af;">Guests</p>
                  <p style="margin:0;font-size:14px;color:#1a2e3b;">${reservationData.guests} persons</p>
                </td>
                <td width="50%" style="padding:6px 18px 18px;vertical-align:top;">
                  <p style="margin:0 0 3px;font-size:11px;color:#9ca3af;">Package</p>
                  <p style="margin:0;font-size:14px;color:#1a2e3b;">${reservationData.package || "Custom"}</p>
                </td>
              </tr>
            </table>

            <!-- Payment summary -->
            <table role="presentation" width="100%" style="border:1px solid #e5e5e2;border-radius:12px;border-collapse:collapse;margin-bottom:16px;overflow:hidden;">
              
              <!-- Title -->
              <tr style="background:#f7f6f2;border-bottom:1px solid #ecebe7;">
                <td colspan="2" style="padding:12px 16px;">
                  <p style="margin:0;font-size:11px;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;">
                    Payment Summary
                  </p>
                </td>
              </tr>

              <!-- Reservation Fee -->
              <tr style="border-bottom:1px solid #f0f0ed;">
                <td style="padding:10px 16px;color:#6b7280;font-size:14px;width:55%;">
                  Reservation Fee (Paid)
                </td>
                <td style="padding:10px 16px;color:#059669;font-size:14px;font-weight:600;text-align:right;">
                  ₱${reservationData.reservation_fee || 0}
                </td>
              </tr>

              <!-- Remaining -->
              <tr style="border-bottom:1px solid #f0f0ed;">
                <td style="padding:10px 16px;color:#6b7280;font-size:14px;">
                  Remaining Balance
                </td>
                <td style="padding:10px 16px;color:#1a2e3b;font-size:14px;text-align:right;">
                  ₱${reservationData.remaining_balance || 0}
                </td>
              </tr>

              <!-- Service Charge -->
              <tr style="border-bottom:1px solid #f0f0ed;">
                <td style="padding:10px 16px;color:#6b7280;font-size:14px;">
                  Service Charge
                </td>
                <td style="padding:10px 16px;color:#1a2e3b;font-size:14px;text-align:right;">
                  ₱${reservationData.service_charge || 0}
                </td>
              </tr>

              <!-- Total Due -->
              <tr style="background:#fffaf0;border-bottom:1px solid #f0f0ed;">
                <td style="padding:12px 16px;color:#92400e;font-size:14px;font-weight:700;">
                  Total Due on Visit
                </td>
                <td style="padding:12px 16px;color:#c9943d;font-size:16px;font-weight:700;text-align:right;">
                  ₱${reservationData.total_fee || 0}
                </td>
              </tr>

              <!-- Method -->
              <tr style="border-bottom:1px solid #f0f0ed;">
                <td style="padding:10px 16px;color:#6b7280;font-size:14px;">
                  Payment Method
                </td>
                <td style="padding:10px 16px;color:#1a2e3b;font-size:14px;text-align:right;">
                  ${reservationData.payment_method || "N/A"}
                </td>
              </tr>

              <!-- Reference -->
              <tr>
                <td style="padding:10px 16px;color:#6b7280;font-size:14px;">
                  Reference No.
                </td>
                <td style="padding:10px 16px;color:#1a2e3b;font-size:14px;font-family:monospace;text-align:right;">
                  ${reservationData.payment_reference || "N/A"}
                </td>
              </tr>

            </table>

            <!-- Status banner -->
            <table role="presentation" width="100%" style="background:#fffbf2;border:1px solid #e8d9b0;border-radius:10px;border-collapse:collapse;margin-bottom:16px;">
              <tr>
                <td style="padding:14px 18px;">
                  <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#92400e;text-transform:uppercase;letter-spacing:1px;">Pending verification</p>
                  <p style="margin:0;font-size:13px;color:#7a6030;line-height:1.6;">
                    Our team is reviewing your payment screenshot. You'll receive a confirmation email once your booking is approved — usually within a few hours.
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">Need to make changes? Reply to this email or contact us as soon as possible.</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="border-top:1px solid #e5e5e2;padding:16px 28px;text-align:center;background:#f7f6f2;">
            <p style="margin:0;font-size:12px;color:#aaaaaa;">Lumè Bean &amp; Bar · We look forward to serving you</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`,
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}

// ─── Walk-In Guest Email ──────────────────────────────────────────────────────

async function sendWalkInConfirmation(reservationData: any) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: reservationData.email,
      subject: `Welcome to Lumè Bean & Bar — Visit Summary`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Walk-In Visit Summary</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f0ed;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table role="presentation" width="100%" style="border-collapse:collapse;">
  <tr>
    <td style="padding:32px 16px;">
      <table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;border:1px solid #e0dfd9;overflow:hidden;border-collapse:collapse;">

        <!-- Header -->
        <tr>
          <td style="background:#1a2e3b;padding:36px 30px;text-align:center;">
            <div style="width:52px;height:52px;border-radius:50%;background:#3b82f6;margin:0 auto 16px;display:inline-flex;align-items:center;justify-content:center;">
              <span style="color:#ffffff;font-size:22px;font-weight:700;">👋</span>
            </div>
            <h1 style="margin:0 0 6px;color:#ffffff;font-size:20px;font-weight:500;">Thanks for visiting!</h1>
            <p style="margin:0;color:#9ba8b0;font-size:13px;">Here's a summary of your visit today</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 28px 20px;">
            <p style="margin:0 0 6px;color:#1a2e3b;font-size:15px;">Hi <strong>${reservationData.name}</strong>,</p>
            <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.7;">
              It was great having you at Lumè Bean &amp; Bar today. Your walk-in has been recorded and your table is confirmed. We hope you have a wonderful time!
            </p>

            <!-- Visit Details -->
            <table role="presentation" width="100%" style="background:#f7f6f2;border-radius:12px;border-collapse:collapse;margin-bottom:16px;">
              <tr>
                <td style="padding:16px 18px 8px;" colspan="2">
                  <p style="margin:0;font-size:11px;color:#aaaaaa;letter-spacing:1.5px;text-transform:uppercase;">Visit details</p>
                </td>
              </tr>
              <tr>
                <td width="50%" style="padding:6px 18px 14px;vertical-align:top;">
                  <p style="margin:0 0 3px;font-size:11px;color:#9ca3af;">Reference no.</p>
                  <p style="margin:0;font-size:14px;font-weight:700;color:#3b82f6;letter-spacing:0.5px;">${reservationData.reservation_number}</p>
                </td>
                <td width="50%" style="padding:6px 18px 14px;vertical-align:top;">
                  <p style="margin:0 0 3px;font-size:11px;color:#9ca3af;">Type</p>
                  <p style="margin:0;font-size:14px;color:#1a2e3b;">Walk-in</p>
                </td>
              </tr>
              <tr>
                <td width="50%" style="padding:6px 18px 14px;vertical-align:top;">
                  <p style="margin:0 0 3px;font-size:11px;color:#9ca3af;">Date</p>
                  <p style="margin:0;font-size:14px;color:#1a2e3b;">${new Date(reservationData.date).toDateString()}</p>
                </td>
                <td width="50%" style="padding:6px 18px 14px;vertical-align:top;">
                  <p style="margin:0 0 3px;font-size:11px;color:#9ca3af;">Arrived</p>
                  <p style="margin:0;font-size:14px;color:#1a2e3b;">${reservationData.time}</p>
                </td>
              </tr>
              <tr>
                <td width="50%" style="padding:6px 18px 18px;vertical-align:top;">
                  <p style="margin:0 0 3px;font-size:11px;color:#9ca3af;">Guests</p>
                  <p style="margin:0;font-size:14px;color:#1a2e3b;">${reservationData.guests} persons</p>
                </td>
                <td width="50%" style="padding:6px 18px 18px;vertical-align:top;">
                  <p style="margin:0 0 3px;font-size:11px;color:#9ca3af;">Table / Area</p>
                  <p style="margin:0;font-size:14px;color:#1a2e3b;">${reservationData.dining_preference || "N/A"}</p>
                </td>
              </tr>
            </table>

            ${Number(reservationData.total_fee) > 0 ? `
            <!-- Payment summary -->
            <table role="presentation" width="100%" style="border:1px solid #e5e5e2;border-radius:12px;border-collapse:collapse;margin-bottom:16px;overflow:hidden;">
              <tr>
                <td style="padding:11px 16px 3px 16px;" colspan="2">
                  <p style="margin:0;font-size:11px;color:#aaaaaa;letter-spacing:1.5px;text-transform:uppercase;">Payment</p>
                </td>
              </tr>
              ${reservationData.payment_method ? `
              <tr style="border-bottom:1px solid #f0f0ed;">
                <td style="padding:8px 16px;color:#6b7280;font-size:14px;">Method</td>
                <td style="padding:8px 16px;color:#1a2e3b;font-size:14px;text-align:right;">${reservationData.payment_method}</td>
              </tr>` : ""}
              ${reservationData.payment_reference ? `
              <tr style="border-bottom:1px solid #f0f0ed;">
                <td style="padding:8px 16px;color:#6b7280;font-size:14px;">Reference</td>
                <td style="padding:8px 16px;color:#1a2e3b;font-size:14px;font-family:monospace;text-align:right;">${reservationData.payment_reference}</td>
              </tr>` : ""}
              <tr>
                <td style="padding:8px 16px 12px;color:#6b7280;font-size:14px;font-weight:600;">Total</td>
                <td style="padding:8px 16px 12px;color:#c9943d;font-size:15px;font-weight:700;text-align:right;">₱${reservationData.total_fee || 0}</td>
              </tr>
            </table>` : ""}

            <!-- Come back banner -->
            <table role="presentation" width="100%" style="background:#1a2e3b;border-radius:10px;border-collapse:collapse;margin-bottom:16px;">
              <tr>
                <td style="padding:16px 18px;text-align:center;">
                  <p style="margin:0 0 4px;color:#c9943d;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">See you again soon</p>
                  <p style="margin:0;font-size:13px;color:#9ba8b0;line-height:1.6;">
                    For future visits, book ahead online to secure your preferred table and time slot.
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">Questions or concerns? Reply to this email and we'll be happy to help.</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="border-top:1px solid #e5e5e2;padding:16px 28px;text-align:center;background:#f7f6f2;">
            <p style="margin:0;font-size:12px;color:#aaaaaa;">Lumè Bean &amp; Bar · Thank you for dining with us</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`,
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}

// ─── Route Handlers ───────────────────────────────────────────────────────────

export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured")

    const response = await fetch(`${apiUrl}/api/reservations`, {
      method: "GET",
      headers: { Accept: "application/json" },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to fetch reservations", data },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch reservations",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured")

    const contentType = request.headers.get("content-type") || ""

    let formData: FormData | null = null
    let jsonBody: any = null
    let reservationData: any = {}

    if (contentType.includes("multipart/form-data")) {
      formData = await request.formData()

      for (const [key, value] of formData.entries()) {
        if (!(value instanceof File)) {
          reservationData[key] = value
        }
      }
    } else {
      jsonBody = await request.json()
      reservationData = jsonBody
    }

    const response = await fetch(`${apiUrl}/api/reservations`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(formData ? {} : { "Content-Type": "application/json" }),
      },
      body: formData || JSON.stringify(jsonBody),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Laravel Error:", data)
      throw new Error(data.message || "Failed to create reservation")
    }

    // ✅ USE DATABASE RESPONSE VALUES FIRST
    const savedReservation = data?.data || {}

    // ✅ Proper numeric conversion
    const reservationFee = Number(
      savedReservation.reservation_fee ??
      reservationData.reservation_fee ??
      0
    )

    const remainingBalance = Number(
      savedReservation.remaining_balance ??
      reservationData.remaining_balance ??
      0
    )

    const serviceCharge = Number(
      savedReservation.service_charge ??
      reservationData.service_charge ??
      0
    )

    // ✅ Total Bill = Remaining Balance + Service Charge
    const totalFee = remainingBalance + serviceCharge

    const enrichedData = {
      ...reservationData,
      ...savedReservation,

      reservation_number:
        savedReservation.reservation_number || "N/A",

      reservation_fee: reservationFee,
      remaining_balance: remainingBalance,
      service_charge: serviceCharge,
      total_fee: totalFee,
    }

    const isWalkIn =
      enrichedData.is_walkin === "1" ||
      enrichedData.is_walkin === true

    const hasEmail = !!enrichedData.email?.trim()

    const emailPromises: Promise<boolean>[] = [
      sendAdminNotification(enrichedData),
    ]

    if (hasEmail) {
      emailPromises.push(
        isWalkIn
          ? sendWalkInConfirmation(enrichedData)
          : sendCustomerConfirmation(enrichedData)
      )
    }

    const [adminEmailSent, customerEmailSent = false] =
      await Promise.all(emailPromises)

    return NextResponse.json(
      {
        ...data,
        emailStatus: {
          admin: adminEmailSent,
          customer: customerEmailSent,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("❌ POST Reservation Error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create reservation",
        message:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    )
  }
}