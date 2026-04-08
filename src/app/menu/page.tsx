"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Playfair_Display } from "next/font/google"
import { toast } from "@/hooks/use-toast"
import { useCartStore } from "@/store/cartStore"
import LumeLoaderMinimal from "@/components/oppa-loader"
import Image from "next/image"

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

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMainCategory, setActiveMainCategory] =
    useState<"Kitchen" | "Coffee" | "Bar">("Kitchen")

  const { addItem } = useCartStore()

  const mainCategoryMap = {
    Kitchen: ["food"],
    Coffee: ["coffee"],
    Bar: ["bar"],
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)

      const res = await fetch("/api/product?paginate=false")
      const data = await res.json()

      if (!res.ok) throw new Error(data.message)

      setProducts(data)
    } catch (error) {
      console.error(error)

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load products",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const getImageUrl = (imagePath?: string | null) => {
    if (!imagePath) return "/placeholder-food.jpg"

    if (imagePath.startsWith("http")) return imagePath

    const base =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

    return `${base}/images/products/${imagePath}`
  }

  const filteredProducts = products.filter((item) =>
    mainCategoryMap[activeMainCategory]
      .map((c) => c.toLowerCase())
      .includes(item.category.toLowerCase())
  )

  const groupedProducts = filteredProducts.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, Product[]>)

  const handleAddToCart = (item: Product) => {
    addItem(item)

    toast({
      title: "Added to cart",
      description: `${item.name} added to your order.`,
    })
  }

  if (loading) return <LumeLoaderMinimal />

  return (
    <section className="py-24 bg-[#0b1d26] text-white">
      <div className="container mx-auto px-4 max-w-6xl">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
          {Object.keys(mainCategoryMap).map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setActiveMainCategory(cat as keyof typeof mainCategoryMap)
              }
              className={`px-6 py-2.5 rounded-full text-sm transition ${
                activeMainCategory === cat
                  ? "bg-[#d4a24c] text-black font-semibold"
                  : "bg-[#132e3b] text-white/70 hover:bg-[#193847] hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        {Object.entries(groupedProducts).map(([category, items]) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="grid md:grid-cols-2 gap-x-16 gap-y-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="py-6 border-b border-white/10 flex items-start gap-6 hover:bg-white/5 transition px-2 rounded-lg"
                >
                  {/* Image */}
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                    <Image
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h4 className={`${playfair.className} text-lg font-semibold flex items-center gap-2`}>
                      {item.name}

                      {item.best_seller && (
                        <span className="text-[12px] px-2 py-0.5 rounded-full bg-[#d4a24c]/20 text-[#d4a24c]">
                          Best Seller
                        </span>
                      )}
                    </h4>

                    <p className="text-sm text-white/60 mt-1">
                      {item.description}
                    </p>
                  </div>

                  {/* Price + Button */}
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[#d4a24c] font-semibold text-lg">
                      ₱{item.price}
                    </span>

                    <button
                      onClick={() => handleAddToCart(item)}
                      className="px-4 py-1.5 rounded-full bg-[#d4a24c] text-black text-xs font-semibold hover:brightness-110 transition"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* EMPTY STATE */}
        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-[#d4a24c]/10 flex items-center justify-center mb-6">
              <span className="text-3xl">🍽️</span>
            </div>

            <h3 className={`${playfair.className} text-2xl font-semibold mb-2`}>
              No Dishes Available
            </h3>

            <p className="text-white/60 max-w-md">
              This category is currently being curated by our chefs.
              Please check back soon for new offerings.
            </p>

            <div className="mt-6 h-[1px] w-24 bg-[#d4a24c]/30" />
          </div>
        )}
      </div>
    </section>
  )
}
