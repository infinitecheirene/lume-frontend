import { NextRequest, NextResponse } from "next/server"

const LARAVEL_BASE_URL = process.env.LARAVEL_API_URL || "http://localhost:8000"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    const uploadId = formData.get("upload_id")
    const chunkIndex = formData.get("chunk_index")
    const totalChunks = formData.get("total_chunks")
    const file = formData.get("file") as File

    if (!uploadId || !chunkIndex || !totalChunks || !file) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const laravelForm = new FormData()
    laravelForm.append("upload_id", uploadId.toString())
    laravelForm.append("chunk_index", chunkIndex.toString())
    laravelForm.append("total_chunks", totalChunks.toString())
    laravelForm.append(
      "file",
      new File([await file.arrayBuffer()], file.name, {
        type: file.type || "application/octet-stream",
      }),
    )

    const response = await fetch(`${LARAVEL_BASE_URL}/api/blog-posts/video/upload-chunk`, {
      method: "POST",
      body: laravelForm,
      headers: {
        Accept: "application/json",
      },
    })

    const data = await response.json()

    return NextResponse.json(data, {
      status: response.status,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Internal Server Error",
      },
      { status: 500 },
    )
  }
}
