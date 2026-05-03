import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET() {
  const start = Date.now();
  
  const check = {
    timestamp: new Date().toISOString(),
    database: null as any,
    overall: "healthy",
  };

  try {
    const state = mongoose.connection.readyState;
    const states = ["disconnected", "connected", "connecting", "disconnecting"];
    const stateStr = states[state] || "unknown";
    
    check.database = {
      connected: state === 1,
      state: stateStr,
      host: mongoose.connection.host || "localhost",
      name: mongoose.connection.name || "incentiveio",
      latency: Date.now() - start,
    };
    
    if (state !== 1) {
      check.overall = state === 2 ? "connecting" : "unhealthy";
    }
  } catch (error: any) {
    check.database = {
      connected: false,
      state: "error",
      error: error.message,
    };
    check.overall = "unhealthy";
  }

  const statusCode = check.overall === "healthy" ? 200 : 503;
  return NextResponse.json(check, { status: statusCode });
}