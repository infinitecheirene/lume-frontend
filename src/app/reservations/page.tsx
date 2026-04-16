"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { ChevronRight, Users, Calendar, Clock, Mail, Phone, User, MessageSquare, AlertCircle, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import { Playfair_Display } from "next/font/google"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import LumeLoaderMinimal from "@/components/oppa-loader"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

function getDayHours(dayOfWeek: number): { opening: number; closing: number; isClosed: boolean; label: string } {
  switch (dayOfWeek) {
    case 0: return { opening: 0, closing: 0, isClosed: true, label: "Closed" }
    case 1: return { opening: 10, closing: 22.5, isClosed: false, label: "10 AM – 10:30 PM" }
    case 2: return { opening: 10, closing: 22.5, isClosed: false, label: "10 AM – 10:30 PM" }
    case 3: return { opening: 10, closing: 22.5, isClosed: false, label: "10 AM – 10:30 PM" }
    case 4: return { opening: 10, closing: 22.5, isClosed: false, label: "10 AM – 10:30 PM" }
    case 5: return { opening: 10, closing: 26, isClosed: false, label: "10 AM – 2 AM" }
    case 6: return { opening: 11, closing: 26, isClosed: false, label: "11 AM – 2 AM" }
    default: return { opening: 10, closing: 22.5, isClosed: false, label: "10 AM – 10:30 PM" }
  }
}

function generateTimeSlots(opening: number, closing: number, step = 30) {
  const slots: string[] = []
  for (let time = opening * 60; time < closing * 60; time += step) {
    const hours = Math.floor(time / 60)
    const minutes = time % 60
    slots.push(`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`)
  }
  return slots
}

export type Package = {
  id: string
  room?: string
  name: string
  price?: number
  description: string
  details?: string[]
  badge?: string
}

export const PACKAGES: Package[] = [
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
    ],
  },
]

const SEATING_CONFIG = {
  regular: {
    "Main Dining": 0,
    "Lounge Seating": 100,
    "High Table": 150,
    "Bar Counter": 200,
  } as Record<string, number>,
  vip: {
    "The Loft": 1500,
    "Amber Room": 1500,
    "Aurora Lounge": 1500,
    "Velvet Room": 1500,
  } as Record<string, number>,
}

type PaymentMethod = {
  label: string
  accountName?: string
  accountNumber?: string
}

const PAYMENT_METHODS: Record<string, PaymentMethod> = {
  GCash: {
    label: "GCash",
    accountName: "Juan Dela Cruz",
    accountNumber: "0923456789",
  },
  BPI: {
    label: "BPI",
    accountName: "Juan Dela Cruz",
    accountNumber: "1234-5678-90",
  },
  "Security Bank": {
    label: "Security Bank",
    accountName: "Juan Dela Cruz",
    accountNumber: "0987-6543-21",
  },
  Other: {
    label: "Others (please specify in reference)",
  },
}

const VIP_ROOMS = new Set(Object.keys(SEATING_CONFIG.vip))

const getSeatingFee = (diningPreference: string) => {
  if (!diningPreference) return 0
  if (VIP_ROOMS.has(diningPreference)) {
    return SEATING_CONFIG.vip[diningPreference] ?? 1500
  }
  return SEATING_CONFIG.regular[diningPreference] ?? 0
}

const OCCASION_FEES: Record<string, number> = {
  Celebration: 500,
  Romantic: 700,
  "Night Life": 1000,
  Professional: 2000,
  Casual: 0,
  Other: 300,
}

type FormData = {
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
  down_payment: string
  remaining_balance: string
  service_charge?: string
  total_fee?: string
  payment_method: string
  payment_reference: string
  payment_receipt: File | undefined
}

const DEFAULT_FORM: FormData = {
  date: "",
  time: "",
  guests: "2",
  package: "",
  dining_preference: "Main Dining",
  name: "",
  email: "",
  phone: "",
  special_requests: "",
  occasion: "",
  reservation_fee: "",
  down_payment: "",
  remaining_balance: "",
  service_charge: "",
  total_fee: "",
  payment_method: "",
  payment_reference: "",
  payment_receipt: undefined,
}

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const getMinDate = () => new Date().toISOString().split("T")[0]

const calculateReservationFee = (
  occasionType: string,
  guests: number,
  diningPreference: string,
  packagePrice?: number
): number => {
  if (packagePrice && packagePrice > 0) return packagePrice
  const occasionFee = OCCASION_FEES[occasionType] ?? 0
  const seatingFee = getSeatingFee(diningPreference)
  const extraGuestsFee = Math.max(0, guests - 4) * 200
  return occasionFee + seatingFee + extraGuestsFee
}

