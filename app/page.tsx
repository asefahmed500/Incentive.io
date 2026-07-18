"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  Target,
  Users,
  BarChart3,
  Settings,
  Bell,
  Search,
  ArrowUpRight,
  DollarSign,
  ShoppingCart,
  Clock,
  CheckCircle2,
  Menu,
  LogIn,
  UserPlus,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Line, LineChart } from "recharts";

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Sales Records", icon: ShoppingCart },
  { label: "Commissions", icon: Wallet },
  { label: "Targets", icon: Target },
  { label: "Team", icon: Users },
  { label: "Analytics", icon: BarChart3 },
  { label: "Settings", icon: Settings },
];

const statCards = [
  {
    title: "Total Revenue",
    value: "$284,520",
    change: "+12.5%",
    icon: DollarSign,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    title: "Active Deals",
    value: "1,284",
    change: "+8.2%",
    icon: ShoppingCart,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
  },
  {
    title: "Pending Approvals",
    value: "23",
    change: "-3.1%",
    icon: Clock,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    title: "Commission Payouts",
    value: "$48,920",
    change: "+18.7%",
    icon: Wallet,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
];

const weeklyRevenue = [
  { day: "Mon", revenue: 12400, target: 10000 },
  { day: "Tue", revenue: 18200, target: 10000 },
  { day: "Wed", revenue: 15100, target: 10000 },
  { day: "Thu", revenue: 22100, target: 10000 },
  { day: "Fri", revenue: 19800, target: 10000 },
  { day: "Sat", revenue: 14200, target: 10000 },
  { day: "Sun", revenue: 9800, target: 10000 },
];

const monthlyPerformance = [
  { month: "Jan", sales: 65, commissions: 28 },
  { month: "Feb", sales: 59, commissions: 24 },
  { month: "Mar", sales: 80, commissions: 35 },
  { month: "Apr", sales: 81, commissions: 36 },
  { month: "May", sales: 56, commissions: 22 },
  { month: "Jun", sales: 55, commissions: 20 },
  { month: "Jul", sales: 72, commissions: 30 },
];

const recentSales = [
  { company: "Acme Corp", amount: "$12,400", rep: "Sarah Chen", status: "Approved" as const, date: "Today" },
  { company: "Globex Inc", amount: "$8,200", rep: "Mike Torres", status: "Pending" as const, date: "Today" },
  { company: "Initech", amount: "$5,600", rep: "Lisa Park", status: "Approved" as const, date: "Yesterday" },
  { company: "Umbrella Co", amount: "$15,800", rep: "James Wilson", status: "Pending" as const, date: "Yesterday" },
  { company: "Stark Industries", amount: "$9,300", rep: "Natasha Romanoff", status: "Approved" as const, date: "2 days ago" },
];

const statusStyles = {
  Approved: "bg-emerald-500/10 text-emerald-400",
  Pending: "bg-amber-500/10 text-amber-400",
  Rejected: "bg-red-500/10 text-red-400",
};

const teamLeaderboard = [
  { name: "Sarah Chen", deals: 24, revenue: "$142k", avatar: "SC" },
  { name: "Mike Torres", deals: 18, revenue: "$98k", avatar: "MT" },
  { name: "Lisa Park", deals: 21, revenue: "$115k", avatar: "LP" },
  { name: "James Wilson", deals: 15, revenue: "$76k", avatar: "JW" },
  { name: "Natasha Romanoff", deals: 27, revenue: "$158k", avatar: "NR" },
];

export default function LandingPage() {
  const [activeNav, setActiveNav] = useState("Dashboard");

  return (
    <div className="dark min-h-screen bg-[#0a0a0f] text-[#e5e7eb] font-sans">
      <SidebarProvider>
        <Sidebar className="border-r border-white/5">
          <SidebarHeader className="p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-bold">I</span>
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Incentive.io</h2>
                <p className="text-xs text-gray-500">Commission Management</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.active || activeNav === item.label;
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setActiveNav(item.label)}
                      className="text-sm"
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-sky-400" : "text-gray-500"}`} />
                      <span className={isActive ? "text-white font-medium" : "text-gray-400"}>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-white/5">
            <div className="flex flex-col gap-2">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/5"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="w-full bg-sky-600 hover:bg-sky-500 text-white">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Get Started
                </Button>
              </Link>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          {/* Top header bar */}
          <header className="flex h-14 items-center gap-3 px-4 border-b border-white/5 bg-[#0a0a0f] sticky top-0 z-10">
            <SidebarTrigger className="-ml-1 text-gray-400 hover:text-white">
              <Menu className="w-5 h-5" />
            </SidebarTrigger>
            <Separator orientation="vertical" className="h-5 bg-white/5" />
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search records, teams..."
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-400" />
              </button>
              <div className="flex items-center gap-2 pl-2 border-l border-white/5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-xs font-semibold text-white">
                  JD
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-white">John Doe</p>
                  <p className="text-xs text-gray-500">Sales Executive</p>
                </div>
              </div>
            </div>
          </header>

          {/* Main content */}
          <div className="flex-1 overflow-auto p-6 space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-white tracking-[-0.02em]">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Welcome back, John. Here&apos;s your overview.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 bg-white/5 px-3 py-1.5 rounded-lg">
                  Last 30 days
                </span>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={stat.title}
                    className="bg-[#12121a] border-white/5 hover:border-white/10 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">{stat.title}</p>
                          <p className="text-2xl font-bold text-white mt-1.5">{stat.value}</p>
                          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3" />
                            {stat.change}
                          </p>
                        </div>
                        <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                          <Icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Revenue chart */}
              <Card className="bg-[#12121a] border-white/5">
                <CardHeader className="p-4 pb-0">
                  <CardTitle className="text-sm font-medium text-gray-300">
                    Weekly Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={weeklyRevenue}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                      <XAxis dataKey="day" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{
                          background: "#1a1a2e",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        labelStyle={{ color: "#e5e7eb" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#38bdf8"
                        strokeWidth={2}
                        fill="url(#revenueGrad)"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="target"
                        stroke="#6b7280"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Performance chart */}
              <Card className="bg-[#12121a] border-white/5">
                <CardHeader className="p-4 pb-0">
                  <CardTitle className="text-sm font-medium text-gray-300">
                    Monthly Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={monthlyPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                      <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: "#1a1a2e",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        labelStyle={{ color: "#e5e7eb" }}
                      />
                      <Bar dataKey="sales" fill="#38bdf8" radius={[4, 4, 0, 0]} opacity={0.8} />
                      <Bar dataKey="commissions" fill="#a78bfa" radius={[4, 4, 0, 0]} opacity={0.8} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Bottom row: Recent sales + Team leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Recent sales table */}
              <Card className="bg-[#12121a] border-white/5">
                <CardHeader className="p-4 pb-0">
                  <CardTitle className="text-sm font-medium text-gray-300 flex items-center justify-between">
                    Recent Sales
                    <Link href="/sales-dashboard/records" className="text-xs text-sky-400 hover:text-sky-300">
                      View all
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="text-left px-3 py-2.5 text-gray-500 font-medium text-xs uppercase tracking-wider">Company</th>
                          <th className="text-left px-3 py-2.5 text-gray-500 font-medium text-xs uppercase tracking-wider">Amount</th>
                          <th className="text-left px-3 py-2.5 text-gray-500 font-medium text-xs uppercase tracking-wider">Rep</th>
                          <th className="text-left px-3 py-2.5 text-gray-500 font-medium text-xs uppercase tracking-wider">Status</th>
                          <th className="text-left px-3 py-2.5 text-gray-500 font-medium text-xs uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentSales.map((sale) => (
                          <tr key={sale.company} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                            <td className="px-3 py-3 text-white font-medium">{sale.company}</td>
                            <td className="px-3 py-3 text-gray-300">{sale.amount}</td>
                            <td className="px-3 py-3 text-gray-400">{sale.rep}</td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[sale.status]}`}>
                                {sale.status === "Approved" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                                {sale.status}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-gray-500">{sale.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Team leaderboard */}
              <Card className="bg-[#12121a] border-white/5">
                <CardHeader className="p-4 pb-0">
                  <CardTitle className="text-sm font-medium text-gray-300">
                    Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {teamLeaderboard.map((member, i) => (
                      <div
                        key={member.name}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.02] transition-colors"
                      >
                        <span className="text-xs text-gray-500 w-5 font-mono">{i + 1}</span>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-xs font-medium text-gray-300">
                          {member.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.deals} deals</p>
                        </div>
                        <span className="text-sm font-semibold text-emerald-400">{member.revenue}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
