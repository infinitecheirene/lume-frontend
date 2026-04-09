"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Playfair_Display } from "next/font/google"

const playfair = Playfair_Display({
    subsets: ["latin"],
    weight: ["400", "600", "700"],
})

interface Announcement {
    id: number
    title: string
    description: string
    badge: string
    type?: string
}

export default function Announcements() {
    const [posts, setPosts] = useState<Announcement[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const res = await fetch("/api/announcements")
                const data = await res.json()
                setPosts(data || [])
            } catch (err) {
                console.error("Failed to fetch announcements", err)
            } finally {
                setLoading(false)
            }
        }

        fetchPosts()
    }, [])

    return (
        <section className="py-24 bg-[#0c222b] border-t border-yellow-500/10 text-white overflow-hidden">
            <div className="container mx-auto px-4 max-w-6xl">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <p className="text-[#d4a24c] tracking-[0.3em] uppercase text-sm mb-3">
                        What&apos;s Happening
                    </p>
                    <h2 className={`${playfair.className} text-4xl md:text-5xl font-bold`}>
                        News & <span className="text-[#d4a24c] italic">Promos</span>
                    </h2>
                </motion.div>

                {/* Loading State */}
                {loading && (
                    <div className="max-w-3xl mx-auto space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className="animate-pulse rounded-xl border border-white/10 p-5 bg-white/5"
                            >
                                <div className="h-4 w-1/4 bg-white/10 rounded mb-2" />
                                <div className="h-5 w-3/4 bg-white/10 rounded mb-2" />
                                <div className="h-4 w-full bg-white/10 rounded" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Posts */}
                {!loading && posts.length > 0 && (
                    <>
                        <div className="max-w-xl mx-auto space-y-4">
                            {posts.slice(0, 3).map((item, i) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    viewport={{ once: true }}
                                    className="bg-[#0f2a33] rounded-xl border border-white/10 p-5 hover:shadow-[0_0_20px_rgba(212,162,76,0.25)] transition"
                                >
                                    <div className="flex items-center gap-3 mb-1">
                                        {/* Badge */}
                                        <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-[#d4a24c]/20 text-[#d4a24c]">
                                            {item.badge ?? "Update"}
                                        </span>

                                        {/* Title */}
                                        <h3 className="text-xl font-bold text-white">
                                            {item.title}
                                        </h3>
                                    </div>

                                    {/* Excerpt */}
                                    <p className="text-white/70 text-md">
                                        {item.description}
                                    </p>
                                </motion.div>
                            ))}
                        </div>

                        {/* View All Button */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-center mt-10"
                        >
                            <Link
                                href="/announcements"
                                className="inline-block rounded-full border border-[#d4a24c] px-8 py-3 font-medium text-white transition hover:bg-[#d4a24c] hover:text-black"
                            >
                                View All
                            </Link>
                        </motion.div>
                    </>
                )}

                {/* Empty State */}
                {!loading && posts.length === 0 && (
                    <div className="text-center text-white/60">
                        No announcements available.
                    </div>
                )}
            </div>
        </section>
    )
}