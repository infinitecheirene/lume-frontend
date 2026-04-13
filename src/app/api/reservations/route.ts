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
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #162a3a; color: #e5a834; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #162a3a; }
            .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .info-row:last-child { border-bottom: none; }
            .info-label { font-weight: bold; color: #6b7280; min-width: 150px; }
            .info-value { color: #111827; }
            .special-requests { background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #10b981; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
            .status-badge { display: inline-block; padding: 6px 12px; background: #dbeafe; color: #1e40af; border-radius: 20px; font-size: 14px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Reservation Alert!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">You have a Reservation!</p>
            </div>
            
            <div class="content">
              <div class="info-box">
                <h2 style="margin-top: 0; color: #162a3a;">Customer Details</h2>
                <div class="info-row">
                  <span class="info-label">Name:</span>
                  <span class="info-value">${reservationData.name}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Email:</span>
                  <span class="info-value">${reservationData.email}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Phone:</span>
                  <span class="info-value">${reservationData.phone}</span>
                </div>
              </div>

              <div class="info-box">
                <h2 style="margin-top: 0; color: #162a3a;"> Reservation Details</h2>
                <div class="info-row">
                  <span class="info-label">Date:</span>
                  <span class="info-value">${new Date(reservationData.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Time:</span>
                  <span class="info-value">${reservationData.time}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Number of Guests:</span>
                  <span class="info-value">${reservationData.guests} ${reservationData.guests === "1" ? "Guest" : "Guests"}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Dining Preference:</span>
                  <span class="info-value">${reservationData.dining_preference || "Main Dining"}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Occasion:</span>
                  <span class="info-value">${reservationData.occasion || "Casual Dinner"}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Package:</span>
                  <span class="info-value">${reservationData.package || "Custom"}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Reservation Fee:</span>
                  <span class="info-value">₱${reservationData.reservation_fee || "0"}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Payment Method:</span>
                  <span class="info-value">${reservationData.payment_method || "Not provided"}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Reference:</span>
                  <span class="info-value">${reservationData.payment_reference || "N/A"}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Receipt:</span>
                  <span class="info-value">${reservationData.payment_receipt || "N/A"}</span>
                </div>
              </div>

              ${reservationData.special_requests ? `
              <div class="special-requests">
                <h3 style="margin-top: 0; color: #059669;">💬 Special Requests</h3>
                <p style="margin: 0;">${reservationData.special_requests}</p>
              </div>
              ` : ''}

              <div class="footer">
                <p>This is an automated notification from Lumè Bean and Bar Reservation System</p>
                <p style="margin: 5px 0;">Questions? Reply to this email or contact your support team</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("✅ Admin notification email sent:", info.messageId)
    return true
  } catch (error) {
    console.error("❌ Error sending admin notification email:", error)
    return false
  }
}

// Function to send customer confirmation email
async function sendCustomerConfirmation(reservationData: any) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: reservationData.email,
      subject: `Reservation Confirmation - ${reservationData.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #162a3a; color: #e5a834; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #162a3a; }
            .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .info-row:last-child { border-bottom: none; }
            .info-label { font-weight: bold; color: #6b7280; min-width: 120px; }
            .info-value { color: #111827; }
            .alert-box { background: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #3b82f6; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✨ Thank You for Your Reservation!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">We've received your booking request</p>
            </div>
            
            <div class="content">
              <p style="font-size: 16px;">Dear <strong>${reservationData.name}</strong>,</p>
              
              <p>Thank you for choosing Lumè Bean and Bar! We're excited to host you and your guests.</p>

              <div class="info-box">
                <h2 style="margin-top: 0; color: #162a3a;">📋 Your Reservation Details</h2>
                <div class="info-row">
                  <span class="info-label">Reservation #:</span>
                  <span class="info-value">${reservationData.reservation_number || "N/A"}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Date:</span>
                  <span class="info-value">${new Date(reservationData.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Time:</span>
                  <span class="info-value">${reservationData.time}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Guests:</span>
                  <span class="info-value">${reservationData.guests} ${reservationData.guests === "1" ? "Guest" : "Guests"}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Dining Preference:</span>
                  <span class="info-value">${reservationData.dining_preference || "Main Dining"}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Occasion:</span>
                  <span class="info-value">${reservationData.occasion || "Casual Dinner"}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Reservation Fee:</span>
                  <span class="info-value">₦${reservationData.reservation_fee || "0"}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Payment Method:</span>
                  <span class="info-value">${reservationData.payment_method || "Not provided"}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Reference:</span>
                  <span class="info-value">${reservationData.payment_reference || "N/A"}</span>
                </div>
              </div>

              <div class="alert-box">
                <h3 style="margin-top: 0; color: #162a3a;">✅ Reservation Confirmed</h3>
                <p style="margin: 0;">Your reservation has been successfully submitted! Our team will review it and send you a confirmation shortly.</p>
              </div>

              ${reservationData.special_requests ? `
              <div class="info-box" style="border-left-color: #3b82f6;">
                <h3 style="margin-top: 0; color: #2563eb;">💬 Your Special Requests</h3>
                <p style="margin: 0;">${reservationData.special_requests}</p>
              </div>
              ` : ''}

              <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #059669;">What's Next?</h3>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>You'll receive a confirmation email from our team shortly</li>
                  <li>We recommend arriving 10-15 minutes before your reservation time</li>
                  <li>If you need to make changes, please contact us as soon as possible</li>
                </ul>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #6b7280;">Need to make changes or have questions?</p>
                <h4 style="margin: 5px 0;">Contact us:</h4>
                <p style="margin: 5px 0;">+234 810 123 4567</p>
                <p style="margin: 5px 0;"><a href="mailto:info@lumèbeanandbar.com">info@lumèbeanandbar.com</a></p>
              </div>

              <div class="footer">
                <p>We look forward to serving you!</p>
                <p style="margin: 5px 0;"><strong>Lumè Bean and Bar</strong></p>
                <p style="margin: 5px 0; font-size: 12px;">This is an automated confirmation email</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("✅ Customer confirmation email sent:", info.messageId)
    return true
  } catch (error) {
    console.error("❌ Error sending customer confirmation email:", error)
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiUrl) {
      throw new Error("NEXT_PUBLIC_API_URL is not configured")
    }

    const authHeader = request.headers.get("authorization")
    console.log("GET Reservations - Auth Header:", authHeader ? "Present" : "Missing")

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    }

    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    const url = `${apiUrl}/api/reservations`
    console.log("Fetching from:", url)

    const response = await fetch(url, {
      method: "GET",
      headers,
    })

    console.log("Laravel Response Status:", response.status)

    const responseText = await response.text()
    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error("Failed to parse response:", responseText)
      throw new Error("Invalid JSON response from server")
    }

    if (!response.ok) {
      console.error("Laravel Error:", data)
      return NextResponse.json(
        { error: data.message || "Failed to fetch reservations", data: data },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Reservations GET API Error:", error)
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
    const authHeader = request.headers.get("authorization")

    console.log("=== POST Reservation to Laravel ===")
    console.log("Auth Header:", authHeader ? "Present" : "Missing")

    const contentType = request.headers.get("content-type") || ""

    let formData: FormData | null = null
    let jsonBody: any = null
    let reservationData: any = {}

    if (contentType.includes("multipart/form-data")) {
      console.log("Processing as FormData (with file upload)")
      formData = await request.formData()

      for (const [key, value] of formData.entries()) {
        if (!(value instanceof File)) {
          reservationData[key] = value
        }
      }

      const logData: any = {}
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          logData[key] = `File: ${value.name} (${value.size} bytes)`
        } else {
          logData[key] = value
        }
      }
      console.log("FormData contents:", logData)
    } else {
      console.log("Processing as JSON")
      jsonBody = await request.json()
      reservationData = jsonBody
      console.log("Reservation Data:", jsonBody)
    }

    // Log date information for debugging
    console.log("📅 Date Information:")
    console.log("  - Raw date value:", reservationData.date)
    console.log("  - Parsed date:", new Date(reservationData.date))
    console.log("  - Formatted date:", new Date(reservationData.date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    }))

    const headers: Record<string, string> = {
      Accept: "application/json",
    }

    if (authHeader) {
      headers["Authorization"] = authHeader
      console.log("Authorization header forwarded to Laravel")
    } else {
      console.warn("⚠️ No authorization header - reservation will be created as guest")
    }

    if (!formData) {
      headers["Content-Type"] = "application/json"
    }

    console.log("Sending to:", `${apiUrl}/api/reservations`)

    const response = await fetch(`${apiUrl}/api/reservations`, {
      method: "POST",
      headers,
      body: formData || JSON.stringify(jsonBody),
    })

    console.log("Laravel Response Status:", response.status)

    const responseText = await response.text()
    console.log("Laravel Response Text:", responseText)

    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error("Failed to parse response as JSON:", responseText)
      throw new Error("Invalid response from server")
    }

    if (!response.ok) {
      console.error("Laravel Error Response:", data)
      throw new Error(data.message || "Failed to create reservation")
    }

    console.log("✅ Success Response:", data)

    console.log("📧 Sending email notifications...")

    // Attach reservation number from Laravel response
    const reservationNumber = data?.data?.reservation_number || "N/A"

    const enrichedData = {
      ...reservationData,
      reservation_number: reservationNumber,
    }

    const [adminEmailSent, customerEmailSent] = await Promise.all([
      sendAdminNotification(enrichedData),
      sendCustomerConfirmation(enrichedData),
    ])

    console.log("Email notification results:", {
      adminEmail: adminEmailSent ? "✅ Sent" : "❌ Failed",
      customerEmail: customerEmailSent ? "✅ Sent" : "❌ Failed",
    })

    const responseBody = {
      ...data,
      emailStatus: {
        admin: adminEmailSent,
        customer: customerEmailSent,
      },
    }

    return NextResponse.json(responseBody, { status: 201 })
  } catch (error) {
    console.error("❌ Reservation POST API Error:", error)

    if (error instanceof SyntaxError) {
      console.error("JSON Parse Error - likely invalid request body format")
    }

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
