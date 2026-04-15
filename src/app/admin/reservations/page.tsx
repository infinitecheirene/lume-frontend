"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, Plus, Loader2, MoreHorizontal, CircleX } from "lucide-react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import Image from "next/image"
import { Playfair_Display } from "next/font/google"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

function getDayHours(dayOfWeek: number): { opening: number, closing: number, isClosed: boolean } {
  // dayOfWeek: 0=Sun, 1=Mon, ..., 6=Sat
  switch (dayOfWeek) {
    case 0: return { opening: 0, closing: 0, isClosed: true }; // Sunday closed
    case 1: return { opening: 10, closing: 22, isClosed: false }; // Monday 10 AM – 10:30 PM
    case 2: return { opening: 10, closing: 22, isClosed: false }; // Tuesday 10 AM – 10:30 PM
    case 3: return { opening: 10, closing: 22, isClosed: false }; // Wednesday 10 AM – 10:30 PM
    case 4: return { opening: 10, closing: 22, isClosed: false }; // Thursday 10 AM – 10:30 PM
    case 5: return { opening: 10, closing: 26, isClosed: false }; // Friday 10 AM – 2 AM
    case 6: return { opening: 11, closing: 26, isClosed: false }; // Saturday 11 AM – 2 AM
    default: return { opening: 10, closing: 22, isClosed: false };
  }
}

const SLOT_DURATION_MINUTES = 90 // each reservation occupies 90 min
const BUFFER_MINUTES = 15        // cleanup/turnaround buffer after each booking
const SLOT_STEP_MINUTES = 30     // interval between selectable slots
const MIN_HOUR = 10               // earliest opening
const MAX_HOUR = 26               // latest closing (2 AM next day)

interface Reservation {
  id: number
  name: string
  email: string
  phone: string
  date: string
  time: string
  end_time?: string          // NEW: stored end time (HH:MM)
  duration_minutes?: number  // NEW: actual duration stored on record
  guests: number
  special_requests?: string
  reservation_status: "pending" | "confirmed" | "cancelled" | "completed" | "noshow"
  created_at: string
  reservation_fee_paid?: number
  dining_preference: string
  occasion?: string
  package?: string
  reservation_fee?: number
  payment_status?: "pending" | "paid" | "failed"
  payment_method?: string
  payment_reference?: string
  payment_receipt?: string
  is_walkin?: boolean
}

/** Convert "HH:MM" to total minutes since midnight */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

/** Convert total minutes to "HH:MM" */
function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

/** Format hour for display */
function formatHour(hour: number): string {
  if (hour <= 12) return hour === 0 ? "12 AM" : hour === 12 ? "12 PM" : `${hour} AM`
  if (hour <= 24) return `${hour - 12} PM`
  return `${hour - 24} AM`  // for 25=1 AM, 26=2 AM
}

/**
 * Build every possible slot for a day (openingHour → closingHour - SLOT_DURATION_MINUTES).
 * Returns array of "HH:MM" start times.
 */
function buildAllSlots(openingHour: number, closingHour: number): string[] {
  const slots: string[] = []
  const openMins = openingHour * 60
  const closeMins = closingHour * 60
  for (let t = openMins; t + SLOT_DURATION_MINUTES <= closeMins; t += SLOT_STEP_MINUTES) {
    slots.push(toHHMM(t))
  }
  return slots
}

/**
 * Given existing reservations for a date and an optional ID to exclude (for edits),
 * return the set of slot start-times that are blocked.
 *
 * A slot [slotStart, slotStart+SLOT_DURATION) is blocked if it overlaps with
 * any existing booking's window [bookingStart, bookingStart+SLOT_DURATION+BUFFER).
 */
function getBlockedSlots(dayReservations: Reservation[], excludeId?: number, openingHour: number, closingHour: number): Set<string> {
  const blocked = new Set<string>()
  const allSlots = buildAllSlots(openingHour, closingHour)

  const activeBookings = dayReservations.filter(
    (r) =>
      r.reservation_status !== "cancelled" &&
      r.reservation_status !== "noshow" &&
      r.id !== excludeId,
  )

  for (const slot of allSlots) {
    const slotStart = toMinutes(slot)
    const slotEnd = slotStart + SLOT_DURATION_MINUTES

    for (const booking of activeBookings) {
      const bStart = toMinutes(booking.time.substring(0, 5))
      const duration = booking.duration_minutes ?? SLOT_DURATION_MINUTES
      const bEnd = bStart + duration + BUFFER_MINUTES

      // Overlap check: slot starts before booking ends AND slot ends after booking starts
      if (slotStart < bEnd && slotEnd > bStart) {
        blocked.add(slot)
        break
      }
    }
  }

  return blocked
}

/**
 * Returns available slots for a date string "YYYY-MM-DD",
 * filtering from all existing reservations.
 */
function getAvailableSlots(
  dateStr: string,
  allReservations: Reservation[],
  excludeId?: number,
  openingHour: number,
  closingHour: number,
): string[] {
  const dayRes = allReservations.filter((r) => r.date.substring(0, 10) === dateStr)
  const blocked = getBlockedSlots(dayRes, excludeId, openingHour, closingHour)
  return buildAllSlots(openingHour, closingHour).filter((s) => !blocked.has(s))
}

/**
 * Returns true if a day is fully booked (no slots available, considering only
 * active reservations).
 */
function isDayFullyBooked(date: Date, allReservations: Reservation[], openingHour: number, closingHour: number): boolean {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const dateStr = `${year}-${month}-${day}`
  return getAvailableSlots(dateStr, allReservations, undefined, openingHour, closingHour).length === 0
}

function isSameMonth(dateStr: string, currentDate: Date) {
  const d = new Date(dateStr)
  return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth()
}

function getReservationColor(reservation: Reservation) {
  if (reservation.is_walkin) return "bg-blue-100 text-blue-800 hover:bg-blue-200"
  if (reservation.reservation_status === "confirmed") return "bg-green-100 text-green-800 hover:bg-green-200"
  if (reservation.reservation_status === "pending") return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
  if (reservation.reservation_status === "cancelled") return "bg-red-100 text-red-800 hover:bg-red-200"
  return "bg-green-100 text-green-800 hover:bg-green-200"
}

type DiningPreference = Reservation["dining_preference"]
type OccasionType = Reservation["occasion"]

