"use client"

import { motion } from "framer-motion"
import { Playfair_Display } from "next/font/google"
import { menuItems } from "@/data/menuData"
import { useScroll, useTransform } from "framer-motion"
import { useRef, useEffect, useState } from "react"
import { Coffee } from "lucide-react"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

export default function BestSellerPage() {
  const containerRef = useRef(null)
  const [loading, setLoading] = useState(true)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const fillHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])
  const streamHeight = useTransform(scrollYProgress, [0, 1], ["0%", "120%"])

  const bestSellers = menuItems.filter(
    (item) => item.isBestSeller === true
  )

  // Simulated loading (remove if using API later)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section
      ref={containerRef}
      className="relative py-24 bg-[#0c222b] text-white overflow-hidden"
    >
      <div className="container mx-auto px-4 max-w-6xl">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <p className="tracking-[0.3em] uppercase text-sm mb-3 text-[#d4a24c]">
            Customer Favorites
          </p>

          <h2 className={`${playfair.className} text-4xl md:text-5xl font-bold`}>
            Best <span className="text-[#d4a24c] italic">Sellers</span>
          </h2>
        </motion.div>

        {/* ✅ LOADING STATE */}
        {loading && (
          <div className="grid md:grid-cols-2 gap-x-16 gap-y-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="py-6 border-b border-white/10 animate-pulse"
              >
                <div className="flex justify-between items-start gap-6">

                  <div className="space-y-2 w-full">
                    <div className="h-4 w-1/2 bg-white/10 rounded" />
                    <div className="h-3 w-3/4 bg-white/10 rounded" />
                    <div className="h-3 w-1/3 bg-white/10 rounded" />
                  </div>

                  <div className="h-4 w-12 bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ✅ CONTENT */}
        {!loading && bestSellers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-2 gap-x-16"
          >
            {bestSellers.map((item, i) => (
              <div
                key={item.id ?? i}
                className="py-6 border-b border-white/10 hover:bg-white/5 transition px-3 rounded-lg"
              >
                <div className="flex justify-between items-start gap-6">

                  {/* Left */}
                  <div>
                    <h3 className={`${playfair.className} text-lg md:text-xl font-semibold`}>
                      {item.name}
                    </h3>

                    <p className="text-sm text-white/60 mt-1">
                      {item.description}
                    </p>

                    <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full bg-[#d4a24c]/20 text-[#d4a24c]">
                      Best Seller
                    </span>
                  </div>

                  {/* Price */}
                  <div className="text-[#d4a24c] font-semibold text-lg whitespace-nowrap">
                    ₱{item.price}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ✅ EMPTY STATE (REDESIGNED) */}
        {!loading && bestSellers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">

            <div className="w-16 h-16 rounded-full bg-[#d4a24c]/10 flex items-center justify-center mb-6">
              <Coffee className="w-8 h-8 text-[#d4a24c]" />
            </div>

            <h3 className={`${playfair.className} text-2xl font-semibold mb-2`}>
              No Best Sellers Yet
            </h3>

            <p className="text-white/60 max-w-md">
              Our most loved items will appear here once customers start ordering.
              Stay tuned for our top picks.
            </p>

            <div className="mt-6 h-[1px] w-24 bg-[#d4a24c]/30" />
          </div>
        )}

      </div>
    </section>
  )
}
