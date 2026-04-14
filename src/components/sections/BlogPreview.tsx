"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Playfair_Display } from "next/font/google"
import { Newspaper } from "lucide-react"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

interface BlogPost {
  id: number
  title: string
  excerpt: string
  video_url: string
  image: string
  thumbnail?: string
  created_at: string
  category?: string
}

export default function BlogPreview() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch("/api/blog-posts?draft=0")
        const data = await res.json()
        setPosts(data || [])
      } catch (err) {
        console.error("Failed to fetch blog posts")
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

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
    <section className="relative py-24 bg-[#0c222b] border-t border-yellow-500/10 text-white overflow-hidden">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <p className="text-[#d4a24c] tracking-[0.3em] uppercase text-sm mb-3">From the Roastery</p>
          <h2 className={`${playfair.className} text-4xl md:text-5xl font-bold`}>
            Latest from the <span className="text-[#d4a24c] italic">Journal</span>
          </h2>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-white/10 bg-white/5">
                <div className="aspect-video bg-white/10" />
                <div className="p-5 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-1/4" />
                  <div className="h-6 bg-white/10 rounded w-3/4" />
                  <div className="h-4 bg-white/10 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Blog Cards */}
        {!loading && posts.length > 0 && (
          <>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {posts.slice(0, 2).map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="group bg-[#0f2a33] rounded-2xl border border-white/10 overflow-hidden hover:shadow-[0_0_25px_rgba(212,162,76,0.25)] transition"
                >
                  {/* Image */}
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
                        <span className="absolute top-2 left-2 bg-yellow-500 text-black text-xs font-semibold px-2 py-1 rounded-md shadow">
                          Video
                        </span>
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

                  {/* Content */}
                  <div className="p-5">
                    <span className="text-xs text-[#d4a24c] font-medium">{post.category || "Coffee"}</span>

                    <h3 className="text-lg font-semibold mt-1 mb-2 text-white">{post.title}</h3>

                    <p className="text-white/70 text-sm line-clamp-2">{post.excerpt}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mt-10">
              <Link
                href="/blog"
                className="inline-block rounded-full border border-[#d4a24c] px-8 py-3 font-medium text-white transition hover:bg-[#d4a24c] hover:text-black"
              >
                Read the Journal
              </Link>
            </motion.div>
          </>
        )}

        {/* Empty */}
        {!loading && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-[#d4a24c]/10 flex items-center justify-center mb-6">
              <Newspaper className="w-8 h-8 text-[#d4a24c]" />
            </div>

            <h3 className={`${playfair.className} text-2xl font-semibold mb-2`}>No Blogs Available Yet</h3>

            <p className="text-white/60 max-w-md">
              Our latest stories and updates will appear here soon.
              <br />
              Stay tuned for fresh content from our roastery!
            </p>

            <div className="mt-6 h-[1px] w-24 bg-[#d4a24c]/30" />
          </div>
        )}
      </div>
    </section>
  )
}
