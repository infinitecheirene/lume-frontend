"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight, Plus, Loader2, CircleX, Upload, CheckCircle2, AlertCircle, Clock, Users, TrendingUp, Footprints } from "lucide-react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import Image from "next/image"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

interface Package {
  id: string
  room: string
  name: string
  price: number
  description: string
  details: string[]
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

function getSeatingFee(diningPreference: string): number {
  return SEATING_CONFIG.regular[diningPreference] ?? SEATING_CONFIG.vip[diningPreference] ?? 0
}

function getPackageByRoom(room: string): Package | undefined {
  return PACKAGES.find((p) => p.room === room)
}

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

const SLOT_DURATION_MINUTES = 90
const BUFFER_MINUTES = 15
const SLOT_STEP_MINUTES = 30

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function formatHour(hour: number): string {
  if (hour === 0 || hour === 24) return "12 AM"
  if (hour === 12) return "12 PM"
  if (hour < 12) return `${hour} AM`
  if (hour < 24) return `${hour - 12} PM`
  return `${hour - 24} AM`
}

function buildAllSlots(openingHour: number, closingHour: number): string[] {
  const slots: string[] = []
  const openMins = Math.round(openingHour * 60)
  const closeMins = Math.round(closingHour * 60)
  for (let t = openMins; t + SLOT_DURATION_MINUTES <= closeMins; t += SLOT_STEP_MINUTES) {
    slots.push(toHHMM(t))
  }
  return slots
}

function getBlockedSlots(dayReservations: Reservation[], excludeId?: number, openingHour = 10, closingHour = 22.5): Set<string> {
  const blocked = new Set<string>()
  const allSlots = buildAllSlots(openingHour, closingHour)
  const activeBookings = dayReservations.filter(
    (r) => r.reservation_status !== "cancelled" && r.reservation_status !== "noshow" && r.id !== excludeId,
  )
  for (const slot of allSlots) {
    const slotStart = toMinutes(slot)
    const slotEnd = slotStart + SLOT_DURATION_MINUTES
    for (const booking of activeBookings) {
      const bStart = toMinutes(booking.time.substring(0, 5))
      const bEnd = bStart + SLOT_DURATION_MINUTES + BUFFER_MINUTES
      if (slotStart < bEnd && slotEnd > bStart) { blocked.add(slot); break }
    }
  }
  return blocked
}

function getAvailableSlots(dateStr: string, allReservations: Reservation[], excludeId?: number, openingHour = 10, closingHour = 22.5): string[] {
  const dayRes = allReservations.filter((r) => r.date.substring(0, 10) === dateStr)
  const blocked = getBlockedSlots(dayRes, excludeId, openingHour, closingHour)
  return buildAllSlots(openingHour, closingHour).filter((s) => !blocked.has(s))
}

function isDayFullyBooked(date: Date, allReservations: Reservation[]): boolean {
  const { opening, closing, isClosed } = getDayHours(date.getDay())
  if (isClosed) return false
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
  return getAvailableSlots(dateStr, allReservations, undefined, opening, closing).length === 0
}

function isSameMonth(dateStr: string, currentDate: Date) {
  const d = new Date(dateStr)
  return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth()
}

interface Reservation {
  id: number
  reservation_number: string
  name: string
  email: string
  phone: string
  date: string
  time: string
  guests: number
  special_requests?: string
  reservation_status: "pending" | "confirmed" | "cancelled" | "completed" | "noshow"
  created_at: string
  reservation_fee_paid?: number
  dining_preference: string
  occasion?: string
  package?: string
  reservation_fee: string | number
  down_payment?: string | number
  remaining_balance?: string | number
  service_charge?: string | number
  total_fee?: string | number
  payment_status?: "pending" | "partially_paid" | "paid" | "failed" | "refunded"
  payment_method?: string
  payment_reference?: string
  payment_receipt?: string
  is_walkin?: boolean
}

type ReservationStatus = Reservation["reservation_status"]
type DiningPreference = Reservation["dining_preference"]
type OccasionType = string | undefined

function getStatusStyle(status: string) {
  switch (status) {
    case "confirmed": return "bg-emerald-100 text-emerald-800 border-emerald-200"
    case "pending": return "bg-amber-100 text-amber-800 border-amber-200"
    case "cancelled": return "bg-red-100 text-red-800 border-red-200"
    case "completed": return "bg-blue-100 text-blue-800 border-blue-200"
    case "noshow": return "bg-gray-100 text-gray-600 border-gray-200"
    default: return "bg-gray-100 text-gray-600 border-gray-200"
  }
}

function getCalendarColor(reservation: Reservation) {
  if (reservation.is_walkin) return "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200"
  return getStatusStyle(reservation.reservation_status) + " hover:opacity-90"
}

// Label component

function StatusBadge({ status, small }: { status: string; small?: boolean }) {
  const labels: Record<string, string> = { noshow: "No-Show", confirmed: "Confirmed", pending: "Pending", cancelled: "Cancelled", completed: "Completed" }
  return (
    <span className={`inline-flex items-center border rounded-full text-xs font-medium px-2 py-0.5 mx-3 capitalize ${small ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"} ${getStatusStyle(status)}`}>
      {labels[status] ?? status}
    </span>
  )
}

function PaymentBadge({ status }: { status?: string }) {
  const map: Record<string, string> = { pending: "bg-amber-50 text-amber-700 border-amber-200", paid: "bg-emerald-50 text-emerald-700 border-emerald-200", failed: "bg-red-50 text-red-700 border-red-200" }
  return (
    <span className={`inline-flex items-center border rounded-full text-xs font-medium px-2 py-0.5 mx-3 capitalize ${map[status ?? "pending"] ?? map.pending}`}>
      {status ?? "pending"}
    </span>
  )
}

// Section wrapper for forms

function FormSection({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="px-5 py-3 bg-gradient-to-r from-[#162A3A] to-[#1e3a50] flex items-center gap-2">
        {icon && <span className="text-[#d4a24c]">{icon}</span>}
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-5 bg-white space-y-4">{children}</div>
    </div>
  )
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

export default function ReservationsAdmin() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isAddingReservation, setIsAddingReservation] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [viewingReservation, setViewingReservation] = useState<Reservation | null>(null)
  const [openView, setOpenView] = useState(false)
  const [statusDialogReservation, setStatusDialogReservation] = useState<Reservation | null>(null)
  const [openStatusDialog, setOpenStatusDialog] = useState(false)
  const [statusUpdate, setStatusUpdate] = useState<ReservationStatus>("pending")
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [paymentFile, setPaymentFile] = useState<File | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "week" | "month">("week")
  const { toast } = useToast()

  type ReservationFormData = {
    name: string
    email: string
    phone: string
    date: string
    time: string
    guests: number
    package: string
    dining_preference: string
    occasion: string | undefined
    reservation_fee: number
    down_payment: number
    service_charge: number
    total_fee: number
    remaining_balance: number
    payment_method: string
    payment_reference: string
    payment_status: "pending" | "partially_paid" | "paid" | "failed" | "refunded"
    payment_receipt: string | null
    special_requests: string
    is_walkin: boolean
    reservation_status: ReservationStatus
  }

