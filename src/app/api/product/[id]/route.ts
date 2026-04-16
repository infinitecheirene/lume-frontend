import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Get token from Authorization header OR cookies
function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "")
  }

  // fallback cookie names
  return (
    request.cookies.get("token")?.value ||
    request.cookies.get("auth_token")?.value ||
    request.cookies.get("access_token")?.value ||
    null
  )
}

// ======================
// GET SINGLE PRODUCT
// ======================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-cache",
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to fetch product" },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// ======================
// UPDATE PRODUCT
// ======================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const token = getAuthToken(request)

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized - missing token" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const laravelFormData = new FormData()

    // Normal fields
    const fields = [
      "name",
      "description",
      "ingredients",
      "price",
      "category",
    ]

    fields.forEach((field) => {
      const value = formData.get(field)
      if (value !== null) {
        laravelFormData.append(field, String(value))
      }
    })

    // Boolean fields
    laravelFormData.append(
      "best_seller",
      formData.get("best_seller") === "1" ? "1" : "0"
    )

    laravelFormData.append(
      "set",
      formData.get("set") === "1" ? "1" : "0"
    )

    // Image
    const image = formData.get("image") as File | null

    if (image && image.size > 0) {
      laravelFormData.append("image", image)
    }

    // Laravel PUT with multipart usually needs POST + _method
    laravelFormData.append("_method", "PUT")

    const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: laravelFormData,
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          message: data.message || "Failed to update product",
          errors: data.errors || null,
        },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// ======================
// DELETE PRODUCT
// ======================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const token = getAuthToken(request)

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized - missing token" },
        { status: 401 }
      )
    }

    const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to delete product" },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}