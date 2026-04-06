"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { toast } from "@/hooks/use-toast"
import { CheckCircle, AlertCircle } from "lucide-react"
import { Playfair_Display } from "next/font/google"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (data.success) {
        toast({
          title: "Message Sent!",
          description:
            data.message ||
            "Thank you for contacting us. We'll get back to you within 24 hours.",
          action: <CheckCircle className="h-5 w-5 text-green-500" />,
        })

        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to send message.",
          variant: "destructive",
          action: <AlertCircle className="h-5 w-5 text-red-500" />,
        })
      }
    } catch (err) {
      toast({
        title: "Connection Error",
        description: "Unable to send message. Check your connection.",
        variant: "destructive",
        action: <AlertCircle className="h-5 w-5 text-red-500" />,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0b1d26]">
      <section className="py-24">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <p className=" text-[#d4a24c] tracking-[0.3em] uppercase text-sm mb-3">
              Get In Touch
            </p>
            <h1 className={`${playfair.className} font-heading text-4xl md:text-5xl font-bold`}>
              Contact <span className=" text-[#d4a24c] italic">Us</span>
            </h1>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-16 max-w-5xl mx-auto">
            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <h3 className={`${playfair.className} font-heading text-2xl font-semibold mb-2`}>Visit Us</h3>
                <p className="text-muted-foreground text-md">42 Crescent Lane, Downtown</p>
              </div>
              <div>
                <h3 className={`${playfair.className} font-heading text-2xl font-semibold mb-2`}>Call Us</h3>
                <p className="text-muted-foreground text-md">(555) 234-5678</p>
              </div>
              <div>
                <h3 className={`${playfair.className} font-heading text-2xl font-semibold mb-2`}>Email Us</h3>
                <p className="text-muted-foreground text-md">hello@crescentcoffee.com</p>
              </div>
              <div>
                <h3 className={`${playfair.className} font-heading text-2xl font-semibold mb-2`}>Hours</h3>
                <div className="text-muted-foreground space-y-1 text-md">
                  <p>Mon–Fri: 7:00 AM – 12:00 AM</p>
                  <p>Saturday: 8:00 AM – 1:00 AM</p>
                  <p>Sunday: 8:00 AM – 11:00 PM</p>
                </div>
              </div>
            </motion.div>

            {/* Form */}
            <motion.form
              onSubmit={handleSubmit}
              className="bg-[#0f2a33] rounded-2xl p-10 border border-[#a47015]/60 transition shadow-[0_0_25px_rgba(212,162,76,0.25)] backdrop-blur"
            >
              <div className="grid gap-6">

                {/* Name */}
                <div>
                  <label className="text-sm text-white/60 mb-2 block">
                    Name
                  </label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full rounded-lg bg-[#0b1d26] border border-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#d4a24c]/40"
                    placeholder="Your name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm text-white/60 mb-2 block">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full rounded-lg bg-[#0b1d26] border border-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#d4a24c]/40"
                    placeholder="you@email.com"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="text-sm text-white/60 mb-2 block">
                    Message
                  </label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => handleInputChange("message", e.target.value)}
                    rows={5}
                    className="w-full rounded-lg bg-[#0b1d26] border border-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#d4a24c]/40 resize-none"
                    placeholder="How can we help?"
                  />
                </div>

                {/* Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 w-full rounded-full bg-[#d4a24c] py-3.5 font-semibold text-black transition-all hover:brightness-110 disabled:opacity-50"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </div>
            </motion.form>

          </div>
        </div>
      </section>
    </div>
  )
}