const calculateTotalBill = (reservationFee: number) => {
  const serviceCharge = reservationFee * 0.1
  return { serviceCharge, total: reservationFee + serviceCharge }
}

const generateReservationNumber = () => {
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0")
  return `RES-${Date.now()}-${random}`
}

export default function ReservationsPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [isCustom, setIsCustom] = useState(false)
  const [packageDialogPreview, setPackageDialogPreview] = useState<Package | null>(null)
  const [openReceipt, setOpenReceipt] = useState(false)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [copied, setCopied] = useState(false)
  const [confirmedReservationNumber, setConfirmedReservationNumber] = useState<string | null>(null)

  const selected = useMemo(
    () => PAYMENT_METHODS[formData.payment_method],
    [formData.payment_method]
  )

  const { toast } = useToast()

  const isVIP = VIP_ROOMS.has(formData.dining_preference)

  useEffect(() => {
    if (selectedPackage) return

    const fee = calculateReservationFee(
      formData.occasion,
      Number(formData.guests) || 1,
      formData.dining_preference
    )

    setFormData((prev) => {
      if (prev.reservation_fee !== String(fee)) {
        return { ...prev, reservation_fee: String(fee) }
      }
      return prev
    })
  }, [formData.occasion, formData.guests, formData.dining_preference, selectedPackage])

  useEffect(() => {
    const fee = Number(formData.reservation_fee) || 0
    const down = fee * 0.5
    setFormData((prev) => {
      if (prev.down_payment !== String(down)) {
        return { ...prev, down_payment: String(down) }
      }
      return prev
    })
  }, [formData.reservation_fee])

  useEffect(() => {
    return () => {
      if (receiptPreview) URL.revokeObjectURL(receiptPreview)
    }
  }, [])

  const stars = useMemo(
    () =>
      Array.from({ length: 140 }).map((_, i) => ({
        id: i,
        cx: Math.random() * 100,
        cy: Math.random() * 100,
        r: Math.random() * 3 + 0.8,
        duration: Math.random() * 4 + 2,
        delay: Math.random() * 5,
        opacity: Math.random() * 0.4 + 0.3,
      })),
    []
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target

      if (name === "email") {
        setFormData((prev) => ({ ...prev, email: value }))
        setEmailError(isValidEmail(value) ? "" : "Please enter a valid email address")
        return
      }

      if (name === "phone") {
        const digits = value.replace(/\D/g, "")
        if (digits.length > 11) { setPhoneError("Phone number cannot exceed 11 digits"); return }
        if (!/^[0-9+()\- ]*$/.test(value)) { setPhoneError("Phone number can only contain digits, +, - or ()"); return }
        setPhoneError("")
        setFormData((prev) => ({ ...prev, phone: value }))
        return
      }

      if (name === "date") {
        setFormData((prev) => {
          const newData = { ...prev, date: value }
          if (value === getMinDate() && prev.time) {
            const selected = new Date(`${value}T${prev.time}`)
            if (selected <= new Date()) newData.time = ""
          }
          return newData
        })
        return
      }

      setFormData((prev) => ({ ...prev, [name]: value }))
    },
    []
  )

  const handleSelectPackage = useCallback((pkg: Package) => {
    setSelectedPackage(pkg)
    setIsCustom(false)
    setFormData((prev) => ({
      ...prev,
      package: pkg.name,
      dining_preference: pkg.room ?? prev.dining_preference,
      reservation_fee: String(pkg.price ?? 0),
    }))
    setPackageDialogPreview(null)
    setStep(2)
  }, [])

  const handleSelectCustom = useCallback(() => {
    setSelectedPackage(null)
    setIsCustom(true)
    setFormData((prev) => ({
      ...prev,
      package: "Custom Reservation",
      dining_preference: "Main Dining",
      reservation_fee: "0",
    }))
    setStep(2)
  }, [])

  const isStepValid = useCallback((): boolean => {
    switch (step) {
      case 1:
        return Boolean(formData.package)
      case 2:
        return (
          formData.date.trim() !== "" &&
          formData.time.trim() !== "" &&
          formData.guests.trim() !== "" &&
          formData.dining_preference.trim() !== ""
        )
      case 3: {
        const phoneDigits = formData.phone.replace(/\D/g, "")
        return (
          formData.name.trim() !== "" &&
          formData.email.trim() !== "" &&
          isValidEmail(formData.email) &&
          !emailError &&
          phoneDigits.length === 11 &&
          !phoneError
        )
      }
      case 4:
        return Boolean(formData.occasion)
      case 5:
        return (
          !isNaN(Number(formData.reservation_fee)) &&
          Number(formData.reservation_fee) >= 0 &&
          Boolean(formData.payment_method) &&
          Boolean(formData.payment_reference) &&
          Boolean(formData.payment_receipt)
        )
      default:
        return false
    }
  }, [step, formData, emailError, phoneError])

  const handleSubmit = async () => {
    setLoading(true)

    try {
      const reservationNumber = generateReservationNumber()
      const payload = new FormData()

      const fee = Number(computedReservationFee) || 0
      const { serviceCharge, total } = calculateTotalBill(fee)

      payload.append("reservation_number", reservationNumber)

      for (const key in formData) {
        const value = formData[key as keyof FormData]
        if (key === "payment_receipt" && value instanceof File) {
          payload.append("payment_receipt", value)
        } else if (value !== undefined && value !== null) {
          payload.append(key, value.toString())
        }
      }

      payload.set("reservation_fee", fee.toString())
      payload.set("service_charge", serviceCharge.toFixed(2))
      payload.set("total_fee", total.toFixed(2))

      const res = await fetch("/api/reservations", {
        method: "POST",
        body: payload,
      })

      let data
      try {
        data = await res.json()
      } catch {
        toast({
          title: "Server Error",
          description: "Invalid response from server.",
          variant: "destructive",
        })
        return
      }

      if (!res.ok) {
        toast({
          title: "Reservation Failed",
          description: data.message ?? data.error ?? "Failed to create reservation",
          variant: "destructive",
        })
        return
      }

      const confirmedNumber = data?.data?.reservation_number ?? reservationNumber
      setConfirmedReservationNumber(confirmedNumber)
      setStep(7)

    } catch (err) {
      console.error("Reservation error:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const computedReservationFee = useMemo(() => {
    if (selectedPackage) return selectedPackage.price ?? 0
    return calculateReservationFee(
      formData.occasion,
      Number(formData.guests) || 1,
      formData.dining_preference
    )
  }, [selectedPackage, formData.occasion, formData.guests, formData.dining_preference])

  const reservationFeeNum = Number(computedReservationFee) || 0
  const { serviceCharge, total } = calculateTotalBill(reservationFeeNum)
  const downPaymentNum = reservationFeeNum * 0.5 || 0
  const remainingReservationFee = Math.max(reservationFeeNum - downPaymentNum, 0)
  const finalTotal = remainingReservationFee + serviceCharge

  useEffect(() => {
    const fee = Number(computedReservationFee) || 0
    const { serviceCharge, total } = calculateTotalBill(fee)
    setFormData((prev) => ({
      ...prev,
      service_charge: serviceCharge.toFixed(2),
      total_fee: total.toFixed(2),
    }))
  }, [computedReservationFee])

  if (loading) return <LumeLoaderMinimal />

  return (
    <div className="relative py-28 bg-[#0b1d26] min-h-screen overflow-hidden">

      {/* Background stars */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,162,76,0.08),transparent_40%)]" />
        <svg width="100%" height="100%">
          {stars.map((star) => (
            <circle
              key={star.id}
              cx={`${star.cx}%`}
              cy={`${star.cy}%`}
              r={star.r}
              fill="hsl(40, 80%, 75%)"
              className="animate-twinkle"
              style={{
                animationDuration: `${star.duration}s`,
                animationDelay: `${star.delay}s`,
                opacity: star.opacity,
                filter: star.r > 2.5 ? "drop-shadow(0 0 6px rgba(212,162,76,0.4))" : "none",
              }}
            />
          ))}
        </svg>
      </div>

      <div className="max-w-2xl mx-auto relative z-10">

        {/* Header */}
        <div className="flex flex-col items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="text-center mb-6">
            <p className="tracking-[0.3em] uppercase text-sm mb-3 text-[#d4a24c]">Reservations</p>
            <h2 className={`${playfair.className} text-4xl md:text-5xl font-bold text-white`}>
              Reserve Your <span className="text-[#d4a24c] italic">Moment</span>
            </h2>
          </motion.div>
        </div>

        {/* Progress bar — hidden on success screen */}
        {step < 7 && (
          <div className="mb-10">
            <div className="relative w-full px-5 mt-10">
              <div className="absolute top-5 left-15 right-15 h-1 bg-white/20 rounded" />
              <div
                className="absolute top-5 h-1 bg-white rounded transition-all duration-500"
                style={{ width: `calc(${((step - 1) / 6) * 100}%)` }}
              />
              <div className="relative flex justify-between">
                {[1, 2, 3, 4, 5, 6].map((s) => (
                  <div
                    key={s}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${s <= step ? "bg-white text-[#0f4764] shadow-xl scale-110" : "bg-white/20 text-white/50"}`}
                  >
                    {s}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between text-center mt-2">
              {["Package Selection", "Reservation Details", "Guest Information", "Occasion Details", "Payment Details", "Confirmation"].map(
                (label) => (
                  <div key={label} className="text-xs text-white/70 font-medium" style={{ width: "50px" }}>
                    {label}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Form card */}
        <div className="mx-5 md:mx-auto bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/10 animate-in fade-in zoom-in duration-500">
          <div className="bg-white h-1" />
          <div className="p-8 md:p-10">

            {/* Step 1: Package Selection q*/}
            {step === 1 && (
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10">
                  <p className="text-[#d4a24c] tracking-[0.3em] uppercase text-sm">Reservation Packages</p>
                  <h2 className="text-4xl font-bold text-white mt-2">
                    Choose Your <span className="text-[#d4a24c] italic">Experience</span>
                  </h2>
                  <p className="text-white/70 mt-3">
                    Select a curated package or proceed with a custom reservation
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {PACKAGES.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => setPackageDialogPreview(pkg)}
                      className={`relative cursor-pointer bg-white/5 border rounded-2xl p-6 transition-all hover:scale-[1.02] ${pkg.badge ? "border-[#d4a24c]" : "border-white/20 hover:border-[#d4a24c]/50"}`}
                    >
                      {pkg.badge && (
                        <span className="absolute -top-3 right-3 text-[10px] tracking-wider uppercase bg-[#d4a24c] text-gray-700 px-2 py-1 rounded-full font-semibold">
                          {pkg.badge}
                        </span>
                      )}
                      <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>
                      <p className="text-white/60 text-xs mb-1">{pkg.room}</p>
                      <p className="text-white/70 text-sm mb-4">{pkg.description}</p>
                      <p className="text-[#d4a24c] font-semibold">₱{pkg.price?.toLocaleString()}</p>
                    </div>
                  ))}

                  <div
                    onClick={handleSelectCustom}
                    className="cursor-pointer bg-white/5 border border-white/20 hover:border-white/60 rounded-2xl p-6 transition-all hover:scale-[1.02]"
                  >
                    <h3 className="text-xl font-bold text-white mb-2">Custom Reservation</h3>
                    <p className="text-white/70 text-sm mb-4">
                      Full control over seating, time, and preferences
                    </p>
                    <p className="text-white/40 text-sm font-medium">Standard Rates Apply</p>
                  </div>
                </div>

                <Dialog
                  open={Boolean(packageDialogPreview)}
                  onOpenChange={(open) => { if (!open) setPackageDialogPreview(null) }}
                >
                  <DialogContent className="bg-[#162a3a] text-white border border-white/20">
                    {packageDialogPreview && (
                      <>
                        <DialogHeader>
                          <DialogTitle className="text-lg md:text-xl font-bold">
                            {packageDialogPreview.name}
                          </DialogTitle>
                          <DialogDescription className="text-gray-300">
                            {packageDialogPreview.description}
                          </DialogDescription>
                        </DialogHeader>

                        {packageDialogPreview.room && (
                          <p className="text-sm text-white/60 mb-2">
                            Room: <span className="text-white/80 font-medium">{packageDialogPreview.room}</span>
                          </p>
                        )}

                        {packageDialogPreview.details && (
                          <div className="space-y-2 text-sm text-white/80 my-2">
                            {packageDialogPreview.details.map((item, i) => (
                              <p key={i}>• {item}</p>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2 mb-4 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                          <span className="text-white/60 text-sm">Package Rate</span>
                          <span className="text-[#d4a24c] font-bold text-lg">
                            ₱{packageDialogPreview.price?.toLocaleString()}
                          </span>
                        </div>

                        <button
                          onClick={() => handleSelectPackage(packageDialogPreview)}
                          className="w-full bg-[#d4a24c] hover:bg-[#c49040] text-black py-3 rounded-xl font-semibold transition-colors"
                        >
                          Select This Package
                        </button>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Step 2: Reservation Details */}
            {step === 2 && (
              <div>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">Reservation Details</h2>
                  <p className="text-white/70">Please provide the details for your reservation</p>

                  <div className="mt-4">
                    {selectedPackage ? (
                      <div className="inline-flex items-center gap-2 bg-[#d4a24c]/10 border border-[#d4a24c]/30 px-3 py-1.5 rounded-full">
                        <span className="text-[#d4a24c] text-xs font-semibold uppercase tracking-wide">
                          {selectedPackage.name}
                        </span>
                        {selectedPackage.room && (
                          <span className="text-white/50 text-xs">· {selectedPackage.room}</span>
                        )}
                        <span className="text-white/50 text-xs">· ₱{selectedPackage.price?.toLocaleString()}</span>
                      </div>
                    ) : isCustom ? (
                      <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1.5 rounded-full">
                        <span className="text-white/70 text-xs font-semibold uppercase tracking-wide">
                          Custom Reservation
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Date *</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-3.5 w-5 h-5 text-[#d4a24c] pointer-events-none" />
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleChange}
                          min={getMinDate()}
                          required
                          className="w-full pl-12 pr-4 py-3 border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-all text-lg text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Time *</label>
                      {(() => {
                        const day = formData.date ? new Date(formData.date).getDay() : 1
                        const { opening, closing, isClosed, label } = getDayHours(day)
                        const timeSlots = isClosed ? [] : generateTimeSlots(opening, closing, 30)

                        return (
                          <div className="relative">
                            <Clock className="absolute left-4 top-3.5 w-5 h-5 text-[#d4a24c]" />
                            <select
                              name="time"
                              value={formData.time}
                              onChange={handleChange}
                              disabled={isClosed}
                              required
                              className="w-full pl-12 pr-4 py-3 border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-all text-lg text-white"
                            >
                              {isClosed ? (
                                <option value="">Closed</option>
                              ) : (
                                <>
                                  <option value="">Select time</option>
                                  {timeSlots.map((t) => (
                                    <option key={t} value={t} className="text-black">{t}</option>
                                  ))}
                                </>
                              )}
                            </select>
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Number of Guests *</label>
                      <div className="relative">
                        <Users className="absolute left-4 top-3.5 w-5 h-5 text-[#d4a24c] pointer-events-none" />
                        <input
                          type="number"
                          name="guests"
                          value={formData.guests}
                          min={1}
                          max={50}
                          onChange={(e) => { if (/^\d*$/.test(e.target.value)) handleChange(e) }}
                          placeholder="Guests"
                          required
                          className="w-full pl-12 pr-4 py-3 border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-all text-lg text-white placeholder-white/40"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">
                        Dining Preference *
                        {selectedPackage?.room && (
                          <span className="ml-2 text-[#d4a24c] text-xs font-normal">(locked to package)</span>
                        )}
                      </label>
                      <div className="relative">
                        <Users className="absolute left-4 top-3.5 w-5 h-5 text-[#d4a24c] pointer-events-none" />
                        <select
                          name="dining_preference"
                          value={formData.dining_preference || "Main Dining"}
                          onChange={handleChange}
                          disabled={Boolean(selectedPackage?.room)}
                          required
                          className="w-full pl-12 pr-8 py-3 border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-all text-lg text-white appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <optgroup label="Standard Seating (Auto-Assigned)">
                            {Object.keys(SEATING_CONFIG.regular).map((opt) => (
                              <option key={opt} value={opt} className="text-gray-900">{opt}</option>
                            ))}
                          </optgroup>
                          <optgroup label="VIP Private Rooms">
                            {Object.keys(SEATING_CONFIG.vip).map((opt) => (
                              <option key={opt} value={opt} className="text-gray-900 font-semibold">{opt}</option>
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
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-4 top-3.5 w-5 h-5 text-[#d4a24c] pointer-events-none" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Full Name"
                        className="w-full pl-12 pr-4 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-all text-lg text-white placeholder-white/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 w-5 h-5 text-[#d4a24c] pointer-events-none" />
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
                        className={`w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none transition-all text-lg text-white placeholder-white/40 bg-white/10 backdrop-blur-sm border ${emailError ? "border-red-400" : "border-white/20 focus:border-white focus:ring-2 focus:ring-white/30"}`}
                      />
                    </div>
                    {emailError && (
                      <div className="mt-2 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-[#d4a24c] shrink-0 mt-0.5" />
                        <p className="text-[#d4a24c] text-sm font-medium">{emailError}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-3.5 w-5 h-5 text-[#d4a24c] pointer-events-none" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="09123456789"
                        className={`w-full pl-12 pr-4 py-3 border rounded-xl bg-white/10 backdrop-blur-sm focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-all text-lg text-white placeholder-white/40 ${phoneError ? "border-red-400" : "border-white/20"}`}
                      />
                    </div>
                    {phoneError && <p className="mt-2 text-sm text-[#d4a24c]">{phoneError}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">
                      Special Request (Accessibility, Dietary, Celebrations)
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-4 top-3.5 w-5 h-5 text-[#d4a24c] pointer-events-none" />
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

                <div>
                  <label className="block text-sm font-semibold text-white mb-3">Occasion Type *</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-3.5 w-5 h-5 text-[#d4a24c] pointer-events-none" />
                    <select
                      name="occasion"
                      value={formData.occasion}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-all text-lg appearance-none text-white"
                    >
                      <option value="" disabled>Select Occasion</option>
                      {Object.keys(OCCASION_FEES).map((opt) => (
                        <option key={opt} value={opt} className="bg-[#0b1d26] text-white">{opt}</option>
                      ))}
                    </select>
                  </div>

                  {isCustom && formData.occasion && (
                    <p className="mt-3 text-white/50 text-sm">
                      Occasion fee:{" "}
                      <span className="text-[#d4a24c] font-medium">
                        ₱{(OCCASION_FEES[formData.occasion] ?? 0).toLocaleString()}
                      </span>
                    </p>
                  )}
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
                  {/* Fee breakdown */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                    <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide">Fee Breakdown</h3>

                    {selectedPackage ? (
                      <div className="flex justify-between text-white/80">
                        <span>{selectedPackage.name} Package</span>
                        <span className="text-[#d4a24c] font-semibold">₱{selectedPackage.price?.toLocaleString()}</span>
                      </div>
                    ) : isCustom ? (
                      <>
                        <div className="flex justify-between text-white/80">
                          <span>Custom Reservation</span>
                          <span className="font-semibold">₱{reservationFeeNum.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-white/80">
                          <span>Occasion: {formData.occasion || "—"}</span>
                          <span>₱{(OCCASION_FEES[formData.occasion] ?? 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-white/80">
                          <span>Seating: {formData.dining_preference || "—"}</span>
                          <span>
                            ₱{(
                              VIP_ROOMS.has(formData.dining_preference)
                                ? SEATING_CONFIG.vip[formData.dining_preference]
                                : SEATING_CONFIG.regular[formData.dining_preference] ?? 0
                            ).toLocaleString()}
                          </span>
                        </div>
                        {Number(formData.guests) > 4 && (
                          <div className="flex justify-between text-white/80">
                            <span>Extra guests ({Number(formData.guests) - 4} × ₱200)</span>
                            <span>₱{((Number(formData.guests) - 4) * 200).toLocaleString()}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between text-white/80">
                          <span>Occasion ({formData.occasion || "—"})</span>
                          <span>₱{(OCCASION_FEES[formData.occasion] ?? 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-white/80">
                          <span>Seating ({formData.dining_preference || "—"})</span>
                          <span className="text-[#d4a24c] font-semibold">₱{getSeatingFee(formData.dining_preference).toLocaleString()}</span>
                        </div>
                        {Number(formData.guests) > 4 && (
                          <div className="flex justify-between text-white/80">
                            <span>Extra guests ({Number(formData.guests) - 4} × ₱200)</span>
                            <span>₱{((Number(formData.guests) - 4) * 200).toLocaleString()}</span>
                          </div>
                        )}
                      </>
                    )}

                    <div className="border-t border-white/10 pt-3 flex justify-between text-white/80 font-semibold">
                      <span>Reservation Fee</span>
                      <span>₱{reservationFeeNum.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-white font-semibold">
                      <span>Down Payment (50%)</span>
                      <span className="text-[#d4a24c]">₱{downPaymentNum.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Payment method */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">Payment Method *</label>
                    <select
                      name="payment_method"
                      value={formData.payment_method}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-all text-lg appearance-none text-white"
                    >
                      <option value="" disabled>Select Payment Method</option>
                      {Object.values(PAYMENT_METHODS).map((method) => (
                        <option key={method.label} value={method.label} className="text-gray-900">
                          {method.label}
                        </option>
                      ))}
                    </select>

                    {selected?.accountNumber && (
                      <div className="mt-4 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-lg">
                        <p className="text-xs uppercase tracking-widest text-white/50 mb-3">Payment Instructions</p>
                        <div className="mb-2">
                          <p className="text-white/50 text-xs">Account Name</p>
                          <p className="text-white font-semibold text-base">{selected.accountName}</p>
                        </div>
                        <div className="mb-3">
                          <p className="text-white/50 text-xs">Account Number</p>
                          <p className="text-[#d4a24c] font-semibold text-lg tracking-wider">{selected.accountNumber}</p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selected.accountNumber || "")
                            setCopied(true)
                            setTimeout(() => setCopied(false), 1500)
                          }}
                          className={`w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-medium transition-all active:scale-95 ${copied
                            ? "bg-green-500/20 border-green-400/30 text-green-300"
                            : "bg-white/10 hover:bg-white/20 border-white/10 text-white"
                            }`}
                        >
                          {copied ? "Copied!" : "Copy Account Number"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Reference number */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">Reference Number *</label>
                    <input
                      type="text"
                      name="payment_reference"
                      value={formData.payment_reference}
                      onChange={handleChange}
                      required
                      placeholder="Enter payment reference number"
                      className="w-full px-4 py-3 border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-all text-lg text-white placeholder-white/40"
                    />
                  </div>

                  {/* Receipt upload */}
                  <div>
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
                          if (receiptPreview) URL.revokeObjectURL(receiptPreview)
                          setReceiptPreview(URL.createObjectURL(file))
                        }
                      }}
                      className="w-full px-4 py-3 border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl text-lg text-white"
                    />
                    {formData.payment_receipt && (
                      <p className="mt-2 text-white/60 text-xs">Selected: {formData.payment_receipt.name}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Confirmation */}
            {step === 6 && (
              <div className="space-y-10">
                <div>
                  <h2 className="text-3xl font-extrabold text-white tracking-tight">Review & Confirm</h2>
                  <p className="text-white/60 mt-1">Please review your reservation details before submitting.</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-6 md:p-8 space-y-8">

                  <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
                    <h3 className="text-sm uppercase tracking-widest text-white/60 font-semibold">Guest Information</h3>
                    <div className="grid gap-2 text-white/80 text-sm">
                      <div><span className="text-white/50">Name:</span> {formData.name}</div>
                      <div><span className="text-white/50">Email:</span> {formData.email}</div>
                      <div><span className="text-white/50">Phone:</span> {formData.phone}</div>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
                    <h3 className="text-sm uppercase tracking-widest text-white/60 font-semibold">Reservation Details</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm text-white/80">
                      <div><span className="text-white/50">Date:</span> {formData.date}</div>
                      <div><span className="text-white/50">Time:</span> {formData.time}</div>
                      <div><span className="text-white/50">Guests:</span> {formData.guests}</div>
                      <div><span className="text-white/50">Dining:</span> {formData.dining_preference}</div>
                      <div><span className="text-white/50">VIP:</span> {isVIP ? "Yes" : "No"}</div>
                      <div>
                        <span className="text-white/50">Package:</span>{" "}
                        {selectedPackage ? selectedPackage.name : "Custom Reservation"}
                      </div>
                      <div className="col-span-2">
                        <span className="text-white/50">Occasion:</span> {formData.occasion || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                    <h3 className="text-sm uppercase tracking-widest text-white/60 font-semibold">Payment Summary</h3>

                    <div className="pt-4 space-y-2 text-sm text-white/80 bg-white/10 border border-white/10 rounded-xl px-4 py-3">
                      <div className="flex justify-between">
                        <span className="text-white/50">Method:</span>
                        <span>{formData.payment_method || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Reference:</span>
                        <span>{formData.payment_reference || "—"}</span>
                      </div>
                      {formData.payment_receipt && (
                        <div className="flex justify-between items-center">
                          <span className="text-white/50">Receipt:</span>
                          <button
                            type="button"
                            onClick={() => setOpenReceipt(true)}
                            className="text-[#d4a24c] underline hover:text-white transition"
                          >
                            View Receipt
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 text-sm bg-white/10 border border-white/10 rounded-xl px-4 py-3">
                      <div className="flex justify-between text-white/70">
                        <span>Reservation Fee</span>
                        <span className="text-white">₱{reservationFeeNum.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-white/70">
                        <span>Down Payment (50%)</span>
                        <span className="text-red-400">- ₱{downPaymentNum.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-white/70">
                        <span>Remaining Reservation Fee</span>
                        <span className="text-white">₱{remainingReservationFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-white/70">
                        <span>Service Charge (10%)</span>
                        <span className="text-white">₱{serviceCharge.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-white/10">
                        <span className="text-white font-semibold">Final Total</span>
                        <span className="text-[#d4a24c] font-bold text-lg">₱{Math.round(finalTotal).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {formData.special_requests && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                      <h3 className="text-sm uppercase tracking-widest text-white/60 font-semibold mb-2">Special Requests</h3>
                      <p className="text-white/80 text-sm leading-relaxed">{formData.special_requests}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 7: Success */}
            {step === 7 && (
              <div className="flex flex-col items-center text-center space-y-6 py-4">
                <div className="w-20 h-20 rounded-full bg-[#d4a24c]/10 border border-[#d4a24c]/30 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-[#d4a24c]" />
                </div>

                <div>
                  <h2 className={`${playfair.className} text-3xl font-bold text-white`}>
                    You&apos;re all set!
                  </h2>
                  <p className="text-white/60 mt-2 text-sm">
                    Your reservation has been received and is pending confirmation.
                  </p>
                </div>

                <div className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 space-y-1 text-sm">
                  <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Reservation number</p>
                  <p className="text-[#d4a24c] font-bold text-lg tracking-wide">{confirmedReservationNumber}</p>
                </div>

                <div className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 space-y-2 text-sm text-left">
                  <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Summary</p>
                  <div className="flex justify-between text-white/70">
                    <span>Name</span>
                    <span className="text-white">{formData.name}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Date & time</span>
                    <span className="text-white">{formData.date} · {formData.time}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Package</span>
                    <span className="text-white">{selectedPackage ? selectedPackage.name : "Custom Reservation"}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Guests</span>
                    <span className="text-white">{formData.guests}</span>
                  </div>
                  <div className="flex justify-between text-white/70 pt-2 border-t border-white/10">
                    <span>Down payment due</span>
                    <span className="text-[#d4a24c] font-semibold">₱{downPaymentNum.toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-white/40 text-xs max-w-xs">
                  A confirmation will be sent to <span className="text-white/60">{formData.email}</span>. Please keep your reservation number for your records.
                </p>

                <button
                  onClick={() => {
                    setStep(1)
                    setSelectedPackage(null)
                    setIsCustom(false)
                    setConfirmedReservationNumber(null)
                    setFormData(DEFAULT_FORM)
                  }}
                  className="mt-2 px-8 py-3 border border-white/20 text-white/70 hover:text-white hover:border-white/40 font-medium rounded-xl transition-all text-sm"
                >
                  Make another reservation
                </button>
              </div>
            )}

            {/* Navigation buttons */}
            {step < 7 && (
              <div className="flex gap-4 mt-8">
                {step > 1 && (
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    className="flex-1 px-6 py-3 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all hover:scale-105"
                  >
                    Back
                  </button>
                )}

                {step > 1 && step < 6 && (
                  <button
                    onClick={() => setStep((s) => s + 1)}
                    disabled={!isStepValid()}
                    className="flex-1 px-6 py-3 bg-white hover:bg-white/90 disabled:bg-white/20 text-[#0b1d26] disabled:text-white/50 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:shadow-none hover:scale-105 disabled:hover:scale-100"
                  >
                    Continue
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}

                {step === 6 && (
                  <button
                    onClick={handleSubmit}
                    className="flex-1 px-6 py-3 bg-white hover:bg-white/90 disabled:bg-white/20 text-[#0b1d26] disabled:text-white/50 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:shadow-none hover:scale-105 disabled:hover:scale-100"
                  >
                    {loading ? "Confirming…" : "Confirm Reservation"}
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Receipt preview modal */}
      {openReceipt && receiptPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setOpenReceipt(false)}
        >
          <div
            className="relative w-full max-w-3xl bg-[#0b1d26] border border-white/20 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-5 py-4 border-b border-white/20">
              <h2 className="text-white font-semibold">Receipt Preview</h2>
              <button onClick={() => setOpenReceipt(false)} className="text-white text-xl hover:text-white/70">✕</button>
            </div>
            <div className="p-4 flex justify-center bg-[#08141a]">
              <img src={receiptPreview} alt="Receipt" className="max-h-[75vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}

    </div>
  )
}