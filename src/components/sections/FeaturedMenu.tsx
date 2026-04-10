"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Playfair_Display } from "next/font/google"
import { Coffee, Star, X } from "lucide-react"
import Image from "next/image"
import { toast } from "@/hooks/use-toast"
import LumeLoaderMinimal from "@/components/oppa-loader"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/store/cartStore"

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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const { addItem } = useCartStore()

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

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    setDialogOpen(true)
  }

  const handleAddToCart = (product: Product) => {
    addItem(product)
    toast({
      title: "Added to cart",
      description: `${product.name} added to your order.`,
    })
  }

  const getImageUrl = (imagePath?: string | null) => {
    if (!imagePath) return "/placeholder-food.jpg"

    if (imagePath.startsWith("http")) return imagePath

    const base =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

    return `${base}/images/products/${imagePath}`
  }

  if (loading) return <LumeLoaderMinimal />

  return (
    <section className="relative py-24 bg-gradient-to-br from-[#0c222b] via-[#0f2833] to-[#1a3441] text-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-32 h-32 bg-[#d4a24c]/10 rounded-full blur-2xl" />
        <div className="absolute top-1/3 right-20 w-24 h-24 bg-[#d4a24c]/5 rounded-full blur-xl" />
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-[#d4a24c]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-28 h-28 bg-[#d4a24c]/6 rounded-full blur-2xl" />
      </div>

      <div className="container mx-auto px-4 max-w-6xl relative z-10">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <p className="text-[#d4a24c] tracking-[0.3em] uppercase text-sm mb-3">
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
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="group cursor-pointer"
                onClick={() => handleProductClick(item)}
              >
                <div className="py-8 border-b border-white/10 flex items-start gap-6 hover:bg-gradient-to-r hover:from-white/5 hover:to-white/10 transition-all duration-300 px-4 rounded-xl backdrop-blur-sm hover:shadow-lg hover:shadow-[#d4a24c]/10">
                  {/* Image */}
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-300">
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
                    <div className="flex items-start justify-between">
                      <h3 className={`${playfair.className} text-xl font-semibold group-hover:text-[#d4a24c] transition-colors duration-300`}>
                        {item.name}
                      </h3>
                      <Star className="w-5 h-5 text-[#d4a24c] flex-shrink-0 ml-2" />
                    </div>

                    <p className="text-sm text-white/70 mt-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between mt-4">
                      <span className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-full bg-gradient-to-r from-[#d4a24c]/20 to-[#d4a24c]/10 text-[#d4a24c] font-medium border border-[#d4a24c]/30">
                        <Coffee className="w-3 h-3" />
                        {item.category}
                      </span>

                      <div className="text-[#d4a24c] font-bold text-xl">
                        ₱{item.price}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
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

        {/* Product Detail Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl bg-gradient-to-br from-[#0c222b] to-[#1a3441] border border-[#d4a24c]/20 text-white shadow-2xl">
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
