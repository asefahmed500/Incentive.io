import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/incentiveio";

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export async function checkDatabaseConnection(): Promise<{ connected: boolean; message: string; latency?: number }> {
  const start = Date.now();
  
  try {
    await connectToDatabase();
    const latency = Date.now() - start;
    
    const state = mongoose.connection.readyState;
    const states = ["disconnected", "connected", "connecting", "disconnecting"];
    
    return {
      connected: state === 1,
      message: states[state] || "unknown",
      latency,
    };
  } catch (error: any) {
    return {
      connected: false,
      message: error.message || "Connection failed",
    };
  }
}

export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export function getConnectionState(): string {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  return states[mongoose.connection.readyState] || "unknown";
}