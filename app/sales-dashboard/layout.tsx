"use client";

import Link from "next/link";
import { LayoutDashboard, FileText, Target, Wallet, Users, BarChart3, LogOut, User, Bell } from "lucide-react";
import { signOut } from "next-auth/react";
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
  { href: "/sales-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sales-dashboard/records", label: "My Records", icon: FileText },
  { href: "/sales-dashboard/targets", label: "Targets", icon: Target },
  { href: "/sales-dashboard/commissions", label: "Commissions", icon: Wallet },
  { href: "/sales-dashboard/wallet", label: "Wallet", icon: Wallet },
  { href: "/sales-dashboard/manager-info", label: "Manager Info", icon: Users },
  { href: "/sales-dashboard/profile", label: "Profile", icon: User },
];

export default function SalesDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">incentivio</h2>
              <p className="text-sm text-muted-foreground">Sales Executive</p>
            </div>
            <NotificationBell />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton asChild>
                      <span>
                        <Icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
