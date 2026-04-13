"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronRight, Users, Calendar, Clock, Mail, Phone, User, MessageSquare, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { Playfair_Display } from "next/font/google"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

const PACKAGES = [
  {
    id: "loft",
    room: "The Loft",
    name: "Skyline Social",
    price: 5500,
    description: "A stylish open-style loft perfect for barkada nights.",
    details: [
      "Open-style loft setup",
      "Best for barkada (4–10 pax)",
      "Great for casual events",
      "Reservation Fee: ₱5,500",
    ],
  },
  {
    id: "amber",
    room: "Amber Room",
    name: "Golden Hour",
    price: 4000,
    description: "Warm-toned private room for intimate gatherings.",
    details: [
      "Cozy and aesthetic ambiance",
      "Ideal for small groups (2–6 pax)",
      "Private setup",
      "Reservation Fee: ₱4,000",
    ],
  },
  {
    id: "aurora",
    room: "Aurora Lounge",
    name: "Neon Nights",
    price: 8500,
    description: "Vibrant lounge with dynamic lighting.",
    details: [
      "Color-shifting lights",
      "Party-ready atmosphere",
      "Great for big groups",
      "Reservation Fee: ₱8,500",
    ],
    badge: "Most Picked",
  },
  {
    id: "velvet",
    room: "Velvet Room",
    name: "Midnight Luxe",
    price: 6500,
    description: "Speakeasy-style premium private room.",
    details: [
      "Luxury interior",
      "Speakeasy vibe",
      "Ideal for premium events",
      "Reservation Fee: ₱6,500",
    ],
  },
  {
    id: "custom",
    name: "Custom Reservation",
    description: "Full control over seating, time, and preferences",
  },
];

const SEATING_CONFIG = {
  regular: {
    "Main Dining": 0,
    "Lounge Seating": 100,
    "High Table": 150,
    "Bar Counter": 200,
  },
  vip: {
    "The Loft": 1500,
    "Amber Room": 1500,
    "Aurora Lounge": 1500,
    "Velvet Room": 1500,
  },
}

const VIP_ROOMS = new Set(Object.keys(SEATING_CONFIG.vip))
const REGULAR_SEATING = SEATING_CONFIG.regular

