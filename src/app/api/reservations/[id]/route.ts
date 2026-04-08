import { type NextRequest, NextResponse } from "next/server"

// GET single reservation by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    const authHeader = request.headers.get("authorization")

    console.log(`GET Reservation ID: ${params.id}`)

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    }

    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    const response = await fetch(`${apiUrl}/api/reservations/${params.id}`, {
      method: "GET",
      headers,
    })

    console.log("Laravel Response Status:", response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Laravel Error:", errorData)
      throw new Error(`Failed to fetch reservation: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Reservation GET by ID API Error:", error)
    return NextResponse.json({ error: "Failed to fetch reservation" }, { status: 500 })
  }
}

// UPDATE reservation by ID
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiUrl) throw new Error("NEXT_PUBLIC_API_URL is not defined")

    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          message: "No authorization token provided",
        },
        { status: 401 },
      )
    }

    const formData = await request.formData()

    formData.append("_method", "PUT")

    const response = await fetch(`${apiUrl}/api/reservations/${id}`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
      body: formData,
    })

    const responseText = await response.text()

    let data: any
    try {
      data = JSON.parse(responseText)
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid response from server",
          message: responseText,
        },
        { status: 502 },
      )
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || "Failed to update reservation",
          message: data.message || "Unknown error",
        },
        { status: response.status },
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Reservation PUT API Error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update reservation",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// DELETE reservation by ID
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    const authHeader = request.headers.get("authorization")

    console.log("=== DELETE Reservation from Laravel ===")
    console.log("Reservation ID:", params.id)
    console.log("Auth Header:", authHeader ? "Present" : "Missing")

    if (!authHeader) {
      console.error("⚠️ No authorization header provided!")
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          message: "No authorization token provided",
        },
        { status: 401 },
      )
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authHeader,
    }

    const response = await fetch(`${apiUrl}/api/reservations/${params.id}`, {
      method: "DELETE",
      headers,
    })

    console.log("Laravel Response Status:", response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Laravel Error Response:", errorData)

      return NextResponse.json(
        {
          success: false,
          error: errorData.error || "Failed to delete reservation",
          message: errorData.message || "Unknown error",
        },
        { status: response.status },
      )
    }

    const data = await response.json().catch(() => ({
      success: true,
      message: "Reservation deleted successfully",
    }))

    console.log("✅ Delete Success:", data)

    return NextResponse.json(data)
  } catch (error) {
    console.error("❌ Reservation DELETE API Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete reservation",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
