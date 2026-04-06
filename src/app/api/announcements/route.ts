import { NextRequest } from "next/server"

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  const cookieToken = request.cookies.get("auth_token")?.value
  return authHeader?.replace("Bearer ", "") || cookieToken || null
}
export async function GET(request: Request) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL

    if (!apiUrl) {
      throw new Error("NEXT_PUBLIC_API_URL is not defined")
    }

    const response = await fetch(`${apiUrl}/api/announcements`, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Backend error response:", errorData)
      throw new Error(`Backend returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("Announcements Fetch Error:", error)
    return Response.json({ error: "Failed to fetch announcements" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request)
    const body = await request.json()
    const apiUrl = process.env.NEXT_PUBLIC_API_URL

    if (!apiUrl) {
      throw new Error("NEXT_PUBLIC_API_URL is not defined")
    }

    if (!token) {
      return Response.json({ error: "No token provided" }, { status: 401 })
    }

    const fullUrl = `${apiUrl}/api/announcements`

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    const rawText = await response.text()
    console.log("Backend Raw Response:", rawText)

    let data: any = null
    try {
      data = rawText ? JSON.parse(rawText) : null
    } catch (jsonError) {
      console.error("Failed to parse backend response as JSON:", jsonError)
    }

    if (!response.ok) {
      return Response.json(
        {
          error: "Backend error",
          status: response.status,
          statusText: response.statusText,
          rawResponse: rawText,
        },
        { status: response.status },
      )
    }

    return Response.json(data, { status: 201 })
  } catch (error) {
    console.error("Announcements Create Error:", error)

    return Response.json(
      {
        error: "Failed to create announcement",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
