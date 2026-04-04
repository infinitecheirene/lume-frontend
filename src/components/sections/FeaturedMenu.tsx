"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import MenuItemCard from "@/components/ui/menu-item-card"
import type { MenuItem } from "@/types"

export default function FeaturedMenu() {
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const MAX_FEATURED_ITEMS = 8

  useEffect(() => {
    const fetchFeaturedItems = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch("/api/product?is_featured=true")

        if (!res.ok) {
          throw new Error(`Failed: ${res.status}`)
        }

        const data = await res.json()
        setFeaturedItems(data.slice(0, MAX_FEATURED_ITEMS))
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        )
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedItems()
  }, [])

  // ✅ LOADING
  if (loading) {
    return (
      <section className="py-16 bg-neutral-900 text-center text-white">
        Loading featured items...
      </section>
    )
  }

  // ✅ ERROR
  if (error) {
    return (
      <section className="py-16 bg-neutral-900 text-center text-red-400">
        {error}
      </section>
    )
  }

  // ✅ EMPTY
  if (!featuredItems.length) {
    return (
      <section className="py-16 bg-neutral-900 text-center text-white/70">
        No featured items available.
      </section>
    )
  }

  // ✅ MAIN UI
  return (
    <section className="py-24 bg-neutral-900">
      <div className="container mx-auto px-4">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-yellow-500 tracking-[0.3em] uppercase text-sm mb-3">
            Fan Favorites
          </p>

          <h2 className="text-white text-4xl md:text-5xl font-bold">
            Featured <span className="text-yellow-500 italic">Items</span>
          </h2>
        </motion.div>

        {/* Items Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {featuredItems.map((item, i) => (
            <motion.div
              key={item.id ?? i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <MenuItemCard item={item} />
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mt-12"
        >
          <Link
            href="/menu"
            className="inline-block rounded-full border border-yellow-500 px-8 py-3 font-medium text-white hover:bg-yellow-500 hover:text-black transition"
          >
            View Full Menu
          </Link>
        </motion.div>
      </div>
    </section>
  )
}