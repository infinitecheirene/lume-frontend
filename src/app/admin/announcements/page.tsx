"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge, badgeVariants } from "@/components/ui/badge"
import { Megaphone, Plus, Edit, Trash2, Calendar, Eye, EyeOff, Loader2, MoreHorizontal } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Search, CheckCircle, XCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Playfair_Display } from "next/font/google"
import { useAdminRoute } from "@/hooks/use-protected-route"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

interface Announcement {
  id: number
  title: string
  description: string
  type: string
  badge?: string
  is_active: boolean
  created_at: string
}

export default function AdminAnnouncementsPage() {
  useAdminRoute() // Protect this route - only admins can access
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    badge: "",
    is_active: true,
  })

  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth < 1024) // lg breakpoint
    }
    checkDesktop()
    window.addEventListener("resize", checkDesktop)
    return () => window.removeEventListener("resize", checkDesktop)
  }, [])

  const activeCount = announcements.filter((a) => a.is_active).length
  const inactiveCount = announcements.filter((a) => !a.is_active).length

  const filteredAnnouncements = announcements.filter(
    (a) => a.title.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase()),
  )

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/announcements", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch announcements: ${response.status}`)
      }

      const data = await response.json()
      setAnnouncements(Array.isArray(data) ? data : data.data || [])
    } catch (error) {
      console.error("Error fetching announcements:", error)
      toast({
        title: "Error",
        description: "Failed to fetch announcements",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and description are required",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to create announcement")
      }

      const newAnnouncement = await response.json()
      setAnnouncements([newAnnouncement, ...announcements])
      setIsDialogOpen(false)
      setFormData({ title: "", description: "", type: "", badge: "", is_active: true })
      toast({
        title: "Success",
        description: "Announcement created successfully",
      })
    } catch (error) {
      console.error("Error creating announcement:", error)
      toast({
        title: "Error",
        description: "Failed to create announcement",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setFormData({
      title: announcement.title,
      description: announcement.description,
      is_active: announcement.is_active,
      type: announcement.type,
      badge: announcement.badge || "",
    })
    setIsDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingAnnouncement) return

    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and description are required",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/announcements/${editingAnnouncement.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to update announcement")
      }

      const updatedAnnouncement = await response.json()
      setAnnouncements(announcements.map((a) => (a.id === editingAnnouncement.id ? updatedAnnouncement : a)))
      setIsDialogOpen(false)
      setEditingAnnouncement(null)
      setFormData({ title: "", description: "", type: "", badge: "", is_active: true })
      toast({
        title: "Success",
        description: "Announcement updated successfully",
      })
    } catch (error) {
      console.error("Error updating announcement:", error)
      toast({
        title: "Error",
        description: "Failed to update announcement",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete announcement")
      }

      setAnnouncements(announcements.filter((a) => a.id !== id))
      toast({
        title: "Success",
        description: "Announcement deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting announcement:", error)
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive",
      })
    }
  }

  const toggleActive = async (announcement: Announcement) => {
    try {
      const response = await fetch(`/api/announcements/${announcement.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: announcement.title,
          description: announcement.description,
          type: announcement.type,
          badge: announcement.badge || "",
          is_active: !announcement.is_active,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to toggle announcement")
      }

      const updatedAnnouncement = await response.json()
      setAnnouncements(announcements.map((a) => (a.id === announcement.id ? updatedAnnouncement : a)))
      toast({
        title: "Success",
        description: `Announcement ${!announcement.is_active ? "activated" : "deactivated"}`,
      })
    } catch (error) {
      console.error("Error toggling announcement:", error)
      toast({
        title: "Error",
        description: "Failed to toggle announcement status",
        variant: "destructive",
      })
    }
  }
  
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
                  <p className="text-lg font-semibold text-white">Loading Announcements</p>
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
          )}-

          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
            <div className="max-w-full space-y-4 sm:space-y-6">
              {/* Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Announcements Management</h1>
                    <p className="text-gray-600 mt-1">Manage your restaurant&apos;s announcements and promos</p>
                  </div>

                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingAnnouncement(null)
                          setFormData({ title: "", description: "", type: "", badge: "", is_active: true })
                        }}
                        className="bg-[#162A3A] hover:bg-[#1e3a50] text-white rounded-xl shadow-md w-full md:w-auto"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        New Announcement
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border-0 shadow-2xl p-0 text-gray-950">
                      <div className="sticky top-0 z-10 bg-[#162A3A] px-6 py-5 rounded-t-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-bold text-white">{editingAnnouncement ? "Edit Announcement" : "Create New Announcement"}</DialogTitle>
                          <p className="text-white/50 text-sm mt-0.5">{editingAnnouncement ? "Update your announcement details" : "Create a new announcement for your customers"}</p>
                        </DialogHeader>
                      </div>
                      <div className="p-5 space-y-4 bg-[#f5f0e8]">
                        <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                          <div className="px-5 py-3 bg-gradient-to-r from-[#162A3A] to-[#1e3a50] flex items-center gap-2">
                            <span className="text-[#d4a24c] text-sm font-semibold uppercase tracking-wider">Announcement Details</span>
                          </div>
                          <div className="p-5 bg-white space-y-4">
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title <span className="text-red-500 ml-0.5">*</span></label>
                              <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Enter announcement title"
                                className="h-9 bg-white border-gray-200"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description <span className="text-red-500 ml-0.5">*</span></label>
                              <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Enter announcement description"
                                rows={4}
                                className="bg-white border-gray-200 resize-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                                  <SelectTrigger className="h-9 bg-white border-gray-200">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="news">News</SelectItem>
                                    <SelectItem value="promo">Promo</SelectItem>
                                    <SelectItem value="event">Event</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Badge (optional)</label>
                                <Input
                                  value={formData.badge}
                                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                                  placeholder="e.g. New, Hot, Limited"
                                  className="h-9 bg-white border-gray-200"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <label className="block text-sm font-medium text-gray-700">Active</label>
                              <Switch
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3 pb-2">
                          <Button variant="outline" className="flex-1 h-10 text-gray-600 border-gray-300 bg-white" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                          <Button
                            onClick={editingAnnouncement ? handleUpdate : handleCreate}
                            disabled={isSubmitting}
                            className="flex-1 h-10 bg-[#162A3A] hover:bg-[#1e3a50] text-white rounded-xl font-semibold shadow-md"
                          >
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editingAnnouncement ? "Update Announcement" : "Create Announcement"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="flex flex-col gap-2">
                  {/* Active and Inactive Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="rounded-2xl border border-gray-100 shadow-xl p-0 pb-5">
                      <CardContent className="p-5 flex items-center justify-between h-full">
                        <div>
                          <p className="text-sm text-gray-600">Active Announcements</p>
                          <h2 className="text-2xl font-bold text-gray-900">{activeCount}</h2>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl border border-gray-100 shadow-xl p-0 pb-5">
                      <CardContent className="p-5 flex items-center justify-between h-full">
                        <div>
                          <p className="text-sm text-gray-600">Inactive Announcements</p>
                          <h2 className="text-2xl font-bold text-gray-900">{inactiveCount}</h2>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                          <XCircle className="w-5 h-5 text-red-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Search Bar */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-800" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search announcements..."
                        className="pl-9 bg-gray-100 text-black"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Announcements List */}
            <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {loading ? (
                <Card className="col-span-full rounded-2xl border border-gray-100 shadow-xl p-0 pb-5">
                  <CardContent className="text-center py-12">
                    <Loader2 className="w-8 h-8 text-[#d4a24c] mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600">Loading announcements...</p>
                  </CardContent>
                </Card>
              ) : filteredAnnouncements.length === 0 ? (
                <Card className="col-span-full rounded-2xl border border-gray-100 shadow-xl p-0 pb-5">
                  <CardContent className="text-center py-12">
                    <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No announcements yet</p>
                    <p className="text-sm text-gray-500 mt-1">Create your first announcement to get started</p>
                  </CardContent>
                </Card>
              ) : (
                filteredAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="">
                    <Card className="overflow-hidden flex flex-col h-[220px] rounded-2xl border border-gray-100 shadow-xl">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <Badge variant={announcement.is_active ? "default" : "secondary"} className={announcement.is_active ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-gray-100 text-gray-600 border-gray-200"}>{announcement.is_active ? "Active" : "Inactive"}</Badge>
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg font-bold text-gray-900">{announcement.title}</CardTitle>
                            </div>
                            <CardDescription className="flex items-center gap-2 text-sm text-gray-500">
                              <Calendar className="w-4 h-4" />
                              {new Date(announcement.created_at).toLocaleDateString("en-US", {
                                month: "long",
                                day: "2-digit",
                                year: "numeric",
                              })}
                            </CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Button variant="ghost" size="sm" onClick={() => toggleActive(announcement)}>
                                  {announcement.is_active ? (
                                    <span className="flex items-center gap-3">
                                      <EyeOff className="w-4 h-4" />
                                      Deactivate
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-3">
                                      <Eye className="w-4 h-4" />
                                      Activate
                                    </span>
                                  )}
                                </Button>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(announcement)}>
                                  <span className="flex items-center gap-3">
                                    <Edit className="w-4 h-4" /> Edit
                                  </span>
                                </Button>
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                      <span className="flex items-center gap-3">
                                        <Trash2 className="w-4 h-4" /> Delete
                                      </span>
                                    </Button>
                                  </AlertDialogTrigger>

                                  <AlertDialogContent className="w-[92vw] max-w-sm rounded-2xl border-0 shadow-2xl p-0 overflow-hidden">
                                    <div className="bg-[#162A3A] px-6 py-5">
                                      <AlertDialogTitle className="text-xl font-bold text-white">Delete Announcement?</AlertDialogTitle>
                                      <p className="text-white/50 text-sm mt-1">This action cannot be undone.</p>
                                    </div>
                                    <div className="p-6 space-y-5 bg-white">
                                      <p className="text-sm text-gray-700">Are you sure you want to delete this announcement? This action cannot be undone.</p>
                                      <div className="flex gap-2 pt-1">
                                        <AlertDialogCancel className="flex-1 text-gray-700 border-gray-200">Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(announcement.id)} className="flex-1 bg-[#162A3A] hover:bg-[#1e3a50] text-white rounded-xl">Yes, Delete</AlertDialogAction>
                                      </div>
                                    </div>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="text-gray-700 line-clamp-3">{announcement.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                ))
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
