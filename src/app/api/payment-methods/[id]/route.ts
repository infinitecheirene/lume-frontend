import { type NextRequest, NextResponse } from "next/server"

const LARAVEL_API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  const cookieToken = request.cookies.get("auth_token")?.value
  return authHeader?.replace("Bearer ", "") || cookieToken || null
}

/* ================= PUT (UPDATE PAYMENT METHOD) ================= */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authToken = getAuthToken(request)

    if (!authToken) {
      return NextResponse.json({ success: false, message: "Authorization token required" }, { status: 401 })
    }

    const { id } = await params

    const formData = await request.formData()

    const response = await fetch(`${LARAVEL_API_BASE}/api/payment-methods/${id}`, {
      method: "PUT", // Laravel override style
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
        "X-HTTP-Method-Override": "PUT",
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
          message: data?.message || "Failed to update payment method",
          error: data,
        },
        { status: response.status },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Payment method updated successfully",
      data,
    })
  } catch (error) {
    console.error("[API] Payment PUT Error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}

/* ================= DELETE PAYMENT METHOD ================= */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authToken = getAuthToken(request)

    if (!authToken) {
      return NextResponse.json({ success: false, message: "Authorization token required" }, { status: 401 })
    }

    const { id } = await params

    const response = await fetch(`${LARAVEL_API_BASE}/api/payment-methods/${id}`, {
      method: "DELETE",
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
          message: data.message || "Failed to delete payment method",
        },
        { status: response.status },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Payment method deleted successfully",
    })
  } catch (error) {
    console.error("[API] Payment DELETE Error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
