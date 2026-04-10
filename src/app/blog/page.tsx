"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, X, ChefHat, Newspaper } from "lucide-react"
import { motion } from "framer-motion"
import { Playfair_Display } from "next/font/google"
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
  image_url?: string
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch("/api/blog-posts")
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

  useEffect(() => {
    if (selectedPost) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [selectedPost])

  return (
    <div className="py-14 bg-[#0b1d26]">
      {/* Animated background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#E5A834]/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#E5A834]/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-[#E5A834]/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Heading */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <p className="tracking-[0.3em] uppercase text-sm mb-3 text-[#d4a24c]">Our Offerings</p>
          <h2 className={`${playfair.className} text-4xl md:text-5xl font-bold`}>
            The <span className="text-[#d4a24c] italic">Menu</span>
          </h2>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm shadow-lg">
                <div className="h-72 bg-gradient-to-br from-white/20 to-white/5"></div>
                <div className="p-4">
                  <div className="h-6 bg-white/20 rounded w-3/4 mb-2"></div>
                  <div className="space-y-2 mt-3">
                    <div className="h-4 bg-white/20 rounded"></div>
                    <div className="h-4 bg-white/20 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center shadow-2xl">
              <p className="text-[#d4a24c] text-lg font-semibold">⚠️ {error}</p>
            </div>
          </div>
        )}

        {/* Blog Posts Grid */}
        {!loading && !error && posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <div
                key={post.id}
                className="group flex flex-col overflow-hidden rounded-lg border border-white/10 hover:border-white/30 bg-white/5 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: "fadeInUp 0.6s ease-out forwards",
                  opacity: 0,
                }}
                onClick={() => setSelectedPost(post)}
              >
                {/* Thumbnail/Video Preview */}
                <div className="relative h-72 overflow-hidden bg-gradient-to-br from-white/20 to-white/5">
                  {post.image_url ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL}${post.image_url}`}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg"
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  {/* Date badge */}
                  <div className="absolute top-4 right-4 bg-[#d4a24c] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                    {new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold line-clamp-2 group-hover:text-[#d4a24c] transition-colors leading-tight mb-3 text-white">
                    {post.title}
                  </h3>

                  <p className="text-sm text-white/70 line-clamp-3 leading-relaxed mb-4">{post.excerpt}</p>

                  {/* Author info with avatar */}
                  <div className="flex items-center gap-3 pt-3 mb-4 border-t border-white/10">
                    <div className="w-8 h-8 rounded-full bg-[#d4a24c] flex items-center justify-center text-white text-xs font-bold">
                      {post.author.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{post.author}</p>
                      <p className="text-xs text-white/50">Author</p>
                    </div>
                  </div>

                  {/* Button - pushed to bottom */}
                  <div className="mt-auto">
                    <Button className="w-full bg-white hover:bg-white/90 text-yellow-600 shadow-lg hover:shadow-xl transition-all duration-300 group/btn hover:scale-105">
                      Read More
                      <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-20 animate-in fade-in zoom-in duration-500">
            <div className="inline-block p-8 bg-white/10 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20">
              <div className="text-7xl mb-6">📝</div>
              <h2 className="text-3xl font-bold text-white mb-3">No Stories Yet</h2>
              <p className="text-white/70 text-lg">Check back soon for delicious content!</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-black rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 animate-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Video or Thumbnail */}
            <div className="relative h-64 md:h-96 overflow-hidden bg-gradient-to-br from-white/20 to-white/5">
              {selectedPost.image_url ? (
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_URL}${selectedPost.image_url}`}
                  alt={selectedPost.title}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg"
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">🍽️</div>
              )}

              {/* Close button */}
              <button
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 bg-white hover:bg-[#d4a24c] hover:text-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              {/* Title */}
              <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">{selectedPost.title}</h2>

              {/* Author info */}
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/20">
                <div className="w-12 h-12 rounded-full bg-[#d4a24c] flex items-center justify-center text-white text-lg font-bold">
                  {selectedPost.author.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">{selectedPost.author}</p>
                  <p className="text-sm text-white/60">Recipe Creator</p>
                </div>
              </div>

              {/* Excerpt */}
              <div className="mb-6">
                <p className="text-xl text-white/90 leading-relaxed italic border-l-4 border-[#d4a24c] pl-4 bg-white/5 py-3 rounded-r-lg">
                  {selectedPost.excerpt}
                </p>
              </div>

              {/* Content */}
              <div className="prose prose-lg prose-invert max-w-none">
                <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{selectedPost.content}</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
