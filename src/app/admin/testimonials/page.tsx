"use client"

import Image from "next/image"
import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Search, Plus, Eye, Edit, Loader2 } from "lucide-react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Playfair_Display } from "next/font/google"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

interface Testimonial {
  id: number
  client_name: string
  client_email: string
  rating: number
  message: string
  status: "pending" | "approved" | "rejected"
  created_at: string
}

const ITEMS_PER_PAGE = 10

export default function TestimonialsAdmin() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)

  // Separate states for modals
  const [addOpen, setAddOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)

  const [viewTestimonial, setViewTestimonial] = useState<Testimonial | null>(null)
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)

  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    rating: 1,
    message: "",
    status: "pending" as "pending" | "approved" | "rejected",
  })
  const [rowStatuses, setRowStatuses] = useState<Record<number, Testimonial["status"]>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [overallRating, setOverallRating] = useState(0)
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth < 1024) // lg breakpoint
    }
    checkDesktop()
    window.addEventListener("resize", checkDesktop)
    return () => window.removeEventListener("resize", checkDesktop)
  }, [])

  // Fetch testimonials
  useEffect(() => {
    fetchTestimonials()
  }, [])

  // Initialize row statuses
  useEffect(() => {
    const initialStatuses: Record<number, Testimonial["status"]> = {}
    testimonials.forEach((t) => {
      initialStatuses[t.id] = t.status
    })
    setRowStatuses(initialStatuses)
  }, [testimonials])

  // Update overall rating
  useEffect(() => {
    if (testimonials.length === 0) return setOverallRating(0)
    const avg = testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length
    setOverallRating(Number(avg.toFixed(1)))
  }, [testimonials])

  async function fetchTestimonials() {
    try {
      setLoading(true)
      const res = await fetch("/api/testimonials")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setTestimonials(Array.isArray(data) ? data : data.data || [])
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Failed to fetch testimonials", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/testimonials/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast({ title: "Deleted", description: "Testimonial deleted successfully" })
      fetchTestimonials()
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Failed to delete testimonial", variant: "destructive" })
    } finally {
      setDeleteOpen(false)
      setDeleteId(null)
    }
  }

  function openAddModal() {
    setEditingTestimonial(null)
    setFormData({
      client_name: "",
      client_email: "",
      rating: 1,
      message: "",
      status: "pending",
    })
    setFormOpen(true)
  }

  function openEditModal(t: Testimonial) {
    setEditingTestimonial(t)
    setFormData({
      client_name: t.client_name,
      client_email: t.client_email,
      rating: t.rating,
      message: t.message,
      status: t.status,
    })
    setFormOpen(true)
  }

  function openViewModal(t: Testimonial) {
    setViewTestimonial(t)
    setViewOpen(true)
  }

  async function handleSave() {
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.client_email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const method = editingTestimonial ? "PUT" : "POST"
      const url = editingTestimonial ? `/api/testimonials/${editingTestimonial.id}` : "/api/testimonials"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Failed to save testimonial")

      toast({
        title: "Success",
        description: editingTestimonial ? "Updated" : "Created",
      })

      setEditingTestimonial(null)
      setFormOpen(false)
      fetchTestimonials()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save testimonial",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter & paginate
  const filtered = testimonials.filter(
    (t) =>
      t.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.message.toLowerCase().includes(searchTerm.toLowerCase()),
  )
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
  const paginated = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE)

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
                  <p className="text-lg font-semibold text-white">Loading Testimonials</p>
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

          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
            <div className="max-w-full space-y-4 sm:space-y-6">
              {/* Header & Overall Rating */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Testimonials Management</h1>
                  <p className="text-gray-600 mt-1">Manage what says about your restaurant</p>
                </div>
                <Card className="p-4">
                  <CardContent>
                    <p className="text-lg font-semibold">Overall Rating</p>
                    <h2 className="text-3xl font-bold text-yellow-500 flex items-center gap-2">
                      {overallRating} <span className="text-xl">{"★".repeat(Math.round(overallRating))}</span>
                    </h2>
                  </CardContent>
                </Card>
              </div>

              {/* Testimonials Table */}
              <Card className="bg-white/70 backdrop-blur-sm shadow-xl p-0 pb-5 border-blue-100">
                <CardHeader className="p-3 bg-[#162A3A] text-white rounded-t-lg">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Search Input */}
                    <div className="relative w-full sm:max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-950" />
                      <Input
                        placeholder="Search by name, email, or message..."
                        value={searchTerm || ""}
                        onChange={(event) => {
                          setSearchTerm(event.target.value)
                          setCurrentPage(1)
                        }}
                        className="pl-9 pr-3 py-2 w-full bg-blue-100 border-blue-950 text-gray-950 placeholder:text-gray-950 focus:bg-blue-50 focus:border-blue-500 transition-all duration-200"
                      />
                    </div>

                    {/* Button */}
                    <Button onClick={openAddModal} className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600">
                      <Plus className="w-4 h-4 mr-2" />
                      New Testimonial
                    </Button>
                  </div>
                </CardHeader>

                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading testimonials...</div>
                  ) : paginated.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">{testimonials.length === 0 ? "No testimonials yet" : "No results found"}</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b bg-gray-50">
                          <tr>
                            <th className="text-left py-3 px-4 font-semibold">Name</th>
                            <th className="text-left py-3 px-4 font-semibold">Email</th>
                            <th className="text-left py-3 px-4 font-semibold">Rating</th>
                            <th className="text-left py-3 px-4 font-semibold">Message</th>
                            <th className="text-left py-3 px-4 font-semibold">Status</th>
                            <th className="text-left py-3 px-4 font-semibold">Date</th>
                            <th className="text-left py-3 px-4 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginated.map((t) => (
                            <tr key={t.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium">{t.client_name}</td>
                              <td className="py-3 px-4 text-gray-600">{t.client_email}</td>
                              <td className="py-3 px-4 text-yellow-500">{"★".repeat(t.rating)}</td>
                              <td className="py-3 px-4 max-w-xs truncate">{t.message}</td>
                              <td className="py-3 px-4 capitalize">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${t.status === "approved" ? "bg-green-100 text-green-800" : t.status === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
                                >
                                  {t.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-gray-600">{new Date(t.created_at).toLocaleDateString()}</td>
                              <td className="py-3 px-4 flex items-center gap-2">
                                <Button size="sm" variant="outline" className="bg-transparent border-0" onClick={() => openViewModal(t)}>
                                  <Eye className="w-4 h-4" />
                                </Button>

                                <Button size="sm" variant="outline" className="bg-transparent border-0" onClick={() => openEditModal(t)}>
                                  <Edit className="w-4 h-4" />
                                </Button>

                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setDeleteId(t.id)
                                    setDeleteOpen(true)
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* view modal */}
              <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                <DialogContent className="text-black max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Testimonial Details</DialogTitle>
                    <DialogDescription>View testimonial information.</DialogDescription>
                  </DialogHeader>

                  {viewTestimonial && (
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-semibold">Client Name</p>
                        <p className="text-gray-700">{viewTestimonial.client_name}</p>
                      </div>

                      <div>
                        <p className="font-semibold">Email</p>
                        <p className="text-gray-700">{viewTestimonial.client_email}</p>
                      </div>

                      <div>
                        <p className="font-semibold">Rating</p>
                        <p className="text-yellow-500">{"★".repeat(viewTestimonial.rating)}</p>
                      </div>

                      <div>
                        <p className="font-semibold">Message</p>
                        <p className="text-gray-700 whitespace-pre-wrap">{viewTestimonial.message}</p>
                      </div>

                      <div>
                        <p className="font-semibold">Status</p>
                        <p className="capitalize text-gray-700">{viewTestimonial.status}</p>
                      </div>

                      <div>
                        <p className="font-semibold">Date</p>
                        <p className="text-gray-700">{new Date(viewTestimonial.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* add/edit modal */}
              <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="text-black">
                  <DialogHeader>
                    <DialogTitle>{editingTestimonial ? "Update Testimonial" : "New Testimonial"}</DialogTitle>
                    <DialogDescription>{editingTestimonial ? "Update testimonial details." : "Add a new testimonial."}</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="client_name">Client Name</Label>
                      <Input
                        id="client_name"
                        value={formData.client_name}
                        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client_email">Client Email</Label>
                      <Input
                        id="client_email"
                        type="email"
                        value={formData.client_email}
                        onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Rating</Label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Button
                            key={star}
                            type="button"
                            size="sm"
                            onClick={() => setFormData({ ...formData, rating: star })}
                            className={formData.rating >= star ? "bg-yellow-400 hover:bg-amber-500" : "bg-gray-200 hover:bg-yellow-400"}
                          >
                            ★
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(val: Testimonial["status"]) => setFormData({ ...formData, status: val })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button onClick={handleSave} disabled={isSubmitting} className="bg-yellow-500 hover:bg-yellow-600">
                      {editingTestimonial ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Delete Confirmation Modal */}
              <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-black">Delete Testimonial</DialogTitle>
                    <DialogDescription>Are you sure you want to delete this testimonial? This action cannot be undone.</DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDeleteOpen(false)
                        setDeleteId(null)
                      }}
                      className="bg-transparent text-black"
                    >
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
