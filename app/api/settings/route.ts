import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SystemSettings } from "@/lib/models/SystemSettings";

const DEFAULT_SETTINGS = [
  { key: "companyName", value: "AlgoIncentive", category: "system", description: "Company name displayed in the application" },
  { key: "currencySymbol", value: "৳", category: "system", description: "Currency symbol for amounts" },
  { key: "dateFormat", value: "DD/MM/YYYY", category: "system", description: "Date format" },
  { key: "defaultCommissionRate", value: 3, category: "commission", description: "Default commission rate percentage" },
  { key: "eligibilityThreshold", value: 50, category: "commission", description: "Achievement threshold for eligibility (%)" },
  { key: "sessionTimeout", value: 24, category: "user", description: "Session timeout in hours" },
  { key: "emailNotifications", value: true, category: "notification", description: "Enable email notifications" },
  { key: "inAppNotifications", value: true, category: "notification", description: "Enable in-app notifications" },
];

export async function GET() {
  try {
    await connectToDatabase();
    const settings = await SystemSettings.find().lean();
    
    const settingsMap: Record<string, any> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }
    
    for (const def of DEFAULT_SETTINGS) {
      if (!(def.key in settingsMap)) {
        settingsMap[def.key] = def.value;
      }
    }
    
    return NextResponse.json({ settings: settingsMap });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { key, value } = body;
    
    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }
    
    const defaultKey = DEFAULT_SETTINGS.find(s => s.key === key);
    if (!defaultKey && !key.startsWith("custom_")) {
      return NextResponse.json({ error: "Unknown setting key" }, { status: 400 });
    }
    
    await SystemSettings.findOneAndUpdate(
      { key },
      { key, value, category: defaultKey?.category || "system" },
      { upsert: true, new: true }
    );
    
    return NextResponse.json({ success: true, key, value });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const settingsMap = body.settings || body;
    
    for (const [key, value] of Object.entries(settingsMap)) {
      const defaultKey = DEFAULT_SETTINGS.find(s => s.key === key);
      await SystemSettings.findOneAndUpdate(
        { key },
        { key, value, category: defaultKey?.category || "system" },
        { upsert: true, new: true }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
