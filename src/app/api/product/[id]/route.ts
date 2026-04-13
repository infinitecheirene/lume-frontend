import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Helper to get auth token
function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  return authHeader?.replace("Bearer ", "") || null
}

// GET - fetch a single product
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams

    const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: "GET",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      cache: "no-cache",
    })

    let data: any
    const text = await response.text()
    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      data = { message: text }
    }

    if (!response.ok) {
      return NextResponse.json({ message: data.message || "Failed to fetch product" }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error fetching product:", error)
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}

// PUT
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Debug: log params
    console.log("Received params:", params)
    const resolvedParams = await params
    const { id } = resolvedParams
    console.log("Resolved product ID:", id)

    // Check auth token
    const token = getAuthToken(request)
    console.log("Auth token:", token ? "Present" : "Missing")
    if (!token) {
      console.warn("Unauthorized request – missing token")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Read incoming form data
    const formData = await request.formData()
    console.log("Incoming formData keys:", Array.from(formData.keys()))

    const laravelFormData = new FormData()
    // Append fields with debug
    const fields = ["name", "description", "ingredients", "price", "category", "best_seller", "image"]
    fields.forEach((field) => {
      const value = formData.get(field)
      let convertedValue: string
      if (field.startsWith("is_")) {
        convertedValue = value === "true" ? "1" : "0"
      } else {
        convertedValue = value as string
      }
      laravelFormData.append(field, convertedValue)
      console.log(`Appending to laravelFormData: ${field} = ${convertedValue}`)
    })

    // Handle image
    const image = formData.get("image") as File
    if (image && image.size > 0) {
      laravelFormData.append("image", image)
      console.log("Image appended:", image.name, image.size, "bytes")
    } else {
      console.log("No image file provided")
    }

    // Debug: show laravelFormData keys before sending
    console.log("laravelFormData keys to send:", Array.from(laravelFormData.keys()))

    // Send to Laravel API
    const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: "PUT",
      headers: {
        // NOTE: Content-Type should NOT be set when sending FormData
        Authorization: `Bearer ${token}`,
      },
      body: laravelFormData,
    })

    console.log("Laravel API response status:", response.status, response.statusText)
    const text = await response.text()
    console.log("Raw response text:", text)

    let responseData: any
    try {
      responseData = text ? JSON.parse(text) : {}
    } catch {
      responseData = { message: text }
    }

    if (!response.ok) {
      console.error("Failed to update product:", responseData)
      return NextResponse.json(
        {
          message: responseData.message || "Failed to update product",
          errors: responseData.errors || null,
        },
        { status: response.status },
      )
    }

    console.log("Product updated successfully:", responseData)
    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error("Error in PUT /api/product/[id]:", error)
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}

// DELETE - delete product
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams
    const token = getAuthToken(request)

    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    })

    let responseData: any
    const text = await response.text()
    try {
      responseData = text ? JSON.parse(text) : {}
    } catch {
      responseData = { message: text || "Failed to delete product" }
    }

    if (!response.ok) {
      return NextResponse.json({ message: responseData.message || "Failed to delete product" }, { status: response.status })
    }

    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}
