"use client";

import { useSSE } from "@/hooks/use-sse";

/**
 * SSE Connection Indicator
 * Shows real-time connection status for SSE (Server-Sent Events)
 * Displays green when connected, red when disconnected/reconnecting
 */
export function SSEConnectionIndicator() {
  const { isConnected } = useSSE();

  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className={`h-2 w-2 rounded-full transition-colors ${
          isConnected ? "bg-green-500" : "bg-red-500"
        }`}
        aria-label={isConnected ? "Connected to real-time updates" : "Disconnected from real-time updates"}
        aria-live="polite"
      />
      <span className={isConnected ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
        {isConnected ? "Live" : "Reconnecting..."}
      </span>
    </div>
  );
}
