"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { User, Mail, Lock, Eye, EyeOff, Phone, MapPin, Building, Hash, ArrowLeftCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { Playfair_Display } from "next/font/google"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip_code: "",
    password: "",
    password_confirmation: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    if (field === "phone") {
      const numbersOnly = value.replace(/\D/g, "")
      setFormData((prev) => ({ ...prev, [field]: numbersOnly }))
      return
    }
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.password || !formData.password_confirmation) {
      toast.error("Missing Information", {
        description: "Please fill in all required fields.",
      })
      return
    }

    if (formData.password !== formData.password_confirmation) {
      toast.error("Password Mismatch", {
        description: "Passwords do not match. Please check and try again.",
      })
      return
    }

    if (formData.password.length < 8) {
      toast.error("Password Too Short", {
        description: "Password must be at least 8 characters long.",
      })
      return
    }

    if (formData.phone && formData.phone.length !== 11) {
      toast.error("Invalid Phone Number", {
        description: "Phone number must be exactly 11 digits.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Registration Successful!", {
          description: "Please check your email to verify your account.",
          duration: 5000,
        })

        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else {
        toast.error("Registration Failed", {
          description: data.message || "Registration failed. Please try again.",
        })
      }
    } catch (error) {
      console.error("Registration error:", error)
      toast.error("Connection Error", {
        description: "Unable to register. Please check your connection and try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-[#0b1d26] flex items-center justify-center px-4 py-10 relative overflow-hidden">

        {/* Background glow */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-40 h-40 bg-[#d4a24c]/10 blur-3xl rounded-full" />
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-[#d4a24c]/10 blur-3xl rounded-full" />
        </div>

        {/* Steam overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`steam1-${i}`}
              initial={{ y: 100, opacity: 0 }}
              animate={{
                y: -800,
                opacity: [0.4, 0.1, 0.4],
                x: [0, 20, -20, 0],
              }}
              transition={{
                duration: 6 + i * 1.5,
                repeat: Infinity,
                delay: i * 0.8,
                ease: "easeInOut",
              }}
              className="absolute bottom-0 w-32 h-32 bg-white/40 rounded-full blur-2xl"
              style={{ left: `${10 + i * 15}%` }}
            />
          ))}
        </div>

        {/* Card */}
        <div className="relative w-full max-w-3xl">
          <div className="bg-[#0f2a33] border border-[#d4a24c]/30 rounded-2xl p-8 shadow-[0_0_30px_rgba(212,162,76,0.25)] backdrop-blur">

            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-white/60 hover:text-white/80 transition"
            >
              <ArrowLeftCircle className="w-6 h-6" />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className={`text-3xl font-bold text-white ${playfair.className}`}>Create your Account</h1>
              <p className="text-[#d4a24c] mt-1">Lumè Bean and Bar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Name + Email */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-2 block flex items-center gap-2">
                    <User className="w-4 h-4 text-[#d4a24c]" />
                    Full Name
                  </label>
                  <input
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    disabled={isSubmitting}
                    placeholder="Enter your name"
                    className="w-full h-12 rounded-lg bg-[#0b1d26] border border-white/10 px-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#d4a24c]/40"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#d4a24c]" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    disabled={isSubmitting}
                    placeholder="you@email.com"
                    className="w-full h-12 rounded-lg bg-[#0b1d26] border border-white/10 px-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#d4a24c]/40"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-sm text-white/60 mb-2 block flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#d4a24c]" />
                  Phone
                </label>
                <input
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="09123456789"
                  maxLength={11}
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-lg bg-[#0b1d26] border border-white/10 px-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#d4a24c]/40"
                />
              </div>

              {/* Address */}
              <div>
                <label className="text-sm text-white/60 mb-2 block flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#d4a24c]" />
                  Address
                </label>
                <input
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Your address"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-lg bg-[#0b1d26] border border-white/10 px-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#d4a24c]/40"
                />
              </div>

              {/* City + Zip */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-2 block flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#d4a24c]" />
                    City
                  </label>
                  <input
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="City"
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-lg bg-[#0b1d26] border border-white/10 px-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#d4a24c]/40"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block flex items-center gap-2">
                    <Hash className="w-4 h-4 text-[#d4a24c]" />
                    ZIP Code
                  </label>
                  <input
                    value={formData.zip_code}
                    onChange={(e) => handleInputChange("zip_code", e.target.value)}
                    placeholder="1234"
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-lg bg-[#0b1d26] border border-white/10 px-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#d4a24c]/40"
                  />
                </div>
              </div>

              {/* Passwords */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-2 block flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#d4a24c]" />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      required
                      disabled={isSubmitting}
                      className="w-full h-12 rounded-lg bg-[#0b1d26] border border-white/10 px-4 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-[#d4a24c]/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#d4a24c]"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#d4a24c]" />
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.password_confirmation}
                      onChange={(e) => handleInputChange("password_confirmation", e.target.value)}
                      required
                      disabled={isSubmitting}
                      className="w-full h-12 rounded-lg bg-[#0b1d26] border border-white/10 px-4 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-[#d4a24c]/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#d4a24c]"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-full bg-[#d4a24c] text-black font-semibold hover:brightness-110 transition disabled:opacity-50"
              >
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </button>

              {/* Footer */}
              <div className="text-center pt-2">
                <p className="text-white/60">
                  Already have an account?{" "}
                  <Link href="/login" className="text-[#d4a24c] hover:underline">
                    Login
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Toaster />
    </>

  )
}