  const initialFormData: ReservationFormData = {
    name: "", email: "", phone: "",
    date: "", time: "",
    guests: 1,
    package: "", dining_preference: "", occasion: "",
    reservation_fee: 0, down_payment: 0, service_charge: 0, total_fee: 0, remaining_balance: 0,
    payment_method: "", payment_reference: "",
    payment_status: "pending",
    payment_receipt: null,
    special_requests: "",
    is_walkin: false,
    reservation_status: "pending",
  }

  function normalizeReservationToFormData(reservation: Reservation): ReservationFormData {
    return {
      ...initialFormData,
      name: reservation.name ?? "",
      email: reservation.email ?? "",
      phone: reservation.phone ?? "",
      date: reservation.date ?? "",
      time: reservation.time ?? "",
      guests: reservation.guests ?? 1,
      package: reservation.package ?? "",
      dining_preference: reservation.dining_preference ?? "",
      occasion: reservation.occasion ?? "",
      reservation_fee: Number(reservation.reservation_fee ?? 0),
      down_payment: Number(reservation.down_payment ?? 0),
      service_charge: Number(reservation.service_charge ?? 0),
      total_fee: Number(reservation.total_fee ?? 0),
      remaining_balance: Number(reservation.remaining_balance ?? 0),
      payment_method: reservation.payment_method ?? "",
      payment_reference: reservation.payment_reference ?? "",
      payment_status: reservation.payment_status ?? "pending",
      payment_receipt: reservation.payment_receipt ?? null,
      special_requests: reservation.special_requests ?? "",
      is_walkin: Boolean(reservation.is_walkin),
      reservation_status: reservation.reservation_status,
    }
  }

  const [formData, setFormData] = useState<ReservationFormData>(initialFormData)

  // Auto-calculate remaining balance for online reservations
  const calculatedRemaining =
    !formData.is_walkin
      ? Math.max(0, Number(formData.total_fee || 0) - Number(formData.down_payment || 0))
      : Number(formData.remaining_balance || 0)

  // Slot availability
  const getDateSlots = (date: string, excludeId?: number) => {
    if (!date) return { allSlots: [], availableSlots: [], blockedSlots: new Set<string>() }
    const d = new Date(date)
    const { opening, closing, isClosed } = getDayHours(d.getDay())
    if (isClosed) return { allSlots: [], availableSlots: [], blockedSlots: new Set<string>() }
    const allSlots = buildAllSlots(opening, closing)
    const dayRes = reservations.filter((r) => r.date.substring(0, 10) === date)
    const blockedSlots = getBlockedSlots(dayRes, excludeId, opening, closing)
    const availableSlots = allSlots.filter((s) => !blockedSlots.has(s))
    return { allSlots, availableSlots, blockedSlots }
  }

