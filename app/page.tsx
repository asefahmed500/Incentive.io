"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  ChevronDown,
  TrendingUp,
  Users,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Wallet,
  Target,
  Shield,
  Zap,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

function GradientMesh() {
  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-sky-50 via-white to-white" />
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
    </div>
  );
}

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
    { href: "#demo", label: "Demo" },
    { href: "#faq", label: "FAQ" },
  ];

  const handleLinkClick = () => setIsOpen(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl text-gray-900 hover:text-sky-600 transition-colors"
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
                    className="px-4 py-3 text-gray-700 hover:text-sky-600 hover:bg-sky-50 rounded-lg font-medium transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="my-2 border-gray-200" />
                <Link
                  href="/login"
                  onClick={handleLinkClick}
                  className="px-4 py-3 text-gray-700 hover:text-sky-600 hover:bg-sky-50 rounded-lg font-medium transition-colors"
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
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center pt-16 overflow-hidden">
      <GradientMesh />
      <main id="main-content" className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div>
          <Badge
            variant="secondary"
            className="mb-6 bg-sky-100 text-sky-700 hover:bg-sky-200 px-4 py-1"
          >
            <Zap className="w-3 h-3 mr-1" />
            Now with AI-powered insights
          </Badge>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6">
          Sales Commission
          <span className="block mt-2 bg-gradient-to-r from-sky-500 via-blue-600 to-sky-500 bg-clip-text text-transparent">
            Made Simple
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          Track, calculate, and pay commissions effortlessly. Streamline your sales team&apos;s
          incentives with intelligent automation.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link href="/register">
            <Button
              size="lg"
              className="rounded-full px-8 text-base w-full sm:w-auto bg-sky-500 hover:bg-sky-600 min-h-[48px]"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Link href="#demo">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 text-base w-full sm:w-auto min-h-[48px]"
            >
              View Demo
            </Button>
          </Link>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>14-day free trial</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Cancel anytime</span>
          </div>
        </div>
      </main>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Card className="h-full border-2 border-transparent hover:border-sky-100 transition-colors">
      <CardContent className="pt-6">
        <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-sky-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

function Features() {
  const features = [
    {
      icon: TrendingUp,
      title: "Real-time Tracking",
      description:
        "Monitor sales performance in real-time with intuitive dashboards and detailed analytics.",
    },
    {
      icon: Target,
      title: "Target Management",
      description:
        "Set and track team targets with achievement percentages and progress indicators.",
    },
    {
      icon: BarChart3,
      title: "Smart Analytics",
      description:
        "AI-powered insights to help you understand patterns and optimize your commission structure.",
    },
    {
      icon: Wallet,
      title: "Automated Payouts",
      description:
        "Streamline commission payments with automatic calculations and batch processing.",
    },
    {
      icon: Shield,
      title: "Secure & Compliant",
      description:
        "Enterprise-grade security with role-based access control and audit trails.",
    },
    {
      icon: Users,
      title: "Team Management",
      description:
        "Manage multiple teams with hierarchical approval workflows and reporting.",
    },
  ];

  return (
    <section id="features" className="py-20 sm:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Everything you need to manage commissions
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Powerful features designed to simplify your commission management workflow
            and maximize your team&apos;s performance.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MockDashboard() {
  const stats = [
    { label: "Total Sales", value: "৳2,450,000", change: "+12%", positive: true },
    { label: "Commissions", value: "৳98,000", change: "+8%", positive: true },
    { label: "Pending", value: "৳45,000", change: "-3%", positive: false },
    { label: "Team Size", value: "24", change: "+2", positive: true },
  ];

  const recentSales = [
    { company: "TechCorp Ltd", employee: "Jamal H.", amount: "৳150,000", status: "Approved" },
    { company: "Global Systems", employee: "Sara M.", amount: "৳85,000", status: "Pending" },
    { company: "DataTech Inc", employee: "Rahim K.", amount: "৳210,000", status: "Approved" },
  ];

  return (
    <section id="demo" className="py-20 sm:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Powerful Dashboard
          </h2>
          <p className="text-lg text-gray-600">
            Everything your team needs in one place
          </p>
        </div>

        <Card className="overflow-hidden border-2">
          <div className="flex flex-col lg:flex-row">
            <aside className="lg:w-56 bg-gray-900 p-4 shrink-0">
              <div className="mb-6 pb-4 border-b border-gray-700">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-sky-500 to-blue-600 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">I</span>
                  </div>
                  Incentive.io
                </h3>
              </div>
              <nav className="space-y-1" aria-label="Dashboard navigation">
                {[
                  "Dashboard",
                  "Sales",
                  "Team",
                  "Commissions",
                  "Wallets",
                  "Analytics",
                  "Settings",
                ].map((item, index) => (
                  <div
                    key={item}
                    className={`px-3 py-2 rounded-md text-sm cursor-pointer transition-colors ${
                      index === 0
                        ? "bg-sky-600 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </nav>
            </aside>

            <CardContent className="flex-1 p-4 sm:p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 sm:p-4"
                  >
                    <p className="text-xs sm:text-sm text-gray-500">{stat.label}</p>
                    <p className="text-lg sm:text-2xl font-bold mt-1 text-gray-900">
                      {stat.value}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        stat.positive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {stat.change}
                    </p>
                  </div>
                ))}
              </div>

              <Card className="overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b">
                  <h3 className="font-semibold text-gray-900">Recent Sales</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs sm:text-sm text-gray-500 border-b">
                        <th className="px-4 py-3 font-medium">Company</th>
                        <th className="px-4 py-3 font-medium">Employee</th>
                        <th className="px-4 py-3 font-medium">Amount</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSales.map((sale, index) => (
                        <tr
                          key={index}
                          className="border-b last:border-b-0"
                        >
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {sale.company}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{sale.employee}</td>
                          <td className="px-4 py-3 font-medium">{sale.amount}</td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                sale.status === "Approved"
                                  ? "secondary"
                                  : "outline"
                              }
                              className={
                                sale.status === "Approved"
                                  ? "bg-green-100 text-green-700 hover:bg-green-100"
                                  : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                              }
                            >
                              {sale.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </CardContent>
          </div>
        </Card>
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
    <div className="border-b last:border-b-0">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`faq-content-${index}`}
        className="w-full px-4 sm:px-6 py-4 flex items-center justify-between text-left gap-4 hover:bg-gray-50 transition-colors min-h-[56px]"
      >
        <span className="font-medium text-gray-900">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
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
        <p className="px-4 sm:px-6 pb-4 text-gray-600 leading-relaxed">
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
    <section id="faq" className="py-20 sm:py-24 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600">
            Have questions? We&apos;ve got answers.
          </p>
        </div>

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
          <p className="text-gray-600">
            Still have questions?{" "}
            <a
              href="mailto:support@incentive.io"
              className="text-sky-600 hover:underline font-medium"
            >
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 sm:py-24 bg-gradient-to-br from-sky-500 to-blue-600">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to streamline your commissions?
        </h2>
        <p className="text-lg text-sky-100 mb-8 max-w-2xl mx-auto">
          Join thousands of sales teams already using Incentive.io to manage
          their commissions effectively.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register">
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full px-8 text-base min-h-[48px]"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Link href="#demo">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 text-base text-white border-white hover:bg-white/10 min-h-[48px]"
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
    <footer className="bg-gray-900 text-gray-400 py-16">
      <div className="max-w-6xl mx-auto px-4">
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
            <p className="text-sm mb-4">
              Sales commission management made simple.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="mailto:hello@incentive.io"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
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
                      className="text-sm hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-gray-800 text-sm text-center">
          © 2026 Incentive.io. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <SkipLink />
      <FloatingNav />
      <Hero />
      <Features />
      <MockDashboard />
      <FAQ />
      <CTASection />
      <Footer />
    </div>
  );
}