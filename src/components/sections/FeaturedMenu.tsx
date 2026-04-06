"use client"

import { motion } from "framer-motion"
import { Playfair_Display } from "next/font/google"
import { menuItems } from "@/data/menuData"
import { useScroll, useTransform } from "framer-motion"
import { useRef } from "react"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

export default function BestSellerPage() {
  const containerRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  // Controls coffee fill
  const fillHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])
  const streamHeight = useTransform(scrollYProgress, [0, 1], ["0%", "120%"])

  const bestSellers = menuItems.filter(
    (item) => item.isBestSeller === true
  )

  return (
    <section
      ref={containerRef}
      className="relative py-24 bg-[#0c222b] text-white overflow-hidden"
    >

      <div className="container mx-auto px-4 max-w-6xl">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <p className="tracking-[0.3em] uppercase text-sm mb-3 text-[#d4a24c]">
            Customer Favorites
          </p>

          <h2 className={`${playfair.className} text-4xl md:text-5xl font-bold`}>
            Best <span className="text-[#d4a24c] italic">Sellers</span>
          </h2>
        </motion.div>

        {/* Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-2 gap-x-16"
        >
          {bestSellers.map((item, i) => (
            <div
              key={item.id ?? i}
              className="py-6 border-b border-white/10 hover:bg-white/5 transition px-2 rounded-lg"
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

                  {/* BEST SELLER BADGE */}
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

        {/* Empty state */}
        {bestSellers.length === 0 && (
          <div className="text-center py-12 text-white/70">
            No best sellers available yet.
          </div>
        )}

      </div>
    </section>
  )
}