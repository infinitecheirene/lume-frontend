"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus, X, ShoppingBag } from "lucide-react"
import { useCartStore } from "@/store/cartStore"
import { toast } from "@/hooks/use-toast"

const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return "/placeholder.svg"

  if (imagePath.startsWith("http")) return imagePath

  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  return `${base}/images/products/${imagePath}`
}

const formatPrice = (price: number): string =>
  price.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

export default function Cart() {
  const { items, updateQuantity, removeItem, getTotal, clearCart } =
    useCartStore()

  const total = getTotal()

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  const handleQuantityChange = (id: string | number, qty: number) => {
    if (qty < 1) {
      removeItem(id)
      toast({
        title: "Item removed",
        description: "Item removed from cart.",
      })
    } else {
      updateQuantity(id, qty)
    }
  }

  const handleRemove = (id: string | number, name: string) => {
    removeItem(id)
    toast({
      title: "Removed",
      description: `${name} removed.`,
    })
  }

  const handleClear = () => {
    clearCart()
    toast({
      title: "Cart cleared",
      description: "All items removed.",
    })
  }

  /* ================= EMPTY ================= */
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1d26] text-white px-4">
        <div className="text-center max-w-md bg-[#0f2a33] p-10 rounded-2xl border border-[#d4a24c]/30 shadow-xl">
          <ShoppingBag className="w-20 h-20 mx-auto text-[#d4a24c] mb-6" />
          <h1 className="text-2xl font-bold mb-3">Your Cart is Empty</h1>
          <p className="text-white/60 mb-6">
            Start adding delicious items from our menu 🍽️
          </p>

          <Button asChild className="bg-[#d4a24c] text-black rounded-full px-6">
            <Link href="/menu">Browse Menu</Link>
          </Button>
        </div>
      </div>
    )
  }

  /* ================= MAIN ================= */
  return (
    <div className="min-h-screen py-24 bg-[#0b1d26] text-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* LEFT */}
          <div className="flex-1">

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold">
                Cart ({totalItems} {totalItems === 1 ? "item" : "items"})
              </h1>

              <Button
                variant="outline"
                onClick={handleClear}
                className="border-white/30 text-white hover:bg-white/10"
              >
                Clear
              </Button>
            </div>

            {/* Items */}
            <div className="space-y-4">
              {items.map((item) => {
                const price = Number(item.price) || 0
                const subtotal = price * item.quantity

                return (
                  <Card
                    key={item.id}
                    className="bg-[#0f2a33] border-white/10 rounded-xl"
                  >
                    <CardContent className="p-5 flex gap-4">

                      {/* Image */}
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                        <Image
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 flex flex-col justify-between">

                        {/* Top */}
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="text-sm text-white/60 line-clamp-2">
                              {item.description}
                            </p>
                          </div>

                          <button
                            onClick={() =>
                              handleRemove(item.id, item.name)
                            }
                            className="text-white/50 hover:text-red-400"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        {/* Bottom */}
                        <div className="flex justify-between items-center mt-3">

                          <Badge className="bg-white/10 border-white/20">
                            {item.category}
                          </Badge>

                          <div className="flex items-center gap-4">

                            {/* Qty */}
                            <div className="flex items-center bg-white/10 rounded-full px-2">
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    item.id,
                                    item.quantity - 1
                                  )
                                }
                                className="p-1"
                              >
                                <Minus size={14} />
                              </button>

                              <span className="px-2">
                                {item.quantity}
                              </span>

                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    item.id,
                                    item.quantity + 1
                                  )
                                }
                                className="p-1"
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <p className="text-xs text-white/60">
                                ₱{formatPrice(price)}
                              </p>
                              <p className="font-semibold">
                                ₱{formatPrice(subtotal)}
                              </p>
                            </div>

                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:w-96">
            <Card className="sticky top-24 bg-[#0f2a33] border border-[#d4a24c]/30 rounded-2xl">
              <CardContent className="p-6 space-y-4">

                <h2 className="text-xl font-semibold">Order Summary</h2>

                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Subtotal</span>
                  <span>₱{formatPrice(total)}</span>
                </div>

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>₱{formatPrice(total)}</span>
                </div>

                <Button
                  asChild
                  className="w-full bg-[#d4a24c] text-black rounded-full"
                >
                  <Link href="/checkout">Checkout</Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="w-full border-white/20 text-white"
                >
                  <Link href="/menu">Continue Shopping</Link>
                </Button>

              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
