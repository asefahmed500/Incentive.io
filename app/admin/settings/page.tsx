"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">System configuration (Admin view)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Application Name</Label>
            <Input value="incentivio" disabled />
          </div>
          <div>
            <Label>Version</Label>
            <Input value="1.0.0" disabled />
          </div>
          <div>
            <Label>Database</Label>
            <Input value="MongoDB" disabled />
          </div>
          <div className="pt-4">
            <p className="text-sm text-muted-foreground">
              Note: Full system settings are restricted to Super Administrator only.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}