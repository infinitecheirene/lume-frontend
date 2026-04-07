"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import Image from "next/image"
import { Playfair_Display } from "next/font/google"

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
  status: "Pending" | "Confirmed" | "Cancelled"
  created_at: string
  reservation_fee_paid: boolean
  dining_preference: "Main Dining" | "Private Tatami Room" | "Chef's Counter" | "Window Seat" | "Celebration Area" | "Family Seating" | "Group Dining"
  occasion_type?: "Casual Dinner" | "Birthday" | "Business Meeting" | "Anniversary" | "Private Event" | "Other"
  reservation_fee?: number
  payment_method?: string
  payment_reference?: string
  payment_screenshot?: string
  is_walkin?: boolean
}

function isSameMonth(dateStr: string, currentDate: Date) {
  const d = new Date(dateStr)
  return (
    d.getFullYear() === currentDate.getFullYear() &&
    d.getMonth() === currentDate.getMonth()
  )
}

function getReservationColor(reservation: Reservation) {
  if (reservation.is_walkin) {
    return "bg-blue-100 text-blue-800 hover:bg-blue-200"
  }
  return "bg-green-100 text-green-800 hover:bg-green-200"
}

type ReservationStatus = "Pending" | "Confirmed" | "Cancelled"
type DiningPreference = Reservation["dining_preference"]
type OccasionType = Reservation["occasion_type"]

