"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Playfair_Display } from "next/font/google"
import { toast } from "@/hooks/use-toast"
import { useCartStore } from "@/store/cartStore"
import LumeLoaderMinimal from "@/components/oppa-loader"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Star, X, Coffee } from "lucide-react"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

interface Product {
  id: number
  name: string
  description: string
  ingredients: string
  category: string
  price: number
  image?: string | null
  best_seller?: boolean
}

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMainCategory, setActiveMainCategory] =
    useState<"Signature" | "Classic" | "Drinks" | "Coffee" | "Refreshers" | "Food">("Signature")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const { addItem } = useCartStore()

  const mainCategoryMap = {
    Signature: ["Signature"],
    Classic: ["Classic"],
    Drinks: ["Drinks"],
    Coffee: ["Coffee"],
    Refreshers: ["Refreshers"],
    Food: ["Food"],
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

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    setDialogOpen(true)
  }

  const stars = useMemo(() => {
    return Array.from({ length: 140 }).map((_, i) => ({
      id: i,
      cx: Math.random() * 100,
      cy: Math.random() * 100,
      r: Math.random() * 3 + 0.8,
      duration: Math.random() * 4 + 2,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.4 + 0.3,
    }))
  }, [])


  if (loading) return <LumeLoaderMinimal />

  return (
    <section className="relative py-28 bg-[#0b1d26] min-h-screen overflow-hidden">

      {/* Background decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        {/* Glow layer */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,162,76,0.08),transparent_40%)]" />
        <svg width="100%" height="100%">
          {stars.map((star) => (
            <circle
              key={star.id}
              cx={`${star.cx}%`}
              cy={`${star.cy}%`}
              r={star.r}
              fill="hsl(40, 80%, 75%)"
              className="animate-twinkle"
              style={{
                animationDuration: `${star.duration}s`,
                animationDelay: `${star.delay}s`,
                opacity: star.opacity,
                filter: star.r > 2.5 ? "drop-shadow(0 0 6px rgba(212,162,76,0.4))" : "none",
              }}
            />
          ))}
        </svg>
      </div>

      <div className="container mx-auto px-4 max-w-6xl relative z-10">

        {/* Heading */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 md:mb-16">
          <p className="tracking-[0.2em] md:tracking-[0.3em] uppercase text-xs md:text-sm mb-2 md:mb-3 text-[#d4a24c]">Our Offerings</p>
          <h2 className={`${playfair.className} text-3xl md:text-5xl lg:text-6xl font-bold leading-tight`}>
            The <span className="text-[#d4a24c] italic">Menu</span>
          </h2>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-20">
          {Object.keys(mainCategoryMap).map((cat) => (
            <motion.button
              key={cat}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Object.keys(mainCategoryMap).indexOf(cat) * 0.1 }}
              onClick={() =>
                setActiveMainCategory(cat as keyof typeof mainCategoryMap)
              }
              className={`px-8 py-3 rounded-full text-sm font-medium transition-all duration-300 shadow-lg ${activeMainCategory === cat
                ? "bg-gradient-to-r from-[#d4a24c] to-[#b8943a] text-black font-semibold shadow-[#d4a24c]/30"
                : "bg-[#132e3b]/80 backdrop-blur-sm text-white/70 hover:bg-[#193847] hover:text-white border border-white/10 hover:border-[#d4a24c]/30"
                }`}
            >
              {cat}
            </motion.button>
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
            <div className="grid md:grid-cols-2 gap-x-16 gap-y-8">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group cursor-pointer"
                  onClick={() => handleProductClick(item)}
                >
                  <div
                    className="group cursor-pointer rounded-2xl bg-white/5 backdrop-blur-md border border-white/10
                            hover:border-[#d4a24c]/30 hover:bg-white/10 transition-all duration-300
                              hover:shadow-lg hover:shadow-[#d4a24c]/10 overflow-hidden"
                  >
                    <div
                      className="p-5 flex gap-5"
                      onClick={() => handleProductClick(item)}
                    >
                      {/* IMAGE */}
                      <div className="relative w-28 h-28 md:w-32 md:h-32 flex-shrink-0 rounded-xl overflow-hidden">
                        <Image
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* CONTENT */}
                      <div className="flex-1 flex flex-col justify-between">

                        {/* TITLE + BADGE */}
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <h4 className={`${playfair.className} text-xl font-semibold group-hover:text-[#d4a24c] transition-colors`}>
                              {item.name}
                            </h4>

                            {item.best_seller && (
                              <span className="flex items-center gap-1 text-[#d4a24c] text-xs font-medium">
                                <Star className="w-4 h-4" />
                                Best Seller
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-white/60 mt-2 line-clamp-2">
                            {item.description}
                          </p>
                        </div>

                        {/* PRICE + BUTTON */}
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-[#d4a24c] font-bold text-lg">
                            ₱{item.price}
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAddToCart(item)
                            }}
                            className="px-4 py-2 rounded-full bg-[#d4a24c] text-black text-xs font-semibold
                                    hover:bg-[#b8943a] transition"
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* INGREDIENTS */}
                    <div className="px-5 pb-5 pt-3 border-t border-white/10">
                      <div className="flex flex-wrap gap-2">
                        {item.ingredients.split("|").slice(0, 5).map((ing, i) => (
                          <span
                            key={i}
                            className="text-[11px] px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60"
                          >
                            {ing.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                </motion.div>
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

        {/* Product Detail Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl bg-[#0b1d26] border border-white/10 text-white rounded-2xl overflow-hidden p-0">

            {/* IMAGE HEADER */}
            <div className="relative w-full h-72">
              <Image
                src={getImageUrl(selectedProduct?.image)}
                alt={selectedProduct?.name || ""}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1d26] via-black/40 to-transparent" />

              {/* BADGE */}
              {selectedProduct?.best_seller && (
                <div className="absolute top-4 left-4 bg-[#d4a24c] text-black px-3 py-1 rounded-full text-xs font-semibold">
                  ⭐ Best Seller
                </div>
              )}
            </div>

            {/* CONTENT */}
            <div className="p-6 space-y-5">

              {/* TITLE + PRICE */}
              <div className="flex items-start justify-between gap-4">
                <DialogTitle className={`${playfair.className} text-2xl md:text-3xl font-bold text-[#d4a24c]`}>
                  {selectedProduct?.name}
                </DialogTitle>

                <div className="text-xl font-bold text-white">
                  ₱{selectedProduct?.price}
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="text-white/70 text-sm leading-relaxed">
                {selectedProduct?.description}
              </div>

              {/* INGREDIENTS */}
              <div>
                <p className="text-xs uppercase tracking-widest text-white/40 mb-2">
                  Ingredients
                </p>

                <div className="flex flex-wrap gap-2">
                  {selectedProduct?.ingredients.split("|").map((ing, i) => (
                    <span
                      key={i}
                      className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70"
                    >
                      {ing.trim()}
                    </span>
                  ))}
                </div>
              </div>

              {/* ACTION */}
              <div className="pt-2">
                <Button
                  onClick={() => {
                    handleAddToCart(selectedProduct!)
                    setDialogOpen(false)
                  }}
                  className="w-full bg-[#d4a24c] hover:bg-[#b8943a] text-black font-semibold py-3 rounded-xl"
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          </DialogContent>

        </Dialog>
      </div>

      <style>
        {`
          
@keyframes twinkle {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.9;
  }
}

.animate-twinkle {
  animation: twinkle ease-in-out infinite;
}
        `}
      </style>
    </section>
  )
}
