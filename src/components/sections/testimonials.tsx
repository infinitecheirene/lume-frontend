"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Star, MessageCircleWarning, ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import { Playfair_Display } from "next/font/google"
import { useToast } from "@/hooks/use-toast"

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
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [submittingTestimonial, setSubmittingTestimonial] = useState(false)
  const { toast } = useToast()
  const [testimonialForm, setTestimonialForm] = useState({
    client_name: "",
    client_email: "",
    rating: "",
    message: "",
  })

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

  useEffect(() => {
    fetchTestimonials()
  }, [])

  useEffect(() => {
    if (!testimonials.length) return

    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))
    }, 5000)

    return () => clearInterval(interval)
  }, [testimonials])

  const handleTestimonialChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setTestimonialForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmitTestimonial = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingTestimonial(true)

    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...testimonialForm,
          rating: Number(testimonialForm.rating),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({
          title: "Submission Failed",
          description: data.message || "Failed to submit testimonial",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Thank you!",
        description: "Your testimonial has been submitted successfully.",
      })

      setTestimonialForm({
        client_name: "",
        client_email: "",
        rating: "",
        message: "",
      })

      fetchTestimonials()
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setSubmittingTestimonial(false)
    }
  }

  return (
    <section className="py-8 md:py-14 lg:py-24 bg-[#0b1d26] text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 md:w-32 md:h-32 lg:w-40 lg:h-40 bg-[#d4a24c]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-24 h-24 md:w-36 md:h-36 lg:w-52 lg:h-52 bg-[#d4a24c]/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="text-center mb-8 md:mb-12 lg:mb-16">
          <p className="tracking-[0.3em] uppercase text-sm mb-3 text-[#d4a24c]">Guest Experiences</p>

          <h2 className={`${playfair.className} text-3xl md:text-4xl lg:text-5xl font-bold`}>
            What Our <span className="text-[#d4a24c] italic">Guests</span> Say
          </h2>
        </motion.div>

        {/* LOADING */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 md:p-6 rounded-2xl border border-white/10 bg-white/5 animate-pulse space-y-4">
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

        {/* ERROR */}
        {!loading && error && (
          <div className="flex flex-col items-center text-center py-8 md:py-12 lg:py-16">
            <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-red-500/10 mb-4">
              <MessageCircleWarning className="text-red-400 w-6 h-6 md:w-8 md:h-8" />
            </div>

            <h3 className="text-lg md:text-xl font-semibold mb-2">Failed to Load Testimonials</h3>

            <p className="text-white/60 max-w-md text-sm md:text-base">{error}</p>
          </div>
        )}

        {/* CONTENT */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* LEFT: FORM */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 md:p-7">
              <h3 className={`${playfair.className} text-2xl font-semibold mb-2`}>Leave a Review</h3>
              <p className="text-white/60 text-sm mb-6">Share your experience with Lumè Bean and Bar.</p>

              <form onSubmit={handleSubmitTestimonial} className="space-y-4">
                {/* NAME */}
                <div className="space-y-1">
                  <label className="text-sm text-white/80">Full Name</label>
                  <input
                    type="text"
                    name="client_name"
                    value={testimonialForm.client_name}
                    onChange={handleTestimonialChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#d4a24c] focus:ring-2 focus:ring-[#d4a24c]/30 transition"
                    placeholder="Enter your name"
                  />
                </div>

                {/* EMAIL */}
                <div className="space-y-1">
                  <label className="text-sm text-white/80">Email</label>
                  <input
                    type="email"
                    name="client_email"
                    value={testimonialForm.client_email}
                    onChange={handleTestimonialChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#d4a24c] focus:ring-2 focus:ring-[#d4a24c]/30 transition"
                    placeholder="Enter your email"
                  />
                </div>

                {/* RATING */}
                <div className="space-y-2">
                  <label className="text-sm text-white/80">Rating</label>

                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setTestimonialForm((prev) => ({
                            ...prev,
                            rating: star.toString(),
                          }))
                        }
                        className="transition hover:scale-110"
                      >
                        <Star className={`w-7 h-7 ${Number(testimonialForm.rating) >= star ? "fill-[#d4a24c] text-[#d4a24c]" : "text-white/20"}`} />
                      </button>
                    ))}
                  </div>

                  {/* hidden input so required works */}
                  <input type="hidden" name="rating" value={testimonialForm.rating} required />
                </div>

                {/* MESSAGE */}
                <div className="space-y-1">
                  <label className="text-sm text-white/80">Message</label>
                  <textarea
                    name="message"
                    value={testimonialForm.message}
                    onChange={handleTestimonialChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#d4a24c] focus:ring-2 focus:ring-[#d4a24c]/30 transition resize-none"
                    placeholder="Write your review..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingTestimonial}
                  className="w-full py-3 rounded-xl bg-[#d4a24c] text-[#0b1d26] font-semibold hover:bg-[#e0b15d] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submittingTestimonial ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </div>

            {/* RIGHT: TESTIMONIALS */}
            <div>
              {/* LOADING */}
              {loading && (
                <div className="grid grid-cols-1 gap-4 md:gap-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-4 md:p-6 rounded-2xl border border-white/10 bg-white/5 animate-pulse space-y-4">
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
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* EMPTY */}
              {!loading && testimonials.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-white/10 bg-white/5">
                  <div className="w-14 h-14 rounded-full bg-[#d4a24c]/10 flex items-center justify-center mb-4">
                    <Star className="w-7 h-7 text-[#d4a24c]" />
                  </div>

                  <h3 className={`${playfair.className} text-xl font-semibold mb-2`}>No Reviews Yet</h3>

                  <p className="text-white/60 max-w-md text-sm md:text-base">
                    Be the first to share your experience with us.
                    <br />
                    Your feedback helps us serve you better.
                  </p>
                  <div className="mt-6 h-[1px] w-16 md:w-24 bg-[#d4a24c]/30" />
                </div>
              )}

              {/* LIST */}
              {!loading && testimonials.length > 0 && (
                <div className="w-full max-w-2xl mx-auto space-y-6">
                  <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_60px_rgba(212,162,76,0.08)]">
                    {/* glow */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#d4a24c]/10 blur-3xl rounded-full" />
                      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#d4a24c]/10 blur-3xl rounded-full" />
                    </div>

                    <CardContent className="relative z-10 p-6 md:p-10 flex flex-col gap-6">
                      {/* STARS */}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${i < testimonials[activeTestimonial].rating ? "fill-[#d4a24c] text-[#d4a24c]" : "text-white/20"}`}
                            />
                          ))}
                        </div>

                        <span className="text-xs text-white/50 tracking-widest uppercase">Verified Guest</span>
                      </div>

                      {/* MESSAGE */}
                      <p className="text-white/85 text-lg md:text-xl leading-relaxed font-light italic">
                        &quot;{testimonials[activeTestimonial].message}&quot;
                      </p>

                      {/* AUTHOR */}
                      <div className="flex items-center justify-between border-t border-white/10 pt-5">
                        <div>
                          <h3 className="font-semibold text-white text-lg">{testimonials[activeTestimonial].client_name}</h3>
                        </div>

                        <div className="text-sm text-white/50">
                          {activeTestimonial + 1} / {testimonials.length}
                        </div>
                      </div>
                    </CardContent>

                    {/* NAV BUTTONS */}
                    <button
                      type="button"
                      onClick={() => setActiveTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </Card>

                  {/* DOTS */}
                  <div className="flex justify-center gap-2">
                    {testimonials.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveTestimonial(i)}
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          i === activeTestimonial ? "w-8 bg-[#d4a24c]" : "w-2.5 bg-white/20 hover:bg-white/40"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