export default function ReservationsAdmin() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [isAddingReservation, setIsAddingReservation] = useState(false)
  const [isWalkInGuest, setIsWalkInGuest] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth < 1024) // lg breakpoint
    }
    checkDesktop()
    window.addEventListener("resize", checkDesktop)
    return () => window.removeEventListener("resize", checkDesktop)
  }, [])

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    guests: 1,
    dining_preference: "Main Dining" as DiningPreference,
    occasion_type: "Casual Dinner" as OccasionType,
    special_requests: "",
    status: "Pending" as ReservationStatus,
    is_walkin: false,
  })


  useEffect(() => {
    fetchReservations()
  }, [])

  useEffect(() => {
    if (reservations.length > 0) {
      console.log("✅ Loaded reservations:", reservations.length)
      console.log("Sample reservation:", reservations[0])
    }
  }, [reservations])

  function getAuthHeaders() {
    const token = localStorage.getItem('auth_token')
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
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
        headers: getAuthHeaders()
      })

      console.log("Response status:", response.status)

      if (!response.ok) throw new Error("Failed to fetch")

      const data = await response.json()
      console.log("Raw API Response:", data)

      let reservationList = []

      if (data.success && data.data && Array.isArray(data.data)) {
        reservationList = data.data
      } else if (Array.isArray(data)) {
        reservationList = data
      } else if (data.data && Array.isArray(data.data)) {
        reservationList = data.data
      }

      console.log("✅ Loaded reservations:", reservationList.length)
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
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`

    const found = reservations.filter(res => {
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
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  function isToday(date: Date | null) {
    if (!date) return false
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  function formatTime(timeString: string) {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const minute = minutes || '00'
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minute}${period}`
  }

  async function handleCreateReservation() {
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to create reservation")

      // Only send email if it's not a walk-in
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

      setFormData({
        name: "",
        email: "",
        phone: "",
        date: "",
        time: "",
        guests: 1,
        special_requests: "",
        status: "Pending",
        dining_preference: "Main Dining",
        occasion_type: "Casual Dinner",
        is_walkin: false,
      })
      setIsAddingReservation(false)
      fetchReservations()
    } catch (error) {
      console.error("Error creating reservation:", error)
    }
  }

  async function handleWalkInGuest() {
    try {
      const payload = {
        ...formData,
        is_walkin: true,
        status: "Confirmed",
      }

      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Failed to create walk-in")

      setFormData({
        name: "",
        email: "",
        phone: "",
        date: "",
        time: "",
        guests: 1,
        dining_preference: "Main Dining",
        occasion_type: "Casual Dinner",
        special_requests: "",
        status: "Pending",
        is_walkin: false,
      })

      setIsWalkInGuest(false)
      fetchReservations()
    } catch (error) {
      console.error("Walk-in error:", error)
    }
  }


  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this reservation?")) return

    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      if (!response.ok) throw new Error("Failed to delete")

      setSelectedReservation(null)
      fetchReservations()
    } catch (error) {
      console.error("Error deleting reservation:", error)
    }
  }

  async function handleStatusChange(id: number, newStatus: ReservationStatus) {
    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error("Failed to update")

      fetchReservations()
      if (selectedReservation?.id === id) {
        setSelectedReservation({ ...selectedReservation, status: newStatus })
      }
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const days = getDaysInMonth(currentDate)
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
                  <p className="text-lg font-semibold text-white">
                    Loading Reservations
                  </p>
                  <p className="text-sm text-white/60">
                    Please wait while we fetch the data...
                  </p>
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
    .filter(
      r =>
        !r.is_walkin &&
        r.status !== "Cancelled" &&
        isSameMonth(r.date, currentDate)
    )
    .reduce((sum, r) => sum + r.guests, 0)

  const walkInCustomerCount = reservations
    .filter(
      r =>
        r.is_walkin &&
        r.status !== "Cancelled" &&
        isSameMonth(r.date, currentDate)
    )
    .reduce((sum, r) => sum + r.guests, 0)

  return (
    <SidebarProvider defaultOpen={!isDesktop}>
      <div className="flex min-h-screen w-full bg-amber-50">
        <AppSidebar />
        <div className={`flex-1 min-w-0 ${isDesktop ? "ml-0" : "ml-72"}`}>
          {isDesktop && (
            <div className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b bg-[#162A3A] px-4 shadow-sm">
              <SidebarTrigger className="-ml-1" />
              <Image
                src="/logo.jpg"
                alt="Lumè Bean and Bar Logo"
                width={40}
                height={40}
                className="object-contain rounded-full"
              />
              <h1 className={`${playfair.className} text-lg font-semibold text-white`}>Lumè Bean and Bar</h1>
            </div>
          )}

          <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Reservation Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage your restaurant&apos;s reservations and walk-in guests
                </p>
              </div>

              {/* Monthly Guest Counts */}
              <div className="flex flex-wrap items-center gap-6 text-sm bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-gray-700">
                    Reservation:{" "}
                    <span className="font-semibold text-green-800">
                      {reservationCustomerCount}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  <span className="text-gray-700">
                    Walk-In:{" "}
                    <span className="font-semibold text-blue-800">
                      {walkInCustomerCount}
                    </span>
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
                  <Button onClick={() => setIsAddingReservation(true)} className="flex-1 sm:flex-none font-semibold bg-[#E5A834] text-[#162A3A] hover:bg-[#E5A834]/80">
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">New Reservation</span>
                  </Button>
                  <Button onClick={() => setIsWalkInGuest(true)} className="flex-1 sm:flex-none font-semibold bg-[#E5A834] text-[#162A3A] hover:bg-[#E5A834]/80">
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Walk-In Guest</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2 mx-5">
                {weekDays.map(day => (
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
                      className={`min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] ${!date ? 'invisible' : ''} ${isToday(date) ? 'ring-2 ring-blue-500' : ''
                        }`}
                    >
                      <CardContent className="p-1 sm:p-2">
                        {date && (
                          <>
                            <div className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-gray-700">
                              {date.getDate()}
                            </div>
                            <div className="space-y-0.5 sm:space-y-1">
                              {dayReservations.map(reservation => (
                                <button
                                  key={reservation.id}
                                  onClick={() => setSelectedReservation(reservation)}
                                  className={`w-full text-left px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs truncate transition-colors font-medium ${getReservationColor(reservation)}`}
                                >
                                  <span className="hidden sm:inline">{reservation.time.substring(0, 5)} - </span>
                                  {reservation.status}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Reservation Details Dialog */}
              <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-lg border border-gray-200 p-6 bg-white">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900 mb-4">Reservation Details</DialogTitle>
                  </DialogHeader>

                  {selectedReservation && (
                    <div className="space-y-6">
                      {/* Guest Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-md font-bold text-gray-800">Name</label>
                          <p className="text-md font-semibold text-gray-700">{selectedReservation.name}</p>
                        </div>
                        <div>
                          <label className="text-md font-bold text-gray-800">Email</label>
                          <p className="text-md font-semibold text-gray-700">{selectedReservation.email}</p>
                        </div>
                        <div>
                          <label className="text-md font-bold text-gray-800">Phone</label>
                          <p className="text-md font-semibold text-gray-700">{selectedReservation.phone}</p>
                        </div>
                        <div>
                          <label className="text-md font-bold text-gray-800">Guests</label>
                          <p className="text-md font-semibold text-gray-700">{selectedReservation.guests} people</p>
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-md font-bold text-gray-800">Date</label>
                          <p className="text-md font-semibold text-gray-700">{formatDate(selectedReservation.date)}</p>
                        </div>
                        <div>
                          <label className="text-md font-bold text-gray-800">Time</label>
                          <p className="text-md font-semibold text-gray-700">{formatTime(selectedReservation.time)}</p>
                        </div>
                      </div>

                      {/* Dining & Occasion */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-md font-bold text-gray-800">Dining Preference</label>
                          <p className="text-md font-semibold text-gray-700">
                            {selectedReservation.dining_preference || "N/A"}
                          </p>
                        </div>

                        <div>
                          <label className="text-md font-bold text-gray-800">Occasion Type</label>
                          <p className="text-md font-semibold text-gray-700">
                            {selectedReservation.occasion_type || "N/A"}
                          </p>
                        </div>

                        <div>
                          <label className="text-md font-bold text-gray-800">Special Requests</label>
                          <p className="text-md font-semibold text-gray-700">
                            {selectedReservation.special_requests || "None"}
                          </p>
                        </div>

                        {/* Status */}
                        <div>
                          <label className="text-md font-bold text-gray-800">Status</label>
                          <Select
                            value={selectedReservation.status}
                            onValueChange={(value: ReservationStatus) =>
                              handleStatusChange(selectedReservation.id, value)
                            }
                          >
                            <SelectTrigger className="w-full text-gray-600">
                              <SelectValue>
                                {selectedReservation.status ? selectedReservation.status : "Select Status"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Confirmed">Confirmed</SelectItem>
                              <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Payment Info */}
                      <div className="border-t border-gray-200 pt-4 space-y-2">
                        <h3 className="text-xl font-bold text-gray-800">Payment Info</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                          <div>
                            <span className="font-medium text-md">Status:</span>{" "}
                            {selectedReservation.reservation_fee_paid ? "Paid" : "Unpaid"}
                          </div>
                          {selectedReservation.reservation_fee && (
                            <div>
                              <span className="font-medium text-md">Fee:</span> ₱{selectedReservation.reservation_fee}
                            </div>
                          )}
                          {selectedReservation.payment_method && (
                            <div>
                              <span className="font-medium text-md">Method:</span> {selectedReservation.payment_method}
                            </div>
                          )}
                          {selectedReservation.payment_reference && (
                            <div>
                              <span className="font-medium text-md">Reference:</span> {selectedReservation.payment_reference}
                            </div>
                          )}
                          {selectedReservation.payment_screenshot && (
                            <div className="col-span-1 sm:col-span-2">
                              <span className="font-medium text-md">Screenshot:</span>{" "}
                              <a
                                href={`/${selectedReservation.payment_screenshot}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline"
                              >
                                View
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Delete Button */}
                      <Button
                        variant="destructive"
                        className="w-full mt-4"
                        onClick={() => handleDelete(selectedReservation.id)}
                      >
                        Delete Reservation
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* New Reservation Dialog */}
              <Dialog open={isAddingReservation} onOpenChange={setIsAddingReservation}>
                <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-amber-50 border border-[#162A3A]/20 text-white">
                  <DialogHeader className="pb-3 border-b border-[#d4a24c]/20">
                    <DialogTitle className="text-2xl font-bold text-[#162A3A]">
                      Create New Reservation
                    </DialogTitle>
                    <p className="text-sm text-blue-950">
                      Add a reservation manually for a guest
                    </p>
                  </DialogHeader>

                  <div className="space-y-5 pt-4">

                    {/* Guest Information */}
                    <div className="space-y-3">
                      <h4 className="text-xl font-bold text-gray-800">
                        Guest Information
                      </h4>

                      <span className="text-md font-semibold text-gray-800">Guest Name*</span>
                      <Input
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="bg-gray-100 border-gray-600 text-gray-800"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-md font-semibold text-gray-800">Email Address*</span>
                          <Input
                            type="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({ ...formData, email: e.target.value })
                            }
                            className="bg-gray-100 border-gray-600 text-gray-800"
                          />
                        </div>
                        <div>
                          <span className="text-md font-semibold text-gray-800">Phone Number*</span>
                          <Input
                            placeholder="Phone Number"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({ ...formData, phone: e.target.value })
                            }
                            className="bg-gray-100 border-gray-600 text-gray-800"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Reservation Details */}
                    <div className="space-y-3">
                      <h4 className="text-xl font-bold text-gray-800">
                        Reservation Details
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-md font-semibold text-gray-800">Date*</span>
                          <Input
                            type="date"
                            value={formData.date}
                            onChange={(e) =>
                              setFormData({ ...formData, date: e.target.value })
                            }
                            className="bg-gray-100 border-gray-600 text-gray-800"
                          />
                        </div>
                        <div>
                          <span className="text-md font-semibold text-gray-800">Time*</span>
                          <Input
                            type="time"
                            value={formData.time}
                            onChange={(e) =>
                              setFormData({ ...formData, time: e.target.value })
                            }
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
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                guests: Number(e.target.value),
                              })
                            }
                            className="bg-gray-100 border-gray-600 text-gray-800"
                          />
                        </div>
                      </div>

                      {/* Preferences */}
                      <div className="space-y-3">
                        <h4 className="text-xl font-bold text-gray-800">
                          Preferences
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <span className="text-md font-semibold text-gray-800">Dining Preference*</span>
                            <Select
                              value={formData.dining_preference}
                              onValueChange={(value: DiningPreference) =>
                                setFormData({ ...formData, dining_preference: value })
                              }
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
                            <Select
                              value={formData.occasion_type}
                              onValueChange={(value: OccasionType) =>
                                setFormData({ ...formData, occasion_type: value })
                              }
                            >
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

                        {/* Special Requests */}
                        <div className="space-y-2">
                          <h4 className="text-xl font-bold text-gray-800">
                            Special Requests
                          </h4>
                          <Textarea
                            placeholder="Optional notes or special requests"
                            rows={3}
                            value={formData.special_requests}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                special_requests: e.target.value,
                              })
                            }
                            className="bg-gray-100 border-gray-600 text-gray-800"
                          />
                        </div>

                        {/* Action */}
                        <div className="pt-2">
                          <Button
                            onClick={handleCreateReservation}
                            className="w-full rounded-md bg-[#d4a24c] text-gray-800 hover:bg-[#d4a24c]/70"
                          >
                            Create Reservation
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Walk In Dialog */}
              <Dialog open={isWalkInGuest} onOpenChange={setIsWalkInGuest}>
                <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-amber-50 border border-[#162A3A]/20 text-white">

                  <DialogHeader className="pb-3 border-b border-[#d4a24c]/20">
                    <DialogTitle className="text-2xl font-bold text-[#162A3A]">
                      Walk-In Guest
                    </DialogTitle>
                    <p className="text-sm text-blue-950">
                      Add a guest who arrived without a prior reservation
                    </p>
                  </DialogHeader>

                  <div className="space-y-5 pt-4">

                    {/* Guest Information */}
                    <div className="space-y-3">
                      <h4 className="text-xl font-bold text-gray-800">
                        Guest Information
                      </h4>

                      <span className="text-md font-semibold text-gray-800">
                        Guest Name*
                      </span>
                      <Input
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="bg-gray-100 border-gray-600 text-gray-800"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-md font-semibold text-gray-800">
                            Email Address*
                          </span>
                          <Input
                            type="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({ ...formData, email: e.target.value })
                            }
                            className="bg-gray-100 border-gray-600 text-gray-800"
                          />
                        </div>

                        <div>
                          <span className="text-md font-semibold text-gray-800">
                            Phone Number*
                          </span>
                          <Input
                            placeholder="Phone Number"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({ ...formData, phone: e.target.value })
                            }
                            className="bg-gray-100 border-gray-600 text-gray-800"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Visit Details */}
                    <div className="space-y-3">
                      <h4 className="text-xl font-bold text-gray-800">
                        Visit Details
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-md font-semibold text-gray-800">
                            Date*
                          </span>
                          <Input
                            type="date"
                            value={formData.date}
                            onChange={(e) =>
                              setFormData({ ...formData, date: e.target.value })
                            }
                            className="bg-gray-100 border-gray-600 text-gray-800"
                          />
                        </div>

                        <div>
                          <span className="text-md font-semibold text-gray-800">
                            Time*
                          </span>
                          <Input
                            type="time"
                            value={formData.time}
                            onChange={(e) =>
                              setFormData({ ...formData, time: e.target.value })
                            }
                            className="bg-gray-100 border-gray-600 text-gray-800"
                          />
                        </div>

                        <div>
                          <span className="text-md font-semibold text-gray-800">
                            Number of Guests*
                          </span>
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            placeholder="Number of Guests"
                            value={formData.guests}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                guests: Number(e.target.value),
                              })
                            }
                            className="bg-gray-100 border-gray-600 text-gray-800"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Preferences */}
                    <div className="space-y-3">
                      <h4 className="text-xl font-bold text-gray-800">
                        Preferences
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">

                        <div>
                          <span className="text-md font-semibold text-gray-800">
                            Dining Preference*
                          </span>
                          <Select
                            value={formData.dining_preference}
                            onValueChange={(value: DiningPreference) =>
                              setFormData({ ...formData, dining_preference: value })
                            }
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
                          <span className="text-md font-semibold text-gray-800">
                            Occasion Type*
                          </span>
                          <Select
                            value={formData.occasion_type}
                            onValueChange={(value: OccasionType) =>
                              setFormData({ ...formData, occasion_type: value })
                            }
                          >
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
                      <h4 className="text-xl font-bold text-gray-800">
                        Special Requests
                      </h4>

                      <Textarea
                        placeholder="Optional notes or requests"
                        rows={3}
                        value={formData.special_requests}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            special_requests: e.target.value,
                          })
                        }
                        className="bg-gray-100 border-gray-600 text-gray-800"
                      />
                    </div>

                    {/* Action */}
                    <div className="pt-2">
                      <Button
                        onClick={handleWalkInGuest}
                        className="w-full rounded-md bg-[#d4a24c] text-gray-800 hover:bg-[#d4a24c]/70"
                      >
                        Add Walk-In Guest
                      </Button>
                    </div>

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
