"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2, Upload, Flame, Leaf, Save, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: number
  name: string
  description: string
  price: number | string
  image: string
  category: string
  is_spicy?: boolean
  is_vegetarian?: boolean
  is_featured?: boolean
  best_seller?: boolean
  created_at: string
  updated_at: string
}

const categories = ["Coffee", "Bar", "Food"]

const getImageUrl = (imagePath: string) => {
  if (!imagePath) return "/placeholder-food.jpg"
  if (imagePath.startsWith("http")) return imagePath

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  const path = imagePath.startsWith("images/products/") ? imagePath : `images/products/${imagePath}`
  return `${API_BASE_URL}/${path}`
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const resolvedParams = React.use(params) // unwrap the promise
  const productId = resolvedParams.id

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    is_spicy: false,
    is_vegetarian: false,
    is_featured: false,
    best_seller: false,
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // --- Effects ---

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    if (!productId) return

    const fetchProduct = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/product/${productId}`)
        if (!res.ok) throw new Error("Failed to fetch product")
        const data = await res.json()
        setProduct(data)

        setFormData({
          name: data.name || "",
          description: data.description || "",
          price: data.price?.toString() || "",
          category: data.category || "",
          is_spicy: data.is_spicy || false,
          is_vegetarian: data.is_vegetarian || false,
          is_featured: data.is_featured || false,
          best_seller: data.best_seller || false,
        })
      } catch (error) {
        console.error(error)
        toast({ variant: "destructive", title: "Error", description: "Failed to load product details" })
        router.push("/admin/product")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.id, router, toast])

  // --- Handlers ---
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedImage(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      console.log("Submitting form data...", formData)
      if (selectedImage) console.log("Selected image:", selectedImage)

      const fd = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        const val = typeof value === "boolean" ? (value ? "1" : "0") : (value as string)
        fd.append(key, val)
        console.log(`FormData append: ${key} = ${val}`)
      })
      if (selectedImage) fd.append("image", selectedImage)

      console.log(`Sending PUT request to /api/product/${productId}`)
      const res = await fetch(`/api/product/${productId}`, {
        method: "PUT",
        body: fd,
        credentials: "include",
      })

      console.log("Raw response status:", res.status, res.statusText)
      const result = await res.json()
      console.log("Response JSON:", result)

      if (!res.ok) throw new Error(result.message || "Failed to update product")

      toast({ title: "Success", description: "Product updated successfully!" })
      router.push("/admin/product")
    } catch (error: any) {
      console.error("Error during form submission:", error)
      toast({ variant: "destructive", title: "Error", description: error.message || "Error updating product" })
    } finally {
      setSaving(false)
    }
  }

  // --- UI Subcomponents ---
  const Loading = () => (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-yellow-50 to-yellow-50">
        <AppSidebar />
        <div className={`flex-1 min-w-0 ${isMobile ? "ml-0" : "ml-72"}`}>
          <div className="flex items-center justify-center min-h-screen w-full">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-4 rounded-xl shadow-lg">
              <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
              <span className="text-gray-700 font-medium">Loading product details...</span>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )

  const NotFound = () => (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-yellow-50 to-yellow-50">
        <AppSidebar />
        <div className={`flex-1 min-w-0 ${isMobile ? "ml-0" : "ml-72"}`}>
          <div className="flex items-center justify-center min-h-screen w-full">
            <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Product not found</h2>
              <Button
                onClick={() => router.push("/admin/product")}
                className="bg-gradient-to-r from-yellow-500 to-yellow-500 hover:from-yellow-600 hover:to-yellow-600 text-white font-semibold shadow-lg"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Products
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )

  if (loading) return <Loading />
  if (!product) return <NotFound />

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-yellow-50 to-yellow-50">
        <AppSidebar />
        <div className={`flex-1 min-w-0 ${isMobile ? "ml-0" : "ml-72"}`}>
          {isMobile && (
            <div className="sticky top-0 z-50 flex h-12 items-center gap-2 border-b bg-white/90 backdrop-blur-sm px-4 md:hidden shadow-sm">
              <SidebarTrigger className="-ml-1" />
              <span className="text-sm font-semibold bg-gradient-to-r from-yellow-600 to-yellow-600 bg-clip-text text-transparent">Edit Product</span>
            </div>
          )}

          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-4 bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-yellow-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/admin/product")}
                    className="shrink-0 hover:bg-yellow-100 text-yellow-600"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-600 bg-clip-text text-transparent">
                      Edit Product
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600">Update product information</p>
                  </div>
                </div>
              </div>

              {/* Product Form */}
              <Card className="gap-0 p-0 bg-white/70 backdrop-blur-sm shadow-xl border-yellow-100">
                <CardHeader className="bg-slate-800 text-white rounded-t-lg">
                  <CardTitle className="flex py-2 items-center gap-2 text-xl font-bold">
                    <span>Product Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 bg-white">
                  <ProductForm
                    formData={formData}
                    handleFormChange={handleFormChange}
                    handleSwitchChange={handleSwitchChange}
                    handleCategoryChange={handleCategoryChange}
                    handleImageSelect={handleImageSelect}
                    selectedImage={selectedImage}
                    imagePreview={imagePreview}
                    fileInputRef={fileInputRef}
                    saving={saving}
                    product={product}
                    handleSubmit={handleSubmit}
                    router={router}
                  />
                </CardContent>
              </Card>

              {/* Metadata */}
              <ProductMeta product={product} />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

function ProductMeta({ product }: { product: Product }) {
  return (
    <Card className="bg-gradient-to-r from-yellow-100 to-yellow-100 border-yellow-200 shadow-lg">
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <MetaItem label="Product ID" value={product.id.toString()} />
          <MetaItem
            label="Created"
            value={new Date(product.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
          />
          <MetaItem
            label="Last Updated"
            value={new Date(product.updated_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
          />
          <MetaItem label="Status" value="Active" valueClass="text-green-600 font-bold" />
        </div>
      </CardContent>
    </Card>
  )
}

const MetaItem = ({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) => (
  <div>
    <Label className="text-xs text-gray-600 uppercase tracking-wide font-semibold">{label}</Label>
    <p className={`font-mono text-gray-800 font-medium ${valueClass || ""}`}>{value}</p>
  </div>
)

// Product form component
function ProductForm({
  formData,
  handleFormChange,
  handleSwitchChange,
  handleCategoryChange,
  handleImageSelect,
  selectedImage,
  imagePreview,
  fileInputRef,
  saving,
  product,
  handleSubmit,
  router,
}: any) {
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image Upload */}
        <div className="lg:col-span-1">
          <Label htmlFor="image" className="text-base font-medium text-gray-700">
            Product Image
          </Label>
          <div className="mt-2 space-y-4">
            <div className="w-full aspect-square max-w-xs mx-auto lg:mx-0 rounded-xl overflow-hidden border-2 border-dashed border-yellow-300 bg-gradient-to-br from-yellow-50 to-yellow-50 shadow-lg">
              <Image
                src={imagePreview || getImageUrl(product.image)}
                alt={product.name}
                width={300}
                height={300}
                className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="space-y-2">
              <Input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} disabled={saving} className="hidden" />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
                className="w-full border-yellow-300 text-yellow-600 hover:bg-yellow-50 font-medium shadow-md"
              >
                <Upload className="w-4 h-4 mr-2" /> {selectedImage ? "Change Image" : "Upload New Image"}
              </Button>
              {selectedImage && (
                <p className="text-xs text-gray-500 text-center bg-yellow-50 p-2 rounded-lg">New image selected: {selectedImage.name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="name" className="text-gray-700 font-medium">
                Product Name *
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
                disabled={saving}
                placeholder="e.g., Garlic Butter Shrimp"
                className="mt-1 border-yellow-200 focus:border-yellow-400 focus:ring-yellow-400"
              />
            </div>

            <div>
              <Label htmlFor="price" className="text-gray-700 font-medium">
                Price (₱) *
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handleFormChange}
                required
                disabled={saving}
                placeholder="0.00"
                className="mt-1 border-yellow-200 focus:border-yellow-400 focus:ring-yellow-400"
              />
            </div>

            <div>
              <Label htmlFor="category" className="text-gray-700 font-medium">
                Category *
              </Label>
              <Select value={formData.category} onValueChange={handleCategoryChange} disabled={saving}>
                <SelectTrigger className="mt-1 border-yellow-200 focus:border-yellow-400 focus:ring-yellow-400">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-gray-700 font-medium">
              Description *
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              required
              rows={4}
              disabled={saving}
              placeholder="Describe the dish, ingyellowients, and preparation..."
              className="mt-1 resize-none border-yellow-200 focus:border-yellow-400 focus:ring-yellow-400"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-yellow-600 p-4 bg-white/40">
            <div className="space-y-1">
              <Label className="text-gray-700 font-bold text-md">Bestseller</Label>
              <p className="text-sm text-gray-600">Mark this product as a bestseller item.</p>
            </div>

            <Switch checked={formData.best_seller} onCheckedChange={(checked) => handleSwitchChange("best_seller", checked)} disabled={saving} />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-yellow-200">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/product")}
          disabled={saving}
          className="w-full sm:w-auto order-2 sm:order-1 border-yellow-300 text-yellow-600 hover:bg-yellow-50"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto sm:ml-auto order-1 sm:order-2 bg-gradient-to-r from-yellow-500 to-yellow-500 hover:from-yellow-600 hover:to-yellow-600 text-white font-semibold shadow-lg"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating Product...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Update Product
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
