import { type NextRequest, NextResponse } from "next/server"

const apiUrl = process.env.NEXT_PUBLIC_API_URL

if (!apiUrl) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined")
}

// GET single reservation by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const authHeader = request.headers.get("authorization")

    const headers: Record<string, string> = {
      Accept: "application/json",
    }

    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    const response = await fetch(`${apiUrl}/api/reservations/${id}`, {
      method: "GET",
      headers,
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data?.message || "Failed to fetch reservation",
        },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch reservation",
      },
      { status: 500 }
    )
  }
}

// UPDATE reservation by ID
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    const authHeader = request.headers.get("authorization")

    const formData = await request.formData()
    formData.append("_method", "PUT")

    const headers: Record<string, string> = {
      Accept: "application/json",
    }

    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    const response = await fetch(`${apiUrl}/api/reservations/${id}`, {
      method: "POST",
      headers,
      body: formData,
    })

    const text = await response.text()

    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid server response" },
        { status: 502 }
      )
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data?.message || "Failed to update reservation",
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update reservation",
      },
      { status: 500 }
    )
  }
}

// DELETE reservation by ID
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const authHeader = request.headers.get("authorization")

    const headers: Record<string, string> = {
      Accept: "application/json",
    }

    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    const response = await fetch(`${apiUrl}/api/reservations/${id}`, {
      method: "DELETE",
      headers,
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data?.message || "Failed to delete reservation",
        },
        { status: response.status }
      )
    }

    return NextResponse.json(
      data || { success: true, message: "Reservation deleted successfully" }
    )
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete reservation",
      },
      { status: 500 }
    )
  }
}