"use client"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import type React from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoreHorizontal, Eye, Plus, Search, Loader2, ArrowUpDown, Edit, Trash2, Upload, Flame, Leaf, Star } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect, useRef, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
} from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"
import { Playfair_Display } from "next/font/google"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

// Product data type
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
  created_at: string
  updated_at: string
}

const categories = ["Appetizers", "Main Course", "Desserts", "Coffee", "Beverages", "Noodles", "Rice Dishes", "Soups", "Add-ons"]

const getImageUrl = (imagePath: string): string => {
  if (!imagePath) {
    return "/placeholder-food.jpg"
  }

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath
  }

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  let fullPath = imagePath
  if (!imagePath.startsWith("images/products/")) {
    fullPath = `images/products/${imagePath}`
  }

  return `${API_BASE_URL}/${fullPath}`
}

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)

  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth < 1024) // lg breakpoint
    }
    checkDesktop()
    window.addEventListener("resize", checkDesktop)
    return () => window.removeEventListener("resize", checkDesktop)
  }, [])

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newFormData, setNewFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    is_spicy: false,
    is_vegetarian: false,
    is_featured: false,
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const [deletingId, setDeletingId] = useState<number | null>(null)

  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === "string" ? Number.parseFloat(price) : price
    return numPrice.toFixed(2)
  }

  const handleNewFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, value: boolean) => {
    setNewFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (value: string) => {
    setNewFormData((prev) => ({ ...prev, category: value }))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const formData = new FormData()
      formData.append("name", newFormData.name)
      formData.append("description", newFormData.description)
      formData.append("price", newFormData.price)
      formData.append("category", newFormData.category)
      formData.append("is_spicy", newFormData.is_spicy.toString())
      formData.append("is_vegetarian", newFormData.is_vegetarian.toString())
      formData.append("is_featured", newFormData.is_featured.toString())

      if (selectedImage) {
        formData.append("image", selectedImage)
      }

      const response = await fetch("/api/product", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.message || "Failed to create product.")
      }

      toast({
        title: "Success",
        description: "Product created successfully!",
      })

      setIsCreateModalOpen(false)
      resetForm()
      fetchProducts()
    } catch (error: any) {
      console.error("Error creating product:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "There was an error creating the product.",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const resetForm = () => {
    setNewFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      is_spicy: false,
      is_vegetarian: false,
      is_featured: false,
    })
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      const response = await fetch(`/api/product/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.message || "Failed to delete product.")
      }
      toast({
        title: "Success",
        description: "Product deleted successfully!",
      })
      fetchProducts()
    } catch (error: any) {
      console.error("Error deleting product:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "There was an error deleting the product.",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/product?paginate=false")
      const result = await response.json()
      if (response.ok) {
        console.log("Fetched products:", result.length) // Debug log
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

  // Table columns
  const columns: ColumnDef<Product>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "delete",
      header: ({ column }) => (
        <div className="w-8">
          {/* Bulk Delete */}
          {Object.keys(rowSelection).length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-black">Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete {Object.keys(rowSelection).length} product(s).</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="text-black">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      // Map table row IDs to actual product IDs
                      const idsToDelete = Object.keys(rowSelection).map((rowId) => {
                        const row = table.getRow(rowId)
                        return row.original.id // this is the real product ID
                      })

                      try {
                        await Promise.all(idsToDelete.map((id) => handleDelete(id)))
                        toast({
                          title: "Success",
                          description: `${idsToDelete.length} product(s) deleted successfully!`,
                        })
                      } catch (error: any) {
                        toast({
                          variant: "destructive",
                          title: "Error",
                          description: error.message || "Error deleting products",
                        })
                      } finally {
                        setRowSelection({}) // reset selection after deletion
                      }
                    }}
                    className="bg-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      ),
    },
    {
      accessorKey: "image",
      header: "Image",
      cell: ({ row }) => (
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0">
          <Image src={getImageUrl(row.original.image)} alt={row.original.name} width={48} height={48} className="object-cover w-full h-full" />
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="p-0 h-auto font-normal">
          Product Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 truncate">{row.original.name}</div>
          <div className="text-xs text-gray-500 sm:hidden truncate">{row.original.category}</div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 h-auto font-normal hidden sm:flex"
        >
          Category <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs hidden sm:inline-flex">
          {row.original.category}
        </Badge>
      ),
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="p-0 h-auto font-normal">
          Price <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-semibold">₱{formatPrice(row.original.price)}</div>,
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 h-auto font-normal hidden lg:flex"
        >
          Created <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm hidden lg:block">
          {new Date(row.original.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
        </div>
      ),
    },
    {
      accessorKey: "actions",
      header: ({ column }) => <div className="p-0 h-auto font-normal hidden lg:flex">Actions</div>,
      id: "view",
      enableHiding: false,
      cell: ({ row }) => {
        const product = row.original
        return (
          <div className="flex items-center gap-1">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(product)} className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-2">
                  <Eye className="h-4 w-4" />
                  <span className="ml-1 sr-only sm:not-sr-only hidden sm:inline">View</span>
                </Button>
              </DialogTrigger>

              <DialogContent className="w-full max-w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="bg-[#162A3A] text-white p-4 sm:p-6 -m-4 sm:-m-6 mb-4 rounded-t-lg">
                  <DialogTitle className="text-xl sm:text-2xl font-bold">Product Details</DialogTitle>
                </DialogHeader>

                {selectedProduct && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* LEFT - IMAGE */}
                    <div className="relative bg-gray-100 h-64 sm:h-auto min-h-[200px]">
                      <Image
                        src={getImageUrl(selectedProduct.image)}
                        alt={selectedProduct.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                      />

                      {/* subtle overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

                      {/* name overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5">
                        <p className="text-xs uppercase tracking-widest text-white/70">Product</p>
                        <h2 className="text-lg sm:text-2xl font-semibold text-white leading-tight">{selectedProduct.name}</h2>
                      </div>
                    </div>

                    {/* RIGHT - DETAILS */}
                    <div className="flex flex-col p-4 sm:p-6">
                      <div className="space-y-1">
                        <p className="text-xs tracking-widest text-gray-500">Product Name</p>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">{selectedProduct.name}</h3>
                      </div>

                      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-xl border bg-white p-4">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Category</p>
                          <p className="mt-2 text-sm font-semibold text-gray-900 capitalize">{selectedProduct.category}</p>
                        </div>

                        <div className="rounded-xl border bg-white p-4">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Price</p>
                          <p className="mt-2 text-lg font-bold text-green-600">₱{formatPrice(selectedProduct.price)}</p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-xl border bg-gray-50 p-4 flex-1">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Description</p>
                        <p className="mt-2 text-sm sm:text-base text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {selectedProduct.description || "No description available."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )
      },
    },
    {
      id: "delete",
      enableHiding: false,
      cell: ({ row }) => {
        const product = row.original
        return (
          <div className="flex items-center gap-1">
            {/* Edit/Delete */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.push(`/admin/product/${product.id}`)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Trash2 className="text-[#162A3A] mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-bold text-2xl text-gray-900">Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>This action will permanently delete &apos;{product.name}&apos;.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="text-gray-900">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(product.id)} className="text-red-100 bg-red-800 hover:bg-red-700">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: products,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      columnFilters,
      globalFilter,
      rowSelection,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
  })

  // Calculate pagination
  const filteredRows = table.getFilteredRowModel().rows
  const totalItems = filteredRows.length
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(totalItems / itemsPerPage)
  const startIndex = itemsPerPage === -1 ? 0 : (currentPage - 1) * itemsPerPage
  const endIndex = itemsPerPage === -1 ? totalItems : startIndex + itemsPerPage
  const paginatedRows = itemsPerPage === -1 ? filteredRows : filteredRows.slice(startIndex, endIndex)

  // Reset to page 1 when items per page changes or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [itemsPerPage, globalFilter])

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(value === "all" ? -1 : parseInt(value))
  }

  if (loading) {
    return (
      <SidebarProvider defaultOpen={!isDesktop}>
        <div className="flex min-h-screen w-full bg-amber-50">

          <AppSidebar />

          <div className={`flex-1 min-w-0 ${isDesktop ? "ml-0" : "ml-72"}`}>

            <div className="flex items-center justify-center min-h-screen w-full">

              <div className="flex flex-col items-center gap-4 bg-[#162A3A] backdrop-blur-xl px-8 py-8 rounded-2xl border border-[#d4a24c]/70 shadow-2xl">

                {/* Spinner */}
                <div className="relative">
                  <Loader2 className="h-8 w-8 animate-spin text-[#d4a24c]" />
                  <div className="absolute inset-0 rounded-full border border-[#d4a24c]/20 blur-sm" />
                </div>

                {/* Text */}
                <div className="text-center">
                  <p className="text-lg font-semibold text-white">
                    Loading Products
                  </p>
                  <p className="text-sm text-white/60">
                    Please wait while we fetch the data...
                  </p>
                </div>

                {/* Animated dots */}
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-[#d4a24c] rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 bg-[#d4a24c] rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-[#d4a24c] rounded-full animate-bounce" />
                </div>

              </div>

            </div>

          </div>
        </div>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider defaultOpen={!isDesktop}>
      <div className="flex min-h-screen w-full bg-amber-50">
        <AppSidebar />
        <div className={`flex-1 min-w-0 ${isDesktop ? "ml-0" : "ml-72"}`}>
          {isDesktop && (
            <div className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b bg-[#162A3A] px-4 shadow-sm">
              <SidebarTrigger className="-ml-1" />
              <Image src="/logo.jpg" alt="Lumè Bean and Bar Logo" width={40} height={40} className="object-contain rounded-full" />
              <h1 className={`${playfair.className} text-lg font-semibold text-white`}>Lumè Bean and Bar</h1>
            </div>
          )}

          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
            <div className="max-w-full space-y-4 sm:space-y-6">
              {/* Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Product Management</h1>
                  <p className="text-gray-600 mt-1">Manage your restaurant&apos;s menu items</p>
                </div>
              </div>

              <Card className="bg-white/70 backdrop-blur-sm shadow-xl p-0 pb-5 border-blue-100">
                <CardHeader className="p-3 bg-[#162A3A] text-white rounded-t-lg">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-center sm:items-center justify-between">
                      {/* Add Product Button */}
                      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            className="shrink-0 bg-white text-[#162A3A] hover:bg-blue-50 hover:text-blue-800 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Add Product</span>
                            <span className="sm:hidden">Add</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto mx-4 bg-amber-50">
                          <DialogHeader className="bg-[#162A3A] text-white p-6 -m-6 mb-4 rounded-t-lg">
                            <DialogTitle className="text-2xl font-bold">Add New Product</DialogTitle>
                            <DialogDescription className="text-amber-50">Fill in the details for your new menu item.</DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleCreateSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <Label htmlFor="name" className="text-gray-700 font-bold text-md">
                                  Product Name
                                </Label>
                                <Input
                                  id="name"
                                  name="name"
                                  value={newFormData.name}
                                  onChange={handleNewFormChange}
                                  required
                                  disabled={isCreating}
                                  placeholder="e.g., Kimchi Fried Rice"
                                  className="mt-1 border-blue-950 focus:border-blue-700 focus:ring-blue-800"
                                />
                              </div>

                              <div>
                                <Label htmlFor="description" className="text-gray-700 font-bold text-md">
                                  Description
                                </Label>
                                <Textarea
                                  id="description"
                                  name="description"
                                  value={newFormData.description}
                                  onChange={handleNewFormChange}
                                  required
                                  rows={3}
                                  disabled={isCreating}
                                  placeholder="Describe the dish, ingredients, and preparation..."
                                  className="mt-1 resize-none border-blue-950 focus:border-blue-700 focus:ring-blue-800"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="price" className="text-gray-700 font-bold text-md">
                                    Price (₱)
                                  </Label>
                                  <Input
                                    id="price"
                                    name="price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={newFormData.price}
                                    onChange={handleNewFormChange}
                                    required
                                    disabled={isCreating}
                                    placeholder="0.00"
                                    className="mt-1 border-blue-950 focus:border-blue-700 focus:ring-blue-800"
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="category" className="text-gray-700 font-bold text-md">
                                    Category
                                  </Label>
                                  <Select value={newFormData.category} onValueChange={handleCategoryChange} disabled={isCreating}>
                                    <SelectTrigger className="mt-1 border-blue-950 focus:border-blue-700 focus:ring-blue-800">
                                      <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {categories.map((category) => (
                                        <SelectItem key={category} value={category}>
                                          <span className="text-gray-800">{category}</span>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div>
                                <Label htmlFor="image" className="text-gray-700 font-bold text-md">
                                  Product Image
                                </Label>
                                <div className="flex items-center gap-4 mt-1 text-gray-800">
                                  <Input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    disabled={isCreating}
                                    className="flex-1 border-blue-950 focus:border-blue-700 focus:ring-blue-800"
                                  />
                                </div>
                                {imagePreview && (
                                  <div className="mt-3">
                                    <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-blue-200 shadow-md">
                                      <Image
                                        src={imagePreview || "/placeholder.svg"}
                                        alt="Preview"
                                        width={80}
                                        height={80}
                                        className="object-cover w-full h-full"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="flex items-center space-x-2 p-3 border-2 border-blue-200 rounded-lg bg-white/50 hover:bg-white/70 transition-colors">
                                  <Switch
                                    id="is_featured"
                                    checked={newFormData.is_featured}
                                    onCheckedChange={(checked) => handleSwitchChange("is_featured", checked)}
                                    disabled={isCreating}
                                  />
                                  <Label
                                    htmlFor="is_featured"
                                    className="flex items-center gap-2 cursor-pointer text-gray-700 font-medium"
                                  >
                                    <Star className="w-4 h-4 text-yellow-500" />
                                    Featured
                                  </Label>
                                </div>

                                <div className="flex items-center space-x-2 p-3 border-2 border-blue-200 rounded-lg bg-white/50 hover:bg-white/70 transition-colors">
                                  <Switch
                                    id="is_spicy"
                                    checked={newFormData.is_spicy}
                                    onCheckedChange={(checked) => handleSwitchChange("is_spicy", checked)}
                                    disabled={isCreating}
                                  />
                                  <Label
                                    htmlFor="is_spicy"
                                    className="flex items-center gap-2 cursor-pointer text-gray-700 font-medium"
                                  >
                                    <Flame className="w-4 h-4 text-blue-500" />
                                    Spicy
                                  </Label>
                                </div>

                                <div className="flex items-center space-x-2 p-3 border-2 border-blue-200 rounded-lg bg-white/50 hover:bg-white/70 transition-colors">
                                  <Switch
                                    id="is_vegetarian"
                                    checked={newFormData.is_vegetarian}
                                    onCheckedChange={(checked) => handleSwitchChange("is_vegetarian", checked)}
                                    disabled={isCreating}
                                  />
                                  <Label
                                    htmlFor="is_vegetarian"
                                    className="flex items-center gap-2 cursor-pointer text-gray-700 font-medium"
                                  >
                                    <Leaf className="w-4 h-4 text-green-500" />
                                    Vegetarian
                                  </Label>
                                </div>
                              </div> */}
                            </div>

                            <DialogFooter className="gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setIsCreateModalOpen(false)
                                  resetForm()
                                }}
                                disabled={isCreating}
                                className="flex-1 sm:flex-none border-blue-300 text-blue-950 hover:bg-blue-200"
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                disabled={isCreating}
                                className="flex-1 sm:flex-none bg-[#162A3A] hover:bg-blue-800 text-white font-semibold shadow-lg"
                              >
                                {isCreating ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                  </>
                                ) : (
                                  "Create Product"
                                )}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>

                      {/* Price Range Filter */}

                      {/* Properties */}

                      {/* Category */}

                      {/* Search Bar */}
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                        <div className="relative flex-1 max-w-sm">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-950" />
                          <Input
                            placeholder="Search products..."
                            value={globalFilter || ""}
                            onChange={(event) => setGlobalFilter(event.target.value)}
                            className="pl-9 pr-3 py-2 w-full bg-blue-100 border-blue-950 text-gray-950 placeholder:text-gray-950 focus:bg-blue-50 focus:border-blue-500 transition-all duration-200"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <div className="text-sm text-gray-600 font-medium">
                      Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} products
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="items-per-page" className="text-sm text-gray-600 whitespace-nowrap">
                        Items per page:
                      </Label>
                      <Select value={itemsPerPage === -1 ? "all" : itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                        <SelectTrigger id="items-per-page" className="w-[100px] border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="all">All</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="w-full">
                    <div className="rounded-lg border border-blue-200 overflow-hidden shadow-lg">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                          <thead className="bg-gradient-to-r from-blue-100 to-blue-100 h-10 text-gray-950 font-semibold">
                            <tr className="border-b border-blue-200">
                              {table.getHeaderGroups().map((headerGroup) =>
                                headerGroup.headers.map((header) => (
                                  <th key={header.id} className="text-left p-3 sm:p-4 text-md font-semibold text-gray-700">
                                    {header.isPlaceholder ? null : (
                                      <div className="flex items-center gap-2">
                                        {typeof header.column.columnDef.header === "function"
                                          ? header.column.columnDef.header(header.getContext())
                                          : header.column.columnDef.header}
                                      </div>
                                    )}
                                  </th>
                                )),
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedRows.map((row, index) => (
                              <tr
                                key={row.id}
                                className={`border-b border-blue-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-50 transition-all duration-200 ${index % 2 === 0 ? "bg-white" : "bg-blue-25"}`}
                              >
                                {row.getVisibleCells().map((cell) => (
                                  <td key={cell.id} className="p-3 sm:p-4 text-sm">
                                    {typeof cell.column.columnDef.cell === "function"
                                      ? cell.column.columnDef.cell(cell.getContext())
                                      : (cell.getValue() as React.ReactNode)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {table.getRowModel().rows.length === 0 && (
                      <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-blue-200 mt-4">
                        <div className="bg-gradient-to-r from-blue-100 to-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Search className="w-8 h-8 text-blue-500" />
                        </div>
                        <p className="text-lg font-medium text-gray-700">No products found</p>
                        {globalFilter && <p className="text-sm mt-1 text-gray-500">Try adjusting your search terms</p>}
                      </div>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-blue-200">
                        <div className="text-sm text-gray-600">
                          Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="border-blue-300 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                          >
                            First
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="border-blue-300 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="border-blue-300 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                          >
                            Next
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="border-blue-300 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                          >
                            Last
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
