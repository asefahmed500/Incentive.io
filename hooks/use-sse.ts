"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

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
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 3000;

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

    eventSource.onmessage = (event) => {
      try {
        const message: SSEMessage = JSON.parse(event.data);

        switch (message.type) {
          case "connected":
            setClientId((message.payload as any).clientId);
            options.onConnected?.((message.payload as any).clientId);
            break;
          case "notification.new":
            options.onNotification?.(message.payload);
            break;
          case "sale.created":
          case "sale.updated":
          case "sale.approved":
          case "sale.rejected":
            options.onSaleUpdate?.(message.payload);
            break;
          case "commission.calculated":
            options.onCommissionUpdate?.(message.payload);
            break;
          case "wallet.updated":
            options.onWalletUpdate?.(message.payload);
            break;
          case "dashboard.refresh":
            options.onDashboardRefresh?.(message.payload);
            break;
        }
      } catch (error) {
        console.error("Failed to parse SSE message:", error);
      }
    };

    eventSource.onerror = () => {
      console.error("SSE connection error");
      setIsConnected(false);
      options.onError?.(new Event("error"));

      eventSourceRef.current?.close();
      eventSourceRef.current = null;

      // Retry connection with exponential backoff
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        const delay = RETRY_DELAY * Math.pow(2, retryCountRef.current - 1);
        retryTimeoutRef.current = setTimeout(() => {
          // Recreate connection without accessing connect callback
          if (!session?.user?.id || eventSourceRef.current) {
            return;
          }

          const retryEventSource = new EventSource("/api/events", {
            withCredentials: true,
          });

          retryEventSource.onopen = () => {
            setIsConnected(true);
            retryCountRef.current = 0;
          };

          retryEventSource.onmessage = (event) => {
            try {
              const message: SSEMessage = JSON.parse(event.data);

              switch (message.type) {
                case "connected":
                  setClientId((message.payload as any).clientId);
                  options.onConnected?.((message.payload as any).clientId);
                  break;
                case "notification.new":
                  options.onNotification?.(message.payload);
                  break;
                case "sale.created":
                case "sale.updated":
                case "sale.approved":
                case "sale.rejected":
                  options.onSaleUpdate?.(message.payload);
                  break;
                case "commission.calculated":
                  options.onCommissionUpdate?.(message.payload);
                  break;
                case "wallet.updated":
                  options.onWalletUpdate?.(message.payload);
                  break;
                case "dashboard.refresh":
                  options.onDashboardRefresh?.(message.payload);
                  break;
              }
            } catch (err) {
              console.error("Failed to parse SSE message:", err);
            }
          };

          retryEventSource.onerror = () => {
            console.error("SSE connection error");
            setIsConnected(false);
            options.onError?.(new Event("error"));
            retryEventSource.close();
          };

          eventSourceRef.current = retryEventSource;
        }, delay);
      }
    };

    eventSourceRef.current = eventSource;
  }, [session?.user?.id, options]);

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