export default function ReservationsAdmin() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [isAddingReservation, setIsAddingReservation] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [viewingReservation, setViewingReservation] = useState<Reservation | null>(null)
  const [openView, setOpenView] = useState(false)
  const [statusDialogReservation, setStatusDialogReservation] = useState<Reservation | null>(null)
  const [openStatusDialog, setOpenStatusDialog] = useState(false)
  const [statusUpdate, setStatusUpdate] = useState<Reservation["reservation_status"]>("pending")
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [paymentFile, setPaymentFile] = useState<File | null>(null)
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [openMonthDialog, setOpenMonthDialog] = useState(false)
  const { toast } = useToast()

  const initialFormData = {
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    guests: 1,
    package: "",
    dining_preference: "",
    occasion: "",
    reservation_fee: 0,
    reservation_fee_paid: 0,
    payment_method: "",
    payment_reference: "",
    payment_status: "pending",
    payment_receipt: null as string | null,
    special_requests: "",
    is_walkin: false,
    reservation_status: "pending",
  }
  const [formData, setFormData] = useState(initialFormData)

  // Derived availability for the "Create" dialog 
  // Recalculates whenever the selected date changes.
  const createAvailableSlots = formData.date
    ? (() => {
      const date = new Date(formData.date)
      const hours = getDayHours(date.getDay())
      return hours.isClosed ? [] : getAvailableSlots(formData.date, reservations, undefined, hours.opening, hours.closing)
    })()
    : []

  const createAllSlots = formData.date
    ? (() => {
      const date = new Date(formData.date)
      const hours = getDayHours(date.getDay())
      return hours.isClosed ? [] : buildAllSlots(hours.opening, hours.closing)
    })()
    : []
  const createBlockedSlots = formData.date
    ? (() => {
      const date = new Date(formData.date)
      const hours = getDayHours(date.getDay())
      return hours.isClosed ? new Set<string>() : getBlockedSlots(
        reservations.filter((r) => r.date.substring(0, 10) === formData.date),
        undefined,
        hours.opening,
        hours.closing
      )
    })()
    : new Set<string>()

  // Derived availability for the "Edit" dialog 
  const editAllSlots = formData.date && editingReservation
    ? (() => {
      const date = new Date(formData.date)
      const hours = getDayHours(date.getDay())
      return hours.isClosed ? [] : buildAllSlots(hours.opening, hours.closing)
    })()
    : []
  const editBlockedSlots =
    formData.date && editingReservation
      ? (() => {
        const date = new Date(formData.date)
        const hours = getDayHours(date.getDay())
        return hours.isClosed ? new Set<string>() : getBlockedSlots(
          reservations.filter((r) => r.date.substring(0, 10) === formData.date),
          editingReservation.id,
          hours.opening,
          hours.closing
        )
      })()
      : new Set<string>()

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth < 1024)
    checkDesktop()
    window.addEventListener("resize", checkDesktop)
    return () => window.removeEventListener("resize", checkDesktop)
  }, [])

  useEffect(() => {
    fetchReservations()
  }, [])

  function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("auth_token")
    const headers: Record<string, string> = {}
    if (token) headers["Authorization"] = `Bearer ${token}`
    return headers
  }

  async function fetchReservations() {
    try {
      setLoading(true)
      const response = await fetch("/api/reservations", { headers: getAuthHeaders() })
      if (!response.ok) throw new Error("Failed to fetch")

      const data = await response.json()
      let reservationList: Reservation[] = []

      if (data.success && data.data && Array.isArray(data.data)) {
        reservationList = data.data
      } else if (Array.isArray(data)) {
        reservationList = data
      } else if (data.data && Array.isArray(data.data)) {
        reservationList = data.data
      }

      // Normalize time to HH:MM
      reservationList = reservationList.map((res) => {
        if (res.time) {
          const [hours, minutes] = res.time.split(":")
          res.time = `${hours.padStart(2, "0")}:${(minutes || "00").padStart(2, "0")}`
        }
        // Back-fill end_time if missing (legacy records)
        if (!res.end_time && res.time) {
          const endMins = toMinutes(res.time.substring(0, 5)) + SLOT_DURATION_MINUTES
          res.end_time = toHHMM(endMins)
        }
        return res
      })

      setReservations(reservationList)
    } catch (error) {
      console.error("Error fetching reservations:", error)
      setReservations([])
    } finally {
      setLoading(false)
    }
  }

  function getDaysInMonth(date: Date) {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    const days: (Date | null)[] = []
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null)
    for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day))
    return days
  }

  function getReservationsForDate(date: Date | null) {
    if (!date) return []
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const dateStr = `${year}-${month}-${day}`
    return reservations.filter((res) => res.date.substring(0, 10) === dateStr)
  }

  function previousMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }
  function nextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }
  function goToToday() {
    setCurrentDate(new Date())
  }
  function formatMonthYear(date: Date) {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }
  function isToday(date: Date | null) {
    if (!date) return false
    return date.toDateString() === new Date().toDateString()
  }
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }
  function formatTime(timeString?: string) {
    if (!timeString) return "--:--"
    const [hours, minutes] = timeString.split(":")
    const hour = parseInt(hours, 10)
    const period = hour >= 12 ? "PM" : "AM"
    return `${hour % 12 === 0 ? 12 : hour % 12}:${minutes || "00"} ${period}`
  }

  // Week view functions
  function getWeekDates(date: Date): Date[] {
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Monday start
    startOfWeek.setDate(diff)
    const week = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      week.push(day)
    }
    return week
  }

  function previousWeek() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7))
  }

  function nextWeek() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7))
  }

  function formatWeekRange(date: Date) {
    const week = getWeekDates(date)
    const start = week[0]
    const end = week[6]
    const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    return `${startStr} - ${endStr}`
  }

  function getReservationsForDateTime(date: Date, time: string): Reservation[] {
    const dateStr = date.toISOString().split("T")[0]
    return reservations.filter((r) => r.date.substring(0, 10) === dateStr && r.time === time)
  }

  // Compute end_time from start time before submitting 
  function computeEndTime(startHHMM: string): string {
    const endMins = toMinutes(startHHMM) + SLOT_DURATION_MINUTES
    return toHHMM(endMins)
  }

  async function handleCreateReservation() {
    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!formData.is_walkin && formData.email && !isValidEmail(formData.email)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" })
      return
    }

    // Availability guard
    if (formData.date && formData.time) {
      const date = new Date(formData.date)
      const hours = getDayHours(date.getDay())
      if (hours.isClosed) {
        toast({ title: "Restaurant Closed", description: "The restaurant is closed on this day.", variant: "destructive" })
        return
      }
      const blocked = getBlockedSlots(
        reservations.filter((r) => r.date.substring(0, 10) === formData.date),
        undefined,
        hours.opening,
        hours.closing
      )
      if (blocked.has(formData.time)) {
        toast({ title: "Time Unavailable", description: "That time slot is already booked. Please choose another.", variant: "destructive" })
        return
      }
    }

    try {
      const form = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value === null || value === undefined) return
        if (value instanceof File) form.append(key, value)
        else if (typeof value === "boolean") form.append(key, value ? "1" : "0")
        else form.append(key, String(value))
      })

      // Append computed end_time and duration
      if (formData.time) {
        form.append("end_time", computeEndTime(formData.time))
        form.append("duration_minutes", String(SLOT_DURATION_MINUTES))
      }
      if (paymentFile) form.append("payment_receipt", paymentFile)

      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { ...getAuthHeaders() },
        body: form,
      })
      if (!response.ok) {
        const resData = await response.json().catch(() => ({}))
        throw new Error(resData.message || "Failed to create reservation")
      }

      if (!formData.is_walkin && formData.email) {
        await fetch("/api/send-email/reservation", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({
            email: formData.email, name: formData.name,
            date: formData.date, time: formData.time, guests: formData.guests,
          }),
        }).catch((e) => console.error("Email error:", e))
      }

      fetchReservations()
      setFormData(initialFormData)
      setIsAddingReservation(false)
      setPaymentFile(null)
      toast({ title: "Reservation Added", description: "The reservation list has been updated." })
    } catch (error) {
      console.error("Error creating reservation:", error)
      toast({ title: "Error", description: "Failed to create reservation. Please try again.", variant: "destructive" })
    }
  }

  async function handleUpdateReservation() {
    if (!editingReservation) return
    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!formData.is_walkin && formData.email && !isValidEmail(formData.email)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" })
      return
    }
    try {
      const payload = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "payment_receipt") {
          payload.append(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value))
        }
      })
      if (formData.time) {
        payload.append("end_time", computeEndTime(formData.time))
        payload.append("duration_minutes", String(SLOT_DURATION_MINUTES))
      }
      if (paymentFile) payload.append("payment_receipt", paymentFile)

      const response = await fetch(`/api/reservations/${editingReservation.id}`, {
        method: "PUT", headers: getAuthHeaders(), body: payload,
      })
      if (!response.ok) throw new Error("Failed to update reservation")

      if (
        !formData.is_walkin && formData.email &&
        formData.reservation_status === "confirmed" &&
        editingReservation?.reservation_status !== "confirmed"
      ) {
        await fetch("/api/send-email/reservation", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({
            email: formData.email, name: formData.name,
            date: formData.date, time: formData.time, guests: formData.guests,
            subject: `Reservation Confirmed - ${formData.name}`,
            message: `Hello ${formData.name},\n\nYour reservation for ${formData.guests} guest(s) on ${formData.date} at ${formData.time} has been confirmed.`,
          }),
        }).catch((e) => console.error("Email error:", e))
      }

      toast({ title: "Success", description: "Reservation updated successfully." })
      fetchReservations()
      setOpenEdit(false)
      setEditingReservation(null)
      setFormData(initialFormData)
      setPaymentFile(null)
    } catch (error) {
      console.error("Error updating reservation:", error)
      toast({ title: "Error", description: "Failed to update reservation.", variant: "destructive" })
    }
  }

  async function handleStatusUpdate() {
    if (!statusDialogReservation) return
    try {
      const payload = new FormData()
      payload.append("reservation_status", statusUpdate)
      const response = await fetch(`/api/reservations/${statusDialogReservation.id}`, {
        method: "PUT", headers: getAuthHeaders(), body: payload,
      })
      if (!response.ok) throw new Error("Failed to update reservation status")

      toast({ title: "Status Updated", description: `Reservation marked as ${statusUpdate}.` })

      if (!statusDialogReservation.is_walkin && statusUpdate === "confirmed" && statusDialogReservation.email) {
        await fetch("/api/send-email/reservation", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({
            email: statusDialogReservation.email, name: statusDialogReservation.name,
            date: statusDialogReservation.date, time: statusDialogReservation.time, guests: statusDialogReservation.guests,
            subject: `Reservation Confirmed - ${statusDialogReservation.name}`,
            message: `Your reservation for ${statusDialogReservation.guests} guest(s) on ${formatDate(statusDialogReservation.date)} at ${formatTime(statusDialogReservation.time)} has been confirmed.`,
          }),
        }).catch((e) => console.error("Email error:", e))
      }

      fetchReservations()
      setOpenStatusDialog(false)
      setStatusDialogReservation(null)
    } catch (error) {
      console.error("Error updating reservation status:", error)
      toast({ title: "Error", description: "Failed to update reservation status.", variant: "destructive" })
    }
  }

  async function handleDelete(id: number) {
    try {
      const response = await fetch(`/api/reservations/${id}`, { method: "DELETE", headers: getAuthHeaders() })
      if (!response.ok) throw new Error("Failed to delete")
      toast({ title: "Deleted", description: "Reservation has been deleted successfully." })
      setSelectedReservation(null)
      setDeleteOpen(false)
      setDeleteId(null)
      fetchReservations()
    } catch (error) {
      console.error("Error deleting reservation:", error)
      toast({ title: "Error", description: "Failed to delete reservation.", variant: "destructive" })
    }
  }

  // Render
  const days = getDaysInMonth(currentDate)
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  if (loading) {
    return (
      <SidebarProvider defaultOpen={!isDesktop}>
        <div className="flex min-h-screen w-full bg-amber-50">
          <AppSidebar />
          <div className={`flex-1 min-w-0 ${isDesktop ? "ml-0" : "ml-72"}`}>
            <div className="flex items-center justify-center min-h-screen w-full">
              <div className="flex flex-col items-center gap-4 bg-[#162A3A] backdrop-blur-xl px-8 py-8 rounded-2xl border border-[#d4a24c]/70 shadow-2xl">
                <div className="relative">
                  <Loader2 className="h-8 w-8 animate-spin text-[#d4a24c]" />
                  <div className="absolute inset-0 rounded-full border border-[#d4a24c]/20 blur-sm" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-white">Loading Reservations</p>
                  <p className="text-sm text-white/60">Please wait while we fetch the data...</p>
                </div>
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-[#d4a24c] rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 bg-[#d4a24c] rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-[#d4a24c] rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    )
  }

  /* ── derived stats ── */
  const monthRes = reservations.filter((r) => isSameMonth(r.date, currentDate))
  const confirmedCount = monthRes.filter((r) => r.reservation_status === "confirmed").length
  const pendingCount = monthRes.filter((r) => r.reservation_status === "pending").length
  const guestCount = monthRes.filter((r) => !["cancelled", "noshow"].includes(r.reservation_status)).reduce((s, r) => s + r.guests, 0)
  const walkInCount = monthRes.filter((r) => r.is_walkin && !["cancelled", "noshow"].includes(r.reservation_status)).reduce((s, r) => s + r.guests, 0)

  return (
    <SidebarProvider defaultOpen={!isDesktop}>
      <div className="flex min-h-screen w-full bg-amber-50">
        <AppSidebar />
        <div className={`flex-1 min-w-0 ${isDesktop ? "ml-0" : "ml-72"}`}>
          {isDesktop && (
            <div className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b bg-[#162A3A] px-4 shadow-sm">
              <SidebarTrigger className="-ml-1" />
              <Image src="/logo.jpg" alt="Lumè Bean and Bar Logo" width={40} height={40} className="object-contain rounded-full" />
              <h1 className={`${playfair.className} text-lg font-semibold text-white`}>Lumè Bean and Bar</h1>
            </div>
          )}

          <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Reservation Management</h1>
                <p className="text-gray-600 mt-1">Manage your restaurant&apos;s reservations and walk-in guests</p>
              </div>
            </div>

            {/* Stat row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Confirmed", value: confirmedCount, color: "text-green-700", bg: "bg-green-50", border: "border-green-100" },
                { label: "Pending", value: pendingCount, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-100" },
                { label: "Guests", value: guestCount, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-100" },
                { label: "Walk-ins", value: walkInCount, color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200" },
              ].map(({ label, value, color, bg, border }) => (
                <div key={label} className={`${bg} ${border} border rounded-2xl p-4`}>
                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                  <p className={`text-2xl font-semibold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Calendar & Reservations */}
            <div className="bg-white/70 backdrop-blur-sm shadow-xl p-0 pb-5 border-blue-100 border mt-6 rounded-xl">

              {/* Calendar Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border rounded-t-xl p-6 md:mb-8 bg-[#162A3A] text-white">
                <div className="flex items-center gap-2 sm:gap-4">
                  <h2 className="text-xl sm:text-2xl font-bold">{viewMode === 'week' ? formatWeekRange(currentDate) : formatMonthYear(currentDate)}</h2>
                  <div className="text-[#162A3A]">
                    <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
                  </div>
                  <Button variant="outline" size="icon" onClick={viewMode === 'week' ? previousWeek : previousMonth}><ChevronLeft className="w-4 h-4 text-[#162A3A]" /></Button>
                  <Button variant="outline" size="icon" onClick={viewMode === 'week' ? nextWeek : nextMonth}><ChevronRight className="w-4 h-4 text-[#162A3A]" /></Button>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button className="bg-blue-950 text-white hover:bg-blue-800/50" variant="outline" size="sm" onClick={() => setOpenMonthDialog(true)}>Month View</Button>
                  <Button
                    onClick={() => setIsAddingReservation(true)}
                    className="flex-1 sm:flex-none font-semibold bg-[#E5A834] text-[#162A3A] hover:bg-[#E5A834]/80"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">New Reservation</span>
                  </Button>
                </div>
              </div>

              {/* Week Time Grid */}
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">

                  {/* Header with days */}
                  <div className="grid grid-cols-8 gap-1 mb-1">
                    <div className="p-2 text-center font-semibold text-xs text-gray-600"></div>
                    {getWeekDates(currentDate).map((date, index) => (
                      <div key={index} className="p-2 text-center font-semibold text-xs text-gray-600">
                        <div>{date.toLocaleDateString("en-US", { weekday: "short" })}</div>
                        <div className={`text-sm ${isToday(date) ? "text-blue-600 font-bold" : ""}`}>{date.getDate()}</div>
                      </div>
                    ))}
                  </div>

                  {/* Time rows */}
                  {Array.from({ length: MAX_HOUR - MIN_HOUR + 1 }, (_, i) => MIN_HOUR + i).map((hour) => (
                    <div key={hour} className="grid grid-cols-8 gap-1 border-t border-gray-200">
                      <div className="flex items-center justify-center p-2 text-center font-semibold text-sm text-gray-600 border-r border-gray-200">
                        {formatHour(hour)}
                      </div>
                      {getWeekDates(currentDate).map((date, dayIndex) => {
                        const dayHours = getDayHours(date.getDay())
                        if (dayHours.isClosed) {
                          return (
                            <div key={dayIndex} className="border-r border-gray-200 bg-gray-100 flex items-center justify-center">
                              <span className="text-xs text-gray-500">Closed</span>
                            </div>
                          )
                        }
                        const timeSlots = buildAllSlots(dayHours.opening, dayHours.closing).filter(slot => {
                          const slotHour = parseInt(slot.split(":")[0])
                          return slotHour === hour
                        })
                        return (
                          <div key={dayIndex} className="min-h-[60px] p-1 border-r border-gray-200 bg-white">
                            {timeSlots.map((slot) => {
                              const slotReservations = getReservationsForDateTime(date, slot)
                              return (
                                <div key={slot} className="mb-1">
                                  {slotReservations.map((reservation) => (
                                    <div
                                      key={reservation.id}
                                      className={`p-1 rounded text-xs cursor-pointer ${getReservationColor(reservation)}`}
                                      onClick={() => { setViewingReservation(reservation); setOpenView(true) }}
                                    >
                                      <div className="font-semibold truncate">{reservation.name}</div>
                                    </div>
                                  ))}
                                  {slotReservations.length > 1 && (
                                    <div className="text-xs text-gray-500">
                                      +{slotReservations.length - 2} more
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* View Reservation Dialog  */}
              <Dialog open={openView} onOpenChange={(isOpen) => { if (!isOpen) setViewingReservation(null); setOpenView(isOpen) }}>
                <DialogContent className="lg:max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl shadow-lg border border-gray-200 p-0 bg-white">
                  {viewingReservation && (
                    <div className="px-6 py-8 space-y-8">
                      <DialogHeader className="pb-4 border-b px-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <DialogTitle className="text-2xl font-bold text-gray-900">Reservation Details</DialogTitle>
                          <div className="flex flex-wrap items-center gap-2">

                            {/* Status badge */}
                            <span className={`px-3 py-1 rounded-lg text-sm font-semibold 
                              ${viewingReservation.reservation_status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : viewingReservation.reservation_status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : viewingReservation.reservation_status === "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                              {viewingReservation.reservation_status}
                            </span>

                            {viewingReservation.is_walkin && (
                              <span className="px-3 py-1 rounded-lg text-sm font-semibold bg-blue-100 text-blue-800">
                                Walk-in
                              </span>
                            )}

                            {/* ── EDIT BUTTON ── */}
                            <Button
                              size="sm"
                              className="bg-gray-900 text-white hover:bg-gray-800"
                              onClick={() => {
                                setFormData(JSON.parse(JSON.stringify(viewingReservation)))
                                setOpenEdit(true)
                              }}
                            >
                              Edit
                            </Button>

                            {/* ── STATUS UPDATE BUTTON ── */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-300 text-gray-800"
                              onClick={() => {
                                setStatusDialogReservation(viewingReservation)
                                setStatusUpdate(viewingReservation.reservation_status)
                                setOpenStatusDialog(true)
                              }}
                            >
                              Update Status
                            </Button>

                            {/* Close */}
                            <CircleX
                              className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-800"
                              onClick={() => setOpenView(false)}
                            />
                          </div>

                        </div>
                      </DialogHeader>

                      <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                          <section className="bg-gray-50 rounded-xl p-5 space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">Guest Information</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              <div><p className="text-sm text-gray-500">Name</p><p className="text-base font-medium text-gray-800">{viewingReservation.name}</p></div>
                              <div><p className="text-sm text-gray-500">Email</p><p className="text-base font-medium text-gray-800">{viewingReservation.email}</p></div>
                              <div><p className="text-sm text-gray-500">Phone</p><p className="text-base font-medium text-gray-800">{viewingReservation.phone}</p></div>
                              <div><p className="text-sm text-gray-500">Guests</p><p className="text-base font-medium text-gray-800">{viewingReservation.guests} people</p></div>
                            </div>
                          </section>

                          <section className="bg-gray-50 rounded-xl p-5 space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">Schedule Details</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              <div><p className="text-sm text-gray-500">Date</p><p className="text-base font-medium text-gray-800">{formatDate(viewingReservation.date)}</p></div>
                              <div>
                                <p className="text-sm text-gray-500">Time</p>
                                <p className="text-base font-medium text-gray-800">
                                  {formatTime(viewingReservation.time)}
                                  {viewingReservation.end_time && ` – ${formatTime(viewingReservation.end_time)}`}
                                </p>
                              </div>
                            </div>
                          </section>

                          {(viewingReservation.dining_preference || viewingReservation.occasion || viewingReservation.package) && (
                            <section className="bg-gray-50 rounded-xl p-5 space-y-4">
                              <h3 className="text-lg font-bold text-gray-900">Preferences</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {viewingReservation.dining_preference && <div><p className="text-sm text-gray-500">Dining Preference</p><p className="text-base font-medium text-gray-800">{viewingReservation.dining_preference}</p></div>}
                                {viewingReservation.occasion && <div><p className="text-sm text-gray-500">Occasion</p><p className="text-base font-medium text-gray-800">{viewingReservation.occasion}</p></div>}
                                {viewingReservation.package && <div><p className="text-sm text-gray-500">Package</p><p className="text-base font-medium text-gray-800">{viewingReservation.package}</p></div>}
                              </div>
                            </section>
                          )}

                          <section className="bg-gray-50 rounded-xl p-5 space-y-2">
                            <h3 className="text-lg font-bold text-gray-900">Special Requests</h3>
                            <p className="text-gray-700">{viewingReservation.special_requests || "None"}</p>
                          </section>
                        </div>

                        <div className="space-y-6">
                          <section className="bg-gray-50 rounded-xl p-5 space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">Payment Details</h3>
                            <div className="space-y-4">
                              {viewingReservation.reservation_fee != null && <div><p className="text-sm text-gray-500">Reservation Fee</p><p className="text-base font-medium text-gray-800">₱{viewingReservation.reservation_fee}</p></div>}
                              {viewingReservation.reservation_fee_paid != null && <div><p className="text-sm text-gray-500">Amount Paid</p><p className="text-base font-medium text-gray-800">{viewingReservation.reservation_fee_paid === 0 ? "Unpaid" : `₱${viewingReservation.reservation_fee_paid}`}</p></div>}
                              {viewingReservation.payment_method && <div><p className="text-sm text-gray-500">Payment Method</p><p className="text-base font-medium text-gray-800">{viewingReservation.payment_method}</p></div>}
                              {viewingReservation.payment_reference && <div><p className="text-sm text-gray-500">Reference</p><p className="text-base font-medium text-gray-800">{viewingReservation.payment_reference}</p></div>}
                            </div>
                            {viewingReservation.payment_receipt && (
                              <div className="space-y-3">
                                <p className="text-sm text-gray-500">Receipt</p>
                                <button onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/${viewingReservation.payment_receipt}`, "_blank", "noopener,noreferrer")} className="w-full px-4 py-2 rounded-lg bg-yellow-600 text-white font-semibold hover:bg-yellow-700">View Full</button>
                                <Image src={`${process.env.NEXT_PUBLIC_API_URL}/${viewingReservation.payment_receipt}`} alt="Receipt" width={300} height={300} className="rounded-lg border w-full object-cover" />
                              </div>
                            )}
                          </section>
                        </div>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Edit Reservation Dialog */}
              <Dialog
                open={openEdit}
                onOpenChange={(isOpen) => {
                  setOpenEdit(isOpen)

                  if (!isOpen) {
                    setPaymentFile(null)
                    setFormData({ ...initialFormData })
                  }
                }}
              >
                <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-amber-50 border border-[#162A3A]/20 text-white">
                  <DialogHeader className="pb-3 border-b border-[#d4a24c]/20">
                    <DialogTitle className="text-2xl font-bold text-[#162A3A]">Edit Reservation</DialogTitle>
                    <p className="text-sm text-blue-950">Update reservation details</p>
                  </DialogHeader>

                  <div className="space-y-5 pt-4">
                    <div className="space-y-3">
                      <h4 className="text-xl font-bold text-gray-800">Guest Information</h4>
                      <span className="text-md font-semibold text-gray-800">Guest Name*</span>
                      <Input placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-gray-100 border-gray-600 text-gray-800" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-md font-semibold text-gray-800">Email Address</span>
                          <Input type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-gray-100 border-gray-600 text-gray-800" />
                        </div>
                        <div>
                          <span className="text-md font-semibold text-gray-800">Phone Number</span>
                          <Input placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bg-gray-100 border-gray-600 text-gray-800" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xl font-bold text-gray-800">Reservation Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-md font-semibold text-gray-800">Date*</span>
                          <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value, time: "" })} className="bg-gray-100 border-gray-600 text-gray-800" />
                        </div>
                        {/* Admin time override: show all slots, flag blocked ones */}
                        <div>
                          <span className="text-md font-semibold text-gray-800">Time* (admin override)</span>
                          <Select
                            value={formData.time}
                            onValueChange={(value) => setFormData({ ...formData, time: value })}
                          >
                            <SelectTrigger className="bg-gray-100 border-gray-600 text-gray-800">
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-100 text-gray-800">
                              {editAllSlots.map((slot) => {
                                const isBlocked = editBlockedSlots.has(slot)
                                return (
                                  <SelectItem key={slot} value={slot} disabled={false}>
                                    {formatTime(slot)}{isBlocked ? " ⚠ conflict" : ""}
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                          {formData.time && editBlockedSlots.has(formData.time) && (
                            <p className="text-xs text-amber-700 mt-1">Warning: this slot conflicts with another booking.</p>
                          )}
                        </div>
                        <div>
                          <span className="text-md font-semibold text-gray-800">Number of Guests*</span>
                          <Input type="number" min={1} max={20} value={formData.guests} onChange={(e) => setFormData({ ...formData, guests: Number(e.target.value) })} className="bg-gray-100 border-gray-600 text-gray-800" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div>
                          <span className="text-md font-semibold text-gray-800">Dining Preference*</span>
                          <Select value={formData.dining_preference} onValueChange={(value: DiningPreference) => setFormData({ ...formData, dining_preference: value })}>
                            <SelectTrigger className="bg-gray-100 border-gray-600 text-gray-800"><SelectValue placeholder="Dining Preference" /></SelectTrigger>
                            <SelectContent className="bg-gray-100 text-gray-800">
                              <SelectItem value="Regular" disabled>--Regular--</SelectItem>
                              <SelectItem value="Main Dining">Main Dining</SelectItem>
                              <SelectItem value="Lounge Seating">Lounge Seating</SelectItem>
                              <SelectItem value="High Table">High Table</SelectItem>
                              <SelectItem value="Bar Counter">Bar Counter</SelectItem>
                              <SelectItem value="Regular" disabled>--VIP--</SelectItem>
                              <SelectItem value="The Loft">The Loft</SelectItem>
                              <SelectItem value="Amber Room">Amber Room</SelectItem>
                              <SelectItem value="Aurora Lounge">Aurora Lounge</SelectItem>
                              <SelectItem value="Velvet Room">Velvet Room</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <span className="text-md font-semibold text-gray-800">Occasion Type*</span>
                          <Select value={formData.occasion} onValueChange={(value: OccasionType) => setFormData({ ...formData, occasion: value })}>
                            <SelectTrigger className="bg-gray-100 border-gray-600 text-gray-800"><SelectValue placeholder="Occasion Type" /></SelectTrigger>
                            <SelectContent className="bg-gray-100 text-gray-800">
                              <SelectItem value="Celebration">Celebration</SelectItem>
                              <SelectItem value="Romantic">Romantic</SelectItem>
                              <SelectItem value="Night Life">Night Life</SelectItem>
                              <SelectItem value="Professional">Professional</SelectItem>
                              <SelectItem value="Casual">Casual</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="mt-3">
                        <span className="text-md font-semibold text-gray-800">Payment Reference</span>
                        <Input placeholder="Payment Reference" value={formData.payment_reference} onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })} className="bg-gray-100 border-gray-600 text-gray-800" />
                      </div>

                      <div className="mt-3">
                        <span className="text-md font-semibold text-gray-800">Payment Screenshot</span>
                        {formData.payment_receipt && !paymentFile && (
                          <div className="mt-2">
                            <Image src={`${process.env.NEXT_PUBLIC_API_URL}/${formData.payment_receipt}`} alt="Payment Receipt" width={400} height={400} className="rounded-lg border" />
                          </div>
                        )}
                        <input type="file" accept="image/*" onChange={(e) => setPaymentFile(e.target.files?.[0] || null)} className="bg-gray-100 border-gray-600 text-gray-800 p-1 rounded mt-2 block" />
                        {paymentFile && <p className="mt-1 text-sm text-gray-600">Selected: {paymentFile.name}</p>}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div>
                          <span className="text-md font-semibold text-gray-800">Reservation Fee</span>
                          <Input type="number" value={formData.reservation_fee} onChange={(e) => setFormData({ ...formData, reservation_fee: Number(e.target.value) })} className="bg-gray-100 border-gray-600 text-gray-800" />
                        </div>
                        <div>
                          <span className="text-md font-semibold text-gray-800">Fee Paid</span>
                          <Input type="number" step="0.01" value={formData.reservation_fee_paid} onChange={(e) => setFormData({ ...formData, reservation_fee_paid: parseFloat(e.target.value) })} className="bg-gray-100 border-gray-600 text-gray-800" />
                        </div>
                        <div className="mt-3">
                          <span className="text-md font-semibold text-gray-800">Payment Method</span>
                          <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                            <SelectTrigger className="bg-gray-100 border-gray-600 text-gray-800"><SelectValue placeholder="Select Payment Method" /></SelectTrigger>
                            <SelectContent className="bg-gray-100 text-gray-800">
                              <SelectItem value="GCash">GCash</SelectItem>
                              <SelectItem value="Security Bank">Security Bank</SelectItem>
                              <SelectItem value="BPI">BPI</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <span className="text-md font-semibold text-gray-800">Payment Status</span>
                          <Select value={formData.payment_status} onValueChange={(value) => setFormData({ ...formData, payment_status: value })}>
                            <SelectTrigger className="bg-gray-100 border-gray-600 text-gray-800"><SelectValue placeholder="Payment Status" /></SelectTrigger>
                            <SelectContent className="bg-gray-100 text-gray-800">
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2 mt-3">
                        <h4 className="text-xl font-bold text-gray-800">Special Requests</h4>
                        <Textarea placeholder="Optional notes or requests" rows={3} value={formData.special_requests} onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })} className="bg-gray-100 border-gray-600 text-gray-800" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div>
                          <span className="text-md font-semibold text-gray-800">Walk-In</span>{" "}
                          <Switch checked={formData.is_walkin} onCheckedChange={(checked) => setFormData({ ...formData, is_walkin: checked })} />
                        </div>
                        <div>
                          <span className="text-md font-semibold text-gray-800">Reservation Status</span>
                          <Select value={formData.reservation_status} onValueChange={(value) => setFormData({ ...formData, reservation_status: value })}>
                            <SelectTrigger className="bg-gray-100 border-gray-600 text-gray-800"><SelectValue placeholder="Reservation Status" /></SelectTrigger>
                            <SelectContent className="bg-gray-100 text-gray-800">
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="noshow">No-Show</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button onClick={handleUpdateReservation} className="w-full rounded-md bg-[#d4a24c] text-gray-800 hover:bg-[#d4a24c]/70">Update Reservation</Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Status Update Dialog */}
              <Dialog
                open={openStatusDialog}
                onOpenChange={(isOpen) => {
                  setOpenStatusDialog(isOpen)

                  if (!isOpen) {
                    setStatusDialogReservation(null)
                    setStatusUpdate("pending")
                  }
                }}
              >
                <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-amber-50 border border-[#162A3A]/20 text-white">
                  <DialogHeader className="pb-3 border-b border-[#d4a24c]/20">
                    <DialogTitle className="text-2xl font-bold text-[#162A3A]">Update Reservation Status</DialogTitle>
                    <p className="text-sm text-blue-950">Change the reservation status and notify the guest if confirmed.</p>
                  </DialogHeader>
                  <div className="space-y-5 pt-4">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">Guest:
                        <span className="text-gray-700 underline"> {statusDialogReservation?.name || "-"}</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-lg font-semibold text-gray-900">Update Status</span>
                      <Select value={statusUpdate} onValueChange={(value: Reservation["reservation_status"]) => setStatusUpdate(value)}>
                        <SelectTrigger className="bg-gray-100 border-gray-600 text-gray-800"><SelectValue placeholder={statusDialogReservation?.reservation_status || "Select Status" } /></SelectTrigger>
                        <SelectContent className="bg-gray-100 text-gray-800">
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="noshow">No-Show</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-sm text-gray-600">When you confirm this reservation, the customer will be emailed a confirmation notice.</p>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" className="flex-1 text-gray-800" onClick={() => setOpenStatusDialog(false)}>Cancel</Button>
                      <Button onClick={handleStatusUpdate} className="flex-1 rounded-md bg-[#d4a24c] text-gray-800 hover:bg-[#d4a24c]/70">Save Status</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Create New Reservation Dialog */}
              <Dialog open={isAddingReservation} onOpenChange={(isOpen) => {
                setIsAddingReservation(isOpen)
                if (!isOpen) { setViewingReservation(null); setPaymentFile(null); setFormData({ ...initialFormData }) }
              }}>
                <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-amber-50 border border-[#162A3A]/20 text-white">
                  <DialogHeader className="pb-3 border-b border-[#d4a24c]/20">
                    <DialogTitle className="text-2xl font-bold text-[#162A3A]">Create New Reservation</DialogTitle>
                    <p className="text-sm text-blue-950">Add a reservation manually for a guest</p>
                  </DialogHeader>

                  <div className="space-y-5 pt-4">
                    {/* Walk-In toggle */}
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="walkin" checked={formData.is_walkin} onChange={(e) => setFormData({ ...formData, is_walkin: e.target.checked })} className="h-4 w-4 text-[#d4a24c] border-gray-300 rounded" />
                      <label htmlFor="walkin" className="text-gray-800 font-semibold">Walk-In Guest</label>
                    </div>

                    {/* Guest Information */}
                    <div className="space-y-3">
                      <h4 className="text-xl font-bold text-gray-800">Guest Information</h4>
                      <span className="text-md font-semibold text-gray-800">Guest Name*</span>
                      <Input placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-gray-100 border-gray-600 text-gray-800" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-md font-semibold text-gray-800">Email Address*</span>
                          <Input type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-gray-100 border-gray-600 text-gray-800" />
                        </div>
                        <div>
                          <span className="text-md font-semibold text-gray-800">Phone Number*</span>
                          <Input placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bg-gray-100 border-gray-600 text-gray-800" />
                        </div>
                      </div>
                    </div>

                    {/* Reservation Details */}
                    <div className="space-y-3">
                      <h4 className="text-xl font-bold text-gray-800">Reservation Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <span className="text-md font-semibold text-gray-800">Date*</span>
                          <Input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value, time: "" })}
                            className="bg-gray-100 border-gray-600 text-gray-800"
                          />
                        </div>

                        {/* ── Time slot selector with availability ── */}
                        <div className="sm:col-span-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-md font-semibold text-gray-800">Time*</span>
                            {formData.date && (() => {
                              const date = new Date(formData.date)
                              const hours = getDayHours(date.getDay())
                              return hours.isClosed ? (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">Closed</span>
                              ) : createAvailableSlots.length === 0 ? (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-700">Fully Booked</span>
                              ) : (
                                <span className="text-xs text-gray-500">{createAvailableSlots.length} of {createAllSlots.length} slots available</span>
                              )
                            })()}
                          </div>

                          {!formData.date ? (
                            <p className="text-sm text-gray-500 italic">Select a date first to see available times.</p>
                          ) : (
                            <Select
                              value={formData.time}
                              onValueChange={(value) => setFormData({ ...formData, time: value })}
                              disabled={createAvailableSlots.length === 0}
                            >
                              <SelectTrigger className="bg-gray-100 border-gray-600 text-gray-800">
                                <SelectValue placeholder={createAvailableSlots.length === 0 ? "No slots available" : "Select time"} />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-100 text-gray-800">
                                {createAllSlots.map((slot) => {
                                  const isBlocked = createBlockedSlots.has(slot)
                                  return (
                                    <SelectItem key={slot} value={slot} disabled={isBlocked}>
                                      <span className={isBlocked ? "text-gray-400 line-through" : ""}>
                                        {formatTime(slot)}
                                      </span>
                                      {isBlocked && <span className="ml-2 text-xs text-red-400">Booked</span>}
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                          )}

                          {/* Show end time preview */}
                          {formData.time && (
                            <p className="text-xs text-gray-500 mt-1">
                              Duration: {SLOT_DURATION_MINUTES} min &nbsp;·&nbsp;
                              Ends at {formatTime(computeEndTime(formData.time))}
                            </p>
                          )}
                        </div>

                        <div>
                          <span className="text-md font-semibold text-gray-800">Number of Guests*</span>
                          <Input type="number" min={1} max={20} placeholder="Number of Guests" value={formData.guests} onChange={(e) => setFormData({ ...formData, guests: Number(e.target.value) })} className="bg-gray-100 border-gray-600 text-gray-800" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <span className="text-md font-semibold text-gray-800">Dining Preference*</span>
                          <Select value={formData.dining_preference} onValueChange={(value: DiningPreference) => setFormData({ ...formData, dining_preference: value })}>
                            <SelectTrigger className="bg-gray-100 border-gray-600 text-gray-800"><SelectValue placeholder="Dining Preference" /></SelectTrigger>
                            <SelectContent className="bg-gray-100 text-gray-800">
                              <SelectItem value="Main Dining">Main Dining</SelectItem>
                              <SelectItem value="Private Tatami Room">Private Tatami Room</SelectItem>
                              <SelectItem value="Chef's Counter">Chef&apos;s Counter</SelectItem>
                              <SelectItem value="Window Seat">Window Seat</SelectItem>
                              <SelectItem value="Celebration Area">Celebration Area</SelectItem>
                              <SelectItem value="Family Seating">Family Seating</SelectItem>
                              <SelectItem value="Group Dining">Group Dining</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <span className="text-md font-semibold text-gray-800">Occasion Type*</span>
                          <Select value={formData.occasion} onValueChange={(value: OccasionType) => setFormData({ ...formData, occasion: value })}>
                            <SelectTrigger className="bg-gray-100 border-gray-600 text-gray-800"><SelectValue placeholder="Occasion Type" /></SelectTrigger>
                            <SelectContent className="bg-gray-100 text-gray-800">
                              <SelectItem value="Casual Dinner">Casual Dinner</SelectItem>
                              <SelectItem value="Birthday">Birthday</SelectItem>
                              <SelectItem value="Business Meeting">Business Meeting</SelectItem>
                              <SelectItem value="Anniversary">Anniversary</SelectItem>
                              <SelectItem value="Private Event">Private Event</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Special Requests */}
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold text-gray-800">Special Requests</h4>
                      <Textarea placeholder="Optional notes or special requests" rows={3} value={formData.special_requests} onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })} className="bg-gray-100 border-gray-600 text-gray-800" />
                    </div>

                    {/* Payment */}
                    <div className="space-y-3">
                      <h4 className="text-xl font-bold text-gray-800">Payment</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <span className="text-md font-semibold text-gray-800">Reservation Fee</span>
                          <Input type="number" min={0} step={0.01} value={formData.reservation_fee} onChange={(e) => setFormData({ ...formData, reservation_fee: parseFloat(e.target.value) })} className="bg-gray-100 border-gray-600 text-gray-800" />
                        </div>
                        <div>
                          <span className="text-md font-semibold text-gray-800">Fee Paid</span>
                          <Input type="number" min={0} step={0.01} value={formData.reservation_fee_paid} onChange={(e) => setFormData({ ...formData, reservation_fee_paid: parseFloat(e.target.value) })} className="bg-gray-100 border-gray-600 text-gray-800" />
                        </div>
                        <div>
                          <span className="text-md font-semibold text-gray-800">Payment Method</span>
                          <Input placeholder="GCash, Security Bank, etc." value={formData.payment_method} onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })} className="bg-gray-100 border-gray-600 text-gray-800" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-md font-semibold text-gray-800">Payment Reference</span>
                          <Input placeholder="Transaction ID or reference number" value={formData.payment_reference} onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })} className="bg-gray-100 border-gray-600 text-gray-800" />
                        </div>
                        <div>
                          <span className="text-md font-semibold text-gray-800">Payment Status</span>
                          <Select value={formData.payment_status} onValueChange={(value: "pending" | "paid" | "failed") => setFormData({ ...formData, payment_status: value })}>
                            <SelectTrigger className="bg-gray-100 border-gray-600 text-gray-800"><SelectValue placeholder="Payment Status" /></SelectTrigger>
                            <SelectContent className="bg-gray-100 text-gray-800">
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="text-md font-semibold text-gray-800">Payment Screenshot</span>
                        <input type="file" accept="image/*" onChange={(e) => setPaymentFile(e.target.files?.[0] || null)} className="bg-gray-100 border-gray-600 text-gray-800 p-1 rounded mt-2 block" />
                        {paymentFile && <p className="mt-1 text-sm text-gray-600">Selected: {paymentFile.name}</p>}
                      </div>
                    </div>

                    {/* Reservation Status */}
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold text-gray-800">Reservation Status</h4>
                      <Select value={formData.reservation_status} onValueChange={(value: "pending" | "confirmed" | "cancelled" | "completed" | "noshow") => setFormData({ ...formData, reservation_status: value })}>
                        <SelectTrigger className="bg-gray-100 border-gray-600 text-gray-800"><SelectValue placeholder="Reservation Status" /></SelectTrigger>
                        <SelectContent className="bg-gray-100 text-gray-800">
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="noshow">No-Show</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-2">
                      <Button
                        onClick={handleCreateReservation}
                        className="w-full rounded-md bg-[#d4a24c] text-gray-800 hover:bg-[#d4a24c]/70"
                        disabled={!!formData.date && createAvailableSlots.length === 0}
                      >
                        {formData.is_walkin ? "Add Walk-In Guest" : "Create Reservation"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Month View Dialog */}
              <Dialog open={openMonthDialog} onOpenChange={setOpenMonthDialog}>
                <DialogContent className="
                      w-[98vw]
                      sm:w-[95vw]
                      lg:w-[90vw]
                      xl:w-[85vw]
                      2xl:max-w-[1600px]
                      max-h-[92vh]
                      overflow-y-auto
                      rounded-2xl
                      bg-white
                      border border-gray-200
                      text-gray-900
                    ">
                  <DialogHeader className="pb-3 border-b border-gray-200">
                    <DialogTitle className="text-2xl font-bold text-gray-900">
                      {formatMonthYear(currentDate)}
                    </DialogTitle>
                    <p className="text-sm text-gray-600">
                      Monthly overview of reservations
                    </p>
                  </DialogHeader>

                  <div className="pt-4">
                    {/* Month Calendar Grid */}
                    {(() => {
                      const days = getDaysInMonth(currentDate)

                      return (
                        <div className="
                              grid grid-cols-2
                              sm:grid-cols-3
                              md:grid-cols-4
                              lg:grid-cols-7
                              gap-1
                              lg:gap-2
                            ">
                          {weekDays.map((day) => (
                            <div
                              key={day}
                              className="p-2 text-center font-semibold text-sm text-gray-600"
                            >
                              {day}
                            </div>
                          ))}

                          {days.map((date, index) => {
                            const dayReservations = getReservationsForDate(date)
                            const dayHours = date
                              ? getDayHours(date.getDay())
                              : { isClosed: true, opening: 0, closing: 0 }

                            const fullyBooked =
                              date && !dayHours.isClosed
                                ? isDayFullyBooked(date, reservations, dayHours.opening, dayHours.closing)
                                : false

                            return (
                              <Card
                                key={index}
                                className={`
                                  min-h-[70px]
                                  sm:min-h-[90px]
                                  lg:min-h-[110px]
                                  xl:min-h-[120px]

                                  ${!date ? "invisible" : ""}
                                  ${isToday(date) ? "ring-2 ring-blue-500" : ""}
                                  relative overflow-hidden
                                `}
                              >
                                <CardContent className="p-2 sm:p-3 flex flex-col h-full">
                                  {date && (
                                    <>
                                      <div
                                        className={`flex items-center justify-between mb-1 px-2 py-1 rounded-md
                                            ${dayHours.isClosed
                                            ? "bg-gray-100 text-gray-700"
                                            : fullyBooked
                                              ? "bg-red-100 text-red-800"
                                              : isToday(date)
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-transparent"
                                          }
                                        `}
                                      >
                                        <div className="text-sm font-semibold">
                                          {date.getDate()}
                                        </div>

                                        {dayHours.isClosed ? (
                                          <span className="text-xs font-semibold px-1 py-0.5 rounded bg-gray-200 text-gray-700">
                                            Closed
                                          </span>
                                        ) : fullyBooked ? (
                                          <span className="text-xs font-semibold px-1 py-0.5 rounded bg-red-200 text-red-800">
                                            Full
                                          </span>
                                        ) : isToday(date) ? (
                                          <span className="text-xs font-semibold px-1 py-0.5 rounded bg-blue-200 text-blue-800">
                                            Today
                                          </span>
                                        ) : null}
                                      </div>

                                      <div className="space-y-1 flex-1 overflow-hidden">
                                        {dayReservations.slice(0, 2).map((reservation) => (
                                          <div key={reservation.id} className="text-xs truncate">
                                            <button
                                              className={`px-1 py-0.5 rounded ${getReservationColor(reservation)}`}
                                              onClick={() => { setViewingReservation(reservation); setOpenView(true) }}
                                            >
                                              {reservation.time.substring(0, 5)} • {reservation.name}
                                            </button>
                                          </div>
                                        ))}

                                        {dayReservations.length > 2 && (
                                          <div className="text-xs text-gray-500">
                                            +{dayReservations.length - 2} more
                                          </div>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      )
                    })()}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}