import { type NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Helper to get auth token
function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  const cookieToken = request.cookies.get("auth_token")?.value
  return authHeader?.replace("Bearer ", "") || cookieToken || null
} 

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams

    const token = getAuthToken(request)
    console.log("Auth token:", token ? "Present" : "Missing")
    if (!token) {
      console.warn("Unauthorized request - missing token")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()

    formData.append("_method", "PUT")

    const response = await fetch(`${API_URL}/api/blog-posts/${id}`, {
      method: "POST", // Laravel uses POST with _method=PUT for FormData
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to update blog post")
    }

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("Blog API Error:", error)
    return Response.json({ error: "Failed to update blog post" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams

    const token = getAuthToken(request)
    console.log("Auth token:", token ? "Present" : "Missing")
    if (!token) {
      console.warn("Unauthorized request - missing token")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const response = await fetch(`${API_URL}/api/blog-posts/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to delete blog post")
    }

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("Blog API Error:", error)
    return Response.json({ error: "Failed to delete blog post" }, { status: 500 })
  }
}
