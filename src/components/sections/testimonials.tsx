"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"
import { motion } from "framer-motion"
import { Playfair_Display } from "next/font/google"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

interface Testimonial {
  id: number
  name: string
  role: string
  content: string
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
        const response = await fetch("/api/testimonials")
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.details || data.error || "Failed to fetch testimonials")
        }

        setTestimonials(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchTestimonials()
  }, [])

  if (loading) {
    return (
      <section className="py-24 bg-gradient-to-br from-white via-gray-50 to-white">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-800">
              What Our Guests Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-gray-200 animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-24 bg-[#0b1d26] text-white">

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-40 h-40 bg-[#dc143c]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-52 h-52 bg-[#7f0020]/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <p className="tracking-[0.3em] uppercase text-sm mb-3 text-[#d4a24c]">
            Guest Experiences
          </p>

          <h2 className={`${playfair.className} text-4xl md:text-5xl font-bold`}>
            What Our <span className="text-[#d4a24c] italic">Guests</span> Say
          </h2>
        </motion.div>

        {/* ERROR */}
        {error ? (
          <div className="max-w-xl mx-auto bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-600 font-semibold mb-2">
              Unable to load testimonials
            </p>
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            No testimonials yet. Be the first to share!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {testimonials.map((testimonial) => (
              <Card
                key={testimonial.id}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2"
              >

                {/* subtle highlight glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-[#dc143c]/5 to-transparent" />

                <CardContent className="p-6 flex flex-col h-full relative z-10">

                  {/* STARS */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < testimonial.rating
                            ? "fill-[#dc143c] text-[#dc143c]"
                            : "text-gray-300"
                          }`}
                      />
                    ))}
                  </div>

                  {/* CONTENT */}
                  <p className="text-gray-700 italic leading-relaxed flex-1">
                    "{testimonial.content}"
                  </p>

                  {/* AUTHOR */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <h3 className="font-semibold text-gray-900">
                      {testimonial.name}
                    </h3>
                    <p className="text-sm text-[#dc143c]">
                      {testimonial.role}
                    </p>
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