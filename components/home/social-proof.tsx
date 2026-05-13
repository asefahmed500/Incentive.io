"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Users, Shield, Award, Zap, Globe } from "lucide-react"

const features = [
  { icon: TrendingUp, label: "40% Avg Productivity Boost", color: "text-green-600 dark:text-green-400" },
  { icon: Users, label: "50,000+ Active Users", color: "text-sky-600 dark:text-sky-400" },
  { icon: Shield, label: "Enterprise Security", color: "text-purple-600 dark:text-purple-400" },
  { icon: Award, label: "#1 Rated Platform", color: "text-yellow-600 dark:text-yellow-400" },
  { icon: Zap, label: "Lightning Fast Setup", color: "text-orange-600 dark:text-orange-400" },
  { icon: Globe, label: "Available in 50+ Countries", color: "text-blue-600 dark:text-blue-400" }
]

const companies = [
  "TechCorp", "DataFlow", "Innovate", "GrowthPartners", "Enterprise Solutions"
]

export function SocialProof() {
  return (
    <section className="py-16 bg-white dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4">
        {/* Trust Features */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <div className={`w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-2 ${feature.color}`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{feature.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Companies Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
            Trusted by innovative companies worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            {companies.map((company, index) => (
              <motion.div
                key={company}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-xl font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-default"
              >
                {company}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Certifications */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6"
        >
          {[
            "SOC 2 Compliant",
            "GDPR Ready",
            "ISO 27001",
            "Privacy Shield"
          ].map((cert) => (
            <div
              key={cert}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400"
            >
              {cert}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
