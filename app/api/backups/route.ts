import { NextRequest, NextResponse } from "next/server"
import { requireAdminOrAbove } from "@/lib/auth/role-guard"
import { connectToDatabase } from "@/lib/mongodb"
import { Backup } from "@/lib/models/Backup"

export async function GET() {
  const authResult = await requireAdminOrAbove()
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status })

  try {
    await connectToDatabase()
    const backups = await Backup.find({ deletedAt: null }).sort({ createdAt: -1 }).lean()

    return NextResponse.json({
      backups: backups.map((b) => ({
        name: b.filename,
        size: b.size,
        createdAt: b.createdAt.toISOString(),
        id: b._id.toString(),
      })),
    })
  } catch (error) {
    console.error("Failed to fetch backups:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch backups" }, { status: 500 })
  }
}

export async function POST() {
  const authResult = await requireAdminOrAbove()
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status })

  try {
    await connectToDatabase()

    const mongoose = (await import("mongoose")).default
    const collections = [
      "users",
      "salesrecords",
      "teams",
      "categories",
      "products",
      "commissionrules",
      "notifications",
      "wallets",
    ]
    const backupData: Record<string, unknown[] | Record<string, unknown>> = {}

    for (const collName of collections) {
      try {
        const conn = mongoose.connection.db
        if (conn) {
          const coll = conn.collection(collName)
          backupData[collName] = await coll.find({}).toArray()
        }
      } catch {
        backupData[collName] = []
      }
    }

    backupData._meta = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      collections: collections,
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `backup-${timestamp}.json`
    const jsonString = JSON.stringify(backupData)

    const backup = await Backup.create({
      filename,
      data: backupData,
      size: Buffer.byteLength(jsonString, "utf-8"),
    })

    return NextResponse.json({
      success: true,
      filename,
      id: backup._id.toString(),
      size: backup.size,
      message: "Backup created successfully",
    })
  } catch (error) {
    console.error("Backup failed:", error)
    return NextResponse.json({ success: false, error: "Failed to create backup" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAdminOrAbove()
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Backup ID required" }, { status: 400 })
    }

    await connectToDatabase()

    const backup = await Backup.findById(id)
    if (!backup) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 })
    }

    await Backup.findByIdAndUpdate(id, { deletedAt: new Date() })

    return NextResponse.json({ success: true, message: "Backup deleted" })
  } catch (error) {
    console.error("Delete backup failed:", error)
    return NextResponse.json({ success: false, error: "Failed to delete backup" }, { status: 500 })
  }
}
