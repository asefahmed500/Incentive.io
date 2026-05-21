import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { FileAttachment } from "@/lib/models/FileAttachment"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await connectToDatabase()

    const attachment = await FileAttachment.findById(id)
    if (!attachment) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    return new NextResponse(attachment.data, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `inline; filename="${attachment.filename}"`,
        "Content-Length": attachment.size.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }
}
