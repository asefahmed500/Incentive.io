import { NextRequest, NextResponse } from "next/server"
import { requireAdminOrAbove } from "@/lib/auth/role-guard"
import { connectToDatabase } from "@/lib/mongodb"
import { Backup } from "@/lib/models/Backup"

export async function POST(request: NextRequest) {
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

    const backupData = backup.data as Record<string, unknown>
    if (!backupData._meta) {
      return NextResponse.json({ error: "Invalid backup data" }, { status: 400 })
    }

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

    for (const collName of collections) {
      const docs = backupData[collName]
      if (docs && Array.isArray(docs)) {
        try {
          const conn = mongoose.connection.db
          if (conn) {
            const coll = conn.collection(collName)
            if (docs.length > 0) {
              await coll.deleteMany({})
              if (collName === "users" || collName === "commissionrules" || collName === "categories" || collName === "products") {
                for (const doc of docs) {
                  const docWithoutId = { ...doc as Record<string, unknown> }
                  delete docWithoutId._id
                  await coll.insertOne(docWithoutId)
                }
              } else {
                await coll.insertMany(docs)
              }
            }
          }
        } catch (e) {
          console.error(`Failed to restore ${collName}:`, e)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Restore completed successfully",
      collectionsRestored: collections.filter((c) => {
        const docs = backupData[c]
        return docs && Array.isArray(docs) && docs.length > 0
      }).length,
    })
  } catch (error: any) {
    console.error("Restore failed:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdminOrAbove()
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Backup ID required" }, { status: 400 })
    }

    await connectToDatabase()

    const backup = await Backup.findById(id).lean()
    if (!backup) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 })
    }

    const data = backup.data as Record<string, unknown>

    return NextResponse.json({
      filename: backup.filename,
      size: backup.size,
      createdAt: backup.createdAt.toISOString(),
      collections: Object.keys(data).filter((k) => k !== "_meta" && Array.isArray(data[k])),
      recordCounts: Object.fromEntries(
        Object.entries(data)
          .filter(([k, v]) => k !== "_meta" && Array.isArray(v))
          .map(([k, v]) => [k, (v as unknown[]).length])
      ),
    })
  } catch (error: any) {
    console.error("Backup info failed:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
