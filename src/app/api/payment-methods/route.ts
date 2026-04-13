import { type NextRequest, NextResponse } from "next/server"

const LARAVEL_API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  const cookieToken = request.cookies.get("auth_token")?.value
  return authHeader?.replace("Bearer ", "") || cookieToken || null
}

/* ================= GET PAYMENT METHODS ================= */
export async function GET(request: NextRequest) {
  try {
    const authToken = getAuthToken(request)

    if (!authToken) {
      return NextResponse.json({ success: false, message: "Authorization token required" }, { status: 401 })
    }

    const response = await fetch(`${LARAVEL_API_BASE}/api/payment-methods`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || "Failed to fetch payment methods",
        },
        { status: response.status },
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[API] Payment GET Error:", error)

    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

/* ================= CREATE PAYMENT METHOD ================= */
export async function POST(request: NextRequest) {
  try {
    const authToken = getAuthToken(request)

    if (!authToken) {
      return NextResponse.json({ success: false, message: "Authorization token required" }, { status: 401 })
    }

    const formData = await request.formData()

    const response = await fetch(`${LARAVEL_API_BASE}/api/payment-methods`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
      body: formData,
    })

    const rawText = await response.text()

    let data: any = null
    try {
      data = rawText ? JSON.parse(rawText) : null
    } catch {
      data = { message: rawText }
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Failed to create payment method",
          error: data,
        },
        { status: response.status },
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Payment method created successfully",
        data,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[API] Payment POST Error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
