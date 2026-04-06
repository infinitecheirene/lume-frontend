import { type NextRequest, NextResponse } from "next/server"

const LARAVEL_API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  const cookieToken = request.cookies.get("auth_token")?.value
  return authHeader?.replace("Bearer ", "") || cookieToken || null
}

export async function GET(request: NextRequest) {
  try {
    const authToken = request.headers.get("Authorization")

    if (!authToken) {
      return NextResponse.json({ success: false, message: "Authorization token required" }, { status: 401 })
    }

    const url = new URL(request.url)

    // 🔥 DETECT STATISTICS REQUEST
    if (url.pathname.endsWith("/statistics")) {
      const response = await fetch(`${LARAVEL_API_BASE}/api/orders/statistics`, {
        method: "GET",
        headers: {
          Authorization: authToken,
          Accept: "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        return NextResponse.json({ success: false, message: data.message || "Failed to fetch statistics" }, { status: response.status })
      }

      return NextResponse.json(data, { status: 200 })
    }

    // 🔹 NORMAL ORDERS FETCH
    const laravelUrl = new URL(`${LARAVEL_API_BASE}/api/orders`)
    url.searchParams.forEach((value, key) => {
      laravelUrl.searchParams.append(key, value)
    })

    const response = await fetch(laravelUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: authToken,
        Accept: "application/json",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ success: false, message: data.message || "Failed to fetch orders" }, { status: response.status })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[API] Error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken(request)

    console.log("=== CREATE ORDER DEBUG ===")
    console.log("Request Body:", body)
    console.log("API URL:", apiUrl)

    if (!apiUrl) {
      throw new Error("NEXT_PUBLIC_API_URL is not defined")
    }

    const fullUrl = `${apiUrl}/api/orders`
    console.log("Laravel URL:", fullUrl)

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    console.log("Laravel Status:", response.status)

    const rawText = await response.text()
    console.log("Laravel Raw Response:", rawText)

    let data: any = null
    try {
      data = rawText ? JSON.parse(rawText) : null
    } catch (err) {
      console.log("Laravel response is not JSON")
    }

    if (!response.ok) {
      return Response.json(
        {
          success: false,
          message: "Failed to create order",
          status: response.status,
          error: data || rawText,
        },
        { status: response.status },
      )
    }

    return Response.json(
      {
        success: true,
        message: "Order created successfully",
        data: data,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create Order Error:", error)

    return Response.json(
      {
        success: false,
        message: "Server error while creating order",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest
) {
  try {
    const authToken = getAuthToken(request)
    if (!authToken) {
      return NextResponse.json(
        { success: false, message: "Authorization token required" },
        { status: 401 }
      )
    }

    // Parse request body
    let body: { ids?: string[] }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "Array of order IDs is required" },
        { status: 400 }
      )
    }

    console.log("Bulk deleting orders:", body.ids)

    // Call Laravel API for each ID (can also optimize with batch API if supported)
    const results = await Promise.all(
      body.ids.map(async (id) => {
        const res = await fetch(`${LARAVEL_API_BASE}/api/orders/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Admin-Request": "true",
            Authorization: `Bearer ${authToken}`,
          },
        })

        const text = await res.text()
        let data: any
        try {
          data = text ? JSON.parse(text) : {}
        } catch {
          data = { message: text || "Failed to delete order" }
        }

        return { id, status: res.status, ok: res.ok, data }
      })
    )

    // Log summary
    const failed = results.filter(r => !r.ok)
    console.log("Bulk delete results:", results)

    if (failed.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Some orders failed to delete",
          failed,
        },
        { status: 207 } // 207 Multi-Status
      )
    }

    return NextResponse.json({ success: true, message: "All orders deleted", results })
  } catch (error: any) {
    console.error("Bulk DELETE /api/orders error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}