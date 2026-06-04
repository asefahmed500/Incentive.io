import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { FileAttachment } from "@/lib/models/FileAttachment"
import { requireAuth } from "@/lib/auth/role-guard"
import { z } from "zod"

const fileIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid file ID format")

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth()
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status })

  try {
    const { id } = await params
    const parsed = fileIdSchema.safeParse(id)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid file ID" }, { status: 400 })
    }

    await connectToDatabase()

    const attachment = await FileAttachment.findById(parsed.data)
    if (!attachment) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    return new NextResponse(attachment.data, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `inline; filename="${attachment.filename}"`,
        "Content-Length": attachment.size.toString(),
        "Cache-Control": "no-store, must-revalidate",
      },
    })
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }
}