export default function ReservationsPage() {

  const [step, setStep] = useState(1)
  const [user, setUser] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [openReceipt, setOpenReceipt] = useState(false)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState<{
    date: string
    time: string
    guests: string
    package: string
    dining_preference: string
    name: string
    email: string
    phone: string
    occasion: string
    special_requests: string
    reservation_fee: string
    payment_method: string
    payment_reference: string
    payment_receipt: File | undefined
  }>({
    date: "",
    time: "",
    guests: "2",
    package: "Custom",
    dining_preference: "Main Dining",
    name: "",
    email: "",
    phone: "",
    special_requests: "",
    occasion: "",
    reservation_fee: "",
    payment_method: "",
    payment_reference: "",
    payment_receipt: undefined,
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [emailError, setEmailError] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [dailyBookingsCount, setDailyBookingsCount] = useState(0)
  const [checkingBookings, setCheckingBookings] = useState(false)
  const { toast } = useToast()
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)

  // Safe derived value
  const isVIP = VIP_ROOMS.has(formData.dining_preference)

  // Stable function (no ESLint warning)
  const calculateReservationFee = useCallback((
    occasionType: string,
    guests: number,
    diningPreference: string
  ) => {
    let baseFee = 0

    switch (occasionType) {
      case "Celebration":
        baseFee = 500
        break
      case "Romantic":
        baseFee = 700
        break
      case "Night Life":
        baseFee = 1000
        break
      case "Professional":
        baseFee = 2000
        break
      case "Casual":
        baseFee = 0
        break
      case "Other":
        baseFee = 300
        break
      default:
        baseFee = 0
    }

    const isVipRoom = VIP_ROOMS.has(diningPreference)

    if (isVipRoom) {
      baseFee += SEATING_CONFIG.vip[diningPreference] ?? 1500
    } else {
      baseFee += REGULAR_SEATING[diningPreference] ?? 0
    }

    const extraGuests = guests > 4 ? guests - 4 : 0
    const extraFeePerGuest = 200

    return baseFee + extraGuests * extraFeePerGuest
  }, [])


  useEffect(() => {
    if (!selectedPackage) {
      const guestsNum = Number(formData.guests) || 1

      const fee = calculateReservationFee(
        formData.occasion,
        guestsNum,
        formData.dining_preference
      )

      setFormData((prev) => ({
        ...prev,
        reservation_fee: fee.toString(),
      }))
    }
  }, [
    formData.occasion,
    formData.guests,
    formData.dining_preference,
    selectedPackage,
    calculateReservationFee,
  ])


  const calculateTotalBill = (reservationFee: number, guests: number) => {
    const serviceChargeRate = 0.1 // 10% service charge
    const serviceCharge = reservationFee * serviceChargeRate

    const total = reservationFee + serviceCharge

    return {
      serviceCharge,
      total,
    }
  }

  const reservationFeeNum = Number(formData.reservation_fee || 0)
  const guestsNum = Number(formData.guests || 1)

  const { serviceCharge, total } = calculateTotalBill(reservationFeeNum, guestsNum)

  const [packageDialogOpen, setPackageDialogOpen] = useState(false)
  const [selectedPkgForDialog, setSelectedPkgForDialog] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user_data")
    const token = localStorage.getItem("auth_token")

    if (!userData || !token) {
      setIsAuthenticated(false)
      const redirectTimer = setTimeout(() => {
        window.location.href = "/login?redirect=/reservations"
      }, 100)
      return () => clearTimeout(redirectTimer)
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      setFormData((prev) => ({
        ...prev,
        name: parsedUser.name || "",
        email: parsedUser.email || "",
        phone: parsedUser.phone || prev.phone,
      }))
      setIsAuthenticated(true)
    } catch (error) {
      console.error("Error parsing user data:", error)
      setIsAuthenticated(false)
      const redirectTimer = setTimeout(() => {
        window.location.href = "/login?redirect=/reservations"
      }, 100)
      return () => clearTimeout(redirectTimer)
    }
  }, [])

  useEffect(() => {
    const checkDailyBookings = async () => {
      if (!formData.date || !user) return

      setCheckingBookings(true)
      try {
        const token = localStorage.getItem("auth_token")
        const response = await fetch(`/api/reservations/check-daily?date=${formData.date}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setDailyBookingsCount(data.count || 0)
        }
      } catch (error) {
        console.error("Error checking daily bookings:", error)
      } finally {
        setCheckingBookings(false)
      }
    }

    checkDailyBookings()
  }, [formData.date, user])

  const handleChange = (e: { target: { name: string; value: string } }) => {
    const { name, value } = e.target

    // Email validation
    if (name === "email") {
      setFormData((prev) => ({ ...prev, [name]: value }))
      if (!isValidEmail(value)) {
        setEmailError("Please enter a valid email address")
      } else {
        setEmailError("")
      }
      return
    }

    // Phone validation
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "")
      if (digitsOnly.length > 11) {
        setPhoneError("Phone number cannot exceed 11 digits")
      } else if (!/^[0-9+()\- ]*$/.test(value)) {
        setPhoneError("Phone number can only contain digits, +, - or ()")
      } else {
        setPhoneError("")
        setFormData((prev) => ({ ...prev, [name]: value }))
      }
      return
    }

    // Date validation
    if (name === "date") {
      setFormData((prev) => {
        const newData = { ...prev, [name]: value }
        if (value === getMinDate() && prev.time) {
          const selectedDateTime = new Date(`${value}T${prev.time}`)
          if (selectedDateTime <= new Date()) {
            newData.time = ""
          }
        }
        return newData
      })
      return
    }

    // Handle occasion, guests, or dining_preference change to update reservation fee (only for custom reservations)
    if (!selectedPackage && (name === "occasion" || name === "guests" || name === "dining_preference")) {
      setFormData((prev) => {
        const updated = { ...prev, [name]: value }
        const guestsNum = Number(updated.guests) || 1
        updated.reservation_fee = calculateReservationFee(updated.occasion || "", guestsNum, updated.dining_preference).toString()
        return updated
      })
      return
    }

    // Default case for other fields
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  }

  const getMinTime = () => {
    const today = new Date().toISOString().split("T")[0]
    if (formData.date === today) {
      const now = new Date()
      const hours = String(now.getHours()).padStart(2, "0")
      const minutes = String(now.getMinutes()).padStart(2, "0")
      return `${hours}:${minutes}`
    }
    return undefined
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const isDailyLimitReached = () => {
    return dailyBookingsCount >= 2
  }

  const handleSelect = (pkg: any) => {
    setSelectedPackage(pkg.name)
    setFormData((prev) => ({
      ...prev,
      package: pkg.name,
      dining_preference: pkg.room || prev.dining_preference,
      reservation_fee: pkg.price?.toString() || "0",
    }))
    setStep(2)
    setPackageDialogOpen(false)
  }

  const isStepValid = () => {
    switch (step) {
      case 2: // Reservation Details
        return formData.date.trim() !== "" && formData.time.trim() !== "" && formData.guests.trim() !== "" && formData.dining_preference.trim() !== ""
      case 3: // Guest Information
        const phoneDigits = formData.phone.replace(/\D/g, "")
        return (
          formData.name.trim() !== "" &&
          formData.email.trim() !== "" &&
          isValidEmail(formData.email) &&
          formData.phone.trim() !== "" &&
          phoneDigits.length === 11 &&
          !phoneError &&
          !emailError
        )
      case 4: // Occasion Details
        return formData.occasion && formData.occasion !== ""
      case 5: // Payment Details
        if (isDailyLimitReached()) return false
        if (formData.reservation_fee && (isNaN(Number(formData.reservation_fee)) || Number(formData.reservation_fee) < 0)) return false
        if (!formData.payment_method) return false
        if (!formData.payment_reference) return false
        if (!formData.payment_receipt) return false
        return true
      case 1: // Package Details
        return selectedPackage !== null
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    if (isDailyLimitReached()) {
      toast({
        title: "Daily limit reached",
        description: "You have reached the maximum of 2 reservations per day. Please choose a different date.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        window.location.href = "/login?redirect=/reservations"
        return
      }

      // Generate unique reservation number
      const generateReservationNumber = () => {
        const timestamp = Date.now()
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
        return `RES-${timestamp}-${random}`
      }

      const reservationNumber = generateReservationNumber()

      // Create FormData payload
      const formPayload = new FormData()

      // Add reservation number first
      formPayload.append("reservation_number", reservationNumber)

      for (const key in formData) {
        const value = formData[key as keyof typeof formData]

        if (key === "payment_receipt") {
          if (value instanceof File) {
            formPayload.append("payment_receipt", value)
          }
        } else {
          formPayload.append(key, value?.toString() || "")
        }
      }

      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formPayload,
      })

      const responseText = await response.text()

      let data: any
      try {
        data = JSON.parse(responseText)
      } catch {
        toast({
          title: "Server Error",
          description: "Invalid response format from server.",
          variant: "destructive",
        })
        return
      }

      if (!response.ok) {
        const errorMsg = data.message || data.error || "Failed to create reservation"

        toast({
          title: "Reservation Failed",
          description: errorMsg,
          variant: "destructive",
        })

        return
      }

      const responseReservationNumber = data?.data?.reservation_number

      toast({
        title: "Reservation Successful",
        description: `Reservation #${responseReservationNumber || reservationNumber} has been created.`,
      })

      setMessage("success")

      setTimeout(() => {
        setStep(1)
        setFormData({
          name: user?.name || "",
          email: user?.email || "",
          phone: user?.phone || "",
          date: "",
          time: "",
          guests: "2",
          package: "",
          dining_preference: "Main Dining",
          special_requests: "",
          occasion: "",
          reservation_fee: "",
          payment_method: "",
          payment_reference: "",
          payment_receipt: undefined,
        })
        setSelectedPackage(null)
        setMessage("")
        setDailyBookingsCount(0)

        // Redirect after success
        window.location.href = "/reservation-history"
      }, 1500)
    } catch (error) {
      console.error("❌ Reservation error:", error)

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (receiptPreview) {
        URL.revokeObjectURL(receiptPreview)
      }
    }
  }, [receiptPreview])

  return (
    <div className="min-h-screen py-24 bg-[#0b1d26] text-white">
      {/* Authentication Loading State */}
      {isAuthenticated === null && (
        <div className="fixed inset-0 bg-[#0b1d26] flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-[#d4a24c] animate-spin"></div>
            <p className="text-white/70">Checking authentication...</p>
          </div>
        </div>
      )}

      {/* Not Authenticated */}
      {isAuthenticated === false && (
        <div className="fixed inset-0 bg-[#0b1d26] flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-[#d4a24c] animate-spin"></div>
            <p className="text-white/70">Redirecting to login...</p>
          </div>
        </div>
      )}

      {/* Main Content - Only show when authenticated */}
      {isAuthenticated === true && (
        <>
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
            <div className="absolute top-0 left-0 w-96 h-96 bg-[#d4a24c]/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#d4a24c]/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          <div className="max-w-2xl mx-auto relative z-10">
            {/* Header */}
            <div className="flex flex-col items-center">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="text-center mb-6">
                <p className="tracking-[0.3em] uppercase text-sm mb-3 text-[#d4a24c]">Reservations</p>

                <h2 className={`${playfair.className} text-4xl md:text-5xl font-bold`}>
                  Reserve Your <span className="text-[#d4a24c] italic">Moment</span>
                </h2>
              </motion.div>

              {/* User Badge */}
              {user && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full shadow-lg"
                >
                  <User className="w-4 h-4 text-[#d4a24c]" />
                  <span className="text-sm text-white">
                    Reserving as <span className="font-semibold">{user.name}</span>
                  </span>
                </motion.div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-10">
              <div className="relative">
                <div className="relative w-full px-5 mt-10">
                  {/* Progress Line Background */}
                  <div className="absolute top-5 left-15 right-15 h-1 bg-white/20 rounded"></div>

                  {/* Progress Line Fill */}
                  <div
                    className="absolute top-5 h-1 bg-white rounded transition-all duration-500"
                    style={{
                      width: `calc(${((step - 1) / 5) * 100}%)`,
                    }}
                  ></div>

                  {/* Step Circles */}
                  <div className="relative flex justify-between">
                    {[1, 2, 3, 4, 5, 6].map((s) => (
                      <div
                        key={s}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 transform ${s <= step ? "bg-white text-[#0f4764] shadow-xl scale-110" : "bg-white/20 text-white/50"
                          }`}
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between text-center">
                  <div className="text-center text-xs text-white/70 font-medium" style={{ width: "50px" }}>
                    Package Selection
                  </div>
                  <div className="text-center text-xs text-white/70 font-medium" style={{ width: "50px" }}>
                    Reservation Details
                  </div>
                  <div className="text-center text-xs text-white/70 font-medium" style={{ width: "50px" }}>
                    Guest Information
                  </div>
                  <div className="text-center text-xs text-white/70 font-medium" style={{ width: "50px " }}>
                    Occasion Details
                  </div>
                  <div className="text-center text-xs text-white/70 font-medium" style={{ width: "50px" }}>
                    Payment Details
                  </div>
                  <div className="text-center text-xs text-white/70 font-medium" style={{ width: "50px" }}>
                    Confirmation
                  </div>
                </div>
              </div>
            </div>

            {/* Form Card */}
            <div className="mx-5 md:mx-auto bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/10 animate-in fade-in zoom-in duration-500">
              <div className="bg-white h-1" />

              <div className="p-8 md:p-10">
                {/* Step 1: Package Selection */}
                {step === 1 && (
                  <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-10">
                      <p className="text-[#d4a24c] tracking-[0.3em] uppercase text-sm">
                        Reservation Packages
                      </p>
                      <h2 className="text-4xl font-bold text-white mt-2">
                        Choose Your <span className="text-[#d4a24c] italic">Experience</span>
                      </h2>
                      <p className="text-white/70 mt-3">
                        Select a curated package or proceed with custom reservation
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {PACKAGES.filter(pkg => pkg.id !== "custom").map((pkg) => (
                        <div
                          key={pkg.id}
                          onClick={() => {
                            setSelectedPkgForDialog(pkg)
                            setPackageDialogOpen(true)
                          }}
                          className={`relative cursor-pointer group bg-white/5 border rounded-2xl p-6 transition-all hover:scale-[1.02]
          ${pkg.badge ? "border-[#d4a24c]" : "border-white/20 hover:border-[#d4a24c]/50"}
        `}>

                          {/* Badge */}
                          {pkg.badge && (
                            <span className="absolute -top-3 right-3 text-[10px] tracking-wider uppercase bg-[#d4a24c] text-gray-700 px-2 py-1 rounded-full font-semibold">
                              {pkg.badge}
                            </span>
                          )}

                          <h3 className="text-xl font-bold text-white mb-2">
                            {pkg.name}
                          </h3>

                          <p className="text-white/70 text-sm mb-4">
                            {pkg.description}
                          </p>

                          <p className="text-[#d4a24c] font-semibold">
                            {pkg.price ? `₱${pkg.price.toLocaleString()}` : "Standard Rates"}
                          </p>

                        </div>
                      ))}

                      <Dialog open={packageDialogOpen} onOpenChange={setPackageDialogOpen}>
                        <DialogContent className="bg-black text-white border border-white/20">
                          {selectedPkgForDialog && (
                            <>
                              <DialogHeader>
                                <DialogTitle>{selectedPkgForDialog.name}</DialogTitle>
                                <DialogDescription>{selectedPkgForDialog.description}</DialogDescription>
                              </DialogHeader>

                              {selectedPkgForDialog.room && (
                                <div className="text-sm text-white/60 mb-2">
                                  Room: {selectedPkgForDialog.room}
                                </div>
                              )}

                              {selectedPkgForDialog.details && (
                                <div className="space-y-2 text-sm text-white/80">
                                  {selectedPkgForDialog.details.map((item: string, i: number) => (
                                    <p key={i}>• {item}</p>
                                  ))}
                                </div>
                              )}

                              <button
                                onClick={() => handleSelect(selectedPkgForDialog)}
                                className="mt-4 w-full bg-[#d4a24c] text-black py-2 rounded-lg font-semibold"
                              >
                                Select Package
                              </button>
                            </>
                          )}
                        </DialogContent>
                      </Dialog>

                      {PACKAGES.filter(pkg => pkg.id === "custom").map((pkg) => (
                        <div
                          key={pkg.id}
                          onClick={() => {
                            setSelectedPackage("Custom")
                            setFormData((prev) => ({
                              ...prev,
                              package: "Custom",
                            }))
                            setStep(2)
                          }}
                          className="cursor-pointer group bg-white/5 border border-white/20 hover:border-white/60 rounded-2xl p-6 transition-all hover:scale-[1.02]"
                        >
                          <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>
                          <p className="text-white/70 text-sm mb-4">{pkg.description}</p>
                          <p className="text-white/60 font-semibold">Standard Rates</p>
                        </div>
                      ))}
                    </div>

                  </div>
                )}

                {/* Step 2: Reservation Details */}
                {step === 2 && (
                  <div>
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-white mb-2">Reservation Details</h2>
                      <p className="text-white/70">Please provide the details for your reservation</p>
                    </div>

                    <div className="space-y-6">
                      <div className="relative">
                        <label className="block text-sm font-semibold text-white mb-3">Date *</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-3.5 w-5 h-5 text-[#d4a24c]  pointer-events-none" />
                          <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            min={getMinDate()}
                            required
                            className="w-full pl-12 pr-4 py-3 border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-all text-lg text-white placeholder-white/40"
                          />
                        </div>
                      </div>

                      <div className="relative">
                        <label className="block text-sm font-semibold text-white mb-3">Time *</label>
                        <div className="relative">
                          <Clock className="absolute left-4 top-3.5 w-5 h-5 text-[#d4a24c]  pointer-events-none" />
                          <input
                            type="time"
                            name="time"
                            value={formData.time}
                            onChange={handleChange}
                            min={getMinTime()}
                            required
                            className="w-full pl-12 pr-4 py-3 border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-all text-lg text-white placeholder-white/40"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                          <label className="block text-sm font-semibold text-white mb-3">Number of Guests *</label>
                          <div className="relative">
                            <Users className="absolute left-4 top-3.5 w-5 h-5 text-[#d4a24c]  pointer-events-none" />
                            <input
                              type="number"
                              name="guests"
                              value={formData.guests}
                              min={1}
                              max={50} // optional, adjust max as needed
                              onChange={(e) => {
                                const value = e.target.value
                                if (/^\d*$/.test(value)) {
                                  handleChange({
                                    target: { name: "guests", value }
                                  })
                                }
                              }}
                              placeholder="Number of Guests"
                              required
                              className="w-full md:w-auto min-w-[120px] pl-12 pr-4 py-3 border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-all text-lg text-white placeholder-white/40"
                            />
                          </div>
                        </div>

                        <div className="relative">
                          <label className="block text-sm font-semibold text-white mb-3">Dining Preference *</label>
                          <div className="relative">
                            <Users className="absolute left-4 top-3.5 w-5 h-5 text-[#d4a24c]  pointer-events-none" />
                            <select
                              name="dining_preference"
                              value={formData.dining_preference}
                              onChange={handleChange}
                              className="w-full md:w-auto min-w-[120px] pl-12 pr-8 py-3 border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-all text-lg text-white appearance-none"
                              required
                            >
                              {/* REGULAR SEATING (Standard Allocation) */}
                              <optgroup label="Standard Seating (Auto-Assigned)">
                                {[
                                  "Main Dining",
                                  "Lounge Seating",
                                  "High Table",
                                  "Bar Counter",
                                ].map((option) => (
                                  <option key={option} value={option} className="text-gray-900">
                                    {option}
                                  </option>
                                ))}
                              </optgroup>

                              {/* VIP ROOMS (Priority / Private Allocation) */}
                              <optgroup label="VIP Private Rooms">
                                {[
                                  "The Loft",
                                  "Amber Room",
                                  "Aurora Lounge",
                                  "Velvet Room",
                                ].map((option) => (
                                  <option key={option} value={option} className="text-gray-900 font-semibold">
                                    {option}
                                  </option>
                                ))}
                              </optgroup>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Guest Information */}
                {step === 3 && (
                  <div>
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-white mb-2">Guest Information</h2>
                      <p className="text-white/70">Tell us about your party and any special needs</p>
                    </div>

                    <div className="space-y-6">
                      <div className="relative">
                        <label className="block text-sm font-semibold text-white mb-3">Full Name *</label>
                        <div className="relative">
                          <User className="absolute left-4 top-3.5 w-5 h-5 text-[#d4a24c]  pointer-events-none" />
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Full Name"
                            className="w-full pl-12 pr-4 py-3 border rounded-xl bg-white/10 backdrop-blur-sm focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-all text-lg text-white placeholder-white/40 border-white/20"
                          />
                        </div>
                      </div>

                      <div className="relative">
                        <label className="block text-sm font-semibold text-white mb-3">Email Address *</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-3.5 w-5 h-5 text-[#d4a24c]  pointer-events-none" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={() => {
                              if (formData.email && !isValidEmail(formData.email)) {
                                setEmailError("Please enter a valid email address")
                              }
                            }}
                            required
                            placeholder="your@email.com"
                            className={`w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none transition-all text-lg disabled:bg-white/5 disabled:text-white/50 text-white placeholder-white/40 bg-white/10 backdrop-blur-sm ${emailError
                              ? "border-white focus:border-white focus:ring-2 focus:ring-white/30"
                              : "border-white/20 focus:border-white focus:ring-2 focus:ring-white/30"
                              } border`}
                          />
                        </div>
                        {user?.email && <p className="text-xs text-white/50 mt-1">Using your account email</p>}
                        {emailError && !user?.email && (
                          <div className="mt-2 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-[#d4a24c]  shrink-0 mt-0.5" />
                            <p className="text-[#d4a24c]  text-sm font-medium">{emailError}</p>
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        <label className="block text-sm font-semibold text-white mb-3">Phone Number *</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-3.5 w-5 h-5 text-[#d4a24c]  pointer-events-none" />
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            placeholder="09123456789"
                            className={`w-full pl-12 pr-4 py-3 border rounded-xl bg-white/10 backdrop-blur-sm focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-all text-lg text-white placeholder-white/40 ${phoneError ? "border-red-500" : "border-white/20"
                              }`}
                          />
                        </div>
                        {phoneError && <p className="mt-2 text-sm text-[#d4a24c] ">{phoneError}</p>}
                      </div>

                      <div className="relative">
                        <label className="block text-sm font-semibold text-white mb-3">Special Request (Accessibility, Dietary, Celebrations)</label>
                        <div className="relative">
                          <MessageSquare className="absolute left-4 top-3.5 w-5 h-5 text-[#d4a24c]  pointer-events-none" />
                          <input
                            type="text"
                            name="special_requests"
                            value={formData.special_requests}
                            onChange={handleChange}
                            placeholder="Accessibility needs, dietary restrictions, celebrations, etc."
                            className="w-full pl-12 pr-4 py-3 border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-all text-lg text-white placeholder-white/40"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Occasion Details */}
                {step === 4 && (
                  <div>
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-white mb-2">Occasion Details</h2>
                      <p className="text-white/70">Let us know what you&apos;re celebrating or the purpose of your visit</p>
                    </div>

                    <div className="space-y-6">
                      <div className="relative">
                        <label className="block text-sm font-semibold text-white mb-3">Occasion Type *</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-3.5 w-5 h-5 text-[#d4a24c]  pointer-events-none" />
                          <select
                            name="occasion"
                            value={formData.occasion || ""}
                            onChange={handleChange}
                            required
                            className="w-full pl-12 pr-4 py-3 border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-all text-lg appearance-none text-white"
                          >
                            {["Celebration", "Romantic", "Professional", "Night Life", "Casual", "Other"].map((option) => (
                              <option key={option} value={option} className="bg-blue-250 text-gray-900">
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Payment Details */}
                {step === 5 && (
                  <div>
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-white mb-2">Payment Details</h2>
                      <p className="text-white/70">Secure your reservation</p>
                    </div>

                    <div className="space-y-6">
                      <div className="relative">
                        <label className="block text-sm font-semibold text-white mb-3">Reservation Fee</label>
                        <input
                          type="number"
                          name="reservation_fee"
                          value={formData.reservation_fee || ""}
                          readOnly
                          className="w-full pl-4 pr-4 py-3 border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-all text-lg text-white placeholder-white/40"
                        />
                      </div>

                      <div className="relative">
                        <label className="block text-sm font-semibold text-white mb-3">Payment Method *</label>
                        <select
                          name="payment_method"
                          value={formData.payment_method || ""}
                          onChange={handleChange}
                          required
                          className="w-full pl-4 pr-4 py-3 border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-all text-lg appearance-none text-white"
                        >
                          <option value="" disabled>Select Payment Method</option>
                          {["GCash", "BPI", "Security Bank", "Other"].map((option) => (
                            <option key={option} value={option} className="bg-blue-250 text-gray-900">
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="relative">
                        <label className="block text-sm font-semibold text-white mb-3">Reference Number *</label>
                        <input
                          type="text"
                          name="payment_reference"
                          value={formData.payment_reference || ""}
                          onChange={handleChange}
                          required
                          placeholder="Enter payment reference number"
                          className="w-full pl-4 pr-4 py-3 border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-all text-lg text-white placeholder-white/40"
                        />
                      </div>

                      <div className="relative">
                        <label className="block text-sm font-semibold text-white mb-3">Receipt Screenshot *</label>
                        <input
                          type="file"
                          name="payment_receipt"
                          accept="image/*"
                          required
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setFormData((prev) => ({ ...prev, payment_receipt: file }))
                              setReceiptPreview(URL.createObjectURL(file))
                            }
                          }}
                          className="w-full pl-4 pr-4 py-3 border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-all text-lg text-white placeholder-white/40"
                        />
                        {formData.payment_receipt && <div className="mt-2 text-white text-xs">Selected: {formData.payment_receipt.name}</div>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 6: Reservation Details (Confirmation) */}
                {step === 6 && (
                  <div className="space-y-8">
                    {/* Header */}
                    <div className="mb-4">
                      <h2 className="text-3xl font-extrabold text-white mb-1">
                        Review & Confirm
                      </h2>
                      <p className="text-white/70 text-md">
                        Please review your reservation details before submitting.
                      </p>
                    </div>

                    {/* Receipt Container */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg space-y-6">

                      {/* Guest Information */}
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2">
                        <h3 className="text-lg font-semibold text-white mb-2">
                          Guest Information
                        </h3>

                        <div className="flex flex-col gap-4 text-white/80">
                          <span>
                            <span className="font-semibold">Name:</span> {formData.name}
                          </span>
                          <span>
                            <span className="font-semibold">Email:</span> {formData.email}
                          </span>
                          <span>
                            <span className="font-semibold">Phone:</span> {formData.phone}
                          </span>
                        </div>
                      </div>

                      {/* Reservation Details */}
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2">
                        <h3 className="text-lg font-semibold text-white mb-2">
                          Reservation Details
                        </h3>

                        <div className="grid grid-cols-2 gap-4 text-white/80">
                          <span><span className="font-semibold">Date:</span> {formData.date}</span>
                          <span><span className="font-semibold">Time:</span> {formData.time}</span>
                          <span><span className="font-semibold">Guests:</span> {formData.guests}</span>
                          <span><span className="font-semibold">Dining:</span> {formData.dining_preference}</span>
                          <span><span className="font-semibold">VIP Package:</span> {isVIP ? "Yes" : "No"}</span>
                          <span><span className="font-semibold">Package:</span> {selectedPackage || "-"}</span>
                          <span><span className="font-semibold">Occasion:</span> {formData.occasion || "-"}</span>
                        </div>
                      </div>

                      {/* Payment */}
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-4">
                        <h3 className="text-lg font-semibold text-white mb-2">Payment</h3>

                        <div className="space-y-3 text-white/80">
                          {/* Reservation Fee */}
                          <div className="flex justify-between items-center bg-white/5 px-4 py-3 rounded-xl border border-white/10">
                            <span className="font-semibold">Reservation Fee</span>
                            <span>₱{formData.reservation_fee || "0.00"}</span>
                          </div>

                          {/* Service Charge */}
                          <div className="flex justify-between items-center bg-white/5 px-4 py-3 rounded-xl border border-white/10">
                            <span className="font-semibold">Service Charge (10%)</span>
                            <span>₱{serviceCharge.toFixed(2)}</span>
                          </div>

                          {/* Total */}
                          <div className="flex justify-between items-center bg-white/10 px-4 py-4 rounded-xl border border-white/20">
                            <span className="font-bold text-white">Total Bill</span>
                            <span className="font-bold text-white text-lg">
                              ₱{total.toFixed(2)}
                            </span>
                          </div>

                          <div className="border-t border-white/10 my-2" />

                          {/* Payment Method */}
                          <div className="flex gap-6 items-center">
                            <span className="font-semibold">Payment Method:</span>
                            <span>{formData.payment_method || "-"}</span>
                          </div>

                          {/* Reference */}
                          <div className="flex gap-6 items-center">
                            <span className="font-semibold">Reference:</span>
                            <span>{formData.payment_reference || "-"}</span>
                          </div>

                          {/* Receipt */}
                          {formData.payment_receipt && (
                            <div className="flex gap-6 items-center">
                              <span className="font-semibold">Receipt:</span>
                              <button
                                type="button"
                                onClick={() => setOpenReceipt(true)}
                                className="text-white underline hover:text-white/70 transition"
                              >
                                {formData.payment_receipt.name}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Special Requests */}
                      {formData.special_requests && (
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <h3 className="text-lg font-semibold text-white mb-2">
                            Special Requests
                          </h3>
                          <p className="text-white/80">{formData.special_requests}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-4 mt-8">
                  {step > 1 && (
                    <button
                      onClick={() => setStep(step - 1)}
                      className="flex-1 px-6 py-3 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all hover:scale-105"
                    >
                      Back
                    </button>
                  )}

                  {step < 6 ? (
                    <button
                      onClick={() => setStep(step + 1)}
                      disabled={!isStepValid()}
                      className="flex-1 px-6 py-3 bg-white hover:bg-white/90 disabled:bg-white/20 text-[#0b1d26] disabled:text-white/50 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:shadow-none hover:scale-105 disabled:hover:scale-100"
                    >
                      Continue
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={loading || isDailyLimitReached()}
                      className="flex-1 px-6 py-3 bg-white hover:bg-white/90 disabled:bg-white/20 text-[#0b1d26] disabled:text-white/50 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:shadow-none hover:scale-105 disabled:hover:scale-100"
                    >
                      {loading ? "Confirming..." : "Confirm Reservation"}
                    </button>
                  )}
                </div>

                {openReceipt && receiptPreview && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black"
                    onClick={() => setOpenReceipt(false)}
                  >
                    <div
                      className="relative w-full max-w-3xl bg-[#0b1d26] border border-white/20 rounded-2xl overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className="flex justify-between items-center px-5 py-4 border-b border-white/20">
                        <h2 className="text-white font-semibold">Receipt Preview</h2>

                        <button
                          onClick={() => setOpenReceipt(false)}
                          className="text-white text-xl hover:text-white/70"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Image */}
                      <div className="p-4 flex justify-center bg-[#08141a]">
                        <img
                          src={receiptPreview}
                          alt="Receipt"
                          className="max-h-[75vh] object-contain rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
