import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/mongodb";

export async function GET() {
  const check = {
    timestamp: new Date().toISOString(),
    database: await checkDatabaseConnection(),
    overall: "healthy",
  };

  if (!check.database.connected) {
    check.overall = "unhealthy";
  }

  const statusCode = check.overall === "healthy" ? 200 : 503;
  return NextResponse.json(check, { status: statusCode });
}