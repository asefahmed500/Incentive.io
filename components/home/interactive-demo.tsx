"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Users,
  Wallet,
  BarChart3,
  CheckCircle,
  DollarSign,
  Target,
  PieChart,
  LineChart,
  ArrowRight,
  Plus,
} from "lucide-react";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart as RechartsBar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart as RechartsLine,
  Line,
  Area,
  AreaChart,
} from "recharts";

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899"];

// Commission rates based on achievement
const getCommissionRate = (achievement: number) => {
  if (achievement < 50) return 0;
  if (achievement < 60) return 2;
  if (achievement < 70) return 3;
  if (achievement < 80) return 4;
  if (achievement < 90) return 5;
  return 5;
};

const calculateCommission = (salesAmount: number, achievement: number) => {
  const rate = getCommissionRate(achievement);
  return (salesAmount * rate) / 100;
};

// Demo data generators
const generateSalesData = () => [
  { month: "Jan", sales: 150000, commission: 4500 },
  { month: "Feb", sales: 180000, commission: 5400 },
  { month: "Mar", sales: 220000, commission: 8800 },
  { month: "Apr", sales: 195000, commission: 7800 },
  { month: "May", sales: 260000, commission: 13000 },
  { month: "Jun", sales: 285000, commission: 14250 },
];

const generateTeamData = () => [
  { name: "Jamal", sales: 450000, target: 500000, achievement: 90 },
  { name: "Fatima", sales: 380000, target: 400000, achievement: 95 },
  { name: "Karim", sales: 290000, target: 350000, achievement: 83 },
  { name: "Nasrin", sales: 410000, target: 450000, achievement: 91 },
  { name: "Rahim", sales: 350000, target: 400000, achievement: 88 },
];

const generateStatusData = (pending: number, approved: number, rejected: number) => [
  { name: "Approved", value: approved, color: "#10b981" },
  { name: "Pending", value: pending, color: "#f59e0b" },
  { name: "Rejected", value: rejected, color: "#ef4444" },
];

const activities = [
  { action: "New sale: ৳45,000", user: "Jamal Hassan", role: "Executive", time: "2 min ago", type: "sale" },
  { action: "Approved 3 sales", user: "Fatima Rahman", role: "Manager", time: "15 min ago", type: "approval" },
  { action: "Commission: ৳12,500 paid", user: "Karim Uddin", role: "Finance", time: "1 hour ago", type: "commission" },
  { action: "Target achieved!", user: "Nasrin Akter", role: "Executive", time: "2 hours ago", type: "achievement" },
];

