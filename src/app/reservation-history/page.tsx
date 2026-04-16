"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, XCircle, User, LogIn, Calendar, Users, Mail, Phone, ChefHat, MessageSquare, Filter, Plus } from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import { useAuthStore } from "@/store/authStore"
import { Playfair_Display } from "next/font/google"
import { useProtectedRoute } from "@/hooks/use-protected-route"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

const ReservationsHistory = () => {
  useProtectedRoute() // Protect this route - only logged in users can access
  const [reservations, setReservations] = useState<any[]>([])
  const [filteredReservations, setFilteredReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    const fetchReservations = async () => {
      if (!user || !token) {
        console.log("❌ No user or token found")
        setLoading(false)
        return
      }

      console.log("=== Frontend Debug ===")
      console.log("User:", user)
      console.log("User ID:", user.id)
      console.log("Token:", token ? "Present" : "Missing")

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL

        const reservationsResponse = await fetch(`${apiUrl}/api/reservations`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })

        console.log("Response status:", reservationsResponse.status)

        if (reservationsResponse.ok) {
          const reservationsData = await reservationsResponse.json()

          console.log("=== Backend Response ===")
          console.log("Full response:", reservationsData)
          console.log("Debug:", reservationsData.debug)
          console.log("Authenticated:", reservationsData.debug?.authenticated)
          console.log("Count:", reservationsData.debug?.total_count || reservationsData.data?.length)

          const resData = Array.isArray(reservationsData) ? reservationsData : reservationsData.data || []

          console.log("✅ Reservations loaded:", resData.length)
          setReservations(resData)
          setFilteredReservations(resData)
        } else {
          const errorData = await reservationsResponse.json()
          console.error("❌ Response not OK:", reservationsResponse.status, errorData)
          toast({
            title: "Error",
            description: errorData.message || "Failed to load reservations",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("❌ Error fetching reservations:", error)
        toast({
          title: "Error",
          description: "Failed to load reservations. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchReservations()
  }, [user, token])

  useEffect(() => {
    if (activeFilter === "all") {
      setFilteredReservations(reservations)
    } else {
      setFilteredReservations(reservations.filter((res) => res.status === activeFilter))
    }
  }, [activeFilter, reservations])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />
      case "confirmed":
        return <ChefHat className="w-4 h-4" />
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "cancelled":
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30"
      case "confirmed":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30"
      case "completed":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
      case "cancelled":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30"
    }
  }

  const getStatusCount = (status: string) => {
    if (status === "all") return reservations.length
    return reservations.filter((res) => res.status === status).length
  }

  const getReceiptUrl = (path: string) => {
    if (!path) return ""

    // already full URL
    if (path.startsWith("http")) return path

    // already starts with storage or uploads
    if (path.startsWith("storage") || path.startsWith("uploads")) {
      return `${process.env.NEXT_PUBLIC_API_URL}/${path}`
    }

    // fallback
    return `${process.env.NEXT_PUBLIC_API_URL}/storage/${path}`
  }


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1d26] text-white">
        <div className="flex flex-col items-center gap-6">

          {/* Glow ring */}
          <div className="relative">
            <div className="w-20 h-20 border-4 border-[#d4a24c]/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-[#d4a24c] rounded-full animate-spin"></div>
          </div>

          {/* Text */}
          <div className="text-center">
            <p className="text-xl font-semibold">Loading your reservations</p>
            <p className="text-white/60 text-sm">Fetching your dining history...</p>
          </div>

          {/* Animated dots */}
          <div className="flex gap-2">
            <span className="w-2 h-2 bg-[#d4a24c] rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 bg-[#d4a24c] rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 bg-[#d4a24c] rounded-full animate-bounce" />
          </div>

        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen py-24 bg-[#0b1d26] text-white">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#d4a24c]/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#d4a24c]/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-[#d4a24c]/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <Card className="flex items-center justify-center max-w-xl mx-5 md:mx-auto bg-[#0c222b] backdrop-blur-sm border-white/30 shadow-2xl relative z-10">
          <CardContent className="p-10 text-center">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white mb-3">Welcome!</h1>
            <p className="text-white/70 mb-8">Please log in to view your reservations history.</p>
            <div className="flex flex-col gap-3">
              <Link href="/login" className="w-full">
                <Button className="w-full bg-white hover:bg-white/90 text-[#d4a24c] font-bold py-6 text-lg shadow-lg">
                  <LogIn className="w-5 h-5 mr-2" />
                  Login to Continue
                </Button>
              </Link>
              <Link href="/register" className="w-full">
                <Button
                  variant="outline"
                  className="w-full border-white/30 text-white hover:bg-white/10 hover:border-white/50 font-semibold py-6 text-lg bg-transparent"
                >
                  Create Account
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-24 bg-[#0b1d26] text-white">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#d4a24c]/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#d4a24c]/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-[#d4a24c]/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="mx-3 md:max-w-7xl md:mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center gap-4 mb-6">
            <div>
              <h1 className={`${playfair.className} text-4xl md:text-5xl font-black text-white mb-2`}>
                Your <span className="text-[#d4a24c] italic">Reservation</span>
              </h1>
              <p className="text-white/70 text-lg">Track your dining experience in one place</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <div className="space-y-2">

            {/* Filters */}
            <div className="mx-auto md:mx-10 lg:mx-auto backdrop-blur-sm h-fit lg:top-6 bg-[#0c222b] rounded-2xl p-8 border border-[#a47015]/60 text-center hover:border-[#d4a24c]/40 transition shadow-[0_0_20px_rgba(212,162,76,0.35)]">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-4 h-4 text-[#d4a24c]" />
                <span className="text-md font-semibold text-white uppercase tracking-wide">Status</span>
              </div>

              <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${activeFilter === "all" ? "bg-white text-[#0c222b] shadow" : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                >
                  All ({getStatusCount("all")})
                </button>

                <button
                  onClick={() => setActiveFilter("confirmed")}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${activeFilter === "confirmed" ? "bg-blue-500 text-white shadow" : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                >
                  Confirmed ({getStatusCount("confirmed")})
                </button>

                <button
                  onClick={() => setActiveFilter("completed")}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${activeFilter === "completed" ? "bg-emerald-500 text-white shadow" : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                >
                  Completed ({getStatusCount("completed")})
                </button>

                <button
                  onClick={() => setActiveFilter("cancelled")}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${activeFilter === "cancelled" ? "bg-red-500 text-white shadow" : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                >
                  Cancelled ({getStatusCount("cancelled")})
                </button>
              </div>
            </div>

            <div className="mt-5 text-center">
              <Button asChild className="bg-white hover:bg-white/90 text-[#0c222b] font-bold text-md shadow-lg rounded-2xl">
                <Link href="/reservations">
                  <Plus className="w-4 h-4 mr-2" /> Make New Reservation
                </Link>
              </Button>
            </div>
          </div>

          {/* Content */}
          {filteredReservations.length === 0 ? (
            <div className="flex items-center justify-center">
              <Card className="max-w-lg w-full bg-[#0c222b] border border-[#d4a24c]/40 rounded-3xl shadow-[0_0_40px_rgba(212,162,76,0.2)] text-center p-10">

                {/* Icon */}
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#d4a24c]/10 flex items-center justify-center">
                  <Calendar className="w-12 h-12 text-[#d4a24c]" />
                </div>

                {/* Text */}
                <h2 className="text-3xl font-bold mb-3 text-gray-100">
                  No Reservations Found
                </h2>

                <p className="text-white/60 mb-8">
                  {activeFilter === "all"
                    ? "You haven't made any reservations yet."
                    : `No ${activeFilter} reservations available.`}
                </p>

                {/* CTA */}
                <Button
                  asChild
                  className="bg-[#d4a24c] hover:bg-[#d4a24c]/90 text-black font-semibold px-8 py-5 rounded-xl shadow-lg hover:scale-105 transition"
                >
                  <Link href="/reservations">
                    <Plus className="w-4 h-4 mr-2" />
                    Book Your First Table
                  </Link>
                </Button>

              </Card>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {filteredReservations.map((reservation) => (
                <Card
                  key={reservation.id}
                  className="mx-5 group bg-[#0f1f2b]/60 backdrop-blur-2xl border border-white/10 hover:border-[#d4a24c]/40 transition-all duration-500 hover:shadow-[0_0_40px_rgba(212,162,76,0.25)] rounded-2xl overflow-hidden"
                >
                  {/* HEADER */}
                  <div className="px-6 py-5 border-b border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                    <div className="space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-white font-bold text-xl md:text-2xl tracking-tight">
                          {reservation.occasion}
                        </h2>

                        <span className="text-white/40 text-sm font-mono">
                          #{reservation.reservation_number}
                        </span>
                      </div>

                      <p className="text-white/40 text-xs">
                        Created{" "}
                        {new Date(reservation.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge
                        className={`${getStatusColor(
                          reservation.status
                        )} px-3 py-1 rounded-full border text-xs font-semibold`}
                      >
                        {getStatusIcon(reservation.status)}
                        <span className="ml-1 capitalize">{reservation.status}</span>
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-6">

                    {/* TOP SUMMARY STRIP */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        {
                          label: "Date",
                          value: new Date(reservation.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "2-digit",
                          }),
                          icon: Calendar,
                        },
                        {
                          label: "Time",
                          value: reservation.time,
                          icon: Clock,
                        },
                        {
                          label: "Guests",
                          value: `${reservation.guests}`,
                          icon: Users,
                        },
                        {
                          label: "Dining",
                          value: reservation.dining_preference || "-",
                          icon: ChefHat,
                        },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="bg-white/5 border border-white/10 rounded-xl p-3"
                        >
                          <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                            <item.icon className="w-3.5 h-3.5 text-[#d4a24c]" />
                            {item.label}
                          </div>
                          <p className="text-white font-semibold text-sm truncate">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* INFO GRID */}
                    <div className="grid md:grid-cols-2 gap-6">

                      {/* LEFT */}
                      <div className="space-y-4 bg-white/5 border border-white/10 rounded-xl p-5">
                        <h3 className="text-white/60 text-xs uppercase tracking-widest font-semibold">
                          Guest Info
                        </h3>

                        <div className="space-y-3 text-sm">
                          <InfoRow icon={User} label="Name" value={reservation.name} />
                          <InfoRow icon={Mail} label="Email" value={reservation.email} />
                          <InfoRow icon={Phone} label="Phone" value={reservation.phone} />
                        </div>
                      </div>

                      {/* RIGHT */}
                      <div className="space-y-4 bg-white/5 border border-white/10 rounded-xl p-5">
                        <h3 className="text-white/60 text-xs uppercase tracking-widest font-semibold">
                          Occasion & Notes
                        </h3>

                        <div className="space-y-3 text-sm">
                          <InfoRow
                            icon={Calendar}
                            label="Occasion"
                            value={reservation.occasion || "-"}
                          />

                          {reservation.special_requests && (
                            <div className="pt-2">
                              <p className="text-white/40 text-xs mb-1">Special Requests</p>
                              <p className="text-white text-sm leading-relaxed">
                                {reservation.special_requests}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* PAYMENT BAR */}
                    <div className="bg-gradient-to-r from-white/5 to-white/0 border border-white/10 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">

                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge className="bg-white/10 text-white border-white/10">
                          ₱{reservation.reservation_fee || "0.00"}
                        </Badge>

                        <Badge className="bg-white/10 text-white border-white/10">
                          {reservation.payment_method || "No Method"}
                        </Badge>

                        {reservation.payment_reference && (
                          <Badge className="bg-white/10 text-white border-white/10">
                            Ref: {reservation.payment_reference}
                          </Badge>
                        )}
                      </div>

                      {reservation.payment_receipt && (
                        <button
                          onClick={() => setSelectedReceipt(reservation.payment_receipt)}
                          className="text-sm text-[#d4a24c] hover:text-white transition underline"
                        >
                          View Receipt
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>

              ))}
            </div>
          )}
        </div>

        {selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">

            <div className="mx-5 md:mx-auto bg-[#0b1d26] border border-[#d4a24c]/30 rounded-2xl w-full max-w-3xl p-4 relative shadow-2xl">

              {/* CLOSE */}
              <button
                onClick={() => setSelectedReceipt(null)}
                className="absolute top-3 right-3 text-white hover:text-[#d4a24c]"
              >
                ✕
              </button>

              {/* TITLE */}
              <h2 className="text-white font-bold text-lg mb-4">
                Payment Receipt
              </h2>

              {/* CONTENT */}
              <div className="w-full max-h-[80vh] overflow-auto rounded-xl border border-white/10 bg-black">
                <img
                  src={getReceiptUrl(selectedReceipt)}
                  alt="Receipt"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default ReservationsHistory

const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: any
  label: string
  value: string
}) => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex items-center gap-2 text-white/50">
      <Icon className="w-4 h-4 text-[#d4a24c]" />
      <span>{label}</span>
    </div>
    <span className="text-white font-medium truncate max-w-[60%]">
      {value}
    </span>
  </div>
)
