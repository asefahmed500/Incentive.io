"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function SessionRecheck({ interval = 60000 }: { interval?: number }) {
  const { data: session, update } = useSession();
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    if (!session) return;

    const checkSession = async () => {
      try {
        await update(); // Re-fetch session from server
        setLastCheck(new Date());
      } catch (error) {
        console.error("Session re-check failed:", error);
      }
    };

    checkSession(); // Initial check
    const timer = setInterval(checkSession, interval);

    return () => clearInterval(timer);
  }, [session, update, interval]);

  return null; // This component renders nothing
}