export function InteractiveDemo() {
  const [activeTab, setActiveTab] = useState<"executive" | "manager" | "admin">("executive");

  // Executive Demo State
  const [executiveSales, setExecutiveSales] = useState(500000);
  const [executiveTarget, setExecutiveTarget] = useState(500000);
  const [newSaleAmount, setNewSaleAmount] = useState("");
  const [recentSales, setRecentSales] = useState([
    { id: 1, company: "Tech Corp", amount: 45000, commission: 2250, status: "Approved" },
    { id: 2, company: "Data Systems", amount: 78000, commission: 3900, status: "Pending" },
    { id: 3, company: "Cloud Solutions", amount: 32000, commission: 1600, status: "Approved" },
  ]);

  // Manager Demo State
  const [teamData] = useState(generateTeamData());

  // Admin Demo State
  const [adminStats] = useState({
    totalUsers: 156,
    totalTeams: 12,
    totalSales: 12500000,
    pendingApprovals: 23,
    systemHealth: 98,
  });

  // Calculations for Executive Dashboard
  const executiveAchievement = (executiveSales / executiveTarget) * 100;
  const executiveCommissionRate = getCommissionRate(executiveAchievement);
  const executiveCommission = calculateCommission(executiveSales, executiveAchievement);
  const executivePendingCommission = recentSales.filter((s) => s.status === "Pending").reduce((sum, s) => sum + s.commission, 0);

  // Add new sale handler
  const handleAddSale = () => {
    const amount = parseFloat(newSaleAmount);
    if (amount && amount > 0) {
      const commission = calculateCommission(amount, executiveAchievement);
      setRecentSales([
        ...recentSales,
        {
          id: recentSales.length + 1,
          company: "New Company",
          amount,
          commission,
          status: "Pending",
        },
      ]);
      setExecutiveSales(executiveSales + amount);
      setNewSaleAmount("");
    }
  };

  // Update target handler
  const handleUpdateTarget = () => {
    if (executiveTarget > 0) {
      setExecutiveTarget(executiveTarget);
    }
  };

  return (
    <section id="demo" className="py-20 sm:py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400 border-sky-200 dark:border-sky-800">
            Interactive Demo
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            See It In Action
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Experience our powerful dashboards with real-time calculations and interactive visualizations
          </p>
        </motion.div>

        {/* Role Tabs */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {[
            { key: "executive", label: "Sales Executive", icon: TrendingUp, color: "from-sky-500 to-blue-600" },
            { key: "manager", label: "Sales Manager", icon: Users, color: "from-emerald-500 to-green-600" },
            { key: "admin", label: "Administrator", icon: BarChart3, color: "from-purple-500 to-violet-600" },
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "outline"}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`rounded-full px-6 capitalize ${
                activeTab === tab.key ? `bg-gradient-to-r ${tab.color} text-white shadow-lg` : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Dashboard Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Executive Dashboard */}
            {activeTab === "executive" && (
              <div className="space-y-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-sky-500 to-blue-600 text-white border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sky-100 text-sm">Total Sales</p>
                          <p className="text-3xl font-bold mt-1">৳{(executiveSales / 1000).toFixed(0)}K</p>
                        </div>
                        <DollarSign className="w-10 h-10 text-white/80" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Achievement</p>
                          <p className="text-3xl font-bold mt-1">{executiveAchievement.toFixed(1)}%</p>
                        </div>
                        <Target className="w-10 h-10 text-sky-600" />
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{executiveAchievement.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <motion.div
                            className="bg-gradient-to-r from-sky-500 to-blue-600 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(executiveAchievement, 100)}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Commission Rate</p>
                          <p className="text-3xl font-bold mt-1">{executiveCommissionRate}%</p>
                        </div>
                        <Wallet className="w-10 h-10 text-green-600" />
                      </div>
                      <Badge className="mt-2" variant={executiveAchievement >= 50 ? "default" : "secondary"}>
                        {executiveAchievement >= 50 ? "Eligible" : "Not Eligible"}
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Commission</p>
                          <p className="text-3xl font-bold mt-1 text-green-600">৳{executiveCommission.toLocaleString()}</p>
                        </div>
                        <TrendingUp className="w-10 h-10 text-green-600" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">৳{executivePendingCommission.toLocaleString()} pending</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Interactive Calculator */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-sky-600" />
                      Commission Calculator
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Adjust your sales and see how it affects your commission</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="sales-input">Current Sales Amount (৳)</Label>
                          <Input
                            id="sales-input"
                            type="number"
                            value={executiveSales}
                            onChange={(e) => setExecutiveSales(Number(e.target.value))}
                            className="text-lg"
                            min={0}
                            step={10000}
                          />
                        </div>
                        <div>
                          <Label htmlFor="target-input">Sales Target (৳)</Label>
                          <Input
                            id="target-input"
                            type="number"
                            value={executiveTarget}
                            onChange={(e) => setExecutiveTarget(Number(e.target.value))}
                            className="text-lg"
                            min={0}
                            step={50000}
                          />
                        </div>
                        <div className="p-4 bg-sky-50 dark:bg-sky-950/30 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Your Commission</span>
                            <span className="text-2xl font-bold text-sky-600">৳{executiveCommission.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Rate: {executiveCommissionRate}%</span>
                            <span>Achievement: {executiveAchievement.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <ResponsiveContainer width="100%" height={200}>
                          <AreaChart data={generateSalesData()}>
                            <defs>
                              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" style={{ fontSize: 12 }} />
                            <YAxis style={{ fontSize: 12 }} />
                            <Tooltip formatter={(value) => `৳${(value || 0).toLocaleString()}`} />
                            <Area type="monotone" dataKey="sales" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSales)" name="Sales" />
                            <Area type="monotone" dataKey="commission" stroke="#10b981" fillOpacity={1} fill="url(#colorCommission)" name="Commission" />
                          </AreaChart>
                        </ResponsiveContainer>
                        <p className="text-center text-xs text-muted-foreground mt-2">Sales vs Commission Trends (6 months)</p>
                      </div>
                    </div>

                    {/* Commission Rate Breakdown */}
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-semibold mb-3 text-sm">Commission Rates by Achievement</h4>
                      <div className="space-y-2">
                        {[
                          { range: "0-49%", rate: "0%", color: "bg-gray-300 dark:bg-gray-700" },
                          { range: "50-59%", rate: "2%", color: "bg-yellow-400 dark:bg-yellow-600" },
                          { range: "60-69%", rate: "3%", color: "bg-lime-400 dark:bg-lime-600" },
                          { range: "70-79%", rate: "4%", color: "bg-emerald-400 dark:bg-emerald-600" },
                          { range: "80-89%", rate: "5%", color: "bg-sky-400 dark:bg-sky-600" },
                          { range: "90%+", rate: "5%", color: "bg-blue-500 dark:bg-blue-600" },
                        ].map((tier) => (
                          <div key={tier.range} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className={`w-20 h-2 rounded ${tier.color}`} />
                              <span className="text-gray-600 dark:text-gray-400">{tier.range}</span>
                            </div>
                            <span className="font-semibold">{tier.rate}</span>
                          </div>
                        ))}
                      </div>
                      <Badge className="mt-3" variant={executiveAchievement >= 50 ? "default" : "secondary"}>
                        Current: {executiveAchievement.toFixed(1)}% → {executiveCommissionRate}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Sales */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentSales.map((sale) => (
                        <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{sale.company}</p>
                            <p className="text-sm text-muted-foreground">৳{sale.amount.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">৳{sale.commission.toLocaleString()}</p>
                            <Badge variant={sale.status === "Approved" ? "default" : "secondary"} className="text-xs">
                              {sale.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Manager Dashboard */}
            {activeTab === "manager" && (
              <div className="space-y-6">
                {/* Manager Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Team Members</p>
                          <p className="text-3xl font-bold mt-1">{teamData.length}</p>
                        </div>
                        <Users className="w-10 h-10 text-emerald-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Team Sales</p>
                          <p className="text-3xl font-bold mt-1">৳{(teamData.reduce((sum, m) => sum + m.sales, 0) / 1000000).toFixed(1)}M</p>
                        </div>
                        <TrendingUp className="w-10 h-10 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Avg Achievement</p>
                          <p className="text-3xl font-bold mt-1">{(teamData.reduce((sum, m) => sum + m.achievement, 0) / teamData.length).toFixed(0)}%</p>
                        </div>
                        <Target className="w-10 h-10 text-emerald-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Pending Approvals</p>
                          <p className="text-3xl font-bold mt-1 text-yellow-600">5</p>
                        </div>
                        <CheckCircle className="w-10 h-10 text-yellow-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Team Performance Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Team Performance Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={teamData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" style={{ fontSize: 12 }} />
                        <YAxis style={{ fontSize: 12 }} />
                        <Tooltip formatter={(value) => `৳${(value || 0).toLocaleString()}`} />
                        <Bar dataKey="sales" fill="#10b981" name="Sales" />
                        <Bar dataKey="target" fill="#e5e7eb" name="Target" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Team Member Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Member Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {teamData.map((member) => (
                        <div key={member.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">৳{member.sales.toLocaleString()} / ৳{member.target.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{member.achievement}%</p>
                            <Badge variant={member.achievement >= 80 ? "default" : member.achievement >= 50 ? "secondary" : "destructive"} className="text-xs">
                              {member.achievement >= 80 ? "On Track" : member.achievement >= 50 ? "Needs Focus" : "At Risk"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Admin Dashboard */}
            {activeTab === "admin" && (
              <div className="space-y-6">
                {/* Admin Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Users</p>
                          <p className="text-3xl font-bold mt-1">{adminStats.totalUsers}</p>
                        </div>
                        <Users className="w-10 h-10 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Teams</p>
                          <p className="text-3xl font-bold mt-1">{adminStats.totalTeams}</p>
                        </div>
                        <Users className="w-10 h-10 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Sales</p>
                          <p className="text-3xl font-bold mt-1">৳{(adminStats.totalSales / 1000000).toFixed(1)}M</p>
                        </div>
                        <DollarSign className="w-10 h-10 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Pending Approvals</p>
                          <p className="text-3xl font-bold mt-1 text-yellow-600">{adminStats.pendingApprovals}</p>
                        </div>
                        <CheckCircle className="w-10 h-10 text-yellow-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* System Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Sales Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={generateStatusData(adminStats.pendingApprovals * 3, adminStats.totalSales * 0.8, adminStats.pendingApprovals)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                          >
                            {generateStatusData(adminStats.pendingApprovals * 3, adminStats.totalSales * 0.8, adminStats.pendingApprovals).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent System Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {activities.map((activity, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${
                                activity.type === "sale" ? "bg-blue-500" :
                                activity.type === "approval" ? "bg-green-500" :
                                activity.type === "commission" ? "bg-purple-500" :
                                "bg-yellow-500"
                              }`} />
                              <div>
                                <p className="text-sm font-medium">{activity.action}</p>
                                <p className="text-xs text-muted-foreground">{activity.user} • {activity.role}</p>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">{activity.time}</span>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Role Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>User Role Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart layout="vertical" data={[
                        { role: "Sales Executive", count: 98, color: "#3b82f6" },
                        { role: "Sales Manager", count: 24, color: "#10b981" },
                        { role: "Accountant", count: 12, color: "#f59e0b" },
                        { role: "Finance", count: 10, color: "#8b5cf6" },
                        { role: "Admin", count: 8, color: "#ef4444" },
                        { role: "Administrator", count: 4, color: "#ec4899" },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="role" style={{ fontSize: 11 }} />
                        <YAxis style={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8884c8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Ready to transform your commission management?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:opacity-90">
              Start Free Trial
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-full">
              Schedule Demo
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
