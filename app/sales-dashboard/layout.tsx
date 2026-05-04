"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Target, Wallet, Users, LogOut, User, Plus, CheckCircle, Percent } from "lucide-react";
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
  { href: "/sales-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sales-dashboard/add-record", label: "Add Record", icon: Plus },
  { href: "/sales-dashboard/records", label: "My Records", icon: FileText },
  { href: "/sales-dashboard/targets", label: "Targets", icon: Target },
  { href: "/sales-dashboard/eligibility", label: "Eligibility", icon: CheckCircle },
  { href: "/sales-dashboard/commission-rules", label: "Commission Rules", icon: Percent },
  { href: "/sales-dashboard/commissions", label: "Commissions", icon: Wallet },
  { href: "/sales-dashboard/approved-sales", label: "Approved Sales", icon: CheckCircle },
  { href: "/sales-dashboard/wallet", label: "Wallet", icon: Wallet },
  { href: "/sales-dashboard/manager-info", label: "Manager Info", icon: Users },
  { href: "/sales-dashboard/profile", label: "Profile", icon: User },
];

export default function SalesDashboardLayout({
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
                    <SidebarMenuButton asChild isActive={pathname === item.href}>
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
              <SidebarMenuButton onClick={() => signOut({ callbackUrl: "/login" })}>
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
