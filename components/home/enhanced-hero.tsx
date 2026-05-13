"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle, Zap } from "lucide-react"
import Link from "next/link"

export function EnhancedHero() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center pt-16 overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-sky-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900" />

        {/* Animated gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-1/4 w-96 h-96 bg-sky-200/30 dark:bg-sky-900/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-20 right-1/4 w-96 h-96 bg-emerald-200/30 dark:bg-emerald-900/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/2 w-72 h-72 bg-purple-200/20 dark:bg-purple-900/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
        />
      </div>

      <main className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Animated Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge className="mb-6 bg-sky-100 text-sky-700 hover:bg-sky-200 dark:bg-sky-900/50 dark:text-sky-300 px-4 py-1 border border-sky-200 dark:border-sky-800">
            <Zap className="w-3 h-3 mr-1" />
            Now with AI-powered insights
          </Badge>
        </motion.div>

        {/* Animated Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white mb-6"
        >
          Sales Commission
          <span className="block mt-2">
            <motion.span
              className="bg-gradient-to-r from-sky-500 via-blue-600 to-sky-500 bg-clip-text text-transparent bg-[length:200%_auto%]"
              animate={{ backgroundPosition: ["0% center", "200% center"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            >
              Made Simple
            </motion.span>
          </span>
        </motion.h1>

        {/* Animated Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed"
        >
          Track, calculate, and pay commissions effortlessly. Streamline your sales team&apos;s
          incentives with intelligent automation.
        </motion.p>

        {/* Animated CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 justify-center items-center"
        >
          <Link href="/register">
            <Button
              size="lg"
              className="rounded-full px-8 text-base w-full sm:w-auto bg-sky-500 hover:bg-sky-600 min-h-[48px] shadow-lg hover:shadow-xl transition-shadow"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Link href="#demo">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 text-base w-full sm:w-auto min-h-[48px] border-2 hover:bg-sky-50 dark:hover:bg-sky-900/20"
            >
              View Demo
            </Button>
          </Link>
        </motion.div>

        {/* Animated Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400"
        >
          {[
            { icon: CheckCircle, text: "No credit card required" },
            { icon: CheckCircle, text: "14-day free trial" },
            { icon: CheckCircle, text: "Cancel anytime" },
          ].map((item, index) => (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
              className="flex items-center gap-2"
            >
              <item.icon className="w-4 h-4 text-green-500" />
              <span>{item.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </section>
  )
}
