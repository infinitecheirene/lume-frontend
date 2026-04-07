"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Edit2, Plus, X, Search, Underline } from "lucide-react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

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

  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth < 1024)
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

  async function handleDelete(id: number) {
    if (!confirm("Delete this post?")) return
    await fetch(`/api/blog-posts/${id}`, { method: "DELETE" })
    fetchPosts()
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
        <AppSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-10 w-10 border-b-2 border-primary rounded-full" />
        </div>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider defaultOpen={!isDesktop}>
      <div className="flex min-h-screen w-full bg-red-50">
        <AppSidebar />

        <div className={`flex-1 min-w-0 ${isDesktop ? "ml-0" : "ml-72"}`}>
          {isDesktop && (
            <div className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b bg-white px-4">
              <SidebarTrigger />
              <Image src="/logo.jpg" alt="Logo" width={40} height={40} />
              <h1 className="font-bold">Lumè Bean and Bar</h1>
            </div>
          )}

          <main className="p-4 md:p-6">
            <div className="space-y-6 min-h-[300px]">
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold">Blog Management</h1>
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

                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Post" : "Create Post"}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                          placeholder="Title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          required
                        />
                        <Input
                          placeholder="Author"
                          value={formData.author}
                          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                          required
                        />
                        <Textarea
                          placeholder="Excerpt"
                          value={formData.excerpt}
                          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                          rows={3}
                          required
                        />
                        <Textarea
                          placeholder="Content"
                          value={formData.content}
                          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                          rows={6}
                          required
                        />
                        <Input type="file" accept="image/*" onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })} />
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
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-800" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search blog post..."
                        className="pl-9 bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Posts List */}
              <div className="space-y-4 grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {posts.map((post) => (
                  <Card key={post.id} className="overflow-hidden gap-0 p-0">
                    <Image
                      src={getImageUrl(post.image_url) || "/placeholder.png"}
                      alt={post.title}
                      width={400}
                      height={200}
                      className="w-full h-48 object-cover"
                    />
                    <CardContent className="p-4 flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold">{post.title}</h3>
                          <p className="text-sm text-gray-500">
                            Author: <u>{post.author}</u>
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(post)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(post.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-md text-gray-700">{post.excerpt}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
