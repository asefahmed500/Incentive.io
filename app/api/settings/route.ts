import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SystemSettings } from "@/lib/models/SystemSettings";
import { requireAdminOrAbove } from "@/lib/auth/role-guard";
import { handleError } from "@/lib/api-error";
import { updateSettingSchema, updateSettingsSchema } from "@/lib/validations/settings.validation";

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
  const authResult = await requireAdminOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  try {
    await connectToDatabase();
    const settings = await SystemSettings.find().lean();

    const settingsMap: Record<string, string | number | boolean> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    for (const def of DEFAULT_SETTINGS) {
      if (!(def.key in settingsMap)) {
        settingsMap[def.key] = def.value;
      }
    }

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: Request) {
  const authResult = await requireAdminOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  try {
    await connectToDatabase();
    const body = await request.json();

    const parsed = updateSettingSchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const { key, value } = parsed.data;

    const defaultKey = DEFAULT_SETTINGS.find(s => s.key === key);
    await SystemSettings.findOneAndUpdate(
      { key },
      { key, value, category: defaultKey?.category || "system" },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, key, value });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  const authResult = await requireAdminOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  try {
    await connectToDatabase();
    const body = await request.json();
    const settingsMap = body.settings || body;

    const parsed = updateSettingsSchema.safeParse(settingsMap);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    for (const [key, value] of Object.entries(parsed.data)) {
      const defaultKey = DEFAULT_SETTINGS.find(s => s.key === key);
      await SystemSettings.findOneAndUpdate(
        { key },
        { key, value, category: defaultKey?.category || "system" },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
