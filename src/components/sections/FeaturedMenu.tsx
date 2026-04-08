"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Playfair_Display } from "next/font/google"
import { Coffee } from "lucide-react"
import Image from "next/image"
import { toast } from "@/hooks/use-toast"
import LumeLoaderMinimal from "@/components/oppa-loader"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

interface Product {
  id: number
  name: string
  description: string
  category: string
  price: number
  image?: string | null
  best_seller?: boolean
}

export default function BestSellerPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBestSellers = async () => {
    try {
      setLoading(true)

      const res = await fetch("/api/product?best_seller=true&paginate=false")
      const data = await res.json()

      if (!res.ok) throw new Error(data.message)

      setProducts(data)
    } catch (error) {
      console.error(error)

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load best sellers",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBestSellers()
  }, [])

  const getImageUrl = (imagePath?: string | null) => {
    if (!imagePath) return "/placeholder-food.jpg"

    if (imagePath.startsWith("http")) return imagePath

    const base =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

    return `${base}/images/products/${imagePath}`
  }

  if (loading) return <LumeLoaderMinimal />

  return (
    <section className="relative py-24 bg-[#0c222b] text-white overflow-hidden">
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

        {/* ✅ CONTENT */}
        {products.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-2 gap-x-16 gap-y-6"
          >
            {products.map((item) => (
              <div
                key={item.id}
                className="py-6 border-b border-white/10 flex items-start gap-6 hover:bg-white/5 transition px-3 rounded-lg"
              >
                {/* Image */}
                <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                  <Image
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className={`${playfair.className} text-lg font-semibold`}>
                    {item.name}
                  </h3>

                  <p className="text-sm text-white/60 mt-1">
                    {item.description}
                  </p>

                  <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full bg-[#d4a24c]/20 text-[#d4a24c]">
                    {item.category}
                  </span>
                </div>

                {/* Price */}
                <div className="text-[#d4a24c] font-semibold text-lg whitespace-nowrap">
                  ₱{item.price}
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          /* ✅ EMPTY STATE */
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
