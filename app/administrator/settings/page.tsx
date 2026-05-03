"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save } from "lucide-react";

interface Settings {
  companyName: string;
  currencySymbol: string;
  dateFormat: string;
  defaultCommissionRate: number;
  eligibilityThreshold: number;
  sessionTimeout: number;
  emailNotifications: boolean;
  inAppNotifications: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        setSettings(data.settings);
        setFormData(data.settings);
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">Configure system-wide settings</p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Settings
        </Button>
      </div>

      {saveSuccess && (
        <Badge className="bg-green-500">Settings saved successfully!</Badge>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                value={formData.companyName || ""}
                onChange={(e) => updateField("companyName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Currency Symbol</Label>
              <Input
                value={formData.currencySymbol || ""}
                onChange={(e) => updateField("currencySymbol", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Date Format</Label>
              <Input
                value={formData.dateFormat || ""}
                onChange={(e) => updateField("dateFormat", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commission Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default Commission Rate (%)</Label>
              <Input
                type="number"
                value={formData.defaultCommissionRate || ""}
                onChange={(e) => updateField("defaultCommissionRate", parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Eligibility Threshold (%)</Label>
              <Input
                type="number"
                value={formData.eligibilityThreshold || ""}
                onChange={(e) => updateField("eligibilityThreshold", parseFloat(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Session Timeout (hours)</Label>
              <Input
                type="number"
                value={formData.sessionTimeout || ""}
                onChange={(e) => updateField("sessionTimeout", parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="emailNotif"
                checked={formData.emailNotifications || false}
                onChange={(e) => updateField("emailNotifications", e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="emailNotif">Email Notifications</Label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="inAppNotif"
                checked={formData.inAppNotifications || false}
                onChange={(e) => updateField("inAppNotifications", e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="inAppNotif">In-App Notifications</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><strong>Application:</strong> AlgoIncentive Sales Commission Management</p>
          <p><strong>Version:</strong> 1.0.0</p>
          <p><strong>Framework:</strong> Next.js 16</p>
          <p><strong>Database:</strong> MongoDB</p>
          <p><strong>Authentication:</strong> NextAuth v5</p>
        </CardContent>
      </Card>
    </div>
  );
}
