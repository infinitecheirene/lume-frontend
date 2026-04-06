"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Playfair_Display } from "next/font/google"
import { menuItems, categories, type Category } from "@/data/menuData"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

export default function MenuPage() {
  const [active, setActive] = useState<Category>("coffee")

  const filteredProducts = menuItems.filter(
    (item) => item.category?.toLowerCase() === active
  )

  return (
    <section className="py-24 bg-[#0c222b] text-white">
      <div className="container mx-auto px-4 max-w-6xl">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <p className="tracking-[0.3em] uppercase text-sm mb-3 text-[#d4a24c]">
            Our Offerings
          </p>
          <h2 className={`${playfair.className} text-4xl md:text-5xl font-bold`}>
            The <span className="text-[#d4a24c] italic">Menu</span>
          </h2>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center gap-3 mb-16">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActive(cat.key)}
              className={`px-6 py-2.5 rounded-full text-sm transition ${
                active === cat.key
                  ? "bg-[#d4a24c] text-black font-semibold"
                  : "bg-[#132e3b] text-white/70 hover:bg-[#193847] hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Menu List */}
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-2 gap-x-16"
        >
          {filteredProducts.map((item, i) => (
            <div
              key={item.id ?? i}
              className="py-6 border-b border-white/10"
            >
              <div className="flex justify-between items-start gap-6">
                
                {/* Left content */}
                <div>
                  <h3 className={`${playfair.className} text-lg md:text-xl font-semibold`}>
                    {item.name}
                  </h3>
                  <p className="text-sm text-white/60 mt-1">
                    {item.description}
                  </p>
                </div>

                {/* Price */}
                <div className="text-[#d4a24c] font-semibold text-lg whitespace-nowrap">
                  ${item.price}
                </div>

              </div>
            </div>
          ))}
        </motion.div>

        {/* Empty state */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-white/70">
            No items available in this category yet.
          </div>
        )}
      </div>
    </section>
  )
}