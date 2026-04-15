import { NextRequest, NextResponse } from "next/server"

// Helper to get auth token
function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  const cookieToken = request.cookies.get("auth_token")?.value
  return authHeader?.replace("Bearer ", "") || cookieToken || null
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log("PUT request received for testimonial update")
    console.log("Raw params:", params)

    const resolvedParams = await params
    const { id } = resolvedParams
    console.log("Resolved testimonial ID:", id)

    const token = getAuthToken(request)
    console.log("Auth token:", token ? "Present" : "Missing")
    if (!token) {
      console.warn("Unauthorized request – missing token")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Request body:", body)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiUrl) {
      console.error("NEXT_PUBLIC_API_URL is not defined")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    console.log(`Forwarding PUT request to backend: ${apiUrl}/api/testimonials/${id}`)

    const response = await fetch(`${apiUrl}/api/testimonials/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    console.log("Backend response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Backend returned error:", errorText)
      throw new Error(`Backend returned ${response.status}`)
    }

    const data = await response.json()
    console.log("Update successful, backend returned:", data)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Testimonials PUT Error:", error)
    return NextResponse.json({ error: "Failed to update testimonial" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiUrl) throw new Error("NEXT_PUBLIC_API_URL is not defined")

    const response = await fetch(`${apiUrl}/api/testimonials/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    })

    if (!response.ok) throw new Error(`Backend returned ${response.status}`)

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Testimonials DELETE Error:", error)
    return NextResponse.json({ error: "Failed to delete testimonial" }, { status: 500 })
  }
}
