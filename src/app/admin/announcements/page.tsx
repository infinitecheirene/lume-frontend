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
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
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
      setIsLoading(true)
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
      setIsLoading(false)
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

  return (
    <SidebarProvider defaultOpen={!isDesktop}>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-yellow-50 to-yellow-50">
        <AppSidebar />
        <div className={`flex-1 min-w-0 ${isDesktop ? "ml-0" : "ml-72"}`}>
          {isDesktop && (
            <div className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b bg-white px-4 shadow-sm">
              <SidebarTrigger className="-ml-1" />
              <Image src="/logo.jpg" alt="Lumè Logo" width={40} height={40} className="object-contain" />
              <h1 className="text-lg font-bold text-gray-900">Lumè Bean and Bar</h1>
            </div>
          )}

          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
            <div className="max-w-full space-y-4 sm:space-y-6">
              {/* Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Announcements Management</h1>
                    <p className="text-gray-600 mt-1">Manage your restaurant&apos;s announcements and promos</p>
                  </div>

                  {/* Adding New Announcement */}
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingAnnouncement(null)
                          setFormData({ title: "", description: "", type: "", badge: "", is_active: true })
                        }}
                        className="bg-yellow-600 hover:bg-orange-700 w-full md:w-auto"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        New Announcement
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="text-black">
                      <DialogHeader>
                        <DialogTitle>{editingAnnouncement ? "Edit Announcement" : "Create New Announcement"}</DialogTitle>
                        <DialogDescription>
                          {editingAnnouncement ? "Update your announcement details" : "Create a new announcement for your customers"}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Title</Label>
                          <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Enter announcement title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="content">Content</Label>
                          <Textarea
                            id="content"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Enter announcement description"
                            rows={4}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="type">Type</Label>
                          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                            <SelectTrigger id="type">
                              <SelectValue placeholder="Select announcement type" />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value="news">News</SelectItem>
                              <SelectItem value="promo">Promo</SelectItem>
                              <SelectItem value="event">Event</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="badge">Badge (optional)</Label>
                          <Input
                            id="badge"
                            value={formData.badge}
                            onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                            placeholder="e.g. New, Hot, Limited"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="is_active">Active</Label>
                          <Switch
                            id="is_active"
                            checked={formData.is_active}
                            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={editingAnnouncement ? handleUpdate : handleCreate}
                          disabled={isSubmitting}
                          className="bg-yellow-600 hover:bg-yellow-700"
                        >
                          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          {editingAnnouncement ? "Update" : "Create"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="flex flex-col gap-2">
                  {/* Active and Inactive Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="border-l-4 border-green-500 h-[96px]">
                      <CardContent className="p-5 flex items-center justify-between h-full">
                        <div>
                          <p className="text-sm text-gray-600">Active Announcements</p>
                          <h2 className="text-xl font-bold text-gray-900">{activeCount}</h2>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-red-500 h-[96px]">
                      <CardContent className="p-5 flex items-center justify-between h-full">
                        <div>
                          <p className="text-sm text-gray-600">Inactive Announcements</p>
                          <h2 className="text-xl font-bold text-gray-900">{inactiveCount}</h2>
                        </div>
                        <div className="p-3 bg-red-100 rounded-full">
                          <XCircle className="w-6 h-6 text-red-600" />
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
            <div className="space-y-4 grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {isLoading ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Loader2 className="w-8 h-8 text-orange-600 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600">Loading announcements...</p>
                  </CardContent>
                </Card>
              ) : announcements.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No announcements yet</p>
                    <p className="text-sm text-gray-500 mt-1">Create your first announcement to get started</p>
                  </CardContent>
                </Card>
              ) : (
                filteredAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="">
                    <Card className="overflow-hidden flex flex-col h-[220px]">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <Badge variant={announcement.is_active ? "default" : "secondary"}>{announcement.is_active ? "Active" : "Inactive"}</Badge>
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg font-bold">{announcement.title}</CardTitle>
                            </div>
                            <CardDescription className="flex items-center gap-2 text-sm">
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

                                  <AlertDialogContent className="text-black">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this announcement? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>

                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(announcement.id)} className="bg-yellow-600 hover:bg-yellow-700">
                                        Yes, Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700">{announcement.description}</p>
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
