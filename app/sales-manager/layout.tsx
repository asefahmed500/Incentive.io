"use client";

import Link from "next/link";
import { LayoutDashboard, Users, Building2, FileText, Percent, Target, Wallet, BarChart3, Settings, LogOut, User, Bell } from "lucide-react";
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
  SidebarInset,
} from "@/components/ui/sidebar";
import { NotificationBell } from "@/components/notification-bell";

const sidebarItems = [
  { href: "/sales-manager", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sales-manager/team", label: "Team", icon: Users },
  { href: "/sales-manager/pending-approvals", label: "Approvals", icon: FileText },
  { href: "/sales-manager/team-sales", label: "Team Sales", icon: BarChart3 },
  { href: "/sales-manager/my-commissions", label: "My Commissions", icon: Wallet },
  { href: "/sales-manager/profile", label: "Profile", icon: User },
];

export default function SalesManagerLayout({
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
              <p className="text-sm text-muted-foreground">Sales Manager</p>
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
