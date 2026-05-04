"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Wallet, BarChart3, LogOut, User, Percent } from "lucide-react";
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
  SidebarInset,
} from "@/components/ui/sidebar";
import { NotificationBell } from "@/components/notification-bell";

const sidebarItems = [
  { href: "/finance", label: "Dashboard", icon: LayoutDashboard },
  { href: "/finance/approvals", label: "Approval Queue", icon: FileText },
  { href: "/finance/payment-queue", label: "Payment Queue", icon: Wallet },
  { href: "/finance/payments", label: "Payment History", icon: Wallet },
  { href: "/finance/commissions", label: "Commissions", icon: Wallet },
  { href: "/finance/sales-records", label: "Sales Records", icon: FileText },
  { href: "/finance/wallets", label: "Wallets", icon: Wallet },
  { href: "/finance/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/finance/commission-rules", label: "Commission Rules", icon: Percent },
  { href: "/finance/profile", label: "Profile", icon: User },
];

export default function FinanceLayout({
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
              <p className="text-sm text-muted-foreground">Finance</p>
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
