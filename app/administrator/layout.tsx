"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Building2, Tag, Percent, Target, FileText, Wallet, BarChart3, Settings, LogOut, User, HardDrive, Bell, RefreshCw, Database, Activity, ClipboardList } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { NotificationBell } from "@/components/notification-bell";

const sidebarItems = [
  { href: "/administrator", label: "Dashboard", icon: LayoutDashboard },
  { href: "/administrator/users", label: "Users", icon: Users },
  { href: "/administrator/sync", label: "Database Sync", icon: RefreshCw },
  { href: "/administrator/backups", label: "Backups", icon: HardDrive },
  { href: "/administrator/audit-logs", label: "Audit Logs", icon: ClipboardList },
  { href: "/administrator/health", label: "System Health", icon: Activity },
  { href: "/administrator/settings", label: "Settings", icon: Settings },
  { href: "/administrator/profile", label: "Profile", icon: User },
];

export default function AdministratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Incentive.io</h2>
              <p className="text-sm text-muted-foreground">SuperAdmin</p>
            </div>
            <NotificationBell />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {sidebarItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={pathname === item.href}>
                  <Link href={item.href} className="flex items-center gap-3 px-3 py-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2 w-full text-left text-red-500 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}