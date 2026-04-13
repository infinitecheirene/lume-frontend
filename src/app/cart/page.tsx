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
                className="bg-[#d4a24c] hover:bg-[#d4a24c]/60 text-gray-900 border-none"
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
                    <CardContent className="p-5 flex flex-col md:flex-row gap-5">

                      {/* LEFT - IMAGE + BASIC INFO */}
                      <div className="flex gap-4 w-full md:w-auto">

                        {/* IMAGE */}
                        <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-xl overflow-hidden flex-shrink-0">
                          <Image
                            src={getImageUrl(item.image)}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>

                        {/* NAME + DESCRIPTION */}
                        <div className="flex flex-col justify-center">
                          <h3 className="font-bold text-2xl text-gray-200">
                            {item.name}
                          </h3>

                          <p className="text-sm text-white/60 line-clamp-2 max-w-xs">
                            {item.description}
                          </p>

                          <Badge className="my-2 w-fit text-xs px-3 py-1 rounded-full bg-[#d4a24c]/20 text-[#d4a24c]">
                            {item.category}
                          </Badge>

                          <p className="my-2 text-sm text-gray-400">
                            ₱{formatPrice(price)}
                          </p>
                        </div>
                      </div>

                      {/* RIGHT - ACTIONS */}
                      <div className="flex flex-col justify-between ml-auto w-full md:w-auto gap-4">

                        {/* REMOVE BUTTON */}
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleRemove(item.id, item.name)}
                            className="text-white/40 hover:text-red-400 transition"
                          >
                            <X size={18} />
                          </button>
                        </div>

                        {/* QUANTITY + PRICE */}
                        <div className="flex items-center justify-between md:justify-end gap-6">

                          {/* QTY */}
                          <div className="flex items-center bg-white/10 rounded-full px-2">
                            <button
                              onClick={() =>
                                handleQuantityChange(item.id, item.quantity - 1)
                              }
                              className="p-1 hover:text-[#d4a24c]"
                            >
                              <Minus size={18} />
                            </button>

                            <span className="px-3 text-white font-medium">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                handleQuantityChange(item.id, item.quantity + 1)
                              }
                              className="p-1 hover:text-[#d4a24c]"
                            >
                              <Plus size={18} />
                            </button>
                          </div>

                          {/* PRICE */}
                          <div className="text-right min-w-[100px]">
                            <p className="text-xl font-bold text-gray-200">
                              ₱{formatPrice(subtotal)}
                            </p>
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

                <h2 className="text-2xl font-bold text-[#d4a24c]">
                  Order Summary
                </h2>

                {/* Items Summary */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {items.map((item) => {
                    const price = Number(item.price) || 0
                    const subtotal = price * item.quantity

                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-3 text-md text-white/70"
                      >
                        <span>
                          {item.name}
                        </span>
                        <span className="flex justify-center items-center">
                          x{item.quantity}
                        </span>
                        <span className="flex justify-end items-end">
                          ₱{formatPrice(subtotal)}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Divider */}
                <div className="h-[1px] bg-white/10" />

                {/* Total */}
                <div className="flex justify-between font-semibold text-lg text-white">
                  <span>Total</span>
                  <span>₱{formatPrice(total)}</span>
                </div>

                {/* Buttons */}
                <Button
                  asChild
                  className="w-full bg-[#d4a24c] hover:bg-[#d4a24c]/80 text-black rounded-full"
                >
                  <Link href="/checkout">Checkout</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
