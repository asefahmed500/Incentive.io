"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Server, Database, Zap, Clock, Users, FileText, Wallet, AlertCircle, CheckCircle } from "lucide-react";

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

export default function SuperAdminHealth() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([
    { name: "CPU Usage", value: "23%", status: "healthy", description: "Server CPU utilization" },
    { name: "Memory Usage", value: "45%", status: "healthy", description: "RAM utilization" },
    { name: "Disk Usage", value: "67%", status: "warning", description: "Disk space used" },
    { name: "API Latency", value: "145ms", status: "healthy", description: "Average API response time" },
  ]);

  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([
    { path: "/api/auth/session", method: "GET", avgResponse: 45, status: "healthy" },
    { path: "/api/sales-records", method: "GET", avgResponse: 120, status: "healthy" },
    { path: "/api/users", method: "GET", avgResponse: 85, status: "healthy" },
    { path: "/api/commissions", method: "GET", avgResponse: 95, status: "healthy" },
  ]);

  const [sessions, setSessions] = useState([
    { user: "iomadmin@iomltd.com", role: "admin", started: "2026-05-03 09:00", duration: "2h 30m", ip: "192.168.1.100" },
    { user: "jamal.hassan@iomltd.com", role: "salesExecutive", started: "2026-05-03 08:30", duration: "3h 00m", ip: "192.168.1.105" },
    { user: "iommanager@iomltd.com", role: "salesManager", started: "2026-05-03 09:15", duration: "2h 15m", ip: "192.168.1.110" },
  ]);

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
        return <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Healthy</span>;
      case "warning":
        return <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-700 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Warning</span>;
      default:
        return <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Health</h1>
        <p className="text-muted-foreground">Monitor API performance and system resources (SuperAdmin)</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Uptime</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
            <p className="text-xs text-muted-foreground">Currently logged in</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">145ms</div>
            <p className="text-xs text-muted-foreground">Last hour</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Connected</div>
            <p className="text-xs text-muted-foreground">MongoDB</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Resource Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.map((metric) => (
                <div key={metric.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{metric.name}</span>
                    <span className={`text-sm ${getStatusColor(metric.status)}`}>{metric.value}</span>
                  </div>
                  <Progress
                    value={parseInt(metric.value)}
                    className={`h-2 ${
                      metric.status === "healthy" ? "" : metric.status === "warning" ? "[--variant-destructive:theme(colors.yellow.500)]" : "[--variant-destructive:theme(colors.red.500)]"
                    }`}
                  />
                </div>
              ))}
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
                <div key={ep.path} className="flex items-center justify-between p-3 rounded-md border">
                  <div>
                    <p className="font-medium text-sm">{ep.path}</p>
                    <p className="text-xs text-muted-foreground">{ep.method}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono">{ep.avgResponse}ms</p>
                    {getStatusBadge(ep.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sessions.map((session, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-md border">
                <div>
                  <p className="font-medium">{session.user}</p>
                  <p className="text-xs text-muted-foreground">{session.role} · {session.ip}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{session.duration}</p>
                  <p className="text-xs text-muted-foreground">Started {session.started}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}