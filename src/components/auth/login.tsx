"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, Lock, Eye, EyeOff, ArrowLeftCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/toaster"
import { useAuthStore } from "@/store/authStore"
import { Playfair_Display } from "next/font/google"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const login = useAuthStore((state) => state.login)

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      toast.error("Missing Information", {
        description: "Please fill in all required fields.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        const token = data.token || data.data?.token || data.access_token
        const user = data.user || data.data?.user || data.data

        if (token && user) {
          login({ ...user, token })

          toast.success("Login Successful!", {
            description: "Welcome back to Lumè Bean and Bar!",
          })

          const userRole = user?.role?.toLowerCase?.() || user?.role || ""
          const isAdmin = userRole === "admin"
          const isCustomer = userRole === "customer" || userRole === "user"

          let redirectPath = "/"
          if (isAdmin) {
            redirectPath = "/admin/dashboard"
          } else if (isCustomer) {
            redirectPath = "/"
          }

          setTimeout(() => {
            router.push(redirectPath)
          }, 1500)
        }
      } else {
        toast.error("Login Failed", {
          description: data.message || "Login failed. Please try again.",
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      toast.error("Connection Error", {
        description: "Unable to login. Please check your connection and try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-[#0b1d26] flex items-center justify-center px-4">

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

        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`steam2-${i}`}
              initial={{ y: 100, opacity: 0 }}
              animate={{
                y: -500,
                opacity: [0.3, 0.1, 0.3],
                x: [0, 20, 50, 0],
              }}
              transition={{
                duration: 7 + i * 1.2,
                repeat: Infinity,
                delay: i * 0.6,
                ease: "easeInOut",
              }}
              className="absolute bottom-0 w-28 h-28 bg-white/70 rounded-full blur-2xl"
              style={{ left: `${5 + i * 15}%` }}
            />
          ))}
        </div>

        {/* Card */}
        <div className="relative w-full max-w-md">
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
              <h1 className={`text-3xl font-bold text-white ${playfair.className}`}>Welcome Back!</h1>
              <p className="text-[#d4a24c] mt-1 tracking-wide">Lumè Bean and Bar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Email */}
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

              {/* Password */}
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
                    placeholder="Enter your password"
                    className="w-full h-12 rounded-lg bg-[#0b1d26] border border-white/10 px-4 pr-10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#d4a24c]/40"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#d4a24c] hover:opacity-80"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-full bg-[#d4a24c] text-black font-semibold transition-all hover:brightness-110 disabled:opacity-50"
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </button>

              {/* Footer */}
              <div className="text-center pt-2">
                <p className="text-white/60">
                  Don’t have an account?{" "}
                  <Link href="/register" className="text-[#d4a24c] hover:underline">
                    Register
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
