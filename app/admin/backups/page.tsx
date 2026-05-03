"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HardDrive, Download, Save, Clock } from "lucide-react";

export default function AdminBackups() {
  const [backups] = useState<any[]>([]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Backups</h1>
        <p className="text-muted-foreground">Database backup management</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Backup System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Note: Backup creation is restricted to Super Administrator</p>
                <p className="text-sm text-muted-foreground">Contact your system administrator for backup needs</p>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Automated backups are performed daily at 2:00 AM UTC.</p>
            <p>Manual backups can be created through the command line interface.</p>
          </div>
          
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">To create a manual backup:</p>
            <code className="text-xs block mt-2">mongodump --db incentivio --out backup/</code>
          </div>
        </CardContent>
      </Card>

      {backups.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No backups available
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Available Backups</CardTitle>
          </CardHeader>
          <CardContent>
            {backups.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-3 border rounded mb-2">
                <div className="flex items-center gap-3">
                  <HardDrive className="h-5 w-5" />
                  <div>
                    <p className="font-medium">{backup.name}</p>
                    <p className="text-sm text-muted-foreground">{backup.date}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Restore
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}