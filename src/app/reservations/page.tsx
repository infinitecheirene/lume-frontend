"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  ChevronRight,
  Users,
  Clock,
  Mail,
  Calendar as CalendarIcon,
  Phone,
  User,
  MessageSquare,
  AlertCircle,
  Upload,
  Check,
  Copy,
  X,
} from "lucide-react"
import { motion } from "framer-motion"
import { Playfair_Display } from "next/font/google"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import LumeLoaderMinimal from "@/components/oppa-loader"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

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
    details: ["Open-style loft setup", "Best for barkada (4–10 pax)", "Great for casual events"],
  },
  {
    id: "amber",
    room: "Amber Room",
    name: "Golden Hour",
    price: 4000,
    description: "Warm-toned private room for intimate gatherings.",
    details: ["Cozy and aesthetic ambiance", "Ideal for small groups (2–6 pax)", "Private setup"],
  },
  {
    id: "aurora",
    room: "Aurora Lounge",
    name: "Neon Nights",
    price: 8500,
    description: "Vibrant lounge with dynamic lighting.",
    details: ["Color-shifting lights", "Party-ready atmosphere", "Great for big groups"],
    badge: "Most Picked",
  },
  {
    id: "velvet",
    room: "Velvet Room",
    name: "Midnight Luxe",
    price: 6500,
    description: "Speakeasy-style premium private room.",
    details: ["Luxury interior", "Speakeasy vibe", "Ideal for premium events"],
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

const getSeatingFee = (diningPreference: string) => {
  if (!diningPreference) return 0

  if (VIP_ROOMS.has(diningPreference)) {
    return SEATING_CONFIG.vip[diningPreference] ?? 1500
  }

  return SEATING_CONFIG.regular[diningPreference] ?? 0
}

const VIP_ROOMS = new Set(Object.keys(SEATING_CONFIG.vip))

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
  payment_method: "",
  payment_reference: "",
  payment_receipt: undefined,
}

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const getMinDate = () => new Date().toISOString().split("T")[0]

const getMinTime = (date: string) => {
  const today = new Date().toISOString().split("T")[0]
  if (date === today) {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  }
  return undefined
}

const calculateReservationFee = (occasionType: string, guests: number, diningPreference: string, packagePrice?: number): number => {
  // If user selected a package → use package price as base
  if (packagePrice && packagePrice > 0) {
    return packagePrice
  }

  // Occasion base fee
  const occasionFee = OCCASION_FEES[occasionType] ?? 0

  // Seating fee (VIP or regular)
  const seatingFee = getSeatingFee(diningPreference)

  // Extra guests fee (free for first 4)
  const extraGuestsFee = Math.max(0, guests - 4) * 200

  return occasionFee + seatingFee + extraGuestsFee
}

const calculateTotalBill = (reservationFee: number) => {
  const serviceCharge = reservationFee * 0.1
  return { serviceCharge, total: reservationFee + serviceCharge }
}

const generateReservationNumber = () => {
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")
  return `RES-${Date.now()}-${random}`
}

