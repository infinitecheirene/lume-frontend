"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { toast } from "@/hooks/use-toast"
import { CheckCircle, AlertCircle, ChevronDown, Pi } from "lucide-react"
import { Playfair_Display } from "next/font/google"
import { MapPin, Phone, Mail, Clock } from "lucide-react"
import LumeLoaderMinimal from "@/components/oppa-loader"

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

    if (!formData.name || !formData.email || !formData.message || !formData.subject) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (data.success) {
        toast({
          title: "Message Sent!",
          description: data.message || "Thank you for contacting us. We'll get back to you within 24 hours.",
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

  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const faqs = [
    {
      question: "Do you accept walk-in customers?",
      answer: "Yes, we accept walk-ins depending on table availability. We recommend reservations during peak hours.",
    },
    {
      question: "What are your operating hours?",
      answer: "We are open daily. Mon–Fri: 7:00 AM – 12:00 AM, Saturday: 8:00 AM – 1:00 AM, Sunday: 8:00 AM – 11:00 PM.",
    },
    {
      question: "Do you offer reservations?",
      answer: "Yes, you can reserve a table through our reservation system or by contacting us directly.",
    },
    {
      question: "Can I host private events?",
      answer: "Absolutely. We offer private dining and event setups. Please contact us for arrangements and availability.",
    },
  ]

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 800) // adjust or remove if not needed

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return <LumeLoaderMinimal />
  }

  return (
    <div className="min-h-screen bg-[#0b1d26]">
      <section className="py-24 justify-center flex">
        <div className="container px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <p className=" text-[#d4a24c] tracking-[0.3em] uppercase text-sm mb-3">Get In Touch</p>
            <h1 className={`${playfair.className} font-heading text-4xl md:text-5xl font-bold`}>
              Contact <span className=" text-[#d4a24c] italic">Us</span>
            </h1>
          </motion.div>

          <div className="max-w-5xl mx-auto">
            {/* Form */}
            <motion.form
              onSubmit={handleSubmit}
              className="bg-[#0f2a33] rounded-2xl p-10 border border-[#a47015]/60 transition shadow-[0_0_25px_rgba(212,162,76,0.25)] backdrop-blur"
            >
              <div className="grid grid-cols-2 gap-6 my-2">
                {/* Name */}
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Name</label>
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
                  <label className="text-sm text-white/60 mb-2 block">Email</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full rounded-lg bg-[#0b1d26] border border-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#d4a24c]/40"
                    placeholder="you@email.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Phone (optional)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full rounded-lg bg-[#0b1d26] border border-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#d4a24c]/40"
                    placeholder="Your phone number"
                  />
                </div>

                {/* Inquiry Type */}
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Inquiry Type</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => handleInputChange("subject", e.target.value)}
                    className="w-full rounded-lg bg-[#0b1d26] border border-white/10 p-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#d4a24c]/40"
                  >
                    <option value="">Select an option</option>
                    <option value="general">General Inquiry</option>
                    <option value="reservation">Reservation</option>
                    <option value="complaint">Complaint</option>
                    <option value="suggestion">Suggestion</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-6 my-2">
                {/* Message */}
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Message</label>
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

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mt-20">
            <div className="text-center">
              <Phone className="mx-auto mb-3 text-[#d4a24c]" />
              <h2 className={`${playfair.className} text-2xl font-bold`}>Call Us</h2>
              <p className="text-white/60"> Mon-Sat from 9am - 10pm </p>
              <p className="text-white/60 font-bold"> (555) 234-5678 </p>
            </div>
            <div className="text-center border-x-2 border-white/30">
              <MapPin className="mx-auto mb-3 text-[#d4a24c]" />
              <h2 className={`${playfair.className} text-2xl font-bold`}>Our Location</h2>
              <p className="text-white/60"> Come say hello!</p>
              <p className="text-white/60 font-bold"> (555) 234-5678 </p>
            </div>
            <div className="text-center">
              <Mail className="mx-auto mb-3 text-[#d4a24c]" />
              <h2 className={`${playfair.className} text-2xl font-bold`}>Email Us</h2>
              <p className="text-white/60"> Drop us an email anytime! </p>
              <p className="text-white/60 font-bold"> info@lumebeanandbar.com </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 border-t border-white/10">
        <div className="container px-4 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <p className="text-[#d4a24c] tracking-[0.3em] uppercase text-sm mb-3">FAQ</p>
            <h2 className={`${playfair.className} text-3xl md:text-4xl font-bold`}>
              Frequently Asked <span className="text-[#d4a24c] italic">Questions</span>
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index

              return (
                <div key={index} className="border border-white/10 rounded-xl bg-[#0f2a33] overflow-hidden">
                  <button onClick={() => setOpenFaq(isOpen ? null : index)} className="w-full flex items-center justify-between px-6 py-4 text-left">
                    <span className="font-medium text-white">{faq.question}</span>

                    <ChevronDown className={`w-5 h-5 text-[#d4a24c] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-6 pb-4 text-sm text-white/70"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
