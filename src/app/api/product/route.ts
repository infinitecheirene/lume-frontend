import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

/* =====================================================
   GET - Fetch Products
===================================================== */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const queryParams = new URLSearchParams()

    searchParams.forEach((value, key) => {
      queryParams.append(key, value)
    })

    const apiUrl = `${API_BASE_URL}/api/products${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          message: data.message || "Failed to fetch products",
        },
        { status: response.status }
      )
    }

    return NextResponse.json(data.data || data)
  } catch (error) {
    console.error("GET Products Error:", error)

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

/* =====================================================
   POST - Create Product
===================================================== */
export async function POST(request: NextRequest) {
  try {
    const incoming = await request.formData()

    const formData = new FormData()

    const getString = (key: string) =>
      String(incoming.get(key) || "").trim()

    const toBooleanString = (value: FormDataEntryValue | null) => {
      return value === "true" ||
        value === "1" ||
        value === "on"
        ? "1"
        : "0"
    }

    /* Basic Fields */
    formData.append("name", getString("name"))
    formData.append("description", getString("description"))
    formData.append("ingredients", getString("ingredients"))
    formData.append("price", getString("price"))
    formData.append("category", getString("category"))

    /* Boolean Fields */
    formData.append(
      "best_seller",
      toBooleanString(incoming.get("best_seller"))
    )

    formData.append(
      "set",
      toBooleanString(incoming.get("set"))
    )

    /* Image */
    const image = incoming.get("image") as File | null

    if (image && image.size > 0) {
      formData.append("image", image)
    }

    /* Forward token/cookie */
    const token = request.cookies.get("token")?.value

    const response = await fetch(`${API_BASE_URL}/api/products`, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
        ...(token && {
          Authorization: `Bearer ${token}`,
        }),
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          message: data.message || "Failed to create product",
          errors: data.errors || null,
        },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("POST Product Error:", error)

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}