"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function GradientMesh() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] animate-spin-slow opacity-50">
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full blur-3xl" />
      </div>
      <div className="absolute -bottom-1/2 -right-1/2 w-[200%] h-[200%] animate-spin-slow-reverse opacity-50">
        <div className="absolute bottom-1/4 right-1/4 w-1/2 h-1/2 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-full blur-3xl" />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse" />
      </div>
    </div>
  );
}

function FloatingNav() {
  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#faq", label: "FAQ" },
    { href: "#demo", label: "Demo" },
  ];

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 px-2 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-gray-200/50">
        <Link href="/" className="px-4 py-2 font-semibold text-gray-900 hover:text-sky-600 transition-colors">
          incentiveio
        </Link>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            {link.label}
          </Link>
        ))}
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
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <GradientMesh />
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6">
          Sales Commission
          <span className="block bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
            Made Simple
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Track, calculate, and pay commissions effortlessly. Streamline your sales team&apos;s
          incentives with intelligent automation.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <Button size="lg" className="rounded-full px-8 bg-sky-500 hover:bg-sky-600 text-lg">
              Start Free Trial
            </Button>
          </Link>
          <Link href="#demo">
            <Button size="lg" variant="outline" className="rounded-full px-8 text-lg">
              View Demo
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function FAQChat() {
  const faqs = [
    {
      q: "How does commission calculation work?",
      a: "Our system automatically calculates commissions based on achievement percentage. Sales execs earn 2-5% depending on hitting 50%+ of their target.",
    },
    {
      q: "Can I customize commission rules?",
      a: "Yes! Admins can set custom achievement ranges, rates, and periods. You decide how to reward your team.",
    },
    {
      q: "Is there a free trial?",
      a: "Absolutely. Start with a 14-day free trial. No credit card required.",
    },
  ];

  return (
    <section id="faq" className="py-24 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-md p-4 rounded-2xl ${
                  i % 2 === 0
                    ? "bg-gray-900 text-white rounded-br-none"
                    : "bg-white border rounded-bl-none shadow-sm"
                }`}
              >
                {i % 2 === 0 && (
                  <p className="text-sm text-gray-400 mb-1">You</p>
                )}
                <p className={i % 2 === 0 ? "font-medium" : "text-gray-900 font-medium mb-2"}>
                  {faq.q}
                </p>
                {i % 2 !== 0 && (
                  <>
                    <p className="text-sm text-gray-500">You</p>
                    <p className="text-gray-600 mt-2">{faq.a}</p>
                  </>
                )}
                {i % 2 === 0 && (
                  <p className="text-gray-300 mt-2">{faq.a}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MockDashboard() {
  const stats = [
    { label: "Total Sales", value: "৳2,450,000", change: "+12%" },
    { label: "Commissions", value: "৳98,000", change: "+8%" },
    { label: "Pending", value: "৳45,000", change: "-3%" },
    { label: "Team Size", value: "24", change: "+2" },
  ];

  const recentSales = [
    { company: "TechCorp Ltd", employee: "Jamal H.", amount: "৳150,000", status: "Approved" },
    { company: "Global Systems", employee: "Sara M.", amount: "৳85,000", status: "Pending" },
    { company: "DataTech Inc", employee: "Rahim K.", amount: "৳210,000", status: "Approved" },
  ];

  return (
    <section id="demo" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">Powerful Dashboard</h2>
        <p className="text-center text-gray-600 mb-12">Everything your team needs in one place</p>

        <div className="flex gap-6">
          <aside className="w-56 shrink-0">
            <div className="bg-gray-900 rounded-lg p-4 text-white">
              <div className="mb-6 pb-4 border-b border-gray-700">
                <h3 className="font-semibold">incentiveio</h3>
              </div>
              <nav className="space-y-1">
                {["Dashboard", "Sales", "Team", "Commissions", "Wallets", "Analytics", "Settings"].map((item) => (
                  <div key={item} className="px-3 py-2 rounded text-gray-400 hover:text-white hover:bg-gray-800 cursor-pointer">
                    {item}
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          <main className="flex-1">
            <div className="grid grid-cols-4 gap-4 mb-6">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className={`text-xs mt-1 ${stat.change.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                    {stat.change}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h3 className="font-semibold">Recent Sales</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500">
                    <th className="px-4 py-2">Company</th>
                    <th className="px-4 py-2">Employee</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-3">{sale.company}</td>
                      <td className="px-4 py-3 text-gray-600">{sale.employee}</td>
                      <td className="px-4 py-3">{sale.amount}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            sale.status === "Approved"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {sale.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </main>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const footerLinks = {
    Product: ["Features", "Pricing", "Demo", "Integrations"],
    Company: ["About", "Blog", "Careers", "Contact"],
    Resources: ["Documentation", "API", "Guides", "Support"],
    Legal: ["Privacy", "Terms", "Security", "Cookies"],
  };

  return (
    <footer className="bg-gray-900 text-gray-400 py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-5 gap-8 mb-12">
          <div className="col-span-1">
            <h3 className="text-white font-bold text-xl mb-2">incentiveio</h3>
            <p className="text-sm">Sales commission management made simple.</p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-white mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-gray-800 text-sm text-center">
          © 2026 incentiveio. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <FloatingNav />
      <Hero />
      <MockDashboard />
      <FAQChat />
      <Footer />
    </div>
  );
}