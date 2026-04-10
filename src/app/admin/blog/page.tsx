"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Edit2, Plus, X, Search, Underline, Loader2 } from "lucide-react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
import { Label } from "@/components/ui/label"
import { Playfair_Display } from "next/font/google"

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
  image_url?: string
  created_at: string
}

export default function BlogPostsAdmin() {
  const { toast } = useToast()

  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth < 1024) // lg breakpoint
    }
    checkDesktop()
    window.addEventListener("resize", checkDesktop)
    return () => window.removeEventListener("resize", checkDesktop)
  }, [])

  const filteredPosts = posts.filter(
    (a) => a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase()),
  )

  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    author: "",
    image: null as File | null,
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const form = new FormData()
      Object.entries(formData).forEach(([k, v]) => v && form.append(k, v))

      const url = editingId ? `/api/blog-posts/${editingId}` : "/api/blog-posts"
      const method = editingId ? "PUT" : "POST"

      await fetch(url, { method, body: form })

      toast({
        title: "Success",
        description: editingId ? "Post updated" : "Post created",
      })

      setFormData({ title: "", excerpt: "", content: "", author: "", image: null })
      setEditingId(null)
      setIsDialogOpen(false)
      fetchPosts()
    } catch {
      toast({
        title: "Error",
        description: "Failed to save blog post",
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
    })
    setEditingId(post.id)
    setIsDialogOpen(true)
  }

  async function handleDelete() {
    if (!deleteId) return

    await fetch(`/api/blog-posts/${deleteId}`, { method: "DELETE" })
    fetchPosts()

    setDeleteOpen(false)
    setDeleteId(null)
  }

  const getImageUrl = (imagePath?: string): string => {
    if (!imagePath) {
      return "/placeholder.jpg"
    }

    // Absolute URL already
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath
    }

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

    // Remove leading slash to avoid double slash
    const normalizedPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath

    return `${API_BASE_URL}/${normalizedPath}`
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
          {isDesktop && (
            <div className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b bg-[#162A3A] px-4 shadow-sm">
              <SidebarTrigger className="-ml-1" />
              <Image src="/logo.jpg" alt="Lumè Bean and Bar Logo" width={40} height={40} className="object-contain rounded-full" />
              <h1 className={`${playfair.className} text-lg font-semibold text-white`}>Lumè Bean and Bar</h1>
            </div>
          )}

          <main className="p-4 md:p-6">
            <div className="space-y-6 min-h-[300px]">
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <h1 className="text-3xl text-black font-bold">Blog Management</h1>
                  <p className="text-gray-600">Manage restaurant&apos;s kitchen blog posts</p>
                </div>

                <div className="flex gap-4 items-center">
                  {/* Add New Blog Post */}
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingId(null)
                          setFormData({
                            title: "",
                            excerpt: "",
                            content: "",
                            author: "",
                            image: null,
                          })
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        New Post
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="text-black">
                      <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Post" : "Create Post"}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Title</Label>
                          <Input
                            id="title"
                            placeholder="Enter title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="author">Author</Label>
                          <Input
                            id="author"
                            placeholder="Enter author"
                            value={formData.author}
                            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="excerpt">Excerpt</Label>
                          <Textarea
                            id="excerpt"
                            placeholder="Enter excerpt"
                            value={formData.excerpt}
                            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                            rows={3}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="content">Content</Label>
                          <Textarea
                            id="content"
                            placeholder="Enter content"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            rows={6}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="image">Upload Image</Label>
                          <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                          />
                        </div>
                      </form>
                      <DialogFooter>
                        <Button type="button" onClick={handleSubmit}>
                          {editingId ? "Update Post" : "Create Post"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Search Bar */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-800" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search blog post..."
                        className="pl-9 bg-gray-100 text-black"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Posts List */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {filteredPosts.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="text-center py-12">
                      <Underline className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No blog posts found</p>
                      <p className="text-sm text-gray-500 mt-1">Create your first blog post to get started</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredPosts.map((post) => (
                    <Card key={post.id} className="overflow-hidden p-0 flex flex-col h-[360px]">
                      <Image
                        src={getImageUrl(post.image_url) || "/placeholder.png"}
                        alt={post.title}
                        width={400}
                        height={200}
                        className="w-full h-48 object-cover flex-shrink-0"
                      />

                      <CardContent className="p-4 flex flex-col gap-3 flex-1">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <h3 className="text-lg font-bold truncate">{post.title}</h3>
                            <p className="text-sm text-gray-500">Author: {post.author}</p>
                          </div>

                          <div className="flex gap-2 flex-shrink-0">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(post)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setDeleteId(post.id)
                                setDeleteOpen(true)
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-md text-gray-700 line-clamp-2">{post.excerpt}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* delete dialog */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <AlertDialogContent className="text-black">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone. This will permanently delete the post.</AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel
                    onClick={() => {
                      setDeleteId(null)
                      setDeleteOpen(false)
                    }}
                  >
                    Cancel
                  </AlertDialogCancel>

                  <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
