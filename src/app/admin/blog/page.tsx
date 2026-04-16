"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Edit2, Plus, Search, Underline, Loader2 } from "lucide-react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Playfair_Display } from "next/font/google"
import { Switch } from "@/components/ui/switch"
import { useAdminRoute } from "@/hooks/use-protected-route"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

interface BlogPost {
  id: number
  title: string
  excerpt: string
  content: string
  author: string
  image?: string
  video_url?: string
  thumbnail?: string
  draft: boolean
  created_at: string
}

export default function BlogPostsAdmin() {
  useAdminRoute() // Protect this route - only admins can access
  const { toast } = useToast()

  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [draftFilter, setDraftFilter] = useState<"all" | "draft" | "published">("all")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<"media" | "image">("media")
  const [viewPost, setViewPost] = useState<BlogPost | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploadingVideo, setUploadingVideo] = useState(false)

  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth < 1024)
    checkDesktop()
    window.addEventListener("resize", checkDesktop)
    return () => window.removeEventListener("resize", checkDesktop)
  }, [])

  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    author: "",
    image: null as File | null,
    imageUrl: "",
    thumbnail: null as File | null,
    thumbnailUrl: "",
    videoUrl: "",
    draft: false,
  })

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    try {
      const res = await fetch("/api/blog-posts")
      const data = await res.json()
      setPosts(data)
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch blog posts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // VIDEO CHUNK UPLOAD
  async function uploadVideoChunked(file: File): Promise<string> {
    const uploadId = crypto.randomUUID()
    const chunkSize = 5 * 1024 * 1024
    const totalChunks = Math.ceil(file.size / chunkSize)

    setUploadingVideo(true)

    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize
        const end = Math.min(file.size, start + chunkSize)
        const chunk = file.slice(start, end)

        const form = new FormData()
        form.append("upload_id", uploadId)
        form.append("chunk_index", String(i))
        form.append("total_chunks", String(totalChunks))
        form.append("file", chunk)

        const res = await fetch("/api/blog-posts/video", {
          method: "POST",
          body: form,
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data?.message || "Upload failed")
        }

        if (data.completed) {
          return data.video_url
        }
      }

      throw new Error("Upload incomplete")
    } finally {
      setUploadingVideo(false)
    }
  }

  // SUBMIT BLOG POST
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId && (!videoFile || !formData.thumbnail) && !formData.image) {
      toast({
        title: "Missing Media",
        description: "Please upload a video with thumbnail or an image before saving.",
        variant: "destructive",
      })
      return
    }

    try {
      let videoUrl = ""

      const form = new FormData()

      form.append("title", formData.title)
      form.append("excerpt", formData.excerpt)
      form.append("content", formData.content)
      form.append("author", formData.author)

      form.append("draft", formData.draft ? "1" : "0")

      // IMAGE
      if (formData.image instanceof File) {
        form.append("image", formData.image)
      }

      // THUMBNAIL
      if (formData.thumbnail instanceof File) {
        form.append("thumbnail", formData.thumbnail)
      }

      if (videoFile) {
        videoUrl = await uploadVideoChunked(videoFile)
      }

      if (videoFile && !videoUrl) {
        throw new Error("Video upload failed, no URL returned")
      }

      if (videoUrl) {
        form.append("video_url", videoUrl)
      }

      const url = editingId ? `/api/blog-posts/${editingId}` : "/api/blog-posts"

      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, { method, body: form })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to save post")
      }

      toast({
        title: "Success",
        description: editingId ? "Post updated" : "Post created",
      })

      setFormData({
        title: "",
        excerpt: "",
        content: "",
        author: "",
        image: null as File | null,
        imageUrl: "",
        thumbnail: null as File | null,
        thumbnailUrl: "",
        videoUrl: "",
        draft: false,
      })

      setVideoFile(null)
      setEditingId(null)
      setIsDialogOpen(false)

      fetchPosts()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save blog post",
        variant: "destructive",
      })
    }
  }

  function handleEdit(post: BlogPost) {
    setFormData({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      author: post.author,
      image: null,
      thumbnail: null,
      draft: post.draft,
      imageUrl: post.image || "",
      thumbnailUrl: post.thumbnail || "",
      videoUrl: post.video_url || "",
    })
    setEditingId(post.id)
    setIsDialogOpen(true)
    setActiveTab(post.video_url ? "media" : "image")
  }

  async function handleDelete() {
    if (!deleteId) return

    await fetch(`/api/blog-posts/${deleteId}`, { method: "DELETE" })
    fetchPosts()

    setDeleteOpen(false)
    setDeleteId(null)
  }

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase()) || post.content.toLowerCase().includes(search.toLowerCase())

    const matchesDraft = draftFilter === "all" ? true : draftFilter === "draft" ? (post as any).draft === 1 : (post as any).draft === 0

    return matchesSearch && matchesDraft
  })

  const getImageUrl = (imagePath?: string): string => {
    if (!imagePath) return "/placeholder.jpg"
    if (imagePath.startsWith("http")) return imagePath

    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    const clean = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath

    return `${base}/${clean}`
  }

  const getVideoUrl = (videoPath?: string): string => {
    if (!videoPath) return "/placeholder.jpg"
    if (videoPath.startsWith("http")) return videoPath

    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    const clean = videoPath.startsWith("/") ? videoPath.slice(1) : videoPath

    return `${base}/${clean}`
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
                  <p className="text-lg font-semibold text-white">Loading Blog Posts</p>
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
          {/* TOP BAR */}
          {isDesktop && (
            <div className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b bg-[#162A3A] px-4 shadow-sm">
              <SidebarTrigger className="-ml-1" />

              <Image src="/logo.jpg" alt="Lumè Bean and Bar Logo" width={40} height={40} className="rounded-full object-contain" />

              <h1 className={`${playfair.className} text-lg font-semibold text-white`}>Lumè Bean and Bar</h1>
            </div>
          )}

          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
            <div className="max-w-full space-y-6">
              {/* HEADER */}
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                {/* TITLE */}
                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Blog Post Management</h1>
                  <p className="text-sm sm:text-base text-gray-600">Manage your restaurant&apos;s blog posts.</p>
                </div>

                {/* RIGHT CONTROLS */}
                <div className="flex flex-col gap-4 w-full md:w-auto md:items-end">
                  {/* SEARCH */}
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-yellow-600" />
                    <Input
                      placeholder="Search posts..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 border-yellow-200 text-black focus:border-yellow-500 focus:ring-yellow-400 bg-white w-full"
                    />
                  </div>

                  {/* FILTERS */}
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <Button
                      size="sm"
                      className={
                        draftFilter === "all"
                          ? "bg-yellow-600 hover:bg-yellow-500 text-white"
                          : "border border-yellow-300 text-yellow-700 hover:bg-yellow-500 hover:text-yellow-700"
                      }
                      variant={draftFilter === "all" ? "default" : "outline"}
                      onClick={() => setDraftFilter("all")}
                    >
                      All
                    </Button>

                    <Button
                      size="sm"
                      className={
                        draftFilter === "draft"
                          ? "bg-yellow-600 hover:bg-yellow-500 text-white"
                          : "border border-yellow-300 text-yellow-700 hover:bg-yellow-500 hover:text-yellow-700"
                      }
                      variant={draftFilter === "draft" ? "default" : "outline"}
                      onClick={() => setDraftFilter("draft")}
                    >
                      Draft
                    </Button>

                    <Button
                      size="sm"
                      className={
                        draftFilter === "published"
                          ? "bg-yellow-600 hover:bg-yellow-500 text-white"
                          : "border border-yellow-300 text-yellow-700 hover:bg-yellow-500 hover:text-yellow-700"
                      }
                      variant={draftFilter === "published" ? "default" : "outline"}
                      onClick={() => setDraftFilter("published")}
                    >
                      Published
                    </Button>
                  </div>

                  {/* CREATE BUTTON */}
                  <Dialog
                    open={isDialogOpen}
                    onOpenChange={(open) => {
                      setIsDialogOpen(open)

                      if (!open) {
                        setActiveTab("media")
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        className="gap-2 bg-yellow-600 hover:bg-yellow-500"
                        onClick={() => {
                          setEditingId(null)
                          setVideoFile(null)
                          setFormData({
                            title: "",
                            excerpt: "",
                            content: "",
                            author: "",
                            image: null as File | null,
                            imageUrl: "",
                            thumbnail: null as File | null,
                            thumbnailUrl: "",
                            videoUrl: "",
                            draft: false,
                          })
                        }}
                      >
                        <Plus size={16} /> New Post
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border-0 shadow-2xl p-0 text-gray-950">
                      <div className="sticky top-0 z-10 bg-[#162A3A] px-6 py-5 rounded-t-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-bold text-white">{editingId ? "Edit Blog Post" : "Create New Blog Post"}</DialogTitle>
                          <p className="text-white/50 text-sm mt-0.5">{editingId ? "Update your blog post details" : "Create a new blog post for your customers"}</p>
                        </DialogHeader>
                      </div>
                      <div className="p-5 space-y-4 bg-[#f5f0e8]">
                        <form className="space-y-4" onSubmit={handleSubmit}>
                          {/* TITLE */}
                          <div className="space-y-1">
                            <label className="text-sm font-medium">Title</label>
                            <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                          </div>

                          {/* AUTHOR */}
                          <div className="space-y-1">
                            <label className="text-sm font-medium">Author</label>
                            <Input
                              id="author"
                              value={formData.author}
                              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                              required
                            />
                          </div>

                          {/* EXCERPT */}
                          <div className="space-y-1">
                            <label className="text-sm font-medium">Excerpt</label>
                            <Textarea
                              id="excerpt"
                              value={formData.excerpt}
                              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                              className="min-h-[80px]"
                            />
                          </div>

                          {/* CONTENT */}
                          <div className="space-y-1">
                            <label className="text-sm font-medium">Content</label>
                            <Textarea
                              id="content"
                              className="min-h-[140px] sm:min-h-[180px]"
                              value={formData.content}
                              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            />
                          </div>

                          {/* TABS */}
                          <div className="space-y-3">
                            {/* TAB BUTTONS */}
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant={activeTab === "media" ? "default" : "outline"}
                                className={
                                  activeTab === "media"
                                    ? "bg-yellow-600 hover:bg-yellow-500 text-white w-full sm:w-auto"
                                    : "border-yellow-300 text-yellow-700 hover:bg-yellow-50 hover:text-yellow-700 w-full sm:w-auto"
                                }
                                onClick={() => {
                                  setActiveTab("media")

                                  if (!editingId) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      image: null,
                                    }))
                                  }
                                }}
                                disabled={editingId && formData.imageUrl ? true : false}
                              >
                                Video
                              </Button>

                              <Button
                                type="button"
                                size="sm"
                                variant={activeTab === "image" ? "default" : "outline"}
                                className={
                                  activeTab === "image"
                                    ? "bg-yellow-600 hover:bg-yellow-500 text-white w-full sm:w-auto"
                                    : "border-yellow-300 text-yellow-700 hover:bg-yellow-50 hover:text-yellow-700 w-full sm:w-auto"
                                }
                                onClick={() => {
                                  setActiveTab("image")
                                  if (!editingId) {
                                    setVideoFile(null)
                                    setFormData((prev) => ({ ...prev, thumbnail: null }))
                                  }
                                }}
                                disabled={editingId && formData.videoUrl ? true : false}
                              >
                                Image
                              </Button>
                            </div>

                            {/* TAB 1: VIDEO + THUMB */}
                            {activeTab === "media" && (
                              <div className="space-y-4">
                                {editingId && formData.videoUrl && (
                                  <div className="relative w-full rounded-md overflow-hidden border border-blue-200">
                                    <video
                                      controls
                                      className="w-full rounded-lg max-h-[250px] sm:max-h-[320px]"
                                      poster={formData.thumbnailUrl ? getImageUrl(formData.thumbnailUrl) : "/video-placeholder.jpg"}
                                    >
                                      <source src={getVideoUrl(formData.videoUrl)} type="video/mp4" />
                                      Your browser does not support the video tag.
                                    </video>
                                  </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-sm font-medium">Upload Video</label>
                                    <Input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-sm font-medium">Upload Thumbnail</label>
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          thumbnail: e.target.files?.[0] || null,
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* TAB 2: IMAGE */}
                            {activeTab === "image" && (
                              <div className="space-y-3">
                                {editingId && formData.imageUrl && (
                                  <div className="overflow-hidden rounded-md border border-blue-100">
                                    <Image
                                      src={getImageUrl(formData.imageUrl || (formData as any).imageUrl)}
                                      alt={formData.title}
                                      width={400}
                                      height={200}
                                      className="w-full h-48 sm:h-56 object-cover hover:scale-105 transition-transform"
                                    />
                                  </div>
                                )}

                                <div className="space-y-1">
                                  <label className="text-sm font-medium">Upload Image</label>
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        image: e.target.files?.[0] || null,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* DRAFT */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2">
                            <label className="text-sm font-medium">Save as Draft</label>
                            <Switch id="draft" checked={formData.draft} onCheckedChange={(checked) => setFormData({ ...formData, draft: checked })} />
                          </div>

                          <div className="flex gap-3 pb-2">
                            <Button variant="outline" className="flex-1 h-10 text-gray-600 border-gray-300 bg-white" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={uploadingVideo} className="flex-1 h-10 bg-[#162A3A] hover:bg-[#1e3a50] text-white rounded-xl font-semibold shadow-md">
                              {uploadingVideo ? "Uploading video..." : editingId ? "Update Post" : "Create Post"}
                            </Button>
                          </div>
                        </form>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* POSTS */}
              {filteredPosts.length === 0 ? (
                <div className="w-full flex flex-col items-center justify-center py-20 px-4 rounded-2xl border border-gray-100 shadow-xl bg-white text-center">
                  <div className="w-14 h-14 flex items-center justify-center rounded-full bg-yellow-100 border border-yellow-200">
                    <Search className="w-6 h-6 text-yellow-600" />
                  </div>

                  <h2 className="mt-4 text-lg font-semibold text-gray-900">No blog posts found</h2>
                  <p className="mt-1 text-sm text-gray-600 max-w-md">
                    {search
                      ? `No results match "${search}". Try adjusting your search or filters.`
                      : draftFilter !== "all"
                        ? `No ${draftFilter} posts available yet.`
                        : "You haven't created any blog posts yet. Start by creating your first post."}
                  </p>

                  <Button
                    className="mt-5 bg-yellow-600 hover:bg-yellow-500 gap-2"
                    onClick={() => {
                      setIsDialogOpen(true)
                      setEditingId(null)
                      setVideoFile(null)
                      setFormData({
                        title: "",
                        excerpt: "",
                        content: "",
                        author: "",
                        image: null,
                        imageUrl: "",
                        thumbnail: null,
                        thumbnailUrl: "",
                        videoUrl: "",
                        draft: false,
                      })
                    }}
                  >
                    <Plus size={16} />
                    Create New Post
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredPosts.map((post) => (
                    <Card
                      key={post.id}
                      onClick={() => {
                        setViewPost(post)
                        setViewOpen(true)
                      }}
                      className="bg-white rounded-2xl border border-gray-100 shadow-xl hover:shadow-2xl hover:border-[#d4a24c]/50 transition-all cursor-pointer"
                    >
                      <CardContent className="p-5 space-y-3 text-gray-900">
                        {/* IMAGE */}
                        {(post.image || (post as any).thumbnail) && (
                          <div className="overflow-hidden rounded-md border border-blue-100">
                            <Image
                              src={getImageUrl(post.image || (post as any).thumbnail)}
                              alt={post.title}
                              width={400}
                              height={200}
                              className="w-full h-48 object-cover hover:scale-105 transition-transform"
                            />
                          </div>
                        )}

                        {/* TITLE + BADGES */}
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold text-blue-900">{post.title}</h3>

                          <div className="flex flex-wrap gap-2 items-center text-xs">
                            <span
                              className={`px-2 py-1 rounded-full font-medium ${(post as any).draft === 1
                                  ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                                  : "bg-blue-100 text-blue-800 border border-blue-300"
                                }`}
                            >
                              {(post as any).draft === 1 ? "Draft" : "Published"}
                            </span>

                            {(post as any).video_url && (
                              <span className="px-2 py-1 rounded-full bg-yellow-200 text-yellow-900 border border-yellow-400">Video attached</span>
                            )}
                          </div>
                        </div>

                        {/* EXCERPT */}
                        <p className="text-sm text-gray-600 line-clamp-2">{post.excerpt}</p>

                        {/* ACTIONS */}
                        <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="ghost" className=" hover:text-white text-yellow-500" onClick={() => handleEdit(post)}>
                            <Edit2 size={16} />
                          </Button>

                          <Button
                            size="sm"
                            className="bg-red-500 hover:bg-red-400 text-white"
                            onClick={() => {
                              setDeleteId(post.id)
                              setDeleteOpen(true)
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                <DialogContent className="lg:max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-lg border border-gray-200 p-0 bg-white">
                  <div className="sticky top-0 z-10 bg-[#162A3A] px-6 py-5 rounded-t-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold text-white">{viewPost?.title}</DialogTitle>
                      <p className="text-white/50 text-sm mt-0.5">By {viewPost?.author} • {viewPost?.draft ? "Draft" : "Published"}</p>
                    </DialogHeader>
                  </div>
                  <div className="p-6">
                    {viewPost && (
                      <div className="space-y-4">
                        {viewPost.video_url ? (
                          <div className="space-y-2">
                            <p className="text-sm text-blue-700 font-medium">Video Preview</p>

                            <div className="relative w-full rounded-md overflow-hidden border border-blue-200">
                              <video
                                controls
                                className="w-full rounded-lg"
                                poster={viewPost.thumbnail ? getImageUrl(viewPost.thumbnail) : "/video-placeholder.jpg"}
                              >
                                <source src={getVideoUrl(viewPost.video_url)} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                            </div>
                          </div>
                        ) : viewPost.image ? (
                          <>
                            <p className="text-sm text-blue-700 font-medium">Image Preview</p>
                            <Image
                              src={getImageUrl(viewPost.image)}
                              alt={viewPost.title}
                              width={800}
                              height={400}
                              className="w-full h-60 object-cover rounded-md border border-blue-200"
                            />
                          </>
                        ) : (
                          <div className="w-full h-60 flex flex-col items-center justify-center rounded-md border border-dashed border-blue-300 bg-blue-50">
                            <div className="text-center space-y-1">
                              <p className="text-blue-700 font-medium">No media available</p>
                              <p className="text-xs text-gray-500">This post doesn&apos;t have a video or image yet.</p>
                            </div>
                          </div>
                        )}

                        {/* BADGES */}
                        <div className="flex gap-2 text-xs">
                          <span
                            className={`px-2 py-1 rounded-full border ${viewPost.draft === 1 ? "bg-yellow-100 text-yellow-800 border-yellow-300" : "bg-blue-100 text-blue-800 border-blue-300"
                              }`}
                          >
                            {viewPost.draft === 1 ? "Draft" : "Published"}
                          </span>

                          {viewPost.video_url && (
                            <span className="bg-yellow-200 text-yellow-900 px-2 py-1 rounded-full border border-yellow-400">Video Attached</span>
                          )}
                        </div>

                        <p className="text-gray-600">{viewPost.excerpt}</p>
                        <p className="text-gray-600">{viewPost.author}</p>

                        <div className="text-sm text-gray-700 whitespace-pre-wrap">{viewPost.content}</div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* DELETE */}
              <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent className="w-[92vw] max-w-sm rounded-2xl border-0 shadow-2xl p-0 overflow-hidden">
                  <div className="bg-[#162A3A] px-6 py-5">
                    <AlertDialogTitle className="text-xl font-bold text-white">Delete Blog Post?</AlertDialogTitle>
                    <p className="text-white/50 text-sm mt-1">This action cannot be undone.</p>
                  </div>
                  <div className="p-6 space-y-5 bg-white">
                    <p className="text-sm text-gray-700">Are you sure you want to delete this blog post? This action cannot be undone.</p>
                    <div className="flex gap-2 pt-1">
                      <AlertDialogCancel className="flex-1 text-gray-700 border-gray-200">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="flex-1 bg-[#162A3A] hover:bg-[#1e3a50] text-white rounded-xl">Yes, Delete</AlertDialogAction>
                    </div>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
