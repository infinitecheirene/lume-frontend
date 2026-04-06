const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function GET() {
  try {
    const response = await fetch(`${API_URL}/api/blog-posts`, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch blog posts from backend")
    }

    const data = await response.json()

    return Response.json(data)
  } catch (error) {
    console.error("Blog API Error:", error)
    return Response.json({ error: "Failed to fetch blog posts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const response = await fetch(`${API_URL}/api/blog-posts`, {
      method: "POST",
      body: formData,
    })

    const responseText = await response.text()

    if (!response.ok) {
      return Response.json(
        {
          error: "Failed to create blog post",
          status: response.status,
          backendResponse: responseText,
        },
        { status: response.status },
      )
    }

    // Parse JSON only if OK
    const data = JSON.parse(responseText)

    return Response.json(data)
  } catch (error: any) {
    console.error("=== BLOG API ERROR ===")
    console.error(error)

    return Response.json(
      {
        error: "Failed to create blog post",
        message: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
