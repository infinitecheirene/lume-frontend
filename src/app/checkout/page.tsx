"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useCartStore } from "@/store/cartStore"
import type { CheckoutInfo } from "@/types"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { Banknote, Lock, Package, LogIn, Upload, X, Copy, Check } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useSettingsStore } from "@/store/settingsStore"

interface ExtendedCheckoutInfo extends Omit<CheckoutInfo, "paymentMethod"> {
  paymentMethod: string
  notes?: string
}

interface Address {
  id: number
  street: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
}

const formatPrice = (price: number): string => {
  return price.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const Checkout = () => {
  const { items, getTotal, clearCart } = useCartStore()
  const total = getTotal()
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()
  const [isOrderComplete, setIsOrderComplete] = useState(false)
  const [userInfo, setUserInfo] = useState<any | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [copiedGcash, setCopiedGcash] = useState(false)
  const [copiedBank, setCopiedBank] = useState(false)
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [loadingPayments, setLoadingPayments] = useState(true)
  const { maintenanceMode, deliveryFee } = useSettingsStore()

  const [checkoutInfo, setCheckoutInfo] = useState<ExtendedCheckoutInfo>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
    paymentMethod: "cash",
    notes: "",
  })
  const [receiptFile, setReceiptFile] = useState<string | null>(null)

  useEffect(() => {
    const checkAuthAndFillForm = async () => {
      setIsLoadingUser(true)

      try {
        const token = localStorage.getItem("auth_token")
        const userData = localStorage.getItem("user_data")

        if (!token || !userData) {
          setIsLoadingUser(false)
          return
        }

        const parsedUserData = JSON.parse(userData)
        setUserInfo(parsedUserData)

        // Load addresses
        setIsLoadingAddresses(true)

        const addressesResponse = await fetch("/api/addresses", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (addressesResponse.ok) {
          const addressesData = await addressesResponse.json()
          const addresses: Address[] = addressesData.addresses || []

          const defaultAddress = addresses.find((addr) => addr.is_default)

          if (defaultAddress) {
            setCheckoutInfo((prev) => ({
              ...prev,
              name: parsedUserData.name || "",
              email: parsedUserData.email || "",
              phone: parsedUserData.phone || "",
              address: defaultAddress.street,
              city: defaultAddress.city,
              zipCode: defaultAddress.postal_code,
            }))

            toast({
              title: "Welcome back!",
              description: "Your default address has been loaded.",
            })
          } else {
            setCheckoutInfo((prev) => ({
              ...prev,
              name: parsedUserData.name || "",
              email: parsedUserData.email || "",
              phone: parsedUserData.phone || "",
              address: parsedUserData.address || "",
              city: parsedUserData.city || "",
              zipCode: parsedUserData.zip_code || "",
            }))
          }
        } else {
          setCheckoutInfo((prev) => ({
            ...prev,
            name: parsedUserData.name || "",
            email: parsedUserData.email || "",
            phone: parsedUserData.phone || "",
            address: parsedUserData.address || "",
            city: parsedUserData.city || "",
            zipCode: parsedUserData.zip_code || "",
          }))
        }
      } catch (error) {
        console.error("Error checking auth:", error)
        localStorage.removeItem("auth_token")
        localStorage.removeItem("user_data")
      } finally {
        setIsLoadingAddresses(false)
        setIsLoadingUser(false)
      }
    }

    checkAuthAndFillForm()
  }, [])

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoadingPayments(true)

        const res = await fetch("/api/payment-methods?is_enabled=1")
        const json = await res.json()

        if (!json.success) throw new Error(json.message)

        setPaymentMethods(json.data || [])
      } catch (err) {
        console.error("Failed to fetch payment methods:", err)
      } finally {
        setLoadingPayments(false)
      }
    }

    fetchPaymentMethods()
  }, [])

  const handleInputChange = (field: keyof ExtendedCheckoutInfo, value: string) => {
    setCheckoutInfo((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 2MB",
          variant: "destructive",
        })
        e.target.value = ""
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setReceiptFile(reader.result as string)
        toast({
          title: "Receipt uploaded",
          description: "Your payment receipt has been attached",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const removeReceipt = () => {
    setReceiptFile(null)
    toast({
      title: "Receipt removed",
      description: "Payment receipt has been removed",
    })
  }

  const copyToClipboard = (text: string, type: "gcash" | "bank") => {
    navigator.clipboard.writeText(text)
    if (type === "gcash") {
      setCopiedGcash(true)
      setTimeout(() => setCopiedGcash(false), 2000)
      toast({
        title: "Copied!",
        description: "GCash number copied to clipboard",
      })
    } else {
      setCopiedBank(true)
      setTimeout(() => setCopiedBank(false), 2000)
      toast({
        title: "Copied!",
        description: "Bank account number copied to clipboard",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!checkoutInfo.name || !checkoutInfo.email || !checkoutInfo.phone || !checkoutInfo.address) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (checkoutInfo.paymentMethod === "cash" && items.some((item) => item.price * item.quantity > 1000)) {
      toast({
        title: "COD Not Available",
        description: "Please use a different payment method for orders over ₱1,000.",
        variant: "destructive",
      })
      return
    }

    if (checkoutInfo.paymentMethod !== "cash" && !receiptFile) {
      toast({
        title: "Receipt Required",
        description: "Please upload your payment receipt to proceed.",
        variant: "destructive",
      })
      return
    }

    const token = localStorage.getItem("auth_token")
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to place an order.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    setIsProcessing(true)

    try {
      const orderData = {
        items: items.map((item) => ({
          name: item.name,
          description: item.description || "",
          price: item.price,
          quantity: item.quantity,
          category: item.category,
          image_url: typeof item.image === "string" ? item.image : "",
        })),
        payment_method: checkoutInfo.paymentMethod,
        delivery_address: checkoutInfo.address,
        delivery_city: checkoutInfo.city,
        delivery_zip_code: checkoutInfo.zipCode,
        customer_name: checkoutInfo.name,
        customer_email: checkoutInfo.email,
        customer_phone: checkoutInfo.phone,
        notes: checkoutInfo.notes || "",
        receipt_file: receiptFile || null,
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()

      if (response.ok) {
        const orderNumber =
          result.data?.order?.order_number || result.data?.order_number || result.order?.order_number || result.order_number || "your order"

        clearCart()
        setIsOrderComplete(true)

        toast({
          title: "Order Placed Successfully!",
          description: `Order ${orderNumber} has been created.`,
        })

        setTimeout(() => {
          router.push("/orders")
        }, 1000)
      } else {
        throw new Error(result.message || result.error || "Failed to create order")
      }
    } catch (error) {
      console.error("Error creating order:", error)
      toast({
        title: "Order Failed",
        description: error instanceof Error ? error.message : "Failed to place order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (items.length === 0 && !isOrderComplete) {
    router.push("/cart")
    return null
  }

  const handlePlaceOrder = async () => {
    if (!checkoutInfo.paymentMethod) {
      toast({
        title: "Payment method required",
        description: "Please select a payment method",
        variant: "destructive",
      })
      return
    }

    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items before placing an order",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      const orderData = {
        items: cart.map((item) => ({
          name: item.name,
          description: item.description || "",
          price: item.price,
          quantity: item.quantity,
          category: item.category || "",
          image_url: typeof item.image === "string" ? item.image : "",
        })),
        total,
        payment_method: checkoutInfo.paymentMethod,
        customer_name: checkoutInfo.name,
        customer_email: checkoutInfo.email,
        customer_phone: checkoutInfo.phone,
        address: checkoutInfo.address,
        city: checkoutInfo.city,
        zip_code: checkoutInfo.zipCode,
        notes: checkoutInfo.notes,
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        throw new Error("Failed to place order")
      }

      // Clear cart
      clearCart()

      // Show success screen
      setIsOrderComplete(true)

      toast({
        title: "Order placed successfully",
        description: "Your order has been confirmed",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Order failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (maintenanceMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1d26] text-white px-4">
        <div className="text-center max-w-md bg-[#0f2a33] p-10 rounded-2xl border border-[#d4a24c]/30 shadow-xl">
          <h1 className="text-2xl font-bold mb-3 text-[#d4a24c]">Maintenance Mode</h1>

          <p className="text-white/70 mb-6">Sorry, we are currently under maintenance. Please try again later.</p>

          <Button onClick={() => (window.location.href = "/")} className="bg-[#d4a24c] text-black rounded-full px-6">
            Go Back Home
          </Button>
        </div>
      </div>
    )
  }

  if (isOrderComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1d26] text-white px-4">
        <div className="text-center max-w-md bg-[#0f2a33] p-10 rounded-2xl border border-[#d4a24c]/30 shadow-xl">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#d4a24c] flex items-center justify-center">
            <Check className="w-8 h-8 text-black" />
          </div>

          <h1 className="text-2xl font-bold mb-3">Order Successful 🎉</h1>

          <p className="text-white/70 mb-6">Your order has been placed successfully. A confirmation email has been sent to your inbox.</p>

          <Button asChild className="bg-[#d4a24c] text-black rounded-full px-6">
            <Link href="/orders">View My Orders</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (isLoadingUser) {
    return (
      <div className="min-h-screen py-24 bg-[#0b1d26] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-[#d4a24c] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white/70">Preparing checkout...</p>
          <p className="text-xs text-white/40">Loading your account and address</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-24 bg-[#0b1d26] text-white">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#d4a24c]/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#d4a24c]/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#d4a24c]/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">Checkout</h1>
            {userInfo && (
              <div className="flex items-center gap-2 px-4 py-2 border bg-[#0b1d26]/70 backdrop-blur-sm border-white/30 hover:border-white/50 rounded-2xl overflow-hidden">
                <span className="text-white font-medium">Welcome, {userInfo.name}!</span>
              </div>
            )}
          </div>

          {!userInfo && (
            <Card className="mb-8 shadow-2xl bg-[#0b1d26]/70 backdrop-blur-sm border-white/30 hover:border-white/50 rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Login for faster checkout!</h3>
                    <p className="text-white/70">Save your information for quick ordering next time.</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/login">
                      <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 bg-transparent">
                        <LogIn className="w-4 h-4 mr-2" />
                        Login
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button className="bg-white hover:bg-white/90 text-[#8B0000] font-bold shadow-lg">
                        <LogIn className="w-4 h-4 mr-2" />
                        Register
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="shadow-2xl p-0 bg-[#0b1d26]/70 backdrop-blur-sm border-white/30 hover:border-white/50 rounded-2xl overflow-hidden">
              <div className="border-b border-white/20 bg-[#d4a24c] text-[#0b1d26]/90 px-6 py-4">
                <h2 className="text-2xl font-bold">Delivery & Payment Information</h2>
              </div>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-xl text-white border-b border-white/20 pb-2">Personal Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 space-y-4">
                      <div>
                        <Label htmlFor="name" className="text-white py-2">
                          Full Name *
                        </Label>
                        <Input
                          id="name"
                          value={checkoutInfo.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="Enter your full name"
                          required
                          className="border-white/30 bg-white/20 text-white placeholder:text-white/60 focus:border-white focus:ring-white/30"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-white py-2">
                          Email Address *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={checkoutInfo.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder="Enter your email"
                          required
                          className="border-white/30 bg-white/20 text-white placeholder:text-white/60 focus:border-white focus:ring-white/30"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-white py-2">
                        Phone Number *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={checkoutInfo.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="Enter your phone number"
                        required
                        className="border-white/30 bg-white/20 text-white placeholder:text-white/60 focus:border-white focus:ring-white/30"
                      />
                    </div>
                  </div>

                  <Separator className="bg-white/20" />

                  <div className="space-y-4">
                    <h3 className="font-semibold text-xl text-white border-b border-white/20 pb-2">Delivery Address</h3>

                    <div>
                      <Label htmlFor="address" className="text-white py-2">
                        Street Address *
                      </Label>
                      <Input
                        id="address"
                        value={checkoutInfo.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        placeholder="Enter your street address"
                        required
                        className="border-white/30 bg-white/20 text-white placeholder:text-white/60 focus:border-white focus:ring-white/30"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city" className="text-white py-2">
                          City *
                        </Label>
                        <Input
                          id="city"
                          value={checkoutInfo.city}
                          onChange={(e) => handleInputChange("city", e.target.value)}
                          placeholder="Enter your city"
                          required
                          className="border-white/30 bg-white/20 text-white placeholder:text-white/60 focus:border-white focus:ring-white/30"
                        />
                      </div>
                      <div>
                        <Label htmlFor="zipCode" className="text-white py-2">
                          ZIP Code *
                        </Label>
                        <Input
                          id="zipCode"
                          value={checkoutInfo.zipCode}
                          onChange={(e) => handleInputChange("zipCode", e.target.value)}
                          placeholder="Enter ZIP code"
                          required
                          className="border-white/30 bg-white/20 text-white placeholder:text-white/60 focus:border-white focus:ring-white/30"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-white/20" />

                  <div className="space-y-4">
                    <h3 className="font-semibold text-xl text-white border-b border-white/20 pb-2">Payment Method</h3>

                    {total > 1000 && (
                      <div className="p-3 bg-[#ff6b6b]/20 border border-[#ff6b6b]/50 rounded-lg mb-3">
                        <p className="text-sm text-white font-medium">
                          Cash on Delivery is not available for orders above ₱1,000. Please use other payment methods.
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      {loadingPayments ? (
                        <p className="text-white/60 text-sm">Loading payment methods...</p>
                      ) : paymentMethods.length === 0 ? (
                        <p className="text-white/60 text-sm">No payment methods available</p>
                      ) : (
                        paymentMethods
                          .filter((m) => m.is_enabled)
                          .map((method) => (
                            <div
                              key={method.id}
                              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                                checkoutInfo.paymentMethod === method.key
                                  ? "bg-white/10 border-white"
                                  : "bg-white/5 border-white/20 hover:border-white/40"
                              }`}
                              onClick={() => handleInputChange("paymentMethod", method.key as any)}
                            >
                              {/* HEADER ROW */}
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    checkoutInfo.paymentMethod === method.key ? "border-white" : "border-white/30"
                                  }`}
                                >
                                  {checkoutInfo.paymentMethod === method.key && <div className="w-3 h-3 rounded-full bg-white" />}
                                </div>

                                <div className="flex-1">
                                  <p className="font-medium text-white capitalize">{method.display_name}</p>
                                  <p className="text-sm text-white/70 capitalize">
                                    {method.type === "cash" ? "Pay when you receive your order" : method.type}
                                  </p>
                                </div>

                                {checkoutInfo.paymentMethod === method.key && <Check className="w-5 h-5 text-white" />}
                              </div>

                              {/* DETAILS (ONLY WHEN SELECTED) */}
                              {checkoutInfo.paymentMethod === method.key && method.type !== "cash" && (
                                <div className="mt-3 space-y-2 text-sm text-white/80">
                                  {method.account_name ? (
                                    <p>
                                      <span className="text-white/60">Name:</span> {method.account_name}
                                    </p>
                                  ) : method.display_name ? (
                                    <p>
                                      <span className="text-white/60">Name:</span> {method.display_name}
                                    </p>
                                  ) : null}

                                  {method.account_number && (
                                    <p>
                                      <span className="text-white/60">Account Number:</span> {method.account_number}
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          copyToClipboard(
                                            (checkoutInfo.paymentMethod = method.account_number),
                                            (checkoutInfo.paymentMethod = method.key),
                                          )
                                        }
                                        className="ml-2 border-white/30 text-white hover:bg-white/10 bg-transparent"
                                      >
                                        {(checkoutInfo.paymentMethod === "gcash" ? copiedGcash : copiedBank) ? (
                                          <Check className="w-4 h-4 mr-2" />
                                        ) : (
                                          <Copy className="w-4 h-4 mr-2" />
                                        )}
                                        Copy
                                      </Button>
                                    </p>
                                  )}

                                  {method.qr_code && (
                                    <div className="mt-2 w-full">
                                      {method.qr_code && (
                                        <div className="mt-2 w-full">
                                          <Image
                                            src={`${process.env.NEXT_PUBLIC_API_URL}/${method.qr_code}`}
                                            alt="QR Code"
                                            width={360}
                                            height={360}
                                            className="rounded border border-white/20 object-cover"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  <div className="mt-4">
                                    <Label className="text-white">Upload Receipt *</Label>
                                    <div className="mt-2">
                                      {receiptFile ? (
                                        <div className="flex items-center gap-2 p-3 bg-white/10 rounded-lg border border-white/30">
                                          <Check className="w-4 h-4 text-[#ff6b6b]" />
                                          <span className="text-white text-sm">Receipt uploaded</span>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={removeReceipt}
                                            className="ml-auto text-[#ff6b6b] hover:bg-white/10"
                                          >
                                            <X className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-white/30 rounded-lg cursor-pointer hover:border-white/50 transition-colors">
                                          <Upload className="w-5 h-5 text-white/70" />
                                          <span className="text-white/70">Click to upload receipt</span>
                                          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                        </label>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className="mb-4 w-full bg-[#d4a24c] text-black rounded-full py-5 text-lg hover:bg-[#c8953f] transition-all"
                  >
                    {isProcessing ? "Processing..." : "Place Order"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="h-fit sticky top-24 shadow-2xl p-0 bg-[#0b1d26]/70 backdrop-blur-sm border-white/30 hover:border-white/50 rounded-2xl overflow-hidden">
              <div className="border-b border-white/20 bg-[#d4a24c] text-[#0b1d26]/90 px-6 py-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Package className="w-6 h-6" />
                  Order Summary
                </h2>
              </div>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    {/* HEADERS */}
                    <thead>
                      <tr className="border-b border-white/10 text-white/70 text-sm">
                        <th className="py-3 font-medium">Product</th>
                        <th className="py-3 font-medium text-center">Qty</th>
                        <th className="py-3 font-medium text-right">Subtotal</th>
                      </tr>
                    </thead>

                    {/* BODY */}
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-b border-white/10 hover:bg-white/5 transition">
                          {/* PRODUCT NAME */}
                          <td className="py-3 text-white font-medium">
                            <div className="max-w-[220px] truncate">{item.name}</div>
                          </td>

                          {/* QUANTITY */}
                          <td className="py-3 text-white/70 text-center">{item.quantity}</td>

                          {/* SUBTOTAL */}
                          <td className="py-3 text-white text-right font-medium">₱{formatPrice(Number(item.price) * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Separator className="bg-white/20" />
                <div className="flex justify-between font-bold text-lg pt-6">
                  <span className="text-white">Delivery Fee</span>
                  <span className="text-white">₱{formatPrice(deliveryFee)}</span>
                </div>

                <div className="flex justify-between font-bold text-lg pb-6">
                  <span className="text-white">Total</span>
                  <span className="text-white">₱{formatPrice(total + deliveryFee)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
