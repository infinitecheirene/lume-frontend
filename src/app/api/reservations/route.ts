import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// Function to send admin notification email
async function sendAdminNotification(reservationData: any) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: process.env.ADMIN_EMAIL,
      subject: `🍽️ New Reservation - ${reservationData.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background:#0b1d26; margin:0; padding:0; }
            .container { max-width:600px; margin:auto; padding:20px; }
            .card { background:#162a3a; border-radius:16px; overflow:hidden; color:white; }
            .header { padding:25px; background:linear-gradient(135deg,#d4a24c,#b8862b); color:#111; text-align:center; }
            .header h1 { margin:0; font-size:22px; }
            .content { padding:20px; background:#0f2230; }

            .section { background:#132b3a; margin-bottom:15px; padding:15px; border-radius:12px; border:1px solid rgba(255,255,255,0.08); }
            .title { font-size:12px; text-transform:uppercase; letter-spacing:2px; color:#d4a24c; margin-bottom:10px; }

            .row { display:flex; justify-content:space-between; padding:6px 0; font-size:14px; }
            .label { color:#9ca3af; }
            .value { color:#fff; font-weight:500; }

            .highlight { color:#d4a24c; font-weight:bold; }

            .footer { text-align:center; font-size:12px; color:#9ca3af; padding:15px; }
          </style>
        </head>

        <body>
        <div class="container">
          <div class="card">

            <div class="header">
              <h1>New Reservation Received</h1>
              <p style="margin:5px 0 0;">A customer has booked a table</p>
            </div>

            <div class="content">

              <div class="section">
                <div class="title">Customer Details</div>
                <div class="row"><span class="label">Name</span><span class="value">${reservationData.name}</span></div>
                <div class="row"><span class="label">Email</span><span class="value">${reservationData.email}</span></div>
                <div class="row"><span class="label">Phone</span><span class="value">${reservationData.phone}</span></div>
              </div>

              <div class="section">
                <div class="title">Reservation Details</div>
                <div class="row"><span class="label">Date</span><span class="value">${new Date(reservationData.date).toDateString()}</span></div>
                <div class="row"><span class="label">Time</span><span class="value">${reservationData.time}</span></div>
                <div class="row"><span class="label">Guests</span><span class="value">${reservationData.guests}</span></div>
                <div class="row"><span class="label">Dining</span><span class="value">${reservationData.dining_preference}</span></div>
                <div class="row"><span class="label">Occasion</span><span class="value">${reservationData.occasion || "N/A"}</span></div>
                <div class="row"><span class="label">Package</span><span class="value">${reservationData.package || "Custom"}</span></div>
              </div>

              <div class="section">
                <div class="title">Payment</div>
                <div class="row"><span class="label">Fee</span><span class="value">₱${reservationData.reservation_fee}</span></div>
                <div class="row"><span class="label">Service Charge</span><span class="value">₱${Number(reservationData.service_charge).toFixed(2)}</span></div>
                <div class="row"><span class="label highlight">Total</span><span class="value highlight">₱${Number(reservationData.total_bill).toFixed(2)}</span></div>
                <div class="row"><span class="label">Method</span><span class="value">${reservationData.payment_method || "N/A"}</span></div>
                <div class="row"><span class="label">Reference</span><span class="value">${reservationData.payment_reference || "N/A"}</span></div>
              </div>

              ${reservationData.special_requests ? `
              <div class="section">
                <div class="title">Special Requests</div>
                <div class="value">${reservationData.special_requests}</div>
              </div>` : ""}

            </div>

            <div class="footer">
              Lumè Bean & Bar • Reservation System
            </div>

          </div>
        </div>
        </body>
        </html>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}

// Function to send customer confirmation email
async function sendCustomerConfirmation(reservationData: any) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: reservationData.email,
      subject: `Reservation Confirmed - Lumè Bean & Bar`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial; background:#0b1d26; margin:0; padding:0; }
            .container { max-width:600px; margin:auto; padding:20px; }

            .card { background:#162a3a; border-radius:16px; overflow:hidden; color:white; }

            .header {
              background:linear-gradient(135deg,#d4a24c,#b8862b);
              padding:30px;
              text-align:center;
              color:#111;
            }

            .header h1 { margin:0; font-size:22px; }

            .content { padding:20px; background:#0f2230; }

            .box {
              background:#132b3a;
              padding:15px;
              border-radius:12px;
              margin-bottom:15px;
              border:1px solid rgba(255,255,255,0.08);
            }

            .row { display:flex; justify-content:space-between; padding:6px 0; font-size:14px; }
            .label { color:#9ca3af; }
            .value { color:#fff; }

            .cta {
              background:#d4a24c;
              color:#111;
              text-align:center;
              padding:12px;
              border-radius:12px;
              font-weight:bold;
              margin-top:10px;
            }

            .note {
              background: rgba(255,255,255,0.06);
              border: 1px solid rgba(255,255,255,0.1);
              padding: 12px;
              border-radius: 12px;
              font-size: 13px;
              color: #d1d5db;
              margin-top: 15px;
              line-height: 1.4;
            }

            .footer {
              text-align:center;
              color:#9ca3af;
              font-size:12px;
              margin-top:20px;
            }
          </style>
        </head>

        <body>
        <div class="container">
          <div class="card">

            <div class="header">
              <h1>Your Reservation is Confirmed ✨</h1>
              <p style="margin:5px 0 0;">We can't wait to welcome you</p>
            </div>

            <div class="content">

              <p style="color:#fff;">Hi <b>${reservationData.name}</b>,</p>
              <p style="color:#9ca3af;">
                Thank you for choosing Lumè Bean & Bar. Your reservation has been received successfully.
              </p>

              <div class="box">
                <div class="row">
                  <span class="label">Reservation #</span>
                  <span class="value">${reservationData.reservation_number}</span>
                </div>
                <div class="row">
                  <span class="label">Date</span>
                  <span class="value">${new Date(reservationData.date).toDateString()}</span>
                </div>
                <div class="row">
                  <span class="label">Time</span>
                  <span class="value">${reservationData.time}</span>
                </div>
                <div class="row">
                  <span class="label">Guests</span>
                  <span class="value">${reservationData.guests}</span>
                </div>
              </div>

              <div class="box">
                <div class="row">
                  <span class="label">Total Bill</span>
                  <span class="value">₱${Number(reservationData.total_bill).toFixed(2)}</span>
                </div>
                <div class="row">
                  <span class="label">Payment Method</span>
                  <span class="value">${reservationData.payment_method || "N/A"}</span>
                </div>
              </div>

              <!-- ✅ NEW LOGIN NOTE -->
              <div class="note">
                <strong style="color:#fff;">Check your reservation status</strong><br/>
                Please log in to your account to track your reservation updates.  
                If you don’t have an account yet, please sign up to access your booking history.
              </div>

              <div class="cta">
                Please arrive 10–15 minutes before your reservation time
              </div>

              <p style="margin-top:15px; color:#9ca3af; font-size:13px;">
                If you need to modify your booking, please contact us as soon as possible.
              </p>

            </div>

            <div class="footer">
              Lumè Bean & Bar • We look forward to serving you
            </div>

          </div>
        </div>
        </body>
        </html>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}

export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured")

    const response = await fetch(`${apiUrl}/api/reservations`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data.message || "Failed to fetch reservations",
          data,
        },
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

    console.log("=== POST Reservation (No Auth Mode) ===")

    const contentType = request.headers.get("content-type") || ""

    let formData: FormData | null = null
    let jsonBody: any = null
    let reservationData: any = {}

    // Handle FormData (file upload)
    if (contentType.includes("multipart/form-data")) {
      formData = await request.formData()

      for (const [key, value] of formData.entries()) {
        if (!(value instanceof File)) {
          reservationData[key] = value
        }
      }
    }
    // Handle JSON
    else {
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

    console.log("✅ Reservation created successfully")

    // Attach reservation number for emails
    const reservationNumber = data?.data?.reservation_number || "N/A"

    const enrichedData = {
      ...reservationData,
      reservation_number: reservationNumber,
    }

    console.log("📧 Sending emails...")

    const [adminEmailSent, customerEmailSent] = await Promise.all([
      sendAdminNotification(enrichedData),
      sendCustomerConfirmation(enrichedData),
    ])

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
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

