"use client"

import { useState, useEffect } from "react"
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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

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

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    setDialogOpen(true)
  }

  if (loading) return <LumeLoaderMinimal />

  return (
    <section className="py-28 bg-[#0b1d26] min-h-screen">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-32 h-32 bg-[#d4a24c]/10 rounded-full blur-2xl" />
        <div className="absolute top-1/3 right-20 w-24 h-24 bg-[#d4a24c]/5 rounded-full blur-xl" />
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-[#d4a24c]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-28 h-28 bg-[#d4a24c]/6 rounded-full blur-2xl" />
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
                  <div className="py-8 border-b border-white/10 flex items-start gap-6 hover:bg-gradient-to-r hover:from-white/5 hover:to-white/10 transition-all duration-300 px-4 rounded-xl backdrop-blur-sm hover:shadow-lg hover:shadow-[#d4a24c]/10">
                    {/* Image */}
                    <div className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <Image
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className={`${playfair.className} text-xl font-semibold group-hover:text-[#d4a24c] transition-colors duration-300 flex items-center gap-2`}>
                          {item.name}
                          {item.best_seller && (
                            <span className="inline-flex items-center gap-1">
                              <Star className="w-4 h-4 text-[#d4a24c] flex-shrink-0" />
                              <p className="text-[#d4a24c] font-medium text-sm">Best Seller</p>
                            </span>
                          )}
                        </h4>
                      </div>

                      <p className="text-sm text-white/70 mt-2 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>

                      <div className="flex items-center justify-between mt-4">
                        <span className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-[#d4a24c]/20 text-[#d4a24c] font-medium border border-[#d4a24c]/30">
                          <Coffee className="w-3 h-3" />
                          {item.category}
                        </span>

                        <div className="text-right">
                          <div className="text-[#d4a24c] font-bold text-xl mb-2">
                            ₱{item.price}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAddToCart(item)
                            }}
                            className="px-4 py-2 rounded-full bg-gradient-to-r from-[#d4a24c] to-[#b8943a] text-black text-xs font-semibold hover:from-[#b8943a] hover:to-[#d4a24c] transition-all duration-300 shadow-md hover:shadow-lg"
                          >
                            + Add to Cart
                          </button>
                        </div>
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
          <DialogContent className="max-w-2xl bg-gradient-to-br from-[#0b1d26] to-[#1a2e3a] border border-[#d4a24c]/20 text-white shadow-2xl">
            <DialogHeader className="text-center">
              <DialogTitle className={`${playfair.className} text-3xl font-bold text-[#d4a24c] mb-2`}>
                {selectedProduct?.name}
              </DialogTitle>
            </DialogHeader>

            {selectedProduct && (
              <div className="space-y-6">
                {/* Image */}
                <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-2xl">
                  <Image
                    src={getImageUrl(selectedProduct.image)}
                    alt={selectedProduct.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-gradient-to-r from-[#d4a24c]/20 to-[#d4a24c]/10 text-[#d4a24c] font-medium border border-[#d4a24c]/30">
                      <Coffee className="w-4 h-4" />
                      {selectedProduct.category}
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      {selectedProduct?.best_seller && (
                        <>
                          <Star className="w-5 h-5 text-[#d4a24c] fill-current" />
                          <span className="text-sm text-[#d4a24c] font-medium">Best Seller</span>
                        </>
                      )}
                    </div>
                    <div className="text-3xl font-bold text-[#d4a24c]">
                      ₱{selectedProduct.price}
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h4 className="text-[#d4a24c] font-semibold mb-2">Description</h4>
                    <p className="text-white/80 leading-relaxed">
                      {selectedProduct.description}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      handleAddToCart(selectedProduct)
                      setDialogOpen(false)
                    }}
                    className="flex-1 bg-gradient-to-r from-[#d4a24c] to-[#b8943a] hover:from-[#b8943a] hover:to-[#d4a24c] text-black font-semibold py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </section>
  )
}
