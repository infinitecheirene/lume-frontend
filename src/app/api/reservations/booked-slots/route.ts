import { NextResponse } from "next/server"

const apiUrl = process.env.NEXT_PUBLIC_API_URL

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get("date")

    const query = date ? `?date=${date}` : ""

    const res = await fetch(`${apiUrl}/api/reservations/booked-slots${query}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })  

    if (!res.ok) {
      return NextResponse.json({ success: false, message: "Failed to fetch booked slots" }, { status: res.status })
    }

    const data = await res.json()

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error",
      },
      { status: 500 },
    )
  }
}
