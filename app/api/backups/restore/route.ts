import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const BACKUP_DIR = path.join(process.cwd(), "backups");

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");
    
    if (!filename) {
      return NextResponse.json({ error: "Filename required" }, { status: 400 });
    }
    
    const filepath = path.join(BACKUP_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }
    
    const backupData = JSON.parse(fs.readFileSync(filepath, "utf-8"));
    
    if (!backupData._meta) {
      return NextResponse.json({ error: "Invalid backup file format" }, { status: 400 });
    }
    
    const { connectToDatabase } = await import("@/lib/mongodb");
    const { default: mongoose } = await import("mongoose");
    await connectToDatabase();
    
    const collections = ["users", "salesrecords", "teams", "categories", "products", "commissionrules", "notifications", "wallets"];
    
    for (const collName of collections) {
      if (backupData[collName] && Array.isArray(backupData[collName])) {
        try {
          const conn = mongoose.connection.db;
          if (conn) {
            const coll = conn.collection(collName);
            if (backupData[collName].length > 0) {
              await coll.deleteMany({});
              if (collName === "users" || collName === "commissionrules" || collName === "categories" || collName === "products") {
                for (const doc of backupData[collName]) {
                  const docWithoutId = { ...doc };
                  delete docWithoutId._id;
                  await coll.insertOne(docWithoutId);
                }
              } else {
                await coll.insertMany(backupData[collName]);
              }
            }
          }
        } catch (e) {
          console.error(`Failed to restore ${collName}:`, e);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Restore completed successfully",
      collectionsRestored: collections.filter(c => backupData[c]?.length > 0).length,
    });
  } catch (error: any) {
    console.error("Restore failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");
    
    if (!filename) {
      return NextResponse.json({ error: "Filename required" }, { status: 400 });
    }
    
    const filepath = path.join(BACKUP_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }
    
    const stat = fs.statSync(filepath);
    const backupData = JSON.parse(fs.readFileSync(filepath, "utf-8"));
    
    return NextResponse.json({
      filename,
      size: stat.size,
      createdAt: stat.mtime.toISOString(),
      collections: Object.keys(backupData).filter(k => k !== "_meta" && Array.isArray(backupData[k])),
      recordCounts: Object.fromEntries(
        Object.entries(backupData)
          .filter(([k, v]) => k !== "_meta" && Array.isArray(v))
          .map(([k, v]) => [k, (v as unknown[]).length])
      ),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
