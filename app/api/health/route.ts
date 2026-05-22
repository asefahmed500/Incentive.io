import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/mongodb";

export async function GET() {
  try {
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
  } catch (error) {
    return NextResponse.json(
      { timestamp: new Date().toISOString(), database: { connected: false, message: "Health check failed" }, overall: "unhealthy" },
      { status: 503 }
    );
  }
}