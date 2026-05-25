import { NextResponse } from "next/server"
import { requireAuth, requireAdminOrAbove } from "@/lib/auth/role-guard"
import { connectToDatabase } from "@/lib/mongodb"
import { FileAttachment } from "@/lib/models/FileAttachment"
import { handleError } from "@/lib/api-error"
import { z } from "zod"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"]
const MAX_FILE_SIZE = 10 * 1024 * 1024

const fileIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid file ID format")

export async function POST(request: Request) {
  const authResult = await requireAuth()
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status })

  try {
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

    const userId = authResult.session.user.id as string
    const attachment = await FileAttachment.create({
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      data: buffer,
      uploadedBy: userId,
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
  const authResult = await requireAuth()
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "File ID required" }, { status: 400 })
    }

    const parsed = fileIdSchema.safeParse(id)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid file ID" }, { status: 400 })
    }

    await connectToDatabase()

    const attachment = await FileAttachment.findById(parsed.data)
    if (!attachment) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const userId = authResult.session.user.id as string
    const userRole = (authResult.session.user as import("@/types").AuthUser).role as string
    const isOwner = attachment.uploadedBy === userId
    const isAdminOrAbove = ["admin", "administrator"].includes(userRole)

    if (!isOwner && !isAdminOrAbove) {
      return NextResponse.json({ error: "Forbidden: You can only delete your own files" }, { status: 403 })
    }

    await FileAttachment.findByIdAndUpdate(parsed.data, { deletedAt: new Date() })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleError(error)
  }
}
