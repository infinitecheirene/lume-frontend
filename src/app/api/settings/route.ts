import { NextRequest, NextResponse } from "next/server"

const LARAVEL_API_URL = process.env.LARAVEL_API_URL || "http://localhost:8000"

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  const cookieToken = request.cookies.get("auth_token")?.value
  return authHeader?.replace("Bearer ", "") || cookieToken || null
}

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request)
    console.log("Auth token:", token ? "Present" : "Missing")
    if (!token) {
      console.warn("Unauthorized request – missing token")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const res = await fetch(`${LARAVEL_API_URL}/api/settings`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Failed to fetch settings.",
          errors: data?.errors || null,
        },
        { status: res.status },
      )
    }

    return NextResponse.json({
      success: true,
      data: data.data,
    })
  } catch (error) {
    console.error("GET /api/settings error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Server error while fetching settings.",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const token = getAuthToken(request)
    console.log("Auth token:", token ? "Present" : "Missing")
    if (!token) {
      console.warn("Unauthorized request – missing token")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const res = await fetch(`${LARAVEL_API_URL}/api/settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Failed to update settings.",
          errors: data?.errors || null,
        },
        { status: res.status },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully.",
      data: data.data,
    })
  } catch (error) {
    console.error("PUT /api/settings error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Server error while updating settings.",
      },
      { status: 500 },
    )
  }
}
