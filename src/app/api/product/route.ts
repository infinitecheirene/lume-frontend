import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// GET - Fetch all products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Build query parameters
    const queryParams = new URLSearchParams()

    // Add all search parameters to the Laravel API call
    searchParams.forEach((value, key) => {
      queryParams.append(key, value)
    })

    const apiUrl = `${API_BASE_URL}/api/products${queryParams.toString() ? `?${queryParams.toString()}` : ""}`

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-cache", // Disable caching for fresh data
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Unknown error" }))
      return NextResponse.json({ message: errorData.message || "Failed to fetch products" }, { status: response.status })
    }

    const data = await response.json()

    // Handle paginated response - extract the data array
    const products = data.data || data

    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    console.log("=== Incoming FormData ===")
    for (const [key, value] of formData.entries()) {
      console.log(key, value)
    }

    // Create Laravel FormData
    const laravelFormData = new FormData()

    // Helper: normalize boolean-like values
    const toBooleanString = (value: FormDataEntryValue | null) => {
      return value === "true" ||
        value === "1" ||
        value === 1 ||
        value === true ||
        value === "on"
        ? "1"
        : "0"
    }

    // Helper: safe string cast
    const getString = (key: string) => (formData.get(key) as string) ?? ""

    // Fields mapping (iterate instead of manual repetition)
    const fields = {
      name: getString("name"),
      description: getString("description"),
      price: getString("price"),
      category: getString("category"),
    }

    console.log("=== Parsed Fields ===", fields)

    Object.entries(fields).forEach(([key, value]) => {
      console.log(`Appending field: ${key} =`, value)
      laravelFormData.append(key, value)
    })

    // Boolean fields handling (FIXED)
    const isFeatured = toBooleanString(formData.get("is_featured"))
    const bestSeller = toBooleanString(formData.get("best_seller"))

    console.log("is_featured raw:", formData.get("is_featured"))
    console.log("best_seller raw:", formData.get("best_seller"))
    console.log("normalized is_featured:", isFeatured)
    console.log("normalized best_seller:", bestSeller)

    laravelFormData.append("is_featured", isFeatured)
    laravelFormData.append("best_seller", bestSeller)

    // File handling
    const image = formData.get("image") as File | null
    if (image && image.size > 0) {
      console.log("Appending image:", image.name, image.size)
      laravelFormData.append("image", image)
    } else {
      console.log("No valid image provided")
    }

    console.log("=== Final Laravel FormData Preview ===")
    for (const [key, value] of laravelFormData.entries()) {
      console.log(key, value)
    }

    const response = await fetch(`${API_BASE_URL}/api/products`, {
      method: "POST",
      body: laravelFormData,
    })

    const responseData = await response.json()

    console.log("=== Laravel Response ===", responseData)

    if (!response.ok) {
      return NextResponse.json(
        {
          message: responseData.message || "Failed to create product",
          errors: responseData.errors || null,
        },
        { status: response.status },
      )
    }

    return NextResponse.json(responseData, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
