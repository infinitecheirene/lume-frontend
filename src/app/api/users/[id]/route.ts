import { type NextRequest, NextResponse } from "next/server"

// Helper to get auth token
function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  const cookieToken = request.cookies.get("auth_token")?.value
  return authHeader?.replace("Bearer ", "") || cookieToken || null
}

export async function PUT(request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
  try {
    // Access params inside the function
    const resolvedParams = await params
    const { id } = resolvedParams

    const token = getAuthToken(request)

    if (!token) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    const url = `${baseUrl}/api/users/${id}`

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ success: false, message: `Backend returned ${response.status}`, details: errorText }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Error in PUT /api/users/[id]:", error)
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    const url = `${baseUrl}/api/users/${id}`

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ success: false, message: `Backend returned ${response.status}`, details: errorText }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Error in DELETE /api/users/[id]:", error)
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Internal server error" }, { status: 500 })
  }
}
