"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

// Proper TypeScript interfaces for SSE payloads
interface SSEConnectedPayload {
  clientId: string;
}

interface SSEMessage {
  type: string;
  payload: unknown;
}

type SSEEventHandler = (payload: unknown) => void;

interface UseSSEOptions {
  onNotification?: SSEEventHandler;
  onSaleUpdate?: SSEEventHandler;
  onCommissionUpdate?: SSEEventHandler;
  onWalletUpdate?: SSEEventHandler;
  onDashboardRefresh?: SSEEventHandler;
  onConnected?: (clientId: string) => void;
  onError?: (error: Event) => void;
}

export function useSSE(options: UseSSEOptions = {}) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 3000;

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: SSEMessage = JSON.parse(event.data);

      switch (message.type) {
        case "connected":
          const connectedPayload = message.payload as SSEConnectedPayload;
          setClientId(connectedPayload.clientId);
          optionsRef.current.onConnected?.(connectedPayload.clientId);
          break;
        case "notification.new":
          optionsRef.current.onNotification?.(message.payload);
          break;
        case "sale.created":
        case "sale.updated":
        case "sale.approved":
        case "sale.rejected":
          optionsRef.current.onSaleUpdate?.(message.payload);
          break;
        case "commission.calculated":
          optionsRef.current.onCommissionUpdate?.(message.payload);
          break;
        case "wallet.updated":
          optionsRef.current.onWalletUpdate?.(message.payload);
          break;
        case "dashboard.refresh":
          optionsRef.current.onDashboardRefresh?.(message.payload);
          break;
      }
    } catch (error) {
      console.error("Failed to parse SSE message:", error);
    }
  }, []);

  const connectRef = useRef<() => void>(() => {});

  const connect = useCallback(() => {
    if (!session?.user?.id || eventSourceRef.current) {
      return;
    }

    const eventSource = new EventSource("/api/events", {
      withCredentials: true,
    });

    eventSource.onopen = () => {
      setIsConnected(true);
      retryCountRef.current = 0;
    };

    eventSource.onmessage = handleMessage;

    eventSource.onerror = () => {
      console.error("SSE connection error");
      setIsConnected(false);
      optionsRef.current.onError?.(new Event("error"));

      eventSourceRef.current?.close();
      eventSourceRef.current = null;

      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        const delay = RETRY_DELAY * Math.pow(2, retryCountRef.current - 1);
        retryTimeoutRef.current = setTimeout(() => {
          connectRef.current();
        }, delay);
      }
    };

    eventSourceRef.current = eventSource;
  }, [session?.user?.id, handleMessage]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    setClientId(null);
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    clientId,
  };
}