export default function ReservationsPage() {
  const [step, setStep] = useState(1)
  const [user, setUser] = useState<Record<string, string> | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [isCustom, setIsCustom] = useState(false)

  // Package whose details are shown in the preview dialog (null = dialog closed)
  const [packageDialogPreview, setPackageDialogPreview] = useState<Package | null>(null)

  const [openReceipt, setOpenReceipt] = useState(false)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [dailyBookingsCount, setDailyBookingsCount] = useState(0)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [loadingPayments, setLoadingPayments] = useState(true)
  const [copiedGcash, setCopiedGcash] = useState(false)
  const [copiedBank, setCopiedBank] = useState(false)
  const [receiptFile, setReceiptFile] = useState<string | null>(null)
  const [date, setDate] = useState<Date | undefined>()
  const [time, setTime] = useState<string | null>(null)

  const [bookedMap, setBookedMap] = useState<Record<string, string[]>>({})
  const [loadingSlots, setLoadingSlots] = useState(false)

  const { toast } = useToast()

  const isVIP = VIP_ROOMS.has(formData.dining_preference)
  const isDailyLimitReached = dailyBookingsCount >= 2

  useEffect(() => {
    const userData = localStorage.getItem("user_data")
    const token = localStorage.getItem("auth_token")

    if (!userData || !token) {
      setIsAuthenticated(false)
      const t = setTimeout(() => {
        window.location.href = "/login?redirect=/reservations"
      }, 100)
      return () => clearTimeout(t)
    }

    try {
      const parsed = JSON.parse(userData)
      setUser(parsed)
      setFormData((prev) => ({
        ...prev,
        name: parsed.name ?? "",
        email: parsed.email ?? "",
        phone: parsed.phone ?? prev.phone,
      }))
      setIsAuthenticated(true)
    } catch {
      setIsAuthenticated(false)
      const t = setTimeout(() => {
        window.location.href = "/login?redirect=/reservations"
      }, 100)
      return () => clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    if (!formData.date || !user) return
    const check = async () => {
      try {
        const token = localStorage.getItem("auth_token")
        const res = await fetch(`/api/reservations/check-daily?date=${formData.date}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setDailyBookingsCount(data.count ?? 0)
        }
      } catch (err) {
        console.error("Error checking daily bookings:", err)
      }
    }
    check()
  }, [formData.date, user])

  useEffect(() => {
    if (selectedPackage) return

    const fee = calculateReservationFee(formData.occasion, Number(formData.guests) || 1, formData.dining_preference)

    setFormData((prev) => {
      if (prev.reservation_fee !== String(fee)) {
        return { ...prev, reservation_fee: String(fee) }
      }
      return prev
    })
  }, [formData.occasion, formData.guests, formData.dining_preference, selectedPackage])

  const fetchBookedSlots = async () => {
    try {
      const res = await fetch("/api/reservations/booked-slots")
      const data = await res.json()

      if (!data.success) {
        setBookedMap({})
        return
      }

      const map: Record<string, string[]> = {}

      data.booked_slots.forEach((b: any) => {
        if (!b.date || !b.start) return

        const cleanDate = b.date.split("T")[0]

        if (!map[cleanDate]) {
          map[cleanDate] = []
        }

        map[cleanDate].push(b.start)
      })

      setBookedMap(map)
    } catch (err) {
      console.error("Failed to fetch booked slots:", err)
      setBookedMap({})
    }
  }

  const handleSelectTime = (slot: string) => {
    setTime(slot)

    if (!date) return

    // SAFE LOCAL DATE (NO UTC SHIFT)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    const formattedDate = `${year}-${month}-${day}`

    setFormData((prev: any) => ({
      ...prev,
      date: formattedDate,
      time: slot,
    }))
  }
  
  useEffect(() => {
    if (!date) return

    const formatted = date.toISOString().split("T")[0]

    fetchBookedSlots()

    // reset selected time when changing date
    setTime(null)
  }, [date])

  const currentDateKey = date?.toISOString().split("T")[0]

  const bookedSlotsForDate = currentDateKey ? bookedMap[currentDateKey] || [] : []

  const isBooked = (slot: string) => bookedSlotsForDate.includes(slot)

  const isDateBlocked = (d: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const check = new Date(d)
    check.setHours(0, 0, 0, 0)

    const key = check.toISOString().split("T")[0]

    const totalSlots = generateSlots().length
    const bookedCount = bookedMap[key]?.length || 0

    return check < today || bookedCount >= totalSlots
  }

  const generateSlots = () => {
    const slots: string[] = []

    const start = 10 * 60
    const end = 23 * 60 + 30
    const interval = 30

    for (let t = start; t <= end; t += interval) {
      const h = Math.floor(t / 60)
      const m = t % 60

      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
    }

    return slots
  }

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoadingPayments(true)

        const res = await fetch("/api/payment-methods?is_enabled=1")
        const json = await res.json()

        if (!json.success) throw new Error(json.message)

        setPaymentMethods(json.data || [])
      } catch (err) {
        console.error("Failed to fetch payment methods:", err)
      } finally {
        setLoadingPayments(false)
      }
    }

    fetchPaymentMethods()
    fetchBookedSlots()
  }, [])

  useEffect(() => {
    return () => {
      if (receiptPreview) URL.revokeObjectURL(receiptPreview)
    }
  }, [receiptPreview])

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
    [],
  )

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name === "email") {
      setFormData((prev) => ({ ...prev, email: value }))
      setEmailError(isValidEmail(value) ? "" : "Please enter a valid email address")
      return
    }

    if (name === "phone") {
      const digits = value.replace(/\D/g, "")
      if (digits.length > 11) {
        setPhoneError("Phone number cannot exceed 11 digits")
        return
      }
      if (!/^[0-9+()\- ]*$/.test(value)) {
        setPhoneError("Phone number can only contain digits, +, - or ()")
        return
      }
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
  }, [])

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
        return formData.date.trim() !== "" && formData.time.trim() !== "" && formData.guests.trim() !== "" && formData.dining_preference.trim() !== ""

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
          !isDailyLimitReached &&
          !isNaN(Number(formData.reservation_fee)) &&
          Number(formData.reservation_fee) >= 0 &&
          Boolean(formData.payment_method) &&
          Boolean(formData.payment_reference)
        )

      default:
        return false
    }
  }, [step, selectedPackage, isCustom, formData, emailError, phoneError, isDailyLimitReached])

  const handleSubmit = async () => {
    if (isDailyLimitReached) {
      toast({
        title: "Daily limit reached",
        description: "You have reached the maximum of 2 reservations per day. Please choose a different date.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        window.location.href = "/login?redirect=/reservations"
        return
      }

      const reservationNumber = generateReservationNumber()
      const payload = new FormData()
      payload.append("reservation_number", reservationNumber)

      // append normal form fields (exclude payment_receipt)
      for (const key in formData) {
        if (key === "payment_receipt") continue

        const value = formData[key as keyof FormData]
        if (value !== undefined && value !== null) {
          payload.append(key, value.toString())
        }
      }

      // append file using receiptFile state
      if (receiptFile) {
        payload.append("payment_receipt", receiptFile)
      }

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: payload,
      })

      let data: { data?: { reservation_number?: string }; message?: string; error?: string }

      try {
        data = await res.json()
      } catch {
        toast({ title: "Server Error", description: "Invalid response from server.", variant: "destructive" })
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
      toast({
        title: "Reservation Successful",
        description: `Reservation #${confirmedNumber} has been created.`,
      })

      setTimeout(() => {
        setStep(1)
        setSelectedPackage(null)
        setIsCustom(false)
        setDailyBookingsCount(0)

        setFormData({
          ...DEFAULT_FORM,
          name: user?.name ?? "",
          email: user?.email ?? "",
          phone: user?.phone ?? "",
        })

        setReceiptFile(null)

        window.location.href = "/reservation-history"
      }, 1500)
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
    if (selectedPackage) {
      return selectedPackage.price ?? 0
    }

    return calculateReservationFee(formData.occasion, Number(formData.guests) || 1, formData.dining_preference)
  }, [selectedPackage, formData.occasion, formData.guests, formData.dining_preference])

  const reservationFeeNum = computedReservationFee
  const { serviceCharge, total } = calculateTotalBill(reservationFeeNum)

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const copyToClipboard = (text: string, type: "gcash" | "bank") => {
    navigator.clipboard.writeText(text)
    if (type === "gcash") {
      setCopiedGcash(true)
      setTimeout(() => setCopiedGcash(false), 2000)
      toast({
        title: "Copied!",
        description: "GCash number copied to clipboard",
      })
    } else {
      setCopiedBank(true)
      setTimeout(() => setCopiedBank(false), 2000)
      toast({
        title: "Copied!",
        description: "Bank account number copied to clipboard",
      })
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // validate type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file only.",
        variant: "destructive",
      })
      e.target.value = ""
      return
    }

    // validate size
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      })
      e.target.value = ""
      return
    }

    // store the actual file
    setReceiptFile(file)

    toast({
      title: "Receipt uploaded",
      description: "Your payment receipt has been attached",
    })
  }

  const removeReceipt = () => {
    setReceiptFile(null)
    toast({
      title: "Receipt removed",
      description: "Payment receipt has been removed",
    })
  }

  const handleDateSelect = (d: Date | undefined) => {
    if (!d) return

    console.log("date on onselect", d)

    setDate(d)

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")

    const formatted = `${year}-${month}-${day}`

    console.log("formatted", formatted)

    setFormData((prev) => {
      const updated = {
        ...prev,
        date: formatted,
        time: "",
      }

      console.log("date that is set formdata", updated.date)
      console.log("date on formdata", formData.date)

      return updated
    })
  }

  const formatSlot = (time: string) => {
    const [hourStr, minute] = time.split(":")
    let hour = parseInt(hourStr, 10)

    const ampm = hour >= 12 ? "PM" : "AM"

    hour = hour % 12
    hour = hour ? hour : 12 // convert 0 → 12

    return `${hour}:${minute} ${ampm}`
  }

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

      {/* Auth: checking */}
      {isAuthenticated === null && (
        <div className="fixed inset-0 bg-[#0b1d26] flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-[#d4a24c] animate-spin" />
            <p className="text-white/70">Checking authentication…</p>
          </div>
        </div>
      )}

      {/* Auth: redirecting */}
      {isAuthenticated === false && (
        <div className="fixed inset-0 bg-[#0b1d26] flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-[#d4a24c] animate-spin" />
            <p className="text-white/70">Redirecting to login…</p>
          </div>
        </div>
      )}

      {/* Main content */}
      {isAuthenticated === true && (
        <div className="max-w-2xl mx-auto relative z-10">
          {/* Header */}
          <div className="flex flex-col items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="text-center mb-6">
              <p className="tracking-[0.3em] uppercase text-sm mb-3 text-[#d4a24c]">Reservations</p>
              <h2 className={`${playfair.className} text-4xl md:text-5xl font-bold text-white`}>
                Reserve Your <span className="text-[#d4a24c] italic">Moment</span>
              </h2>
            </motion.div>

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

          {/* Progress bar */}
          <div className="mb-10">
            <div className="relative w-full px-5 mt-10">
              <div className="absolute top-5 left-15 right-15 h-1 bg-white/20 rounded" />
              <div
                className="absolute top-5 h-1 bg-white rounded transition-all duration-500"
                style={{ width: `calc(${((step - 1) / 5) * 100}%)` }}
              />
              <div className="relative flex justify-between">
                {[1, 2, 3, 4, 5, 6].map((s) => (
                  <div
                    key={s}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                      s <= step ? "bg-white text-[#0f4764] shadow-xl scale-110" : "bg-white/20 text-white/50"
                    }`}
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
                ),
              )}
            </div>
          </div>

          {/* Form card */}
          <div className="mx-5 md:mx-auto bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/10 animate-in fade-in zoom-in duration-500">
            <div className="bg-white h-1" />
            <div className="p-8 md:p-10">
              {/* Step 1: Package Selection */}
              {step === 1 && (
                <div className="max-w-3xl mx-auto">
                  <div className="text-center mb-10">
                    <p className="text-[#d4a24c] tracking-[0.3em] uppercase text-sm">Reservation Packages</p>
                    <h2 className="text-4xl font-bold text-white mt-2">
                      Choose Your <span className="text-[#d4a24c] italic">Experience</span>
                    </h2>
                    <p className="text-white/70 mt-3">Select a curated package or proceed with a custom reservation</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Curated package cards */}
                    {PACKAGES.map((pkg) => (
                      <div
                        key={pkg.id}
                        onClick={() => setPackageDialogPreview(pkg)}
                        className={`relative cursor-pointer bg-white/5 border rounded-2xl p-6 transition-all hover:scale-[1.02] ${
                          pkg.badge ? "border-[#d4a24c]" : "border-white/20 hover:border-[#d4a24c]/50"
                        }`}
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

                    {/* Custom reservation card — goes straight to step 2, no dialog */}
                    <div
                      onClick={handleSelectCustom}
                      className="cursor-pointer bg-white/5 border border-white/20 hover:border-white/60 rounded-2xl p-6 transition-all hover:scale-[1.02]"
                    >
                      <h3 className="text-xl font-bold text-white mb-2">Custom Reservation</h3>
                      <p className="text-white/70 text-sm mb-4">Full control over seating, time, and preferences</p>
                      <p className="text-white/40 text-sm font-medium">Standard Rates Apply</p>
                    </div>
                  </div>

                  {/* Package preview dialog */}
                  <Dialog
                    open={Boolean(packageDialogPreview)}
                    onOpenChange={(open) => {
                      if (!open) setPackageDialogPreview(null)
                    }}
                  >
                    <DialogContent className="bg-[#162a3a] text-white border border-white/20">
                      {packageDialogPreview && (
                        <>
                          <DialogHeader>
                            <DialogTitle className="text-lg md:text-xl font-bold">{packageDialogPreview.name}</DialogTitle>
                            <DialogDescription className="text-gray-300">{packageDialogPreview.description}</DialogDescription>
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
                            <span className="text-[#d4a24c] font-bold text-lg">₱{packageDialogPreview.price?.toLocaleString()}</span>
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

                    {/* Show which package/path was selected */}
                    <div className="mt-4">
                      {selectedPackage ? (
                        <div className="inline-flex items-center gap-2 bg-[#d4a24c]/10 border border-[#d4a24c]/30 px-3 py-1.5 rounded-full">
                          <span className="text-[#d4a24c] text-xs font-semibold uppercase tracking-wide">{selectedPackage.name}</span>

                          {selectedPackage.room && <span className="text-white/50 text-xs">· {selectedPackage.room}</span>}

                          <span className="text-white/50 text-xs">· ₱{selectedPackage.price?.toLocaleString()}</span>
                        </div>
                      ) : isCustom ? (
                        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1.5 rounded-full">
                          <span className="text-white/70 text-xs font-semibold uppercase tracking-wide">Custom Reservation</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <label className="block text-sm font-semibold text-white mb-3">Date *</label>

                    {/* DATE PICKER */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button className="w-full justify-start border border-white/20 bg-white/10 text-white backdrop-blur-xl hover:bg-white/20 transition-all duration-200 px-4 py-3">
                          {date ? format(date, "yyyy-MM-dd") : "Select date"}
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="p-0">
                        <Calendar mode="single" selected={date} onSelect={handleDateSelect} disabled={isDateBlocked} />
                      </PopoverContent>
                    </Popover>
                    {/* TIME SLOTS */}
                    <label className="block text-sm font-semibold text-white mb-3">Time *</label>

                    {date && (
                      <div className="grid grid-cols-4 gap-3 mt-4">
                        {generateSlots().map((slot) => {
                          const disabled = isBooked(slot)
                          const selected = time === slot

                          return (
                            <Button
                              key={slot}
                              disabled={isBooked(slot)}
                              onClick={() => handleSelectTime(slot)}
                              className={`border border-white/20 backdrop-blur-xl transition-all duration-200 px-4 py-2
                              ${selected ? "bg-[#d4a24c] text-black hover:bg-[#c7953f]" : "bg-white/10 text-white hover:bg-white/20"}
                              ${disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : ""}
                            `}
                            >
                              <div className="flex flex-col items-center leading-tight">
                                <span className="whitespace-nowrap">{formatSlot(slot)}</span>

                                {disabled && <span className="text-[10px] sm:text-xs text-red-400">Booked</span>}
                              </div>
                            </Button>
                          )
                        })}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Guests */}
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
                            onChange={(e) => {
                              if (/^\d*$/.test(e.target.value)) handleChange(e)
                            }}
                            placeholder="Guests"
                            required
                            className="w-full pl-12 pr-4 py-3 border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-all text-lg text-white placeholder-white/40"
                          />
                        </div>
                      </div>

                      {/* Dining preference — locked when package has a room */}
                      <div>
                        <label className="block text-sm font-semibold text-white mb-3">
                          Dining Preference *
                          {selectedPackage?.room && <span className="ml-2 text-[#d4a24c] text-xs font-normal">(locked to package)</span>}
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
                                <option key={opt} value={opt} className="text-gray-900">
                                  {opt}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="VIP Private Rooms">
                              {Object.keys(SEATING_CONFIG.vip).map((opt) => (
                                <option key={opt} value={opt} className="text-gray-900 font-semibold">
                                  {opt}
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
                          className={`w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none transition-all text-lg text-white placeholder-white/40 bg-white/10 backdrop-blur-sm border ${
                            emailError ? "border-red-400" : "border-white/20 focus:border-white focus:ring-2 focus:ring-white/30"
                          }`}
                        />
                      </div>
                      {user?.email && <p className="text-xs text-white/50 mt-1">Using your account email</p>}
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
                          className={`w-full pl-12 pr-4 py-3 border rounded-xl bg-white/10 backdrop-blur-sm focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-all text-lg text-white placeholder-white/40 ${
                            phoneError ? "border-red-400" : "border-white/20"
                          }`}
                        />
                      </div>
                      {phoneError && <p className="mt-2 text-sm text-[#d4a24c]">{phoneError}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Special Request (Accessibility, Dietary, Celebrations)</label>
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
                      <CalendarIcon className="absolute left-4 top-3.5 w-5 h-5 text-[#d4a24c] pointer-events-none" />
                      <select
                        name="occasion"
                        value={formData.occasion}
                        onChange={handleChange}
                        required
                        className="w-full pl-12 pr-4 py-3 border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-all text-lg appearance-none text-white"
                      >
                        <option value="" disabled>
                          Select Occasion
                        </option>
                        {Object.keys(OCCASION_FEES).map((opt) => (
                          <option key={opt} value={opt} className="bg-[#0b1d26] text-white">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* For custom: show how the occasion affects the fee */}
                    {isCustom && formData.occasion && (
                      <p className="mt-3 text-white/50 text-sm">
                        Occasion fee: <span className="text-[#d4a24c] font-medium">₱{(OCCASION_FEES[formData.occasion] ?? 0).toLocaleString()}</span>
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
                    {/* Fee breakdown card */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                      <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide">Fee Breakdown</h3>

                      {selectedPackage ? (
                        <div className="flex justify-between text-white/80">
                          <span>{selectedPackage.name} package</span>
                          <span className="text-[#d4a24c] font-semibold">₱{selectedPackage.price?.toLocaleString()}</span>
                        </div>
                      ) : isCustom ? (
                        <>
                          <div className="flex justify-between text-white/80">
                            <span>Custom Reservation</span>
                            <span className="text-[#d4a24c] font-semibold">₱{reservationFeeNum.toLocaleString()}</span>
                          </div>

                          <div className="flex justify-between text-white/80">
                            <span>Occasion ({formData.occasion || "—"})</span>
                            <span>₱{(OCCASION_FEES[formData.occasion] ?? 0).toLocaleString()}</span>
                          </div>

                          <div className="flex justify-between text-white/80">
                            <span>Seating ({formData.dining_preference})</span>
                            <span>
                              ₱
                              {(VIP_ROOMS.has(formData.dining_preference)
                                ? SEATING_CONFIG.vip[formData.dining_preference]
                                : (SEATING_CONFIG.regular[formData.dining_preference] ?? 0)
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

                      <div className="border-t border-white/10 pt-3 flex justify-between text-white font-semibold">
                        <span>Reservation Fee</span>
                        <span>₱{reservationFeeNum.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Payment method */}
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Payment Method *</label>
                      <div className="space-y-3">
                        {loadingPayments ? (
                          <p className="text-white/60 text-sm">Loading payment methods...</p>
                        ) : paymentMethods.length === 0 ? (
                          <p className="text-white/60 text-sm">No payment methods available</p>
                        ) : (
                          paymentMethods
                            .filter((m) => m.is_enabled && m.key !== "cash")
                            .map((method) => (
                              <div
                                key={method.id}
                                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                                  formData.payment_method === method.key
                                    ? "bg-white/10 border-white"
                                    : "bg-white/5 border-white/20 hover:border-white/40"
                                }`}
                                onClick={() => handleInputChange("payment_method", method.key as any)}
                              >
                                {/* HEADER ROW */}
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                      formData.payment_method === method.key ? "border-white" : "border-white/30"
                                    }`}
                                  >
                                    {formData.payment_method === method.key && <div className="w-3 h-3 rounded-full bg-white" />}
                                  </div>

                                  <div className="flex-1">
                                    <p className="font-medium text-white capitalize">{method.display_name}</p>
                                    <p className="text-sm text-white/70 capitalize">{method.type}</p>
                                  </div>
                                  {formData.payment_method === method.key && <Check className="w-5 h-5 text-white" />}
                                </div>

                                {/* DETAILS (ONLY WHEN SELECTED) */}
                                {formData.payment_method === method.key && method.type !== "cash" && (
                                  <div className="mt-3 space-y-2 text-sm text-white/80">
                                    {method.account_name ? (
                                      <p>
                                        <span className="text-white/60">Name:</span> {method.account_name}
                                      </p>
                                    ) : method.display_name ? (
                                      <p>
                                        <span className="text-white/60">Name:</span> {method.display_name}
                                      </p>
                                    ) : null}

                                    {method.account_number && (
                                      <p>
                                        <span className="text-white/60">Account Number:</span> {method.account_number}
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            copyToClipboard((formData.payment_method = method.account_number), (formData.payment_method = method.key))
                                          }
                                          className="ml-2 border-white/30 text-white hover:bg-white/10 bg-transparent"
                                        >
                                          {(formData.payment_method === "gcash" ? copiedGcash : copiedBank) ? (
                                            <Check className="w-4 h-4 mr-2" />
                                          ) : (
                                            <Copy className="w-4 h-4 mr-2" />
                                          )}
                                          Copy
                                        </Button>
                                      </p>
                                    )}

                                    {method.qr_code && (
                                      <div className="mt-2 w-full">
                                        {method.qr_code && (
                                          <div className="mt-2 w-full">
                                            <Image
                                              src={`${process.env.NEXT_PUBLIC_API_URL}/${method.qr_code}`}
                                              alt="QR Code"
                                              width={360}
                                              height={360}
                                              className="rounded border border-white/20 object-cover"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    <div className="mt-4">
                                      <Label className="text-white">Upload Receipt *</Label>
                                      <div className="mt-2">
                                        {receiptFile ? (
                                          <div className="flex items-center gap-2 p-3 bg-white/10 rounded-lg border border-white/30">
                                            <Check className="w-4 h-4 text-[#ff6b6b]" />
                                            <span className="text-white text-sm">Receipt uploaded</span>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={removeReceipt}
                                              className="ml-auto text-[#ff6b6b] hover:bg-white/10"
                                            >
                                              <X className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-white/30 rounded-lg cursor-pointer hover:border-white/50 transition-colors">
                                            <Upload className="w-5 h-5 text-white/70" />
                                            <span className="text-white/70">Click to upload receipt</span>
                                            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                          </label>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))
                        )}
                      </div>
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
                  </div>
                </div>
              )}

              {/* Step 6: Confirmation */}
              {step === 6 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-extrabold text-white mb-1">Review & Confirm</h2>
                    <p className="text-white/70">Please review your reservation details before submitting.</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg space-y-6">
                    {/* Guest info */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2">
                      <h3 className="text-lg font-semibold text-white mb-2">Guest Information</h3>
                      <div className="flex flex-col gap-3 text-white/80">
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

                    {/* Reservation details */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2">
                      <h3 className="text-lg font-semibold text-white mb-2">Reservation Details</h3>
                      <div className="grid grid-cols-2 gap-4 text-white/80">
                        <span>
                          <span className="font-semibold">Date:</span> {formData.date}
                        </span>
                        <span>
                          <span className="font-semibold">Time:</span> {formatSlot(formData.time)}
                        </span>
                        <span>
                          <span className="font-semibold">Guests:</span> {formData.guests}
                        </span>
                        <span>
                          <span className="font-semibold">Dining:</span> {formData.dining_preference}
                        </span>
                        <span>
                          <span className="font-semibold">VIP Room:</span> {isVIP ? "Yes" : "No"}
                        </span>
                        <span>
                          <span className="font-semibold">Package:</span> {selectedPackage ? selectedPackage.name : "Custom Reservation"}
                        </span>
                        <span>
                          <span className="font-semibold">Occasion:</span> {formData.occasion || "—"}
                        </span>
                      </div>
                    </div>

                    {/* Payment */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-4">
                      <h3 className="text-lg font-semibold text-white mb-2">Payment</h3>
                      <div className="space-y-3 text-white/80">
                        <div className="flex justify-between items-center bg-white/5 px-4 py-3 rounded-xl border border-white/10">
                          <span className="font-semibold">Reservation Fee</span>
                          <span>₱{reservationFeeNum.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 px-4 py-3 rounded-xl border border-white/10">
                          <span className="font-semibold">Service Charge (10%)</span>
                          <span>₱{serviceCharge.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/10 px-4 py-4 rounded-xl border border-white/20">
                          <span className="font-bold text-white">Total Bill</span>
                          <span className="font-bold text-white text-lg">₱{total.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-white/10 my-2" />
                        <div className="flex gap-6 items-center">
                          <span className="font-semibold">Payment Method:</span>
                          <span>{formData.payment_method || "—"}</span>
                        </div>
                        <div className="flex gap-6 items-center">
                          <span className="font-semibold">Reference:</span>
                          <span>{formData.payment_reference || "—"}</span>
                        </div>
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

                    {formData.special_requests && (
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-2">Special Requests</h3>
                        <p className="text-white/80">{formData.special_requests}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-4 mt-8">
                {step > 1 && (
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    className="flex-1 px-6 py-3 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all hover:scale-105"
                  >
                    Back
                  </button>
                )}

                {/* Step 1 has no Continue — selection happens via card click or dialog confirm */}
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
                    disabled={loading || isDailyLimitReached}
                    className="flex-1 px-6 py-3 bg-white hover:bg-white/90 disabled:bg-white/20 text-[#0b1d26] disabled:text-white/50 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:shadow-none hover:scale-105 disabled:hover:scale-100"
                  >
                    {loading ? "Confirming…" : "Confirm Reservation"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt preview modal */}
      {openReceipt && receiptPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setOpenReceipt(false)}>
          <div
            className="relative w-full max-w-3xl bg-[#0b1d26] border border-white/20 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-5 py-4 border-b border-white/20">
              <h2 className="text-white font-semibold">Receipt Preview</h2>
              <button onClick={() => setOpenReceipt(false)} className="text-white text-xl hover:text-white/70">
                ✕
              </button>
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
