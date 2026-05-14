import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import { requireAdminOrAbove } from "@/lib/auth/role-guard";

const execAsync = promisify(exec);
const BACKUP_DIR = path.join(process.cwd(), "backups");

async function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

export async function GET() {
  const authResult = await requireAdminOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  await ensureBackupDir();
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith(".json"))
    .map(f => {
      const stat = fs.statSync(path.join(BACKUP_DIR, f));
      return {
        name: f,
        size: stat.size,
        createdAt: stat.mtime.toISOString(),
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return NextResponse.json({ backups: files });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdminOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  try {
    await ensureBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);
    
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/incentiveio";
    
    const { connectToDatabase } = await import("@/lib/mongodb");
    const { default: mongoose } = await import("mongoose");
    await connectToDatabase();
    
    const collections = ["users", "salesrecords", "teams", "categories", "products", "commissionrules", "notifications", "wallets"];
    const backupData: Record<string, unknown[] | Record<string, unknown>> = {};
    
    for (const collName of collections) {
      try {
        const conn = mongoose.connection.db;
        if (conn) {
          const coll = conn.collection(collName);
          backupData[collName] = await coll.find({}).toArray();
        }
      } catch {
        backupData[collName] = [];
      }
    }
    
    backupData._meta = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      collections: collections,
    };
    
    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
    
    return NextResponse.json({
      success: true,
      filename,
      size: fs.statSync(filepath).size,
      message: "Backup created successfully",
    });
  } catch (error: any) {
    console.error("Backup failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAdminOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json({ error: "Filename required" }, { status: 400 });
    }

    // Security: Prevent path traversal attacks
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    // Security: Only allow .json files in backup directory
    if (!filename.endsWith(".json")) {
      return NextResponse.json({ error: "Invalid file type. Only JSON backup files are allowed." }, { status: 400 });
    }

    const filepath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(filepath)) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    fs.unlinkSync(filepath);

    return NextResponse.json({ success: true, message: "Backup deleted" });
  } catch (error: any) {
    console.error("Delete backup failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
