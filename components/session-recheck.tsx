"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";

export function SessionRecheck({ interval = 60000 }: { interval?: number }) {
  const { data: session, update } = useSession();
  const sessionRef = useRef(session);
  const updateRef = useRef(update);

  useEffect(() => {
    sessionRef.current = session;
    updateRef.current = update;
  });

  useEffect(() => {
    const checkSession = async () => {
      if (!sessionRef.current) return;
      try {
        const result = await updateRef.current();
        if (result && (result as any)?.user?.isActive === false) {
          signOut({ callbackUrl: "/login" });
        }
      } catch (error) {
        console.error("Session re-check failed:", error);
      }
    };

    if (session) checkSession();
    const timer = setInterval(checkSession, interval);
    return () => clearInterval(timer);
  }, [interval]);

  return null;
}