"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Playfair_Display } from "next/font/google"
import { toast } from "@/hooks/use-toast"
import { useCartStore } from "@/store/cartStore"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

export default function MenuPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeMainCategory, setActiveMainCategory] = useState<"Kitchen" | "Coffee" | "Bar">("Kitchen")
  const { addItem } = useCartStore()

  // Map main categories to granular product categories
  const mainCategoryMap = {
    Kitchen: ["Appetizers", "Main Course", "Desserts", "Noodles", "Rice Dishes", "Soups", "Add-ons"],
    Coffee: ["Coffee"],
    Bar: ["Beverages"],
  }

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/product?paginate=false")
      const result = await response.json()
      if (response.ok) {
        setProducts(result)
      } else {
        throw new Error(result.message || "Failed to fetch products")
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
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

  // Filter and group products based on selected main category
  const filteredProducts = products.filter((item) =>
    mainCategoryMap[activeMainCategory].includes(item.category)
  )

  const groupedProducts = filteredProducts.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, typeof filteredProducts>)

  const handleAddToCart = (item: any) => {
    addItem(item)
    toast({
      title: "Added to cart",
      description: `${item.name} added to your order.`,
    })
  }

  return (
    <section className="py-24 bg-[#0b1d26] text-white">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Heading */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <p className="tracking-[0.3em] uppercase text-sm mb-3 text-[#d4a24c]">Our Offerings</p>
          <h2 className={`${playfair.className} text-4xl md:text-5xl font-bold`}>
            The <span className="text-[#d4a24c] italic">Menu</span>
          </h2>
        </motion.div>

        {/* Main Category Tabs */}
        <div className="flex justify-center gap-3 mb-16">
          {Object.keys(mainCategoryMap).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveMainCategory(cat as keyof typeof mainCategoryMap)}
              className={`px-6 py-2.5 rounded-full text-sm transition ${
                activeMainCategory === cat ? "bg-[#d4a24c] text-black font-semibold" : "bg-[#132e3b] text-white/70 hover:bg-[#193847] hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products grouped by granular category */}
        {Object.entries(groupedProducts).map(([category, items]) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h3 className="text-xl font-semibold mb-4">{category}</h3>
            <div className="grid md:grid-cols-2 gap-x-16 gap-y-6">
              {items.map((item) => (
                <div key={item.id} className="py-6 border-b border-white/10 flex justify-between items-start gap-6">
                  <div>
                    <h4 className={`${playfair.className} text-lg md:text-xl font-semibold`}>{item.name}</h4>
                    <p className="text-sm text-white/60 mt-1">{item.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[#d4a24c] font-semibold text-lg whitespace-nowrap">₱{item.price}</span>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="px-4 py-1.5 rounded-full bg-[#d4a24c] text-black text-xs font-semibold hover:brightness-110 transition"
                    >
                      + Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Empty state */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-white/70">No items available in this category yet.</div>
        )}
      </div>
    </section>
  )
}