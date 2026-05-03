"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Database, RefreshCw, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useTransition } from "react";

interface SyncResult {
  operation: string;
  status: "pending" | "running" | "success" | "error";
  message: string;
  recordsProcessed?: number;
}

export default function DatabaseSync() {
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState<Record<string, SyncResult>>({});
  const [runningOps, setRunningOps] = useState<Set<string>>(new Set());

  const syncOperations = [
    { id: "commissions", name: "Sync Commissions", description: "Recalculate all commissions based on current rules" },
    { id: "targets", name: "Sync Targets", description: "Validate and update user targets" },
    { id: "teams", name: "Sync Teams", description: "Validate team relationships and memberships" },
    { id: "wallets", name: "Sync Wallets", description: "Reconcile wallet balances" },
    { id: "eligibility", name: "Re-evaluate Eligibility", description: "Check all users for commission eligibility" },
  ];

  const runSync = async (operationId: string) => {
    setRunningOps(prev => new Set(prev.add(operationId)));
    setResults(prev => ({ ...prev, [operationId]: { operation: operationId, status: "running", message: "Running..." } }));

    try {
      const res = await fetch(`/api/sync?type=${operationId}`, { method: "POST" });
      const data = await res.json();
      
      setResults(prev => ({
        ...prev,
        [operationId]: {
          operation: operationId,
          status: data.success ? "success" : "error",
          message: data.success ? `Sync completed: ${typeof data.result === 'object' ? JSON.stringify(data.result) : data.result + " records processed"}` : data.error,
          recordsProcessed: typeof data.result === 'number' ? data.result : undefined,
        },
      }));
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        [operationId]: { operation: operationId, status: "error", message: error.message },
      }));
    } finally {
      setRunningOps(prev => {
        const next = new Set(prev);
        next.delete(operationId);
        return next;
      });
    }
  };

  const runAllSync = async () => {
    for (const op of syncOperations) {
      await new Promise(resolve => setTimeout(resolve, 500));
      runSync(op.id);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Loader2 className="h-5 w-5 animate-spin text-sky-500" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Database Sync</h1>
        <p className="text-muted-foreground">Recalculate and validate data across the system</p>
      </div>

      <div className="flex gap-4">
        <Button onClick={() => runAllSync()} disabled={isPending || runningOps.size > 0}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? "animate-spin" : ""}`} />
          Run Full Sync
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {syncOperations.map((op) => {
          const result = results[op.id];
          const isRunning = runningOps.has(op.id);
          return (
            <Card key={op.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    {op.name}
                  </CardTitle>
                  {(result || isRunning) && getStatusIcon(result?.status || "running")}
                </div>
                <CardDescription>{op.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {isRunning ? (
                  <Progress value={50} className="mt-2 animate-pulse" />
                ) : result ? (
                  <div className="mt-2 space-y-1">
                    <p className={`text-sm ${result.status === "error" ? "text-red-600" : "text-green-600"}`}>
                      {result.message}
                    </p>
                    {result.recordsProcessed !== undefined && (
                      <p className="text-xs text-muted-foreground">{result.recordsProcessed} records processed</p>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runSync(op.id)}
                    className="mt-2"
                  >
                    Run Sync
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
