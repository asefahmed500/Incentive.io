"use client";

import { cn } from "@/lib/utils";

interface AuthBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Animated gradient background component for auth pages
 * Matches the homepage hero section design with sky blue, emerald, and purple orbs
 */
export function AuthBackground({ children, className }: AuthBackgroundProps) {
  return (
    <div className={cn(
      "relative min-h-screen flex items-center justify-center overflow-hidden",
      "bg-gradient-to-br from-sky-50 via-white to-blue-50",
      "dark:from-gray-950 dark:via-gray-900 dark:to-gray-950",
      className
    )}>
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Sky blue orb */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-sky-200/30 dark:bg-sky-900/20 blur-3xl animate-pulse" />

        {/* Emerald orb */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] rounded-full bg-emerald-200/30 dark:bg-emerald-900/20 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

        {/* Purple orb */}
        <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] rounded-full bg-purple-200/20 dark:bg-purple-900/20 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Content - centered */}
      <div className="relative z-10 flex items-center justify-center w-full h-full px-4">
        {children}
      </div>
    </div>
  );
}
