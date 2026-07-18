"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  ChevronDown,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Wallet,
  Target,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { EnhancedHero } from "@/components/home/enhanced-hero";
import { Testimonials } from "@/components/home/testimonials";
import { SocialProof } from "@/components/home/social-proof";
import { InteractiveDemo } from "@/components/home/interactive-demo";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-sky-600 focus:text-white focus:rounded-md focus:font-medium focus:text-decoration-none"
    >
      Skip to main content
    </a>
  );
}

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}

function NavLink({ href, children, onClick }: NavLinkProps) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="px-4 py-2 text-gray-600 hover:text-sky-600 transition-colors rounded-full hover:bg-sky-50 font-medium text-sm"
    >
      {children}
    </a>
  );
}

function FloatingNav() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#testimonials", label: "Testimonials" },
    { href: "#demo", label: "Demo" },
    { href: "#faq", label: "FAQ" },
  ];

  const handleLinkClick = () => setIsOpen(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
      <nav
        className="max-w-[1200px] mx-auto px-6"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl text-gray-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">I</span>
            </div>
            <span className="hidden sm:inline">Incentive.io</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink key={link.href} href={link.href}>
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm" className="rounded-full">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="rounded-full bg-sky-500 hover:bg-sky-600">
                Get Started
              </Button>
            </Link>
          </div>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-full"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs">
              <SheetHeader>
                <SheetTitle className="text-left flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">I</span>
                  </div>
                  <span>Incentive.io</span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 mt-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={handleLinkClick}
                    className="px-4 py-3 text-gray-700 dark:text-gray-200 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg font-medium transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="my-2 border-gray-200 dark:border-gray-700" />
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-gray-700 dark:text-gray-200">Theme</span>
                  <ThemeToggle />
                </div>
                <Link
                  href="/login"
                  onClick={handleLinkClick}
                  className="px-4 py-3 text-gray-700 dark:text-gray-200 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link href="/register" onClick={handleLinkClick}>
                  <Button className="w-full rounded-full bg-sky-500 hover:bg-sky-600 mt-2">
                    Get Started
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return <EnhancedHero />
}

function MockupFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <span className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-700" />
        <span className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-700" />
        <span className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

function TrackingMockup() {
  const stats = [
    { l: "Revenue", v: "$84.2k", d: "+12%" },
    { l: "Records", v: "1,284", d: "+8%" },
    { l: "Pending", v: "42", d: "-3%" },
  ];
  return (
    <MockupFrame>
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div
            key={s.l}
            className="rounded-lg border border-gray-100 dark:border-gray-800 p-3"
          >
            <p className="text-[11px] text-gray-500">{s.l}</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              {s.v}
            </p>
            <p className="text-[11px] text-sky-600">{s.d}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 h-32 rounded-lg border border-gray-100 dark:border-gray-800 p-3">
        <svg
          viewBox="0 0 300 100"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="trackFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline
            fill="url(#trackFill)"
            stroke="none"
            points="0,80 40,60 80,65 120,40 160,50 200,25 240,30 280,12 300,15 300,100 0,100"
          />
          <polyline
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="2"
            points="0,80 40,60 80,65 120,40 160,50 200,25 240,30 280,12 300,15"
          />
        </svg>
      </div>
    </MockupFrame>
  );
}

