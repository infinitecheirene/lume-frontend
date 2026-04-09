"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Star, MessageCircleWarning } from "lucide-react"
import { motion } from "framer-motion"
import { Playfair_Display } from "next/font/google"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

interface Testimonial {
  id: number
  client_name: string
  role: string
  message: string
  rating: number
  image?: string
  created_at: string
}

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await fetch("/api/testimonials?status=approved")
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.details || data.error || "Failed to fetch testimonials")
        }

        setTestimonials(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    fetchTestimonials()
  }, [])

  return (
    <section className="py-24 bg-[#0b1d26] text-white relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-40 h-40 bg-[#d4a24c]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-52 h-52 bg-[#d4a24c]/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <p className="tracking-[0.3em] uppercase text-sm mb-3 text-[#d4a24c]">Guest Experiences</p>

          <h2 className={`${playfair.className} text-4xl md:text-5xl font-bold`}>
            What Our <span className="text-[#d4a24c] italic">Guests</span> Say
          </h2>
        </motion.div>

        {/* ✅ LOADING */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-6 rounded-2xl border border-white/10 bg-white/5 animate-pulse space-y-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="w-4 h-4 bg-white/10 rounded" />
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="h-3 w-full bg-white/10 rounded" />
                  <div className="h-3 w-5/6 bg-white/10 rounded" />
                  <div className="h-3 w-2/3 bg-white/10 rounded" />
                </div>

                <div className="pt-4 border-t border-white/10 space-y-2">
                  <div className="h-4 w-1/3 bg-white/10 rounded" />
                  <div className="h-3 w-1/4 bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ❌ ERROR */}
        {!loading && error && (
          <div className="flex flex-col items-center text-center py-16">
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-red-500/10 mb-4">
              <MessageCircleWarning className="text-red-400" />
            </div>

            <h3 className="text-xl font-semibold mb-2">Failed to Load Testimonials</h3>

            <p className="text-white/60 max-w-md">{error}</p>
          </div>
        )}

        {/* ⚠️ EMPTY */}
        {!loading && !error && testimonials.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-[#d4a24c]/10 flex items-center justify-center mb-6">
              <Star className="w-8 h-8 text-[#d4a24c]" />
            </div>

            <h3 className={`${playfair.className} text-2xl font-semibold mb-2`}>No Reviews Yet</h3>

            <p className="text-white/60 max-w-md">Be the first to share your experience with us. Your feedback helps us serve you better.</p>

            <div className="mt-6 h-[1px] w-24 bg-[#d4a24c]/30" />
          </div>
        )}

        {/* ✅ CONTENT */}
        {!loading && !error && testimonials.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {testimonials.map((testimonial) => (
              <Card
                key={testimonial.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-500 hover:-translate-y-2"
              >
                <CardContent className="p-6 flex flex-col h-full">
                  {/* STARS */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < testimonial.rating ? "fill-[#d4a24c] text-[#d4a24c]" : "text-white/20"}`} />
                    ))}
                  </div>

                  {/* CONTENT */}
                  <p className="text-white/80 italic leading-relaxed flex-1">&quot;{testimonial.message}&quot;</p>

                  {/* AUTHOR */}
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <h3 className="font-semibold text-white">{testimonial.client_name}</h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
