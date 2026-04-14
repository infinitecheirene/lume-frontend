"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { X, ChefHat, Newspaper, ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import { Playfair_Display } from "next/font/google"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"

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
  created_at: string
  image?: string
  thumbnail?: string
  video_url?: string
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const POSTS_PER_PAGE = 6

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch("/api/blog-posts?draft=0")
        if (!response.ok) throw new Error("Failed to fetch blog posts")
        const data = await response.json()
        setPosts(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  // Reset to page 1 when posts change
  useEffect(() => {
    setCurrentPage(1)
  }, [posts])

  const handleReadMore = (post: BlogPost) => {
    setSelectedPost(post)
    setDialogOpen(true)
  }

  // Pagination logic
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE
  const endIndex = startIndex + POSTS_PER_PAGE
  const currentPosts = posts.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

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

  return (
    <div className="py-8 md:py-14 bg-[#0b1d26] min-h-screen">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-32 h-32 bg-[#d4a24c]/10 rounded-full blur-2xl" />
        <div className="absolute top-1/3 right-20 w-24 h-24 bg-[#d4a24c]/5 rounded-full blur-xl" />
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-[#d4a24c]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-28 h-28 bg-[#d4a24c]/6 rounded-full blur-2xl" />
      </div>

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-16 relative z-10">
        {/* Heading */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 md:mb-16">
          <p className="tracking-[0.2em] md:tracking-[0.3em] uppercase text-xs md:text-sm mb-2 md:mb-3 text-[#d4a24c]">From Roastery</p>
          <h2 className={`${playfair.className} text-3xl md:text-5xl lg:text-6xl font-bold leading-tight`}>
            The Crescent <span className="text-[#d4a24c] italic">Journal</span>
          </h2>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 lg:gap-8 max-w-7xl mx-auto">
            {[...Array(POSTS_PER_PAGE)].map((_, i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-[#d4a24c]/30 overflow-hidden animate-pulse"
              >
                <div className="aspect-video bg-gradient-to-br from-white/20 to-white/10"></div>
                <div className="p-4 md:p-6">
                  <div className="flex items-center gap-2 md:gap-3 mb-3">
                    <div className="h-5 md:h-6 bg-[#d4a24c]/20 rounded-full w-12 md:w-16"></div>
                    <div className="h-3 md:h-4 bg-white/20 rounded w-16 md:w-20"></div>
                  </div>
                  <div className="h-5 md:h-6 bg-white/20 rounded w-3/4 mb-2"></div>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 md:h-4 bg-white/20 rounded"></div>
                    <div className="h-3 md:h-4 bg-white/20 rounded w-5/6"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-3 md:h-4 bg-white/20 rounded w-12 md:w-16"></div>
                    <div className="h-3 md:h-4 bg-[#d4a24c]/20 rounded w-16 md:w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 md:p-8 text-center shadow-2xl">
              <p className="text-[#d4a24c] text-base md:text-lg font-semibold">⚠️ {error}</p>
            </div>
          </div>
        )}

        {/* Blog Posts Grid */}
        {!loading && !error && posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 lg:gap-8 max-w-7xl mx-auto">
            {currentPosts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-[#d4a24c]/30 overflow-hidden group hover:border-[#d4a24c]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#d4a24c]/10"
              >
                <div className="relative aspect-video overflow-hidden rounded-md">
                  {post.video_url ? (
                    <>
                      <video
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        poster={post.thumbnail ? getImageUrl(post.thumbnail) : "/placeholder.svg"}
                        muted
                        preload="metadata"
                      >
                        <source src={getVideoUrl(post.video_url)} type="video/mp4" />
                      </video>
                      <span className="absolute top-2 left-2 bg-yellow-500 text-black text-xs font-semibold px-2 py-1 rounded-md shadow">Video</span>
                    </>
                  ) : post.image ? (
                    <Image
                      src={getImageUrl(post.image)}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl md:text-6xl bg-gradient-to-br from-[#d4a24c]/20 to-[#d4a24c]/10">
                      🍽️
                    </div>
                  )}
                </div>
                <div className="p-4 md:p-6">
                  <div className="flex items-center gap-2 md:gap-3 mb-3">
                    <span className="text-xs font-medium text-[#d4a24c] bg-[#d4a24c]/10 px-2 md:px-3 py-1 rounded-full">Blog</span>
                    <span className="text-xs text-white/60">
                      {new Date(post.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <h2
                    className={`${playfair.className} text-lg md:text-xl font-semibold mb-2 text-white group-hover:text-[#d4a24c] transition-colors leading-tight`}
                  >
                    {post.title}
                  </h2>
                  <p className="text-white/70 text-sm leading-relaxed mb-4 line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60">By {post.author}</span>
                    <button
                      onClick={() => handleReadMore(post)}
                      className="text-[#d4a24c] text-sm font-medium hover:translate-x-1 transition-transform"
                    >
                      Read More →
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && posts.length > POSTS_PER_PAGE && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 md:mt-12 mb-8 px-4">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="border-[#d4a24c]/30 text-[#d4a24c] hover:bg-[#d4a24c]/10 hover:border-[#d4a24c]/50 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </Button>

            <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  onClick={() => handlePageChange(page)}
                  className={`w-8 h-8 sm:w-10 sm:h-10 p-0 text-xs sm:text-sm ${
                    currentPage === page
                      ? "bg-[#d4a24c] text-black hover:bg-[#d4a24c]/90"
                      : "border-[#d4a24c]/30 text-[#d4a24c] hover:bg-[#d4a24c]/10 hover:border-[#d4a24c]/50"
                  }`}
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="border-[#d4a24c]/30 text-[#d4a24c] hover:bg-[#d4a24c]/10 hover:border-[#d4a24c]/50 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-12 md:py-20 animate-in fade-in zoom-in duration-500 px-4">
            <div className="inline-block p-6 md:p-8 bg-white/10 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20">
              <div className="text-5xl md:text-7xl mb-4 md:mb-6">📝</div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">No Stories Yet</h2>
              <p className="text-white/70 text-base md:text-lg">Check back soon for delicious content!</p>
            </div>
          </div>
        )}
      </div>

      {/* Blog Post View Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-[#0b1d26] to-[#1a2e3a] border border-[#d4a24c]/20 text-white mx-4">
          <DialogHeader className="text-center pb-4 md:pb-6">
            <DialogTitle className={`${playfair.className} text-2xl md:text-3xl font-bold text-[#d4a24c] mb-2`}>{selectedPost?.title}</DialogTitle>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs md:text-sm text-white/60">
              <span>By {selectedPost?.author}</span>
              <span className="hidden sm:inline">•</span>
              <span>
                {selectedPost
                  ? new Date(selectedPost.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                  : ""}
              </span>
            </div>
          </DialogHeader>

          {selectedPost && (
            <div className="space-y-4 md:space-y-6">
              <div className="relative w-full h-48 sm:h-64 md:h-96 rounded-xl overflow-hidden shadow-2xl">
                {selectedPost.video_url ? (
                  <>
                    <video
                      className="w-full h-full object-cover"
                      controls
                      muted
                      playsInline
                      preload="metadata"
                      poster={selectedPost.thumbnail ? getImageUrl(selectedPost.thumbnail) : "/placeholder.svg"}
                    >
                      <source src={getVideoUrl(selectedPost.video_url)} type="video/mp4" />
                      Your browser does not support video playback.
                    </video>
                  </>
                ) : selectedPost.image ? (
                  <Image
                    src={getImageUrl(selectedPost.image)}
                    alt={selectedPost.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl md:text-6xl bg-gradient-to-br from-[#d4a24c]/20 to-[#d4a24c]/10">
                    🍽️
                  </div>
                )}
              </div>

              {/* Excerpt */}
              <div className="bg-white/5 rounded-lg p-4 md:p-6 border border-white/10">
                <p className="text-lg md:text-xl text-white/90 leading-relaxed italic text-center">{selectedPost.excerpt}</p>
              </div>

              {/* Full Content */}
              <div className="prose prose-lg prose-invert max-w-none">
                <div className="text-white/80 leading-relaxed whitespace-pre-wrap text-justify text-sm md:text-base">{selectedPost.content}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
