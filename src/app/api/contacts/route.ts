import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("=== Contact API POST called ===")

    const body = await request.json()
    console.log("Request body:", body)

    // Validate required fields
    if (!body.name || !body.email || !body.message) {
      console.warn("Validation failed:", body)
      return NextResponse.json(
        {
          success: false,
          message: "Name, email, and message are required fields.",
          errors: {
            name: !body.name ? ["Name is required"] : [],
            email: !body.email ? ["Email is required"] : [],
            message: !body.message ? ["Message is required"] : [],
          },
        },
        { status: 400 },
      )
    }

    console.log("Sending request to Laravel backend...")

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: body.name,
        email: body.email,
        phone: body.phone || "",
        subject: body.subject || "",
        message: body.message,
      }),
    })

    const data = await response.json()
    console.log("Laravel response:", data, "Status:", response.status)

    if (!response.ok) {
      console.error("Laravel API returned an error:", data)
      return NextResponse.json(data, { status: response.status })
    }

    console.log("Message sent successfully")
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Contact API Error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Failed to send message. Please try again later.",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiUrl) throw new Error("NEXT_PUBLIC_API_URL is not defined")

    const backendUrl = `${apiUrl}/api/contacts`

    const response = await fetch(backendUrl, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    })

    if (!response.ok) throw new Error(`Backend returned ${response.status}`)

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Contacts GET Error:", error)
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 })
  }
}