function WalletMockup() {
  const txns = [
    { n: "Commission payout", t: "Today", a: "+$2,480" },
    { n: "Batch transfer", t: "Mon", a: "+$5,120" },
    { n: "Bonus credit", t: "Fri", a: "+$980" },
  ];
  return (
    <MockupFrame>
      <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4">
        <p className="text-xs text-gray-500">Available balance</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
          $48,920.50
        </p>
        <div className="mt-3 flex gap-2">
          <span className="rounded-md bg-sky-600 px-3 py-1 text-xs font-medium text-white">
            Withdraw
          </span>
          <span className="rounded-md border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200">
            History
          </span>
        </div>
      </div>
      <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
        {txns.map((t) => (
          <div
            key={t.n}
            className="flex items-center justify-between py-3"
          >
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {t.n}
              </p>
              <p className="text-xs text-gray-500">{t.t}</p>
            </div>
            <p className="text-sm font-semibold text-sky-600">{t.a}</p>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

function TargetsMockup() {
  const rows = [
    { l: "Q1 Revenue", v: 78, amt: "$78k / $100k" },
    { l: "New Accounts", v: 100, amt: "56 / 50" },
    { l: "Retention", v: 64, amt: "64% / 100%" },
  ];
  return (
    <MockupFrame>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          Quarterly targets
        </p>
        <span className="rounded-full bg-sky-50 dark:bg-sky-900/30 px-2.5 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-300">
          On track
        </span>
      </div>
      <div className="mt-5 space-y-5">
        {rows.map((r) => (
          <div key={r.l}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-200">{r.l}</span>
              <span className="text-gray-500">{r.amt}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-sky-500"
                style={{ width: `${r.v}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

function AnalyticsMockup() {
  const bars = [40, 65, 50, 82, 55, 92, 70];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <MockupFrame>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          Performance
        </p>
        <p className="text-xs text-gray-500">Last 7 days</p>
      </div>
      <div className="mt-6 flex items-end justify-between gap-2 h-40">
        {bars.map((b, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
          >
            <div
              className="w-full rounded-t-md bg-sky-500"
              style={{ height: `${b}%` }}
            />
            <span className="text-[10px] text-gray-400">{days[i]}</span>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

interface FeatureRowProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ElementType;
  bullets: string[];
  mockup: React.ReactNode;
  reversed: boolean;
}

function FeatureRow({
  eyebrow,
  title,
  description,
  icon: Icon,
  bullets,
  mockup,
  reversed,
}: FeatureRowProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
      <div className={reversed ? "lg:order-2" : "lg:order-1"}>
        <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-800 px-3 py-1">
          <Icon className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {eyebrow}
          </span>
        </div>
        <h3 className="mt-5 text-3xl sm:text-4xl font-semibold tracking-[-0.01em] text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
          {description}
        </p>
        <ul className="mt-6 space-y-3">
          {bullets.map((b) => (
            <li
              key={b}
              className="flex items-start gap-3 text-gray-700 dark:text-gray-200"
            >
              <CheckCircle className="w-5 h-5 text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={reversed ? "lg:order-1" : "lg:order-2"}>{mockup}</div>
    </div>
  );
}

function Features() {
  const features = [
    {
      eyebrow: "Live dashboards",
      icon: TrendingUp,
      title: "Track every sale in real time",
      description:
        "Monitor team performance with live dashboards that update the moment a record is submitted \u2014 no refresh, no waiting.",
      bullets: [
        "Instant status updates across the approval pipeline",
        "Per-team and per-rep breakdowns",
        "Drill into any record in one click",
      ],
      mockup: <TrackingMockup />,
    },
    {
      eyebrow: "Automated payouts",
      icon: Wallet,
      title: "Commissions paid on autopilot",
      description:
        "Calculated, approved, and credited to each rep\u2019s wallet automatically the moment finance signs off.",
      bullets: [
        "Atomic wallet credits \u2014 no race conditions",
        "Batch or single payments",
        "Full payout history and audit trail",
      ],
      mockup: <WalletMockup />,
    },
    {
      eyebrow: "Goals & targets",
      icon: Target,
      title: "Targets that motivate, not guess",
      description:
        "Set quarterly targets and watch achievement percentages update live as approved sales roll in.",
      bullets: [
        "Tiered commission rates by achievement",
        "Automatic eligibility at the 50% threshold",
        "Re-evaluation when thresholds are crossed",
      ],
      mockup: <TargetsMockup />,
    },
    {
      eyebrow: "Smart analytics",
      icon: BarChart3,
      title: "Insights that shape your strategy",
      description:
        "Understand patterns across teams, categories, and periods with analytics built for sales leaders.",
      bullets: [
        "Trends by product category",
        "Team-vs-team benchmarking",
        "Exportable reports",
      ],
      mockup: <AnalyticsMockup />,
    },
  ];

  return (
    <section id="features" className="py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="max-w-2xl mb-16 sm:mb-24">
          <p className="text-sm font-medium text-sky-600 dark:text-sky-400">
            Features
          </p>
          <h2 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-[-0.02em] text-gray-900 dark:text-white">
            Everything you need to manage commissions
          </h2>
          <p className="mt-5 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            Powerful features designed to simplify your commission management
            workflow and maximize your team&apos;s performance.
          </p>
        </div>

        <div className="space-y-20 sm:space-y-28">
          {features.map((feature, i) => (
            <FeatureRow
              key={feature.title}
              {...feature}
              reversed={i % 2 === 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}

function FAQItem({ question, answer, isOpen, onToggle, index }: FAQItemProps) {
  return (
    <div className="border-b last:border-b-0 border-gray-200 dark:border-gray-700">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`faq-content-${index}`}
        className="w-full px-4 sm:px-6 py-4 flex items-center justify-between text-left gap-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[56px]"
      >
        <span className="font-medium text-gray-900 dark:text-white">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        id={`faq-content-${index}`}
        role="region"
        aria-hidden={!isOpen}
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <p className="px-4 sm:px-6 pb-4 text-gray-600 dark:text-gray-300 leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
}

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does commission calculation work?",
      a: "Our system automatically calculates commissions based on achievement percentage. Sales executives earn 2-5% depending on hitting 50%+ of their target. The calculation considers gross sales, applies any deductions (tax, VAT, EO/BP), and determines the commission rate based on achievement ranges.",
    },
    {
      q: "Can I customize commission rules?",
      a: "Yes! Admins can set custom achievement ranges, rates, and periods. You decide how to reward your team with flexible configuration options that adapt to your business needs.",
    },
    {
      q: "Is there a free trial?",
      a: "Absolutely. Start with a 14-day free trial. No credit card required.",
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept all major credit cards, debit cards, and bank transfers. For annual plans, we also offer invoice-based billing for enterprise customers.",
    },
    {
      q: "Can I integrate with my existing tools?",
      a: "Yes! We offer integrations with popular CRM tools, accounting software, and HR systems. Our REST API allows custom integrations as well.",
    },
  ];

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 border-t border-gray-100 dark:border-gray-900">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="max-w-2xl mb-12">
          <p className="text-sm font-medium text-sky-600 dark:text-sky-400">
            FAQ
          </p>
          <h2 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-[-0.02em] text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="mt-5 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            Have questions? We&apos;ve got answers.
          </p>
        </div>

        <div className="max-w-3xl">
          <Card>
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                index={index}
                question={faq.q}
                answer={faq.a}
                isOpen={openIndex === index}
                onToggle={() => handleToggle(index)}
              />
            ))}
          </Card>

          <div className="text-center mt-8">
            <p className="text-gray-600 dark:text-gray-300">
              Still have questions?{" "}
              <a
                href="mailto:support@incentive.io"
                className="text-sky-600 dark:text-sky-400 hover:underline font-medium"
              >
                Contact our support team
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const sidebarItems = [
    { icon: BarChart3, label: "Dashboard", active: true },
    { icon: TrendingUp, label: "Records" },
    { icon: Wallet, label: "Commissions" },
    { icon: Target, label: "Targets" },
    { icon: BarChart3, label: "Analytics" },
  ];

  const stats = [
    { label: "Total Revenue", value: "$284.5k", change: "+12.5%", color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Active Deals", value: "1,284", change: "+8.2%", color: "text-sky-600 dark:text-sky-400" },
    { label: "Pending", value: "23", change: "-3.1%", color: "text-amber-600 dark:text-amber-400" },
    { label: "Commissions", value: "$48.9k", change: "+18.7%", color: "text-violet-600 dark:text-violet-400" },
  ];

  const recentActivity = [
    { name: "Acme Corp", amount: "$12,400", rep: "Sarah Chen", status: "Approved" as const, date: "Today" },
    { name: "Globex Inc", amount: "$8,200", rep: "Mike Torres", status: "Pending" as const, date: "Today" },
    { name: "Initech", amount: "$5,600", rep: "Lisa Park", status: "Approved" as const, date: "Yesterday" },
    { name: "Stark Industries", amount: "$15,800", rep: "James Wilson", status: "Pending" as const, date: "2 days ago" },
  ];

  const statusStyles: Record<string, string> = {
    Approved: "bg-green-100 dark:bg-emerald-500/10 text-green-700 dark:text-emerald-400",
    Pending: "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400",
  };

  return (
    <section id="dashboard" className="py-20 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="max-w-2xl mb-12">
          <p className="text-sm font-medium text-sky-600 dark:text-sky-400">
            Dashboard
          </p>
          <h2 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-[-0.02em] text-gray-900 dark:text-white">
            Your command center
          </h2>
          <p className="mt-5 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            Everything you need at a glance &mdash; pipeline, performance, and payouts.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden">
          {/* Window chrome */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">app.incentive.io</span>
            <div className="w-14" />
          </div>

          {/* Dashboard layout: sidebar + main */}
          <div className="flex flex-col sm:flex-row min-h-[400px]">
            {/* Sidebar */}
            <aside className="w-full sm:w-52 shrink-0 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/50 p-4">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-7 h-7 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">I</span>
                </div>
                <span className="font-semibold text-sm text-gray-900 dark:text-white">Incentive.io</span>
              </div>
              <nav className="space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.label;
                  return (
                    <button
                      key={item.label}
                      onClick={() => setActiveNav(item.label)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                        isActive
                          ? "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 font-medium"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 space-y-2">
                <Link href="/login">
                  <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                    Sign In
                  </button>
                </Link>
                <Link href="/register">
                  <button className="w-full text-left px-3 py-2 rounded-lg text-sm bg-sky-500 hover:bg-sky-600 text-white transition-all font-medium">
                    Get Started
                  </button>
                </Link>
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 p-5 sm:p-6">
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3">
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{s.label}</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{s.value}</p>
                    <p className={"text-[11px] mt-0.5 " + s.color}>{s.change}</p>
                  </div>
                ))}
              </div>

              {/* Chart area */}
              <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200">Weekly Performance</h3>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">Last 7 days</span>
                </div>
                <div className="flex items-end justify-between gap-2 h-32">
                  {[40, 65, 50, 82, 55, 75, 45].map((h, i) => {
                    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <div
                          className="w-full max-w-[32px] rounded-t-md bg-gradient-to-t from-sky-500 to-sky-400/60 dark:from-sky-400 dark:to-sky-500/60"
                          style={{ height: `${h}%` }}
                        />
                        <span className="text-[10px] text-gray-400 dark:text-gray-600">{days[i]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Activity table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200">Recent sales</h3>
                  <span className="text-xs text-sky-600 dark:text-sky-400 cursor-pointer hover:underline">View all</span>
                </div>
                <div className="rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-900/50">
                        <th className="text-left px-3 py-2.5 text-gray-500 dark:text-gray-400 font-medium text-[11px] uppercase tracking-wider">Company</th>
                        <th className="text-left px-3 py-2.5 text-gray-500 dark:text-gray-400 font-medium text-[11px] uppercase tracking-wider">Amount</th>
                        <th className="text-left px-3 py-2.5 text-gray-500 dark:text-gray-400 font-medium text-[11px] uppercase tracking-wider">Rep</th>
                        <th className="text-left px-3 py-2.5 text-gray-500 dark:text-gray-400 font-medium text-[11px] uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentActivity.map((row) => (
                        <tr key={row.name} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                          <td className="px-3 py-2.5 text-gray-900 dark:text-white font-medium">{row.name}</td>
                          <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">{row.amount}</td>
                          <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400">{row.rep}</td>
                          <td className="px-3 py-2.5">
                            <span className={"inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium " + statusStyles[row.status]}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 border-t border-gray-100 dark:border-gray-900">
      <div className="max-w-[1200px] mx-auto px-6 text-center">
        <h2 className="text-4xl sm:text-5xl font-semibold tracking-[-0.02em] text-gray-900 dark:text-white">
          Ready to streamline your commissions?
        </h2>
        <p className="mt-5 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Join thousands of sales teams already using Incentive.io to manage
          their commissions effectively.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register">
            <Button
              size="lg"
              className="rounded-full px-8 text-base min-h-[48px] bg-sky-600 hover:bg-sky-700 text-white"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Link href="#demo">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 text-base min-h-[48px]"
            >
              Request Demo
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const footerLinks = {
    Product: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#" },
      { label: "Demo", href: "#demo" },
      { label: "Integrations", href: "#" },
    ],
    Company: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
    Resources: [
      { label: "Documentation", href: "#" },
      { label: "API", href: "#" },
      { label: "Guides", href: "#" },
      { label: "Support", href: "#" },
    ],
    Legal: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Security", href: "#" },
      { label: "Cookies", href: "#" },
    ],
  };

  return (
    <footer className="bg-gray-900 dark:bg-black text-gray-400 py-16">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          <div className="col-span-2">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-xl text-white mb-4"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">I</span>
              </div>
              <span>Incentive.io</span>
            </Link>
            <p className="text-sm mb-4 dark:text-gray-400">
              Sales commission management made simple.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="mailto:hello@incentive.io"
                className="w-10 h-10 bg-gray-800 dark:bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 dark:hover:bg-gray-700 transition-colors"
                aria-label="Email support"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-white mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm hover:text-white dark:hover:text-gray-200 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-gray-800 dark:border-gray-800 text-sm text-center dark:text-gray-400">
          © 2026 Incentive.io. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = session.user.role;
      const path = role === "administrator" ? "/administrator" 
                 : role === "admin" ? "/admin" 
                 : role === "salesManager" ? "/sales-manager" 
                 : role === "accountant" ? "/accountant" 
                 : role === "finance" ? "/finance" 
                 : "/sales-dashboard";
      router.push(path);
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-sans">
      <SkipLink />
      <FloatingNav />
      <Hero />
      <InteractiveDemo />
      <SocialProof />
      <Features />
      <DashboardPreview />
      <Testimonials />
      <FAQ />
      <CTASection />
      <Footer />
    </div>
  );
}