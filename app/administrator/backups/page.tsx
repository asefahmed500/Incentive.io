"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database, Download, Trash2, Upload, Plus, Loader2, AlertTriangle } from "lucide-react";

interface BackupFile {
  name: string;
  size: number;
  createdAt: string;
}

export default function Backups() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState<BackupFile | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/backups");
      const data = await res.json();
      setBackups(data.backups || []);
    } catch (error) {
      console.error("Failed to fetch backups:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const createBackup = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/backups", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await fetchBackups();
      } else {
        alert("Failed: " + data.error);
      }
    } catch (error) {
      alert("Failed: " + error);
    } finally {
      setCreating(false);
    }
  };

  const deleteBackup = async (filename: string) => {
    if (!confirm(`Delete ${filename}?`)) return;
    setDeleting(filename);
    try {
      const res = await fetch(`/api/backups?filename=${encodeURIComponent(filename)}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setBackups(prev => prev.filter(b => b.name !== filename));
      } else {
        alert("Failed: " + data.error);
      }
    } catch (error) {
      alert("Failed: " + error);
    } finally {
      setDeleting(null);
    }
  };

  const downloadBackup = (filename: string) => {
    const link = document.createElement("a");
    link.href = `/api/backups/restore?filename=${encodeURIComponent(filename)}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const restoreBackup = async () => {
    if (!restoreConfirm || confirmText !== restoreConfirm.name) return;
    setRestoreLoading(true);
    try {
      const res = await fetch(`/api/backups/restore?filename=${encodeURIComponent(restoreConfirm.name)}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert("Restore completed successfully!");
        setRestoreConfirm(null);
        setConfirmText("");
      } else {
        alert("Failed: " + data.error);
      }
    } catch (error) {
      alert("Failed: " + error);
    } finally {
      setRestoreLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Backups</h1>
          <p className="text-muted-foreground">Create and restore database backups</p>
        </div>
        <Button onClick={createBackup} disabled={creating}>
          {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          Create Backup
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              Loading backups...
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No backups yet. Click "Create Backup" to create your first backup.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.name}>
                    <TableCell className="font-medium">{backup.name}</TableCell>
                    <TableCell>{formatSize(backup.size)}</TableCell>
                    <TableCell>{new Date(backup.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => downloadBackup(backup.name)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteBackup(backup.name)} disabled={deleting === backup.name}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setRestoreConfirm(backup)}>
                          <Upload className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!restoreConfirm} onOpenChange={() => { setRestoreConfirm(null); setConfirmText(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Restore Backup
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              WARNING: This will replace all current data with the data from the backup.
              This action cannot be undone.
            </p>
            <div className="flex flex-col gap-2">
              <Label>Type <strong>{restoreConfirm?.name}</strong> to confirm:</Label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={restoreConfirm?.name}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRestoreConfirm(null); setConfirmText(""); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={restoreBackup}
              disabled={confirmText !== restoreConfirm?.name || restoreLoading}
            >
              {restoreLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Restore Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
