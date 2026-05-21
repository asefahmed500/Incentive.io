import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { FileAttachment } from "@/lib/models/FileAttachment"
import { handleError } from "@/lib/api-error"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"]
const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG, and PDF are allowed." },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit." },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    await connectToDatabase()

    const attachment = await FileAttachment.create({
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      data: buffer,
      uploadedBy: session.user.id,
    })

    const fileUrl = `/api/files/${attachment._id}`

    return NextResponse.json({
      success: true,
      url: fileUrl,
      id: attachment._id.toString(),
      fileName: file.name,
      size: file.size,
    })
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "File ID required" }, { status: 400 })
    }

    await connectToDatabase()

    const attachment = await FileAttachment.findById(id)
    if (!attachment) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    await FileAttachment.findByIdAndDelete(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleError(error)
  }
}
