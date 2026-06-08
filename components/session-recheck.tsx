"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export function SessionRecheck({ interval = 60000 }: { interval?: number }) {
  const { data: session, update } = useSession();
  useEffect(() => {
    if (!session) return;

    const checkSession = async () => {
      try {
        const result = await update();
        if (result && (result as any)?.user?.isActive === false) {
          await fetch("/api/auth/signout", { method: "POST" });
          window.location.href = "/login";
          return;
        }
      } catch (error) {
        console.error("Session re-check failed:", error);
      }
    };

    checkSession();
    const timer = setInterval(checkSession, interval);

    return () => clearInterval(timer);
  }, [session, update, interval]);

  return null;
}