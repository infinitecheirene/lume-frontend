"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, Plus, Loader2, MoreHorizontal } from "lucide-react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import Image from "next/image"
import { Playfair_Display } from "next/font/google"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

interface Reservation {
  id: number
  name: string
  email: string
  phone: string
  date: string
  time: string
  guests: number
  special_requests?: string
  reservation_status: "pending" | "confirmed" | "cancelled" | "completed" | "noshow" // updated
  created_at: string
  reservation_fee_paid?: number
  dining_preference: "Main Dining" | "Private Tatami Room" | "Chef's Counter" | "Window Seat" | "Celebration Area" | "Family Seating" | "Group Dining"
  occasion?: "Casual Dinner" | "Birthday" | "Business Meeting" | "Anniversary" | "Private Event" | "Other"
  reservation_fee?: number
  payment_status?: "pending" | "paid" | "failed" // updated
  payment_method?: string
  payment_reference?: string
  payment_receipt?: string
  is_walkin?: boolean
}

function isSameMonth(dateStr: string, currentDate: Date) {
  const d = new Date(dateStr)
  return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth()
}

function getReservationColor(reservation: Reservation) {
  if (reservation.is_walkin) {
    return "bg-blue-100 text-blue-800 hover:bg-blue-200"
  }
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
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [paymentFile, setPaymentFile] = useState<File | null>(null)

  const initialFormData = {
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    guests: 1,
    dining_preference: "",
    occasion: "",
    reservation_fee: 0,
    reservation_fee_paid: 0,
    payment_method: "",
    payment_reference: "",
    payment_status: "pending",
    payment_receipt: null,
    special_requests: "",
    is_walkin: false,
    reservation_status: "pending",
  }
  const [formData, setFormData] = useState(initialFormData)

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth < 1024) // lg breakpoint
    }
    checkDesktop()
    window.addEventListener("resize", checkDesktop)
    return () => window.removeEventListener("resize", checkDesktop)
  }, [])

  useEffect(() => {
    fetchReservations()
  }, [])

  useEffect(() => {
    if (reservations.length > 0) {
      console.log("Loaded reservations:", reservations.length)
      console.log("Sample reservation:", reservations[0])
    }
  }, [reservations])

  function getAuthHeaders() {
    const token = localStorage.getItem("auth_token")
    const headers: Record<string, string> = {
      // "Content-Type": "application/json",
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
    return headers
  }

  async function fetchReservations() {
    try {
      setLoading(true)
      const response = await fetch("/api/reservations", {
        headers: getAuthHeaders(),
      })

      if (!response.ok) throw new Error("Failed to fetch")

      const data = await response.json()
      console.log("Raw API Response:", data)

      let reservationList: Reservation[] = []

      if (data.success && data.data && Array.isArray(data.data)) {
        reservationList = data.data
      } else if (Array.isArray(data)) {
        reservationList = data
      } else if (data.data && Array.isArray(data.data)) {
        reservationList = data.data
      }

      // Normalize time to HH:MM format
      reservationList = reservationList.map((res) => {
        if (res.time) {
          const [hours, minutes] = res.time.split(":")
          const hh = hours.padStart(2, "0")
          const mm = (minutes || "00").padStart(2, "0")
          res.time = `${hh}:${mm}`
        }
        return res
      })

      console.log("Loaded reservations:", reservationList.length)
      if (reservationList.length > 0) {
        console.log("Sample reservation:", reservationList[0])
      }

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

    const days = []

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  function getReservationsForDate(date: Date | null) {
    if (!date) return []

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const dateStr = `${year}-${month}-${day}`

    const found = reservations.filter((res) => {
      const resDate = res.date.substring(0, 10)
      return resDate === dateStr
    })

    return found
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
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  function formatTime(timeString?: string) {
    if (!timeString) return "--:--" // handle undefined or empty

    const [hours, minutes] = timeString.split(":") // ignores seconds
    const hour = parseInt(hours, 10)
    const minute = minutes || "00"
    const period = hour >= 12 ? "PM" : "AM"
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12

    return `${formattedHour}:${minute} ${period}`
  }

  async function handleCreateReservation() {
    try {
      const form = new FormData()

      // Loop through all fields in formData
      Object.entries(formData).forEach(([key, value]) => {
        if (value === null || value === undefined) return

        // If it's a File (e.g., payment_receipt), append directly
        if (value instanceof File) {
          form.append(key, value)
        } else if (typeof value === "boolean") {
          form.append(key, value ? "1" : "0")
        } else {
          form.append(key, String(value))
        }
      })

      // Append the image file if a new one is selected
      if (paymentFile) {
        form.append("payment_receipt", paymentFile)
      }

      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          ...getAuthHeaders(), // Important: do NOT set 'Content-Type'
        },
        body: form, // FormData automatically sets Content-Type with boundary
      })

      if (!response.ok) {
        const resData = await response.json().catch(() => ({}))
        throw new Error(resData.message || "Failed to create reservation")
      }

      // Send email if not walk-in
      if (!formData.is_walkin && formData.email) {
        await fetch("/api/send-reservation-email", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            email: formData.email,
            name: formData.name,
            date: formData.date,
            time: formData.time,
            guests: formData.guests,
          }),
        })
      }
      fetchReservations()

      setFormData(initialFormData)
      setIsAddingReservation(false)
      setPaymentFile(null)
      fetchReservations()
    } catch (error) {
      console.error("Error creating reservation:", error)
    }
  }

  async function handleUpdateReservation() {
    if (!editingReservation) return

    try {
      const payload = new FormData()

      // Append all fields except the image
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "payment_receipt") {
          // Convert boolean and number to string
          payload.append(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value))
        }
      })

      // Append the image file if a new one is selected
      if (paymentFile) {
        payload.append("payment_receipt", paymentFile)
      }

      const response = await fetch(`/api/reservations/${editingReservation.id}`, {
        method: "PUT",
        headers: {
          Authorization: getAuthHeaders().Authorization || "",
        },
        body: payload,
      })

      if (!response.ok) throw new Error("Failed to update reservation")

      // Optionally send email if not walk-in
      if (!formData.is_walkin && formData.email) {
        await fetch("/api/send-reservation-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: getAuthHeaders().Authorization || "",
          },
          body: JSON.stringify({
            email: formData.email,
            name: formData.name,
            date: formData.date,
            time: formData.time,
            guests: formData.guests,
          }),
        })
      }

      // Refresh and reset
      fetchReservations()
      setOpenEdit(false)
      setEditingReservation(null)
      setFormData(initialFormData)
      setPaymentFile(null)
    } catch (error) {
      console.error("Error updating reservation:", error)
    }
  }

  async function handleDelete(id: number) {
    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      if (!response.ok) throw new Error("Failed to delete")

      setSelectedReservation(null)
      setDeleteOpen(false)
      setDeleteId(null)

      fetchReservations()
    } catch (error) {
      console.error("Error deleting reservation:", error)
    }
  }

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
                {/* Spinner */}
                <div className="relative">
                  <Loader2 className="h-8 w-8 animate-spin text-[#d4a24c]" />
                  <div className="absolute inset-0 rounded-full border border-[#d4a24c]/20 blur-sm" />
                </div>

                {/* Text */}
                <div className="text-center">
                  <p className="text-lg font-semibold text-white">Loading Reservations</p>
                  <p className="text-sm text-white/60">Please wait while we fetch the data...</p>
                </div>

                {/* Animated dots */}
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

  const reservationCustomerCount = reservations
    .filter((r) => !r.is_walkin && r.reservation_status !== "cancelled" && isSameMonth(r.date, currentDate))
    .reduce((sum, r) => sum + r.guests, 0)

  const walkInCustomerCount = reservations
    .filter((r) => r.is_walkin && r.reservation_status !== "cancelled" && isSameMonth(r.date, currentDate))
    .reduce((sum, r) => sum + r.guests, 0)

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

              {/* Monthly Guest Counts */}
              <div className="flex flex-wrap items-center gap-6 text-sm bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-gray-700">
                    Reservation: <span className="font-semibold text-green-800">{reservationCustomerCount}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  <span className="text-gray-700">
                    Walk-In: <span className="font-semibold text-blue-800">{walkInCustomerCount}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm shadow-xl p-0 pb-5 border-blue-100 border mt-6 rounded-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border rounded-t-xl p-6 md:mb-8 bg-[#162A3A] text-white">
                <div className="flex items-center gap-2 sm:gap-4">
                  <h2 className="text-xl sm:text-2xl font-bold">{formatMonthYear(currentDate)}</h2>
                  <div className="text-[#162A3A]">
                    <Button variant="outline" size="sm" onClick={goToToday}>
                      Today
                    </Button>
                  </div>
                </div>

                {/* Navigation, New Reservation & Walk-In Guest */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="icon" onClick={previousMonth}>
                    <ChevronLeft className="w-4 h-4 text-[#162A3A]" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={nextMonth}>
                    <ChevronRight className="w-4 h-4 text-[#162A3A]" />
                  </Button>
                  <Button
                    onClick={() => setIsAddingReservation(true)}
                    className="flex-1 sm:flex-none font-semibold bg-[#E5A834] text-[#162A3A] hover:bg-[#E5A834]/80"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">New Reservation</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2 mx-5">
                {weekDays.map((day) => (
                  <div key={day} className="p-1 sm:p-2 text-center font-semibold text-xs sm:text-sm text-gray-600">
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day.substring(0, 1)}</span>
                  </div>
                ))}

                {days.map((date, index) => {
                  const dayReservations = getReservationsForDate(date)

                  return (
                    <Card
                      key={index}
                      className={`min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] ${!date ? "invisible" : ""} ${
                        isToday(date) ? "ring-2 ring-blue-500" : ""
                      }`}
                    >
                      <CardContent className="p-1 sm:p-2">
                        {date && (
                          <>
                            <div className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-gray-700">{date.getDate()}</div>
                            <div className="space-y-0.5 sm:space-y-1">
                              {dayReservations.map((reservation) => (
                                <div key={reservation.id} className="relative w-full">
                                  <button
                                    className={`capitalize w-full text-left px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs truncate transition-colors font-medium ${getReservationColor(reservation)}`}
                                  >
                                    <span className="hidden sm:inline">{reservation.time.substring(0, 5)} - </span>
                                    {reservation.reservation_status}
                                  </button>

                                  {/* Action Dropdown */}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className="absolute top-0 right-0 p-1.5 hover:bg-gray-200 rounded-full">
                                        <MoreHorizontal className="w-3 h-3" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-40 bg-white border shadow-md">
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setViewingReservation(reservation)
                                          setOpenView(true)
                                        }}
                                      >
                                        View
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setFormData({
                                            name: reservation.name,
                                            email: reservation.email,
                                            phone: reservation.phone,
                                            date: reservation.date.split("T")[0],
                                            time: reservation.time,
                                            guests: reservation.guests,
                                            special_requests: reservation.special_requests || "",
                                            reservation_fee: reservation.reservation_fee || 0,
                                            reservation_fee_paid: reservation.reservation_fee_paid || 0,
                                            payment_method: reservation.payment_method || "",
                                            payment_reference: reservation.payment_reference || "",
                                            payment_receipt: reservation.payment_receipt || null,
                                            payment_status: reservation.payment_status || "pending",
                                            reservation_status: reservation.reservation_status || "pending",
                                            dining_preference: reservation.dining_preference || "Main Dining",
                                            occasion: reservation.occasion || "Casual Dinner",
                                            is_walkin: reservation.is_walkin || false,
                                          })
                                          setEditingReservation(reservation)
                                          setOpenEdit(true)
                                        }}
                                      >
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setDeleteId(reservation.id)
                                          setDeleteOpen(true)
                                        }}
                                      >
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* edit reservation */}
              <Dialog
                open={openEdit}
                onOpenChange={(isOpen) => {
                  setOpenEdit(isOpen)
                  if (!isOpen) {
                    setViewingReservation(null)
                    setPaymentFile(null)
                    setFormData({...initialFormData})
                  }
                }}
              >
                <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-amber-50 border border-[#162A3A]/20 text-white">
                  <DialogHeader className="pb-3 border-b border-[#d4a24c]/20">
                    <DialogTitle className="text-2xl font-bold text-[#162A3A]">Edit Reservation</DialogTitle>
                    <p className="text-sm text-blue-950">Update reservation details</p>
                  </DialogHeader>

                  <div className="space-y-5 pt-4">
                    {/* Guest Information */}
                    <div className="space-y-3">
                      <h4 className="text-xl font-bold text-gray-800">Guest Information</h4>

                      <span className="text-md font-semibold text-gray-800">Guest Name*</span>
                      <Input
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-gray-100 border-gray-600 text-gray-800"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-md font-semibold text-gray-800">Email Address*</span>
                          <Input
                            type="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="bg-gray-100 border-gray-600 text-gray-800"
                          />
                        </div>
                        <div>
                          <span className="text-md font-semibold text-gray-800">Phone Number*</span>
                          <Input
                            placeholder="Phone Number"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="bg-gray-100 border-gray-600 text-gray-800"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Reservation Details */}
                    <div className="space-y-3">
                      <h4 className="text-xl font-bold text-gray-800">Reservation Details</h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-md font-semibold text-gray-800">Date*</span>
                          <Input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="bg-gray-100 border-gray-600 text-gray-800"
                          />
                        </div>
                        <div>
                          <span className="text-md font-semibold text-gray-800">Time*</span>
                          <Input
                            type="time"
                            value={`${formData.time.split(":")[0].padStart(2, "0")}:${(formData.time.split(":")[1] || "00").padStart(2, "0")}`}
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            className="bg-gray-100 border-gray-600 text-gray-800"
                          />
                        </div>
                        <div>
                          <span className="text-md font-semibold text-gray-800">Number of Guests*</span>
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            value={formData.guests}
                            onChange={(e) => setFormData({ ...formData, guests: Number(e.target.value) })}
                            className="bg-gray-100 border-gray-600 text-gray-800"
                          />
                        </div>
                      </div>

                      {/* Preferences */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div>
                          <span className="text-md font-semibold text-gray-800">Dining Preference*</span>
                          <Select
                            value={formData.dining_preference}
                            onValueChange={(value: DiningPreference) => setFormData({ ...formData, dining_preference: value })}
                          >
                            <SelectTrigger className="bg-gray-100 border-gray-600 text-gray-800">
                              <SelectValue placeholder="Dining Preference" />
                            </SelectTrigger>
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
                            <SelectTrigger className="bg-gray-100 border-gray-600 text-gray-800">
                              <SelectValue placeholder="Occasion Type" />
                            </SelectTrigger>
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

                      {/* Payment Reference */}
                      <div className="mt-3">
                        <span className="text-md font-semibold text-gray-800">Payment Reference</span>
                        <Input
                          placeholder="Payment Reference"
                          value={formData.payment_reference}
                          onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
                          className="bg-gray-100 border-gray-600 text-gray-800"
                        />
                      </div>

                      {/* Payment Screenshot */}
                      <div className="mt-3">
                        <span className="text-md font-semibold text-gray-800">Payment Screenshot</span>

                        {/* Display existing receipt if available and no new file is selected */}
                        {formData.payment_receipt && !paymentFile && (
                          <div className="mt-2">
                            <Image
                              src={`${process.env.NEXT_PUBLIC_API_URL}/${formData.payment_receipt}`}
                              alt="Payment Receipt"
                              width={400}
                              height={400}
                              className="rounded-lg border"
                            />
                          </div>
                        )}

                        {/* File input */}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                          className="bg-gray-100 border-gray-600 text-gray-800 p-1 rounded mt-2 block"
                        />

                        {/* Show chosen file name if a new file is selected */}
                        {paymentFile && <p className="mt-1 text-sm text-gray-600">Selected: {paymentFile.name}</p>}
                      </div>

                      {/* Payment & Status */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div>
                          <span className="text-md font-semibold text-gray-800">Reservation Fee</span>
                          <Input
                            type="number"
                            value={formData.reservation_fee}
                            onChange={(e) => setFormData({ ...formData, reservation_fee: Number(e.target.value) })}
                            className="bg-gray-100 border-gray-600 text-gray-800"
                          />
                        </div>
                        <div>
                          <span className="text-md font-semibold text-gray-800">Fee Paid</span>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.reservation_fee_paid}
                            onChange={(e) => setFormData({ ...formData, reservation_fee_paid: parseFloat(e.target.value) })}
                            className="bg-gray-100 border-gray-600 text-gray-800"
                          />
                        </div>
                        <div className="mt-3">
                          <span className="text-md font-semibold text-gray-800">Payment Method</span>
                          <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                            <SelectTrigger className="bg-gray-100 border-gray-600 text-gray-800">
                              <SelectValue placeholder="Select Payment Method" />
                            </SelectTrigger>
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
                            <SelectTrigger className="bg-gray-100 border-gray-600 text-gray-800">
                              <SelectValue placeholder="Payment Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-100 text-gray-800">
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Special Requests */}
                      <div className="space-y-2 mt-3">
                        <h4 className="text-xl font-bold text-gray-800">Special Requests</h4>
                        <Textarea
                          placeholder="Optional notes or requests"
                          rows={3}
                          value={formData.special_requests}
                          onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                          className="bg-gray-100 border-gray-600 text-gray-800"
                        />
                      </div>

                      {/* Walk-in / Status */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div>
                          <span className="text-md font-semibold text-gray-800">Walk-In</span>
                          <input
                            type="checkbox"
                            checked={formData.is_walkin}
                            onChange={(e) => setFormData({ ...formData, is_walkin: e.target.checked })}
                            className="h-5 w-5"
                          />
                        </div>
                        <div>
                          <span className="text-md font-semibold text-gray-800">Reservation Status</span>
                          <Select
                            value={formData.reservation_status}
                            onValueChange={(value) => setFormData({ ...formData, reservation_status: value })}
                          >
                            <SelectTrigger className="bg-gray-100 border-gray-600 text-gray-800">
                              <SelectValue placeholder="Reservation Status" />
                            </SelectTrigger>
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

                      {/* Action */}
                      <div className="pt-2">
                        <Button onClick={handleUpdateReservation} className="w-full rounded-md bg-[#d4a24c] text-gray-800 hover:bg-[#d4a24c]/70">
                          Update Reservation
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* View Reservation Details Dialog */}
              <Dialog
                open={openView}
                onOpenChange={(isOpen) => {
                  if (!isOpen) setViewingReservation(null)
                  setOpenView(isOpen)
                }}
              >
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-lg border border-gray-200 p-6 bg-white">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900 mb-6">Reservation Details</DialogTitle>
                  </DialogHeader>

                  {viewingReservation && (
                    <div className="space-y-8">
                      {/* Reservation Status */}
                      <div className="flex flex-wrap gap-3">
                        <span
                          className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                            viewingReservation.reservation_status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : viewingReservation.reservation_status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : viewingReservation.reservation_status === "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {viewingReservation.reservation_status}
                        </span>
                        {viewingReservation.is_walkin && (
                          <span className="px-3 py-1 rounded-lg text-sm font-semibold bg-blue-100 text-blue-800">Walk-in</span>
                        )}
                      </div>

                      {/* Guest Information */}
                      <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">Guest Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-800">Name</label>
                            <p className="text-md font-medium text-gray-700">{viewingReservation.name}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-800">Email</label>
                            <p className="text-md font-medium text-gray-700">{viewingReservation.email}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-800">Phone</label>
                            <p className="text-md font-medium text-gray-700">{viewingReservation.phone}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-800">Number of Guests</label>
                            <p className="text-md font-medium text-gray-700">{viewingReservation.guests} people</p>
                          </div>
                        </div>
                      </section>

                      {/* Schedule */}
                      <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">Schedule</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-800">Date</label>
                            <p className="text-md font-medium text-gray-700">{formatDate(viewingReservation.date)}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-800">Time</label>
                            <p className="text-md font-medium text-gray-700">{formatTime(viewingReservation.time)}</p>
                          </div>
                        </div>
                      </section>

                      {/* Preferences / Occasion */}
                      <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">Preferences</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {viewingReservation.dining_preference && (
                            <div>
                              <label className="block text-sm font-bold text-gray-800">Dining Preference</label>
                              <p className="text-md font-medium text-gray-700">{viewingReservation.dining_preference}</p>
                            </div>
                          )}
                          {viewingReservation.occasion && (
                            <div>
                              <label className="block text-sm font-bold text-gray-800">Occasion</label>
                              <p className="text-md font-medium text-gray-700">{viewingReservation.occasion}</p>
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Special Requests */}
                      <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">Special Requests</h3>
                        <p className="text-md text-gray-700 font-medium">{viewingReservation.special_requests || "None"}</p>
                      </section>

                      {/* Payment Information */}
                      <section className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-md text-gray-700">
                          {/* Payment Status */}
                          <span
                            className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                              viewingReservation.payment_status === "paid"
                                ? "bg-green-100 text-green-800"
                                : viewingReservation.payment_status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {viewingReservation.payment_status}
                          </span>

                          {/* Fees and Method */}
                          {viewingReservation.reservation_fee != null && (
                            <div>
                              <label className="block text-sm font-bold text-gray-800">Reservation Fee</label>
                              <p className="text-md font-medium text-gray-700">₱{viewingReservation.reservation_fee}</p>
                            </div>
                          )}
                          {viewingReservation.reservation_fee_paid != null && (
                            <div>
                              <label className="block text-sm font-bold text-gray-800">Amount Paid</label>
                              <p className="text-md font-medium text-gray-700">
                                {viewingReservation.reservation_fee_paid === 0 ? "Unpaid" : `₱${viewingReservation.reservation_fee_paid}`}
                              </p>
                            </div>
                          )}
                          {viewingReservation.payment_method && (
                            <div>
                              <label className="block text-sm font-bold text-gray-800">Payment Method</label>
                              <p className="text-md font-medium text-gray-700">{viewingReservation.payment_method}</p>
                            </div>
                          )}
                          {viewingReservation.payment_reference && (
                            <div>
                              <label className="block text-sm font-bold text-gray-800">Payment Reference</label>
                              <p className="text-md font-medium text-gray-700">{viewingReservation.payment_reference}</p>
                            </div>
                          )}

                          {/* Payment Receipt */}
                          {viewingReservation.payment_receipt && (
                            <div className="col-span-1 sm:col-span-2">
                              <label className="block text-sm font-bold text-gray-800">Payment Receipt</label>
                              <button
                                onClick={() =>
                                  window.open(
                                    `${process.env.NEXT_PUBLIC_API_URL}/${viewingReservation.payment_receipt}`,
                                    "_blank",
                                    "noopener,noreferrer",
                                  )
                                }
                                className="px-4 py-2 mt-1 rounded-lg bg-yellow-600 text-white font-semibold hover:bg-yellow-700 transition-colors"
                              >
                                View Receipt
                              </button>
                              <Image
                                src={`${process.env.NEXT_PUBLIC_API_URL}/${viewingReservation.payment_receipt}`}
                                alt="Payment Receipt"
                                width={400}
                                height={400}
                                className="mt-2 rounded-lg border"
                              />
                            </div>
                          )}
                        </div>
                      </section>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Create New Reservation Dialog */}
              <Dialog
                open={isAddingReservation}
                onOpenChange={(isOpen) => {
                  setIsAddingReservation(isOpen)
                  if (!isOpen) {
                    setViewingReservation(null)
                    setPaymentFile(null)
                    setFormData({...initialFormData})
                  }
                }}
              >
                <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-amber-50 border border-[#162A3A]/20 text-white">
                  <DialogHeader className="pb-3 border-b border-[#d4a24c]/20">
                    <DialogTitle className="text-2xl font-bold text-[#162A3A]">Create New Reservation</DialogTitle>
                    <p className="text-sm text-blue-950">Add a reservation manually for a guest</p>
                  </DialogHeader>

                  <div className="space-y-5 pt-4">
                    {/* Walk-In Checkbox */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="walkin"
                        checked={formData.is_walkin}
                        onChange={(e) => setFormData({ ...formData, is_walkin: e.target.checked })}
                        className="h-4 w-4 text-[#d4a24c] border-gray-300 rounded"
                      />
                      <label htmlFor="walkin" className="text-gray-800 font-semibold">
                        Walk-In Guest
                      </label>
                    </div>

                    {/* Guest Information */}
                    <div className="space-y-3">
                      <h4 className="text-xl font-bold text-gray-800">Guest Information</h4>

                      <span className="text-md font-semibold text-gray-800">Guest Name*</span>
                      <Input
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-gray-100 border-gray-600 text-gray-800"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-md font-semibold text-gray-800">Email Address*</span>
                          <Input
                            type="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="bg-gray-100 border-gray-600 text-gray-800"
                          />
                        </div>
                        <div>
                          <span className="text-md font-semibold text-gray-800">Phone Number*</span>
                          <Input
                            placeholder="Phone Number"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="bg-gray-100 border-gray-600 text-gray-800"
                          />
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
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="bg-gray-100 border-gray-600 text-gray-800"
                          />
                        </div>
                        <div>
                          <span className="text-md font-semibold text-gray-800">Time*</span>
                          <Input
                            type="time"
                            value={formData.time}
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            className="bg-gray-100 border-gray-600 text-gray-800"
                          />
                        </div>
                        <div>
                          <span className="text-md font-semibold text-gray-800">Number of Guests*</span>
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            placeholder="Number of Guests"
                            value={formData.guests}
                            onChange={(e) => setFormData({ ...formData, guests: Number(e.target.value) })}
                            className="bg-gray-100 border-gray-600 text-gray-800"
                          />
                        </div>
                      </div>

                      {/* Dining & Occasion */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <span className="text-md font-semibold text-gray-800">Dining Preference*</span>
                          <Select
                            value={formData.dining_preference}
                            onValueChange={(value: DiningPreference) => setFormData({ ...formData, dining_preference: value })}
                          >
                            <SelectTrigger className="bg-gray-100 border-gray-600 text-gray-800">
                              <SelectValue placeholder="Dining Preference" />
                            </SelectTrigger>
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
                            <SelectTrigger className="bg-gray-100 border-gray-600 text-gray-800">
                              <SelectValue placeholder="Occasion Type" />
                            </SelectTrigger>
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
                      <Textarea
                        placeholder="Optional notes or special requests"
                        rows={3}
                        value={formData.special_requests}
                        onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                        className="bg-gray-100 border-gray-600 text-gray-800"
                      />
                    </div>

                    {/* Payment Information */}
                    <div className="space-y-3">
                      <h4 className="text-xl font-bold text-gray-800">Payment</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <span className="text-md font-semibold text-gray-800">Reservation Fee</span>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={formData.reservation_fee}
                            onChange={(e) => setFormData({ ...formData, reservation_fee: parseFloat(e.target.value) })}
                            className="bg-gray-100 border-gray-600 text-gray-800"
                          />
                        </div>
                        <div>
                          <span className="text-md font-semibold text-gray-800">Fee Paid</span>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={formData.reservation_fee_paid}
                            onChange={(e) => setFormData({ ...formData, reservation_fee_paid: parseFloat(e.target.value) })}
                            className="bg-gray-100 border-gray-600 text-gray-800"
                          />
                        </div>
                        <div>
                          <span className="text-md font-semibold text-gray-800">Payment Method</span>
                          <Input
                            placeholder="GCash, Security Bank, etc."
                            value={formData.payment_method}
                            onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                            className="bg-gray-100 border-gray-600 text-gray-800"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-md font-semibold text-gray-800">Payment Reference</span>
                          <Input
                            placeholder="Transaction ID or reference number"
                            value={formData.payment_reference}
                            onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
                            className="bg-gray-100 border-gray-600 text-gray-800"
                          />
                        </div>
                        <div>
                          <span className="text-md font-semibold text-gray-800">Payment Status</span>
                          <Select
                            value={formData.payment_status}
                            onValueChange={(value: "pending" | "paid" | "failed") => setFormData({ ...formData, payment_status: value })}
                          >
                            <SelectTrigger className="bg-gray-100 border-gray-600 text-gray-800">
                              <SelectValue placeholder="Payment Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-100 text-gray-800">
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Payment Screenshot */}
                      <div className="mt-3">
                        <span className="text-md font-semibold text-gray-800">Payment Screenshot</span>

                        {/* File input */}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                          className="bg-gray-100 border-gray-600 text-gray-800 p-1 rounded mt-2 block"
                        />

                        {/* Show chosen file name if a new file is selected */}
                        {paymentFile && <p className="mt-1 text-sm text-gray-600">Selected: {paymentFile.name}</p>}
                      </div>
                    </div>

                    {/* Reservation Status */}
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold text-gray-800">Reservation Status</h4>
                      <Select
                        value={formData.reservation_status}
                        onValueChange={(value: "pending" | "confirmed" | "cancelled" | "completed" | "noshow") =>
                          setFormData({ ...formData, reservation_status: value })
                        }
                      >
                        <SelectTrigger className="bg-gray-100 border-gray-600 text-gray-800">
                          <SelectValue placeholder="Reservation Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-100 text-gray-800">
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="noshow">No-Show</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Action */}
                    <div className="pt-2">
                      <Button onClick={handleCreateReservation} className="w-full rounded-md bg-[#d4a24c] text-gray-800 hover:bg-[#d4a24c]/70">
                        {formData.is_walkin ? "Add Walk-In Guest" : "Create Reservation"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Delete Confirmation Dialog */}
              <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-black">Delete Reservation</DialogTitle>
                    <DialogDescription>Are you sure you want to delete this reservation? This action cannot be undone.</DialogDescription>
                  </DialogHeader>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDeleteOpen(false)
                        setDeleteId(null)
                      }}
                      className="text-black"
                    >
                      Cancel
                    </Button>

                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (deleteId) handleDelete(deleteId)
                      }}
                    >
                      Delete
                    </Button>
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