  const createSlots = getDateSlots(formData.date)
  const editSlots = getDateSlots(formData.date, editingReservation?.id)

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth < 1024)
    check(); window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => { fetchReservations() }, [])

  function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("auth_token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  async function fetchReservations() {
    try {
      setLoading(true)
      const res = await fetch("/api/reservations", { headers: getAuthHeaders() })
      if (!res.ok) throw new Error()
      const data = await res.json()
      let list: Reservation[] = data.success ? data.data : Array.isArray(data) ? data : data.data ?? []
      list = list.map((r) => {
        if (r.time) r.time = r.time.substring(0, 5)
        return r
      })
      setReservations(list)
    } catch { setReservations([]) }
    finally { setLoading(false) }
  }

  // Dates helpers

  function getDaysInMonth(date: Date) {
    const year = date.getFullYear(), month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: (Date | null)[] = []
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
    return days
  }

  function getWeekDates(date: Date): Date[] {
    const s = new Date(date), day = s.getDay()
    s.setDate(s.getDate() - day)
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(s); d.setDate(s.getDate() + i); return d })
  }

  function getReservationsForDate(date: Date | null) {
    if (!date) return []
    const ds = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    return reservations.filter((r) => r.date.substring(0, 10) === ds)
  }

  function isToday(date: Date | null) { return !!date && date.toDateString() === new Date().toDateString() }
  function formatDate(ds: string) { return new Date(ds).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) }
  function formatTime(ts?: string) {
    if (!ts) return "--:--"
    const [h, m] = ts.split(":"); const hr = parseInt(h, 10)
    return `${hr % 12 === 0 ? 12 : hr % 12}:${m || "00"} ${hr >= 12 ? "PM" : "AM"}`
  }
  function formatMonthYear(d: Date) { return d.toLocaleDateString("en-US", { month: "long", year: "numeric" }) }
  function formatWeekRange(d: Date) {
    const w = getWeekDates(d)
    return `${w[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${w[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
  }

  async function handleCreateReservation() {
    if (!formData.name.trim()) { toast({ title: "Required", description: "Guest name is required.", variant: "destructive" }); return }
    if (!formData.is_walkin && formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email.", variant: "destructive" }); return
    }
    if (!formData.is_walkin && !formData.date) { toast({ title: "Required", description: "Date is required for online reservations.", variant: "destructive" }); return }
    if (!formData.is_walkin && !formData.time) { toast({ title: "Required", description: "Time is required for online reservations.", variant: "destructive" }); return }
    if (!formData.is_walkin && !paymentFile) { toast({ title: "Required", description: "Payment screenshot is required for online reservations.", variant: "destructive" }); return }

    if (formData.date && formData.time && !formData.is_walkin) {
      const d = new Date(formData.date)
      const { isClosed } = getDayHours(d.getDay())
      if (isClosed) { toast({ title: "Closed", description: "Restaurant is closed on this day.", variant: "destructive" }); return }
      const { blockedSlots } = getDateSlots(formData.date)
      if (blockedSlots.has(formData.time)) { toast({ title: "Unavailable", description: "That slot is already booked.", variant: "destructive" }); return }
    }

    try {
      const form = new FormData()
      const payload = {
        ...formData,
        reservation_status: formData.is_walkin ? "confirmed" : formData.reservation_status,
        payment_status: formData.is_walkin ? formData.payment_status : "pending",
        remaining_balance: formData.is_walkin ? formData.remaining_balance : calculatedRemaining,
      }
      Object.entries(payload).forEach(([k, v]) => {
        if (v === null || v === undefined) return
        form.append(k, typeof v === "boolean" ? (v ? "1" : "0") : String(v))
      })
      if (paymentFile) form.append("payment_receipt", paymentFile)

      const res = await fetch("/api/reservations", { method: "POST", headers: getAuthHeaders(), body: form })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || "Failed") }

      if (!formData.is_walkin && formData.email) {
        fetch("/api/send-email/reservation", {
          method: "POST", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ email: formData.email, name: formData.name, date: formData.date, time: formData.time, guests: formData.guests }),
        }).catch(() => { })
      }

      fetchReservations(); setFormData(initialFormData); setIsAddingReservation(false); setPaymentFile(null)
      toast({ title: "Reservation Created", description: `${formData.is_walkin ? "Walk-in guest" : "Reservation"} added successfully.` })
    } catch (e) {
      console.error(e); toast({ title: "Error", description: "Failed to create reservation.", variant: "destructive" })
    }
  }

  async function handleUpdateReservation() {
    if (!editingReservation) return
    try {
      const payload = new FormData()
      const data = {
        ...formData,
        reservation_status: formData.is_walkin ? "confirmed" : formData.reservation_status,
        remaining_balance: formData.is_walkin ? formData.remaining_balance : calculatedRemaining,
      }
      Object.entries(data).forEach(([k, v]) => { if (k !== "payment_receipt") payload.append(k, typeof v === "boolean" ? (v ? "1" : "0") : String(v ?? "")) })
      if (paymentFile) payload.append("payment_receipt", paymentFile)

      const res = await fetch(`/api/reservations/${editingReservation.id}`, { method: "PUT", headers: getAuthHeaders(), body: payload })
      if (!res.ok) throw new Error()

      toast({ title: "Updated", description: "Reservation updated successfully." })
      fetchReservations(); setOpenEdit(false); setEditingReservation(null); setFormData(initialFormData); setPaymentFile(null)
    } catch { toast({ title: "Error", description: "Failed to update reservation.", variant: "destructive" }) }
  }

  async function handleStatusUpdate() {
    if (!statusDialogReservation) return
    try {
      const payload = new FormData(); payload.append("reservation_status", statusUpdate)
      const res = await fetch(`/api/reservations/${statusDialogReservation.id}`, { method: "PUT", headers: getAuthHeaders(), body: payload })
      if (!res.ok) throw new Error()

      if (statusUpdate === "confirmed" && !statusDialogReservation.is_walkin && statusDialogReservation.email) {
        fetch("/api/send-email/reservation", {
          method: "POST", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ email: statusDialogReservation.email, name: statusDialogReservation.name, date: statusDialogReservation.date, time: statusDialogReservation.time, guests: statusDialogReservation.guests }),
        }).catch(() => { })
      }

      toast({ title: "Status Updated", description: `Reservation marked as ${statusUpdate}.` })
      fetchReservations(); setOpenStatusDialog(false); setStatusDialogReservation(null)
    } catch { toast({ title: "Error", description: "Failed to update status.", variant: "destructive" }) }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/reservations/${id}`, { method: "DELETE", headers: getAuthHeaders() })
      if (!res.ok) throw new Error()
      toast({ title: "Deleted", description: "Reservation deleted." }); fetchReservations()
    } catch { toast({ title: "Error", description: "Failed to delete.", variant: "destructive" }) }
  }

  const MIN_HOUR = 10, MAX_HOUR = 26
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const monthRes = reservations.filter((r) => isSameMonth(r.date, currentDate))
  const confirmedCount = monthRes.filter((r) => r.reservation_status === "confirmed").length
  const pendingCount = monthRes.filter((r) => r.reservation_status === "pending").length
  const guestCount = monthRes.filter((r) => !["cancelled", "noshow"].includes(r.reservation_status)).reduce((s, r) => s + r.guests, 0)
  const walkInCount = monthRes.filter((r) => r.is_walkin && !["cancelled", "noshow"].includes(r.reservation_status)).length

  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchReservations()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <SidebarProvider defaultOpen={!isDesktop}>
        <div className="flex min-h-screen w-full bg-amber-50">
          <AppSidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-[#162A3A] rounded-2xl px-10 py-8 flex flex-col items-center gap-4 shadow-2xl border border-[#d4a24c]/30">
              <Loader2 className="h-8 w-8 animate-spin text-[#d4a24c]" />
              <p className="text-white font-medium">Loading Reservations…</p>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => <span key={i} className="w-2 h-2 rounded-full bg-[#d4a24c] animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    )
  }

  const PaymentSection = ({ isEdit = false }: { isEdit?: boolean }) => {
    const isWalkIn = formData.is_walkin

    if (isWalkIn) {
      return (
        <FormSection title="Payment Details" icon={<TrendingUp className="w-4 h-4" />}>
          {/* Total fee only */}
          <div>
            <FieldLabel>Total Fee</FieldLabel>
            <div className="relative max-w-[200px] text-gray-800">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₱</span>
              <Input
                type="number" min={0} step={0.01}
                value={formData.total_fee}
                onChange={(e) => setFormData({ ...formData, total_fee: parseFloat(e.target.value) || 0 })}
                className="pl-7 h-9 bg-white border-gray-200"
              />
            </div>
          </div>

          {/* Payment method — free text for walk-ins */}
          <div>
            <FieldLabel>Payment Method</FieldLabel>
            <Input
              placeholder="e.g. Cash, GCash, Card…"
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="h-9 bg-white border-gray-200"
            />
          </div>

          {/* Payment status */}
          <div>
            <FieldLabel>Payment Status</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {(["pending", "paid", "failed"] as const).map((s) => (
                <button
                  key={s} type="button"
                  onClick={() => setFormData({ ...formData, payment_status: s })}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all capitalize
                    ${formData.payment_status === s
                      ? s === "paid" ? "bg-emerald-600 text-white border-emerald-600"
                        : s === "pending" ? "bg-amber-500 text-white border-amber-500"
                          : "bg-red-500 text-white border-red-500"
                      : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                    }`}
                >{s}</button>
              ))}
            </div>
          </div>
        </FormSection>
      )
    }

    return (
      <FormSection title="Payment Details" icon={<TrendingUp className="w-4 h-4" />}>
        {/* Fee breakdown */}
        <div className="rounded-xl bg-[#162A3A]/5 border border-[#162A3A]/10 p-4 space-y-3 text-gray-800">
          <h4 className="text-xs font-semibold text-[#162A3A] uppercase tracking-wider">Fee Breakdown</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Reservation Fee</FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₱</span>
                <Input type="number" min={0} step={0.01} value={formData.reservation_fee}
                  onChange={(e) => setFormData({ ...formData, reservation_fee: parseFloat(e.target.value) || 0 })}
                  className="pl-7 h-9 bg-white border-gray-200" />
              </div>
            </div>
            <div>
              <FieldLabel>Service Charge</FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₱</span>
                <Input type="number" min={0} step={0.01} value={formData.service_charge}
                  onChange={(e) => setFormData({ ...formData, service_charge: parseFloat(e.target.value) || 0 })}
                  className="pl-7 h-9 bg-white border-gray-200" />
              </div>
            </div>
            <div>
              <FieldLabel>Down Payment <span className="text-red-500 ml-0.5">*</span></FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₱</span>
                <Input type="number" min={0} step={0.01} value={formData.down_payment}
                  onChange={(e) => setFormData({ ...formData, down_payment: parseFloat(e.target.value) || 0 })}
                  className="pl-7 h-9 bg-white border-gray-200" />
              </div>
            </div>
            <div>
              <FieldLabel>Total Fee <span className="text-red-500 ml-0.5">*</span></FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₱</span>
                <Input type="number" min={0} step={0.01} value={formData.total_fee}
                  onChange={(e) => setFormData({ ...formData, total_fee: parseFloat(e.target.value) || 0 })}
                  className="pl-7 h-9 bg-white border-gray-200" />
              </div>
            </div>
          </div>

          {/* Remaining balance */}
          <div className="pt-2 border-t border-[#162A3A]/10">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#162A3A]">Remaining Balance</span>
              <span className="text-lg font-bold text-[#162A3A]">
                ₱{calculatedRemaining.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Auto-calculated: Total Fee − Down Payment</p>
          </div>
        </div>

        {/* Payment method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-800">
          <div>
            <FieldLabel>Payment Method <span className="text-red-500 ml-0.5">*</span></FieldLabel>
            <Select value={formData.payment_method} onValueChange={(v) => setFormData({ ...formData, payment_method: v })}>
              <SelectTrigger className="h-9 bg-white border-gray-200"><SelectValue placeholder="Select method" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="GCash">GCash</SelectItem>
                <SelectItem value="Security Bank">Security Bank</SelectItem>
                <SelectItem value="BPI">BPI</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel>Reference Number <span className="text-red-500 ml-0.5">*</span></FieldLabel>
            <Input placeholder="Transaction ID / Ref #" value={formData.payment_reference}
              onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
              className="h-9 bg-white border-gray-200" />
          </div>
        </div>

        {/* Payment screenshot — required for online */}
        <div>
          <FieldLabel required>Payment Screenshot (Proof of Payment)</FieldLabel>
          <label className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-[#d4a24c]/40 bg-amber-50/50 cursor-pointer hover:border-[#d4a24c] hover:bg-amber-50 transition-all group">
            <div className="w-10 h-10 rounded-full bg-[#d4a24c]/10 group-hover:bg-[#d4a24c]/20 flex items-center justify-center flex-shrink-0">
              <Upload className="w-4 h-4 text-[#d4a24c]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{paymentFile ? paymentFile.name : "Upload payment screenshot"}</p>
              <p className="text-xs text-gray-400">PNG, JPG up to 10MB · Required for online reservations</p>
            </div>
            {paymentFile && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setPaymentFile(e.target.files?.[0] || null)} />
          </label>
          {isEdit && formData.payment_receipt && !paymentFile && (
            <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 max-w-[200px]">
              <Image src={`${process.env.NEXT_PUBLIC_API_URL}/${formData.payment_receipt}`} alt="Receipt" width={200} height={200} className="w-full object-cover" />
            </div>
          )}
        </div>

        {/* Payment status */}
        <div>
          <FieldLabel>Payment Status</FieldLabel>
          <div className="mb-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">Online reservations default to <strong>Pending</strong>. Mark as <strong>Paid</strong> only after verifying the payment screenshot above.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Payment status */}
            <div>
              <FieldLabel>Payment Status</FieldLabel>

              <div className="flex flex-wrap gap-2">
                {(
                  ["pending", "partially_paid", "paid", "failed", "refunded"] as const
                ).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, payment_status: s })
                    }
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all capitalize
                        ${formData.payment_status === s
                        ? s === "paid"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : s === "pending"
                            ? "bg-amber-500 text-white border-amber-500"
                            : s === "partially_paid"
                              ? "bg-blue-500 text-white border-blue-500"
                              : s === "failed"
                                ? "bg-red-500 text-white border-red-500"
                                : "bg-purple-600 text-white border-purple-600"
                        : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                      }`}
                  >
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </FormSection>
    )
  }

  // Schedule section 
  const ScheduleSection = ({ slots }: { slots: ReturnType<typeof getDateSlots> }) => {
    const isWalkIn = formData.is_walkin
    const selectedDateInfo = formData.date ? getDayHours(new Date(formData.date).getDay()) : null

    return (
      <FormSection title="Schedule" icon={<Clock className="w-4 h-4" />}>
        {isWalkIn ? (
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-center gap-3 text-gray-800">
            <Footprints className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Walk-In Guest</p>
              <p className="text-xs text-blue-600">Date and time selection is disabled. Walk-in guests are served on arrival.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-gray-800">
            <div>
              <FieldLabel required>Date</FieldLabel>
              <Input type="date" value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value, time: "" })}
                className="h-9 bg-white border-gray-200" />
              {selectedDateInfo && (
                <p className="text-xs text-gray-500 mt-1">
                  {selectedDateInfo.isClosed ? "🔴 Closed" : `🟢 Open: ${selectedDateInfo.label}`}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-sm font-medium text-gray-700">Time <span className="text-red-500">*</span></label>
                {formData.date && (selectedDateInfo?.isClosed ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">Closed</span>
                ) : slots.availableSlots.length === 0 ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Fully Booked</span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    {slots.availableSlots.length}/{slots.allSlots.length} slots open
                  </span>
                ))}
              </div>
              {!formData.date ? (
                <div className="h-9 flex items-center px-3 rounded-lg border border-dashed border-gray-300 bg-white">
                  <p className="text-sm text-gray-400 italic">Select a date first</p>
                </div>
              ) : (
                <Select value={formData.time} onValueChange={(v) => setFormData({ ...formData, time: v })} disabled={slots.availableSlots.length === 0 || selectedDateInfo?.isClosed}>
                  <SelectTrigger className="h-9 bg-white border-gray-200"><SelectValue placeholder={slots.availableSlots.length === 0 ? "No slots available" : "Select time"} /></SelectTrigger>
                  <SelectContent>
                    {slots.allSlots.map((slot) => {
                      const blocked = slots.blockedSlots.has(slot)
                      return (
                        <SelectItem key={slot} value={slot} disabled={blocked}>
                          <span className={blocked ? "text-gray-400 line-through" : ""}>{formatTime(slot)}</span>
                          {blocked && <span className="ml-2 text-xs text-red-400">Booked</span>}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}
        <div>
          <FieldLabel required>Number of Guests</FieldLabel>
          <Input type="number" min={1} max={50} value={formData.guests}
            onChange={(e) => setFormData({ ...formData, guests: Number(e.target.value) })}
            className="h-9 bg-white border-gray-200 max-w-[140px]" />
        </div>
      </FormSection>
    )
  }

  return (
    <SidebarProvider defaultOpen={!isDesktop}>
      <div className="flex min-h-screen w-full bg-amber-50">
        <AppSidebar />
        <div className={`flex-1 min-w-0 transition-all duration-300 ${isDesktop ? "ml-0" : "ml-72"}`}>

          {isDesktop && (
            <div className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b bg-[#162A3A] px-4 shadow-sm">
              <SidebarTrigger />
              <Image src="/logo.jpg" alt="Lumè Bean and Bar" width={36} height={36} className="rounded-full object-contain" />
              <h1 className="text-lg font-semibold text-white">Lumè Bean and Bar</h1>
            </div>
          )}

          <main className="px-4 py-6 md:px-6 md:py-6 lg:px-8 lg:py-8 max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-[#162A3A]">Reservations</h1>
                <p className="text-gray-500 mt-1 text-sm">Manage tables, walk-ins, and guest scheduling</p>
              </div>

              <Button
                onClick={() => setIsAddingReservation(true)}
                className="h-10 px-5 font-semibold bg-[#162A3A] text-white hover:bg-[#1e3a50] rounded-xl shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" /> New Reservation
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Confirmed", value: confirmedCount, icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />, bg: "bg-white", accent: "text-emerald-700", border: "border-emerald-100" },
                { label: "Pending", value: pendingCount, icon: <Clock className="w-5 h-5 text-amber-500" />, bg: "bg-white", accent: "text-amber-700", border: "border-amber-100" },
                { label: "Guests", value: guestCount, icon: <Users className="w-5 h-5 text-blue-500" />, bg: "bg-white", accent: "text-blue-700", border: "border-blue-100" },
                { label: "Walk-ins", value: walkInCount, icon: <Footprints className="w-5 h-5 text-violet-500" />, bg: "bg-white", accent: "text-violet-700", border: "border-violet-100" },
              ].map(({ label, value, icon, bg, accent, border }) => (
                <div key={label} className={`${bg} border ${border} rounded-2xl p-4 flex items-center gap-3 shadow-sm`}>
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">{icon}</div>
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className={`text-2xl font-bold ${accent}`}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Calendar panel */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

              {/* Panel header */}
              <div className="flex flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 bg-[#162A3A]">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-white">
                    {viewMode === "list" ? "All Reservations" : viewMode === "week" ? formatWeekRange(currentDate) : formatMonthYear(currentDate)}
                  </h2>
                  <Button size="sm" variant="outline" onClick={() => setCurrentDate(new Date())} className="text-[#162A3A] bg-white/90 border-0 h-7 text-xs">Today</Button>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-7 w-7"
                    onClick={() => viewMode === "week" ? setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7)) : setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-7 w-7"
                    onClick={() => viewMode === "week" ? setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7)) : setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Refresh Button */}
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  disabled={refreshing}
                  className="h-10 px-4 rounded-xl border-gray-200"
                >
                  {refreshing ? "Refreshing..." : "Refresh"}
                </Button>
              </div>

              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
                <div className="px-5 pt-4">
                  <TabsList className="h-9 bg-gray-100 rounded-lg p-1">
                    <TabsTrigger value="list" className="text-xs h-7 rounded-md">List</TabsTrigger>
                    <TabsTrigger value="week" className="text-xs h-7 rounded-md">Week</TabsTrigger>
                    <TabsTrigger value="month" className="text-xs h-7 rounded-md">Month</TabsTrigger>
                  </TabsList>
                </div>

                {/* List View */}
                <TabsContent value="list" className="p-5 bg-white">
                  <div className="overflow-x-auto rounded-3xl border border-gray-100 shadow-sm">
                    <table className="w-full text-sm min-w-[960px]">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {["Reservation #", "Date", "Time", "Guest", "Pax", "Type", "Res Status", "Pay Status", "Actions"].map((h) => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {reservations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((r) => (
                          <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.reservation_number}</td>
                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatDate(r.date)}</td>
                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatTime(r.time)}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                            <td className="px-4 py-3 text-gray-600">{r.guests}</td>
                            <td className="px-4 py-3">
                              {r.is_walkin
                                ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium"><Footprints className="w-3 h-3" />Walk-in</span>
                                : <span className="text-xs text-gray-500">Online</span>}
                            </td>
                            <td className="px-4 py-3">
                              <button onClick={() => { setStatusDialogReservation(r); setStatusUpdate(r.reservation_status); setOpenStatusDialog(true) }}>
                                <StatusBadge status={r.reservation_status} small />
                              </button>
                            </td>
                            <td className="px-4 py-3"><PaymentBadge status={r.payment_status} /></td>
                            <td className="px-4 py-3">
                              <Button size="sm" variant="outline" className="h-7 text-xs border-gray-200 hover:border-[#162A3A]"
                                onClick={() => { setViewingReservation(r); setOpenView(true) }}>View</Button>
                            </td>
                          </tr>
                        ))}
                        {reservations.length === 0 && (
                          <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-sm">No reservations found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                {/* Week View */}
                <TabsContent value="week" className="p-4 bg-white rounded-b-3xl">
                  <div className="overflow-x-auto">
                    <div className="min-w-[720px]">
                      <div className="grid grid-cols-8 mb-1 border-b border-gray-100">
                        <div className="p-2" />
                        {getWeekDates(currentDate).map((date, i) => (
                          <div key={i} className="p-2 text-center">
                            <div className="text-xs font-medium text-gray-500">{date.toLocaleDateString("en-US", { weekday: "short" })}</div>
                            <div className={`text-sm font-bold mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full ${isToday(date) ? "bg-[#d4a24c] text-white" : "text-gray-700"}`}>{date.getDate()}</div>
                          </div>
                        ))}
                      </div>
                      {Array.from({ length: MAX_HOUR - MIN_HOUR }, (_, i) => MIN_HOUR + i).map((hour) => (
                        <div key={hour} className="grid grid-cols-8 border-b border-gray-50">
                          <div className="px-2 py-1 text-right text-xs text-gray-400 pt-1.5">{formatHour(hour)}</div>
                          {getWeekDates(currentDate).map((date, di) => {
                            const { isClosed, opening, closing } = getDayHours(date.getDay())
                            if (isClosed) return <div key={di} className="min-h-[48px] bg-gray-50/50 border-r border-gray-100" />
                            const slots = buildAllSlots(opening, closing).filter(s => parseInt(s.split(":")[0]) === hour)
                            return (
                              <div key={di} className="min-h-[48px] p-0.5 border-r border-gray-100">
                                {slots.map((slot) =>
                                  reservations.filter(r => r.date.substring(0, 10) === `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` && r.time.substring(0, 5) === slot)
                                    .map((res) => (
                                      <div key={res.id} onClick={() => { setViewingReservation(res); setOpenView(true) }}
                                        className={`text-xs p-1.5 rounded-lg mb-0.5 cursor-pointer truncate font-medium border ${getCalendarColor(res)}`}>
                                        {res.name}
                                      </div>
                                    ))
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Month View */}
                <TabsContent value="month" className="p-4 bg-white rounded-b-3xl">
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((d) => (
                      <div key={d} className="p-2 text-center text-xs font-semibold text-gray-500 uppercase">{d}</div>
                    ))}
                    {getDaysInMonth(currentDate).map((date, idx) => {
                      if (!date) return <div key={idx} className="min-h-[80px] rounded-xl bg-gray-50/30" />
                      const dayRes = getReservationsForDate(date)
                      const { isClosed } = getDayHours(date.getDay())
                      const fullyBooked = !isClosed && isDayFullyBooked(date, reservations)
                      return (
                        <div key={idx} onClick={() => { if (!isClosed) { setCurrentDate(date); setViewMode("week") } }}
                          className={`min-h-[80px] rounded-xl p-2 border cursor-pointer transition-all hover:shadow-sm ${isToday(date) ? "bg-amber-50 border-[#d4a24c]/50" : isClosed ? "bg-gray-50 border-gray-100" : "bg-white border-gray-100 hover:border-gray-300"}`}>
                          <div className={`text-sm font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday(date) ? "bg-[#d4a24c] text-white" : "text-gray-700"}`}>{date.getDate()}</div>
                          {isClosed ? <p className="text-xs text-gray-400">Closed</p>
                            : fullyBooked ? <p className="text-xs text-red-500 font-medium">Full</p>
                              : (
                                <div className="space-y-0.5">
                                  {dayRes.slice(0, 2).map((r) => (
                                    <div key={r.id} onClick={(e) => { e.stopPropagation(); setViewingReservation(r); setOpenView(true) }}
                                      className={`text-xs px-1.5 py-0.5 rounded-md truncate border ${getCalendarColor(r)}`}>
                                      {r.time.substring(0, 5)} {r.name}
                                    </div>
                                  ))}
                                  {dayRes.length > 2 && <p className="text-xs text-gray-400 pl-1">+{dayRes.length - 2}</p>}
                                </div>
                              )}
                        </div>
                      )
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>

      {/* VIEW RESERVATION DIALOG */}
      <Dialog open={openView} onOpenChange={(o) => { if (!o) setViewingReservation(null); setOpenView(o) }}>
        <DialogContent className="lg:max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl shadow-lg border border-gray-200 p-0 bg-white">
          {viewingReservation && (
            <>
              {/* Header */}
              <div className="sticky top-0 z-10 bg-[#162A3A] px-6 py-5 rounded-t-2xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-white/50 text-xs font-mono mb-1">{viewingReservation.reservation_number}</p>
                    <h2 className="text-2xl font-bold text-white">{viewingReservation.name}</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {viewingReservation.is_walkin && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-sm font-medium">
                          <Footprints className="w-3.5 h-3.5" />Walk-in
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="bg-[#d4a24c] hover:bg-[#c49040] text-white border-0 h-8"
                      onClick={() => {
                        setEditingReservation(viewingReservation)
                        setFormData(normalizeReservationToFormData(viewingReservation))
                        setOpenView(false)
                        setOpenEdit(true)
                      }}>Edit</Button>
                    <button onClick={() => setOpenView(false)} className="text-white/60 hover:text-white transition-colors">
                      <CircleX className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 space-y-5 gap-4">
                  {/* Guest Info */}
                  <div className="rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Guest Information</h3>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                      {[
                        { label: "Email", value: viewingReservation.email || "—" },
                        { label: "Phone", value: viewingReservation.phone || "—" },
                        { label: "Guests", value: `${viewingReservation.guests} person(s)` },
                        { label: "Occasion", value: viewingReservation.occasion || "—" },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                          <p className="text-sm font-medium text-gray-800">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Schedule</h3>
                      <StatusBadge status={viewingReservation.reservation_status} />
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div><p className="text-xs text-gray-400 mb-0.5">Date</p><p className="text-sm font-medium text-gray-800">{formatDate(viewingReservation.date)}</p></div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Time</p>
                        <p className="text-sm font-medium text-gray-800">{formatTime(viewingReservation.time)}</p>
                      </div>
                      {viewingReservation.dining_preference && <div><p className="text-xs text-gray-400 mb-0.5">Dining</p><p className="text-sm font-medium text-gray-800">{viewingReservation.dining_preference}</p></div>}
                      {viewingReservation.package && <div><p className="text-xs text-gray-400 mb-0.5">Package</p><p className="text-sm font-medium text-gray-800">{viewingReservation.package}</p></div>}
                    </div>
                  </div>

                  {/* Special requests */}
                  {viewingReservation.special_requests && (
                    <div className="rounded-2xl border border-gray-100 overflow-hidden">
                      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Special Requests</h3>
                      </div>
                      <div className="p-4"><p className="text-sm text-gray-700">{viewingReservation.special_requests}</p></div>
                    </div>
                  )}
                </div>

                {/* Payment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 space-y-4 mt-4">
                  <div className="rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center px-4 py-2.5 bg-[#162A3A] border-b border-[#162A3A]/10">
                      <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wider">Payment</h3>
                      {viewingReservation.payment_status && <PaymentBadge status={viewingReservation.payment_status} />}
                    </div>
                    <div className="p-4 space-y-3">
                      {[
                        { label: "Reservation Fee", value: viewingReservation.reservation_fee },
                        { label: "Service Charge", value: viewingReservation.service_charge },
                        { label: "Down Payment", value: viewingReservation.down_payment },
                        { label: "Total Fee", value: viewingReservation.total_fee },
                      ].filter(({ value }) => value != null && value !== "").map(({ label, value }) => (
                        <div key={label} className="flex justify-between text-sm">
                          <span className="text-gray-500">{label}</span>
                          <span className="font-medium text-gray-800">₱{Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                      {viewingReservation.remaining_balance != null && (
                        <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                          <span className="font-semibold text-gray-700">Remaining Balance</span>
                          <span className="font-bold text-[#d4a24c]">₱{Number(viewingReservation.remaining_balance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-gray-100 space-y-2">
                        <div className="text-gray-900 space-y-2">
                          {viewingReservation.payment_method &&
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Method</span>
                              <span className="font-medium">{viewingReservation.payment_method}</span>
                            </div>}
                          {viewingReservation.payment_reference &&
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Reference</span>
                              <span className="font-medium font-mono text-xs">{viewingReservation.payment_reference}</span>
                            </div>}
                        </div>
                        <div className="flex justify-between text-sm items-center">
                          <span className="text-gray-500">Status</span>
                          <PaymentBadge status={viewingReservation.payment_status} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Receipt — small thumbnail */}
                  <div>
                    {viewingReservation.payment_receipt && (
                      <div className="rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Screenshot</h3>
                        </div>
                        <div className="p-3 flex flex-col items-start gap-2">
                          <Image
                            src={`${process.env.NEXT_PUBLIC_API_URL}/${viewingReservation.payment_receipt}`}
                            alt="Receipt"
                            width={220}
                            height={250}
                            className="w-auto max-h-40 rounded-lg object-contain border border-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/${viewingReservation.payment_receipt}`, "_blank")}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/${viewingReservation.payment_receipt}`, "_blank")}
                          >View Full Size</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT RESERVATION SHEET */}
      <Sheet open={openEdit} onOpenChange={(o) => { setOpenEdit(o); if (!o) { setPaymentFile(null); setFormData(initialFormData); setEditingReservation(null) } }}>
        <SheetContent side="right" className="w-[95vw] sm:max-w-2xl max-h-screen overflow-y-auto bg-[#f5f0e8] border-l border-gray-200 p-0 shadow-2xl">

          {/* Sheet header */}
          <div className="sticky top-0 z-10 bg-[#162A3A] px-6 py-5">
            <SheetHeader className="text-left">
              <div className="flex items-center justify-between">
                <div>
                  <SheetTitle className="text-2xl font-bold text-white">Edit Reservation</SheetTitle>
                  <p className="text-white/50 text-sm mt-0.5">{editingReservation?.reservation_number}</p>
                </div>
                {/* Walk-in toggle */}
                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl">
                  <Footprints className="w-4 h-4 text-white/70" />
                  <span className="text-white/80 text-sm">Walk-In</span>
                  <Switch checked={formData.is_walkin}
                    onCheckedChange={(c) => setFormData({ ...formData, is_walkin: c, reservation_status: c ? "confirmed" : formData.reservation_status })} />
                </div>
              </div>
            </SheetHeader>
          </div>

          <div className="p-5 space-y-4">
            {/* Walk-in notice */}
            {formData.is_walkin && (
              <div className="flex items-center gap-3 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
                <Footprints className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">Walk-In Mode</p>
                  <p className="text-xs text-blue-600">Status automatically set to Confirmed. Payment details are optional.</p>
                </div>
              </div>
            )}

            {/* Guest info */}
            <FormSection title="Guest Information" icon={<Users className="w-4 h-4" />}>
              <div>
                <FieldLabel required>Full Name</FieldLabel>
                <Input placeholder="Guest name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-9 bg-white border-gray-200 text-gray-800" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-gray-800">
                <div><FieldLabel>Email</FieldLabel><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-9 bg-white border-gray-200 text-gray-800" /></div>
                <div><FieldLabel>Phone</FieldLabel><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-9 bg-white border-gray-200 text-gray-800" /></div>
              </div>
            </FormSection>

            {/* Schedule */}
            <ScheduleSection slots={editSlots} />

            {/* Preferences */}
            <FormSection title="Preferences">
              <div className="grid grid-cols-2 gap-3 text-gray-800">
                <div>
                  <FieldLabel>Dining Preference</FieldLabel>
                  <Select
                    value={formData.dining_preference}
                    onValueChange={(v: DiningPreference) => {
                      const fee = getSeatingFee(v)
                      const pkg = getPackageByRoom(v)
                      setFormData({
                        ...formData,
                        dining_preference: v,
                        reservation_fee: fee,
                        ...(pkg ? { package: pkg.name, total_fee: pkg.price } : {}),
                      })
                    }}
                  >
                    <SelectTrigger className="h-9 bg-white border-gray-200 text-gray-800">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="text-gray-800">
                      <SelectItem value="Main Dining">Main Dining</SelectItem>
                      <SelectItem value="Lounge Seating">Lounge Seating</SelectItem>
                      <SelectItem value="High Table">High Table</SelectItem>
                      <SelectItem value="Bar Counter">Bar Counter</SelectItem>
                      <SelectItem value="The Loft">The Loft (VIP)</SelectItem>
                      <SelectItem value="Amber Room">Amber Room (VIP)</SelectItem>
                      <SelectItem value="Aurora Lounge">Aurora Lounge (VIP)</SelectItem>
                      <SelectItem value="Velvet Room">Velvet Room (VIP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Occasion</FieldLabel>
                  <Select value={formData.occasion} onValueChange={(v: OccasionType) => setFormData({ ...formData, occasion: v })}>
                    <SelectTrigger className="h-9 bg-white border-gray-200 text-gray-800">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="text-gray-800">
                      {["Celebration", "Romantic", "Night Life", "Professional", "Casual", "Other"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <FieldLabel>Package</FieldLabel>
                <Select
                  value={formData.package}
                  onValueChange={(v) => {
                    const pkg = PACKAGES.find((p) => p.name === v)
                    setFormData({ ...formData, package: v, ...(pkg ? { total_fee: pkg.price } : {}) })
                  }}
                >
                  <SelectTrigger className="h-9 bg-white border-gray-200 text-gray-800">
                    <SelectValue placeholder="Select a package" />
                  </SelectTrigger>
                  <SelectContent className="text-gray-800">
                    {PACKAGES.map((p) => (
                      <SelectItem key={p.id} value={p.name}>
                        {p.name} — {p.room} (₱{p.price.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel>Special Requests</FieldLabel>
                <Textarea rows={3} value={formData.special_requests} onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })} className="bg-white border-gray-200 resize-none" />
              </div>
            </FormSection>

            {/* Payment */}
            <PaymentSection isEdit />

            {/* Reservation status */}
            <FormSection title="Reservation Status">
              {formData.is_walkin ? (
                <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Confirmed (Walk-in)</p>
                    <p className="text-xs text-emerald-600">Walk-in reservations are automatically confirmed.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(["pending", "confirmed", "cancelled", "completed", "noshow"] as const).map((s) => (
                    <button key={s} type="button" onClick={() => setFormData({ ...formData, reservation_status: s })}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all capitalize
                        ${formData.reservation_status === s
                          ? s === "confirmed" ? "bg-emerald-600 text-white border-emerald-600"
                            : s === "pending" ? "bg-amber-500 text-white border-amber-500"
                              : s === "cancelled" ? "bg-red-500 text-white border-red-500"
                                : s === "completed" ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-gray-600 text-white border-gray-600"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                      {s === "noshow" ? "No-Show" : s}
                    </button>
                  ))}
                </div>
              )}
            </FormSection>

            <div className="flex gap-3 pb-6">
              <Button variant="outline" className="flex-1 h-10 text-gray-600 border-gray-200" onClick={() => setOpenEdit(false)}>Cancel</Button>
              <Button onClick={handleUpdateReservation} className="flex-1 h-10 bg-[#162A3A] hover:bg-[#1e3a50] text-white rounded-xl font-semibold">Save Changes</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* STATUS UPDATE DIALOG */}
      <Dialog open={openStatusDialog} onOpenChange={(o) => { setOpenStatusDialog(o); if (!o) { setStatusDialogReservation(null); setStatusUpdate("pending") } }}>
        <DialogContent className="w-[92vw] max-w-sm rounded-2xl border-0 shadow-2xl p-0 overflow-hidden">
          <div className="bg-[#162A3A] px-6 py-5">
            <DialogTitle className="text-xl font-bold text-white">Update Status</DialogTitle>
            <p className="text-white/50 text-sm mt-1">{statusDialogReservation?.name}</p>
          </div>
          <div className="p-6 space-y-5 bg-white">
            <div>
              <FieldLabel>New Status</FieldLabel>
              <Select value={statusUpdate} onValueChange={(v: ReservationStatus) => setStatusUpdate(v)}>
                <SelectTrigger className="h-10 bg-gray-50 border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="noshow">No-Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {statusUpdate === "confirmed" && !statusDialogReservation?.is_walkin && (
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">A confirmation email will be sent to the guest.</p>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 text-gray-700 border-gray-200" onClick={() => setOpenStatusDialog(false)}>Cancel</Button>
              <Button onClick={handleStatusUpdate} className="flex-1 bg-[#162A3A] hover:bg-[#1e3a50] text-white rounded-xl">Confirm</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CREATE RESERVATION DIALOG */}
      <Dialog open={isAddingReservation} onOpenChange={(o) => { setIsAddingReservation(o); if (!o) { setFormData(initialFormData); setPaymentFile(null) } }}>
        <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border-0 shadow-2xl p-0">

          {/* Header */}
          <div className="sticky top-0 z-10 bg-[#162A3A] px-6 py-5 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-white">New Reservation</DialogTitle>
                <p className="text-white/50 text-sm mt-0.5">Fill in the details to create a reservation</p>
              </div>
              {/* Walk-in toggle */}
              <label className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 transition cursor-pointer px-4 py-2 rounded-xl select-none">
                <Footprints className="w-4 h-4 text-white/70" />
                <span className="text-white text-sm font-medium">Walk-In</span>
                <Switch checked={formData.is_walkin}
                  onCheckedChange={(c) => setFormData({
                    ...formData, is_walkin: c,
                    reservation_status: c ? "confirmed" : "pending",
                    payment_status: c ? formData.payment_status : "pending",
                  })} />
              </label>
            </div>
          </div>

          <div className="p-5 space-y-4 bg-[#f5f0e8]">

            {/* Walk-in notice */}
            {formData.is_walkin && (
              <div className="flex items-center gap-3 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
                <Footprints className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">Walk-In Guest Mode</p>
                  <p className="text-xs text-blue-600">Status will be set to <strong>Confirmed</strong> automatically. Date/time and payment details are simplified.</p>
                </div>
              </div>
            )}

            {/* Online reservation notice */}
            {!formData.is_walkin && (
              <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-700"><strong>Online Reservation:</strong> Date, time, and a payment screenshot are required. Payment status defaults to Pending until the screenshot is verified.</p>
              </div>
            )}

            {/* Guest information */}
            <FormSection title="Guest Information" icon={<Users className="w-4 h-4" />}>
              <div>
                <FieldLabel required>Full Name</FieldLabel>
                <Input placeholder="e.g. Juan dela Cruz" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-9 bg-white border-gray-200" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><FieldLabel>Email</FieldLabel><Input type="email" placeholder="guest@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-9 bg-white border-gray-200" /></div>
                <div><FieldLabel>Phone</FieldLabel><Input placeholder="09XX XXX XXXX" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-9 bg-white border-gray-200" /></div>
              </div>
            </FormSection>

            {/* Schedule */}
            <ScheduleSection slots={createSlots} />

            {/* Preferences */}
            <FormSection title="Preferences">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Dining Preference</FieldLabel>
                  <Select
                    value={formData.dining_preference}
                    onValueChange={(v: DiningPreference) => {
                      const fee = getSeatingFee(v)
                      const pkg = getPackageByRoom(v)
                      setFormData({
                        ...formData,
                        dining_preference: v,
                        reservation_fee: fee,
                        ...(pkg ? { package: pkg.name, total_fee: pkg.price } : {}),
                      })
                    }}
                  >
                    <SelectTrigger className="h-9 bg-white border-gray-200"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Main Dining">Main Dining</SelectItem>
                      <SelectItem value="Lounge Seating">Lounge Seating</SelectItem>
                      <SelectItem value="High Table">High Table</SelectItem>
                      <SelectItem value="Bar Counter">Bar Counter</SelectItem>
                      <SelectItem value="The Loft">The Loft (VIP)</SelectItem>
                      <SelectItem value="Amber Room">Amber Room (VIP)</SelectItem>
                      <SelectItem value="Aurora Lounge">Aurora Lounge (VIP)</SelectItem>
                      <SelectItem value="Velvet Room">Velvet Room (VIP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Occasion</FieldLabel>
                  <Select value={formData.occasion} onValueChange={(v: OccasionType) => setFormData({ ...formData, occasion: v })}>
                    <SelectTrigger className="h-9 bg-white border-gray-200"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Celebration", "Romantic", "Night Life", "Professional", "Casual", "Other"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <FieldLabel>Package</FieldLabel>
                <Select
                  value={formData.package}
                  onValueChange={(v) => {
                    const pkg = PACKAGES.find((p) => p.name === v)
                    setFormData({ ...formData, package: v, ...(pkg ? { total_fee: pkg.price } : {}) })
                  }}
                >
                  <SelectTrigger className="h-9 bg-white border-gray-200"><SelectValue placeholder="Select a package" /></SelectTrigger>
                  <SelectContent>
                    {PACKAGES.map((p) => (
                      <SelectItem key={p.id} value={p.name}>
                        {p.name} — {p.room} (₱{p.price.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel>Special Requests</FieldLabel>
                <Textarea placeholder="Any notes, dietary restrictions, special arrangements…" rows={3} value={formData.special_requests} onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })} className="bg-white border-gray-200 resize-none" />
              </div>
            </FormSection>

            {/* Payment */}
            <PaymentSection />

            {/* Reservation status */}
            <FormSection title="Reservation Status">
              {formData.is_walkin ? (
                <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Auto-Confirmed</p>
                    <p className="text-xs text-emerald-600">Walk-in reservations are automatically set to Confirmed.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(["pending", "confirmed", "cancelled", "completed", "noshow"] as const).map((s) => (
                    <button key={s} type="button" onClick={() => setFormData({ ...formData, reservation_status: s })}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all capitalize
                        ${formData.reservation_status === s
                          ? s === "confirmed" ? "bg-emerald-600 text-white border-emerald-600"
                            : s === "pending" ? "bg-amber-500 text-white border-amber-500"
                              : s === "cancelled" ? "bg-red-500 text-white border-red-500"
                                : s === "completed" ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-gray-600 text-white border-gray-600"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                      {s === "noshow" ? "No-Show" : s}
                    </button>
                  ))}
                </div>
              )}
            </FormSection>

            {/* Submit */}
            <div className="flex gap-3 pb-2">
              <Button variant="outline" className="flex-1 h-10 text-gray-600 border-gray-300 bg-white" onClick={() => setIsAddingReservation(false)}>Cancel</Button>
              <Button onClick={handleCreateReservation}
                className="flex-1 h-10 rounded-xl bg-[#162A3A] hover:bg-[#1e3a50] text-white font-semibold shadow-md"
                disabled={!formData.is_walkin && !!formData.date && createSlots.availableSlots.length === 0}>
                {formData.is_walkin ? "Add Walk-In Guest" : "Create Reservation"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}