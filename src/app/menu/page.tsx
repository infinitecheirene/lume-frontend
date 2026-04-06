"use client"

import { useState, useEffect } from "react"
import { Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Playfair_Display } from "next/font/google"
import MenuItemCard from "@/components/ui/menu-item-card"
import type { MenuItem } from "@/types"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

type Category = "coffee" | "food" | "bar"

export default function MenuPage() {
  const [products, setProducts] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState<Category>("coffee")

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch("/api/product")

        if (!res.ok) {
          throw new Error(`Failed: ${res.status}`)
        }

        const data = await res.json()
        setProducts(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        )
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const menuCategories: { key: Category; label: string }[] = [
    { key: "coffee", label: "Coffee" },
    { key: "food", label: "Kitchen" },
    { key: "bar", label: "Bar" },
  ]

  // Filter products by active category
  const filteredProducts = products.filter(
    (product) => product.category?.toLowerCase() === active
  )

  if (loading) {
    return (
      <section className="py-24 bg-[#0b1d26] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#d4a24c] mx-auto mb-4" />
          <p className="text-white">Loading menu...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-24 bg-[#0b1d26] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <X className="mx-auto mb-4 text-red-400 h-10 w-10" />
          <p className="text-red-400 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-[#d4a24c] hover:bg-[#c0903a] text-black"
          >
            Try Again
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section id="menu" className="py-24 bg-[#0b1d26]">
      <div className="container px-4">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <p className="tracking-[0.3em] uppercase text-sm mb-3 text-[#d4a24c]">
            Our Offerings
          </p>
          <h2 className={`${playfair.className} text-4xl md:text-5xl font-bold text-white`}>
            The Menu
          </h2>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-12">
          {menuCategories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActive(cat.key)}
              className={`px-6 py-2.5 rounded-full text-sm transition ${
                active === cat.key
                  ? "bg-[#d4a24c] text-black font-semibold"
                  : "bg-[#132e3b] text-white/70 hover:bg-[#193847]/80 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        {filteredProducts.length > 0 ? (
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto"
          >
            {filteredProducts.map((item, i) => (
              <motion.div
                key={item.id ?? i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <MenuItemCard item={item} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <p className="text-white/70 text-lg">
              No items available in this category yet.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}