"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Quote, Star } from "lucide-react"
import { useState } from "react"

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Sales Director, TechCorp",
    content: "Incentive.io transformed how we manage commissions. Our sales team productivity increased by 40% within the first quarter. The automated calculations save us hours every week.",
    rating: 5,
    image: "SC",
    real: true
  },
  {
    name: "Michael Rahman",
    role: "CEO, Global Sales Solutions",
    content: "The approval workflow is seamless. We've reduced payment processing time from weeks to just days. Our sales team loves the real-time dashboard visibility.",
    rating: 5,
    image: "MR",
    real: true
  },
  {
    name: "Jennifer Foster",
    role: "Finance Manager, DataTech Inc",
    content: "Finally, a commission system that integrates with our existing accounting tools. The audit trails and reporting features have made compliance so much easier.",
    rating: 5,
    image: "JF",
    real: false
  },
  {
    name: "David Kim",
    role: "Sales Manager, Innovate Ltd",
    content: "The team management features are incredible. I can track my entire team's performance at a glance and provide targeted coaching where needed.",
    rating: 5,
    image: "DK",
    real: false
  },
  {
    name: "Aisha Patel",
    role: "HR Director, Enterprise Solutions",
    content: "We've used many commission systems before, but Incentive.io is by far the most intuitive. Onboarding was quick and support has been exceptional.",
    rating: 5,
    image: "AP",
    real: false
  },
  {
    name: "Robert Martinez",
    role: "VP Sales, Growth Partners",
    content: "The flexibility to customize commission rules for different teams has been a game-changer. We can now incentivize the behaviors that drive our business forward.",
    rating: 5,
    image: "RM",
    real: false
  }
]

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.ceil(testimonials.length / 3))
  }

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.ceil(testimonials.length / 3)) % Math.ceil(testimonials.length / 3))
  }

  return (
    <section className="py-20 sm:py-24 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Trusted by Sales Teams Worldwide
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            See what our customers have to say about transforming their commission management
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full border-2 hover:border-sky-200 dark:hover:border-sky-800 transition-all hover:shadow-lg">
                <CardContent className="pt-6">
                  {/* Quote Icon */}
                  <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center mb-4">
                    <Quote className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                  </div>

                  {/* Rating */}
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  {/* Testimonial Content */}
                  <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                    &quot;{testimonial.content}&quot;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {testimonial.image}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {testimonial.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { value: "500+", label: "Companies" },
            { value: "50K+", label: "Sales Reps" },
            { value: "$2B+", label: "Commissions Paid" },
            { value: "99%", label: "Satisfaction" }
          ].map((stat, index) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-sky-600 dark:text-sky-400 mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
