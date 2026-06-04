"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Server, Database, Zap, Users, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface HealthMetric {
  name: string;
  value: string;
  status: "healthy" | "warning" | "critical";
  description: string;
}

interface ApiEndpoint {
  path: string;
  method: string;
  avgResponse: number;
  status: "healthy" | "slow" | "down";
}

interface HealthData {
  timestamp: string;
  database: { connected: boolean; message: string };
  overall: string;
}

const ENDPOINTS_TO_CHECK = [
  { path: "/api/health", method: "GET" },
  { path: "/api/auth/session", method: "GET" },
  { path: "/api/sales-records", method: "GET" },
  { path: "/api/users", method: "GET" },
];

function getEpStatus(ms: number): "healthy" | "slow" | "down" {
  if (ms === 0) return "down";
  if (ms > 500) return "slow";
  return "healthy";
}

export default function SuperAdminHealth() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [healthError, setHealthError] = useState(false);
  const [metrics, setMetrics] = useState<HealthMetric[]>([
    { name: "API Uptime", value: "99.9%", status: "healthy", description: "Last 30 days" },
    { name: "Avg Response", value: "--ms", status: "healthy", description: "Last poll" },
    { name: "DB Latency", value: "--ms", status: "healthy", description: "MongoDB ping" },
  ]);

  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>(
    ENDPOINTS_TO_CHECK.map((ep) => ({
      path: ep.path,
      method: ep.method,
      avgResponse: 0,
      status: "healthy" as const,
    }))
  );

  const [loading, setLoading] = useState(true);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const measureEndpoint = useCallback(
    async (path: string): Promise<number> => {
      try {
        const start = performance.now();
        const res = await fetch(path);
        const elapsed = Math.round(performance.now() - start);
        return res.ok ? elapsed : 0;
      } catch {
        return 0;
      }
    },
    []
  );

  const fetchHealth = useCallback(async () => {
    const dbStart = performance.now();
    try {
      const res = await fetch("/api/health");
      const dbElapsed = Math.round(performance.now() - dbStart);
      if (res.ok) {
        const data: HealthData = await res.json();
        setHealthData(data);
        setHealthError(false);

        setMetrics([
          {
            name: "API Uptime",
            value: data.overall === "healthy" ? "100%" : "Degraded",
            status: data.overall === "healthy" ? "healthy" : "critical",
            description: "Current status",
          },
          {
            name: "Health Check",
            value: `${dbElapsed}ms`,
            status: dbElapsed > 500 ? "warning" : "healthy",
            description: "/api/health response",
          },
          {
            name: "Database",
            value: data.database.connected ? "Connected" : "Disconnected",
            status: data.database.connected ? "healthy" : "critical",
            description: data.database.message,
          },
        ]);
      } else {
        setHealthError(true);
      }
    } catch {
      setHealthError(true);
      setHealthData(null);
    }

    // Measure endpoint latencies in parallel
    const endpointResults = await Promise.all(
      ENDPOINTS_TO_CHECK.map(async (ep) => {
        const ms = await measureEndpoint(ep.path);
        return { path: ep.path, method: ep.method, ms };
      })
    );

    setEndpoints(
      endpointResults.map(({ path, method, ms }) => ({
        path,
        method,
        avgResponse: ms,
        status: getEpStatus(ms),
      }))
    );

    setLoading(false);
  }, [measureEndpoint]);

  useEffect(() => {
    fetchHealth();
    pollingRef.current = setInterval(fetchHealth, 15000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchHealth]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "critical":
      case "slow":
      case "down":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return (
          <span className="flex items-center gap-1 rounded bg-green-100 px-2 py-1 text-xs text-green-700">
            <CheckCircle className="h-3 w-3" /> Healthy
          </span>
        );
      case "warning":
      case "slow":
        return (
          <span className="flex items-center gap-1 rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-700">
            <AlertCircle className="h-3 w-3" /> {status === "slow" ? "Slow" : "Warning"}
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 rounded bg-red-100 px-2 py-1 text-xs text-red-700">
            <AlertCircle className="h-3 w-3" /> {status}
          </span>
        );
    }
  };

  const getHealthStatusBadge = (overall: string) => {
    if (overall === "healthy") {
      return (
        <span className="flex items-center gap-1 rounded bg-green-100 px-2 py-1 text-xs text-green-700">
          <CheckCircle className="h-3 w-3" /> Healthy
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 rounded bg-red-100 px-2 py-1 text-xs text-red-700">
        <AlertCircle className="h-3 w-3" /> Unhealthy
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Health</h1>
          <p className="text-muted-foreground">
            Monitor API performance and system resources (SuperAdmin)
          </p>
        </div>
        {healthData && getHealthStatusBadge(healthData.overall)}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            {healthData?.overall === "healthy" ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthData
                ? healthData.overall === "healthy"
                  ? "Healthy"
                  : "Unhealthy"
                : healthError
                  ? "Unreachable"
                  : "--"}
            </div>
            <p className="text-xs text-muted-foreground">
              {healthData?.timestamp
                ? `Last checked: ${new Date(healthData.timestamp).toLocaleTimeString()}`
                : "Polling..."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database
              className={`h-4 w-4 ${
                healthData?.database.connected
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthData?.database.connected ? "Connected" : "Disconnected"}
            </div>
            <p className="text-xs text-muted-foreground">
              {healthData?.database.message || "MongoDB"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {endpoints.length > 0
                ? `${Math.round(
                    endpoints.reduce((s, e) => s + e.avgResponse, 0) /
                      endpoints.filter((e) => e.avgResponse > 0).length || 0
                  )}ms`
                : "--ms"}
            </div>
            <p className="text-xs text-muted-foreground">Measured on poll</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Endpoints</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{endpoints.length}</div>
            <p className="text-xs text-muted-foreground">Monitored</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.map((metric) => {
                const numericVal =
                  metric.name === "API Uptime"
                    ? metric.value === "100%"
                      ? 100
                      : 0
                    : metric.name === "Health Check"
                      ? parseInt(metric.value) > 500
                        ? 100
                        : Math.min((parseInt(metric.value) / 500) * 100, 100)
                      : metric.status === "healthy"
                        ? 100
                        : metric.status === "warning"
                          ? 67
                          : 33;
                return (
                  <div key={metric.name}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {metric.name}
                      </span>
                      <span className={`text-sm ${getStatusColor(metric.status)}`}>
                        {metric.value}
                      </span>
                    </div>
                    <Progress
                      value={numericVal}
                      className="h-2"
                    />
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {metric.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              API Endpoints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {endpoints.map((ep) => (
                <div
                  key={ep.path}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{ep.path}</p>
                    <p className="text-xs text-muted-foreground">{ep.method}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm">
                      {ep.avgResponse > 0 ? `${ep.avgResponse}ms` : "Error"}
                    </p>
                    {getStatusBadge(ep.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}