"use client"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import type React from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ChevronLeft,
  ChevronRight,
  Bolt,
  Eye,
  Search,
  Loader2,
  ArrowUpDown,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  DollarSign,
  User,
  Phone,
  MapPin,
  SquarePen,
  Mail,
  X,
  Trash2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
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
import { Playfair_Display } from "next/font/google"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})


interface OrderItem {
  id: number
  order_id: number
  name: string
  description: string
  price: number
  quantity: number
  category: string
  is_spicy: boolean
  is_vegetarian: boolean
  image_url: string
  subtotal: number
  created_at: string
  order: {
    id: number
    order_number: string
    created_at: string
    order_status: string
  }
}

interface Order {
  id: number
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  delivery_address: string
  delivery_city: string
  delivery_zip_code: string
  payment_method: string
  order_status: string
  subtotal: number
  delivery_fee: number
  total_amount: number
  notes?: string
  receipt_file?: string
  order_items: OrderItem[]
  created_at: string
  updated_at: string
}

const orderStatuses = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  { value: "preparing", label: "Preparing", color: "bg-orange-100 text-orange-800", icon: Package },
  { value: "ready", label: "Ready", color: "bg-green-100 text-green-800", icon: CheckCircle },
  { value: "out_for_delivery", label: "Out for Delivery", color: "bg-purple-100 text-purple-800", icon: Truck },
  { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-800", icon: Package },
  { value: "cancelled", label: "Cancelled", color: "bg-yellow-100 text-yellow-800", icon: XCircle },
]

const paymentMethods = [
  { value: "cash", label: "Cash on Delivery" },
  { value: "gcash", label: "GCash" },
  { value: "paypal", label: "PayPal" },
  { value: "bpi", label: "BPI" },
  { value: "security_bank", label: "Security Bank" },
  { value: "maya", label: "Maya" },
]

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

const ITEMS_PER_PAGE = 10

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsLoading, setItemsLoading] = useState(false)

  const { toast } = useToast()
  const router = useRouter()

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [globalFilter, setGlobalFilter] = useState("")

  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all")
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // State for desktop detection
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth < 1024) // lg breakpoint
    }
    checkDesktop()
    window.addEventListener("resize", checkDesktop)
    return () => window.removeEventListener("resize", checkDesktop)
  }, [])

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

  // Helper function to safely calculate total revenue
  const calculateTotalRevenue = (orders: Order[]): string => {
    if (!Array.isArray(orders) || orders.length === 0) {
      return "0.00"
    }

    try {
      const total = orders.reduce((sum, order) => {
        const orderTotal = typeof order.total_amount === "number" ? order.total_amount : 0
        return sum + orderTotal
      }, 0)

      return total.toFixed(2)
    } catch (error) {
      console.error("Error calculating total revenue:", error)
      return "0.00"
    }
  }

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    const statusInfo = orderStatuses.find((s) => s.value === status)

    return (
      <Badge variant="outline" className="text-xs">
        {statusInfo?.label || status}
      </Badge>
    )
  }

  // Helper function to get payment method badge
  const getPaymentMethodBadge = (method: string) => {
    const methodInfo = paymentMethods.find((m) => m.value === method)
    return (
      <Badge variant="outline" className="text-xs">
        {methodInfo?.label || method}
      </Badge>
    )
  }

  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null)

  // Update order status
  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem("auth_token")

      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Admin-Request": "true",
        },
        body: JSON.stringify({
          order_status: newStatus,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Validation failed")
      }

      toast({
        title: "Success",
        description: "Order status updated",
      })

      fetchOrders() // refresh list
    } catch (error) {
      console.error("Error updating order status:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order status",
      })
    }
  }

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("auth_token")

      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please log in to access orders.",
        })
        router.push("/login")
        return
      }

      let url = "/api/orders?per_page=100"

      // Add filters to URL
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (paymentMethodFilter !== "all") params.append("payment_method", paymentMethodFilter)
      if (globalFilter) params.append("search", globalFilter)

      if (params.toString()) {
        url += `&${params.toString()}`
      }

      console.log("Fetching orders from:", url) // Debug log

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Admin-Request": "true", // Add admin header to force admin view
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Orders API error response:", errorText)

        if (response.status === 401) {
          localStorage.removeItem("auth_token")
          router.push("/login")
          return
        }

        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log("Orders API response:", result) // Debug log

      if (result.success) {
        // Handle the transformed response structure
        const ordersData = result.data || []
        console.log("Setting orders:", ordersData) // Debug log

        // Ensure we have an array and validate the data structure
        if (Array.isArray(ordersData)) {
          const validatedOrders = ordersData.map((order) => ({
            ...order,
            total: typeof order.total === "number" ? order.total : 0,
            subtotal: typeof order.subtotal === "number" ? order.subtotal : 0,
            delivery_fee: typeof order.delivery_fee === "number" ? order.delivery_fee : 0,
            items: Array.isArray(order.items) ? order.items : [],
          }))

          setOrders(validatedOrders)
        } else {
          console.error("Orders data is not an array:", ordersData)
          setOrders([])
        }
      } else {
        throw new Error(result.message || "Failed to fetch orders")
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load orders. Please check your authentication.",
      })

      setOrders([])

      // If authentication error, redirect to login
      if (error instanceof Error && error.message.includes("401")) {
        localStorage.removeItem("auth_token")
        router.push("/login")
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch order items
  // const fetchOrderItems = async (orderId: number) => {
  //   try {
  //     setItemsLoading(true) // ✅ DO NOT use page-level loading

  //     const token = localStorage.getItem("auth_token")
  //     if (!token) {
  //       toast({
  //         variant: "destructive",
  //         title: "Authentication Required",
  //         description: "Please log in.",
  //       })
  //       return
  //     }

  //     const response = await fetch(`/api/orders/${orderId}`, {
  //       method: "GET",
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         Accept: "application/json",
  //         "X-Admin-Request": "true",
  //       },
  //       cache: "no-store",
  //     })

  //     if (!response.ok) {
  //       const text = await response.text()
  //       throw new Error(`HTTP ${response.status}: ${text}`)
  //     }

  //     const result = await response.json()

  //     console.log("Order items response:", result) // 🔍 keep for now

  //     setOrderItems(
  //       result?.data?.items ??
  //       result?.data?.data?.items ??
  //       []
  //     )
  //   } catch (error) {
  //     console.error("Failed to fetch order items:", error)

  //     toast({
  //       variant: "destructive",
  //       title: "Error",
  //       description: "Failed to load order items.",
  //     })

  //     setOrderItems([])
  //   } finally {
  //     setItemsLoading(false)
  //   }
  // }

  useEffect(() => {
    // Calculate counts whenever orders change
    const counts: Record<string, number> = {
      pending: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
    }

    orders.forEach((order) => {
      const status = order.order_status?.toString().toLowerCase()
      if (status && counts.hasOwnProperty(status)) {
        counts[status] += 1
      }
    })

    setStatusCounts(counts)
  }, [orders])

  const filteredOrders = orders.filter((t) => {
    const searchTerm = globalFilter.toLowerCase()

    const matchesSearch =
      t.order_number.toLowerCase().includes(searchTerm) ||
      t.payment_method.toLowerCase().includes(searchTerm) ||
      t.delivery_address.toLowerCase().includes(searchTerm) ||
      t.delivery_city.toLowerCase().includes(searchTerm) ||
      t.customer_name.toLowerCase().includes(searchTerm) ||
      t.customer_email.toLowerCase().includes(searchTerm) ||
      t.customer_phone.toLowerCase().includes(searchTerm)

    const matchesStatus = statusFilter === "all" || t.order_status?.toString() === statusFilter

    const matchesPayment = paymentMethodFilter === "all" || t.payment_method === paymentMethodFilter

    return matchesSearch && matchesStatus && matchesPayment
  })

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
  const endIdx = startIdx + ITEMS_PER_PAGE
  const paginatedOrders = filteredOrders.slice(startIdx, endIdx)

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (globalFilter !== undefined) {
        fetchOrders()
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [globalFilter])

  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleBulkDelete = async () => {
    // `table` is your table instance
    const selectedOrderIds = table.getSelectedRowModel().rows.map((row) => row.original.id) // <- `original` has your actual order object

    if (selectedOrderIds.length === 0) return

    // Call your bulk delete
    await handleDelete(selectedOrderIds)

    // Clear selection
    table.resetRowSelection()
  }

  const handleDelete = async (ids: number | number[]) => {
    const deletingIds = Array.isArray(ids) ? ids : [ids]
    setDeletingId(deletingIds) // can handle multiple IDs if needed

    try {
      const response = await fetch(`/api/orders`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: deletingIds }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete order(s).")
      }

      toast({
        title: "Success",
        description: deletingIds.length > 1 ? `${deletingIds.length} orders deleted successfully!` : "Order deleted successfully!",
      })

      fetchOrders()
    } catch (error: any) {
      console.error("Error deleting order(s):", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "There was an error deleting the order(s).",
      })
    } finally {
      setDeletingId(null)
    }
  }

  // Define columns for DataTable
  const columns: ColumnDef<Order>[] = [
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
      accessorKey: "action1",
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
                  <AlertDialogDescription>
                    This will permanently delete {Object.keys(rowSelection).length} order
                    {Object.keys(rowSelection).length > 1 ? "s" : ""}.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="text-black">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      ),
      cell: ({ row }) => {
        const order = row.original
        return (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <SquarePen className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Order Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {orderStatuses.map((status) => (
                  <DropdownMenuItem
                    key={status.value}
                    onClick={() => handleStatusUpdate(order.id, status.value)}
                    disabled={updatingStatus === order.id || order.order_status === status.value}
                  >
                    <status.icon className="mr-2 h-4 w-4" />
                    Mark as {status.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
    {
      accessorKey: "order_number",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="p-0 h-auto font-normal">
          Order #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 truncate">{row.original.order_number}</div>
        </div>
      ),
    },
    {
      accessorKey: "customer",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 h-auto font-normal hidden sm:flex"
        >
          Customer
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="min-w-0 hidden sm:block">
          <div className="font-medium text-gray-900 truncate">{row.original.customer_name}</div>
          <div className="text-xs text-gray-500 truncate pb-1">{row.original.customer_email}</div>
          <div className="text-xs text-gray-500 truncate border-t py-1">{row.original.customer_phone}</div>
        </div>
      ),
    },
    {
      accessorKey: "order_status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 h-auto font-normal hidden lg:flex"
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="hidden lg:block">{getStatusBadge(row.original.order_status)}</div>,
    },
    {
      accessorKey: "payment_method",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 h-auto font-normal hidden lg:flex"
        >
          Payment
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="hidden lg:block">{getPaymentMethodBadge(row.original.payment_method)}</div>,
    },
    {
      accessorKey: "total_amount",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-semibold">₱{(row.original.total_amount ?? 0).toFixed(2)}</div>,
    },
    {
      accessorKey: "action2",
      header: ({ column }) => <Button variant="ghost">Actions</Button>,
      cell: ({ row }) => {
        const order = row.original
        return (
          <div className="flex items-center gap-1">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedOrder(order)
                    setOrderItems(order.order_items)
                  }}
                  className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3 sm:py-1"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </DialogTrigger>

              <DialogContent className="w-full sm:max-w-5xl p-0 overflow-hidden rounded-lg shadow-lg">
                {selectedOrder && (
                  <>
                    {/* HEADER */}
                    <div className="sticky top-0 z-10 bg-white border-b px-6 py-4">
                      <DialogHeader>
                        <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <span className="text-xl font-bold text-gray-900">Order #{selectedOrder.order_number}</span>
                          <div className="flex flex-wrap items-center gap-2">
                            {getStatusBadge(selectedOrder.order_status)}
                            {getPaymentMethodBadge(selectedOrder.payment_method)}
                          </div>
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-500 mt-1">
                          Placed on{" "}
                          {new Date(selectedOrder.created_at).toLocaleDateString("en-US", {
                            month: "long",
                            day: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </DialogDescription>
                        <DialogClose asChild>
                          <button className="absolute right-2 top-2 rounded-md p-2 text-gray-400 hover:text-gray-600 transition" aria-label="Close">
                            <X className="h-5 w-5" />
                          </button>
                        </DialogClose>
                      </DialogHeader>
                    </div>

                    {/* BODY */}
                    <div className="px-6 py-6 space-y-10 max-h-[80vh] overflow-y-auto">
                      {/* CUSTOMER & DELIVERY */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="shadow-sm">
                          <CardHeader>
                            <h3 className="text-xl font-bold flex items-center gap-2">Customer Information</h3>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="flex items-center gap-2 text-sm sm:text-base">
                              <User className="w-5 h-5 text-gray-500" />
                              <span className="font-medium">{selectedOrder.customer_name}</span>
                            </p>
                            <p className="flex items-center gap-2 text-sm sm:text-base">
                              <Mail className="w-5 h-5 text-gray-500" />
                              <span className="font-medium">{selectedOrder.customer_email}</span>
                            </p>
                            <p className="flex items-center gap-2 text-sm sm:text-base">
                              <Phone className="w-5 h-5 text-gray-500" />
                              <span className="font-medium">{selectedOrder.customer_phone}</span>
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                          <CardHeader>
                            <h3 className="text-xl font-bold flex items-center gap-2">Delivery Address</h3>
                          </CardHeader>
                          <CardContent className="space-y-3 text-sm sm:text-base">
                            <p className="flex items-center gap-2">
                              <MapPin className="w-5 h-5 text-gray-500" />
                              <span className="font-medium">{selectedOrder.delivery_address}</span>
                            </p>
                            <div className="space-y-1">
                              <p>
                                City: <span className="font-medium">{selectedOrder.delivery_city}</span>
                              </p>
                              <p>
                                Zip Code: <span className="font-medium">{selectedOrder.delivery_zip_code}</span>
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* ORDER ITEMS */}
                      <div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                          <h3 className="text-lg font-semibold flex items-center gap-2 text-black">
                            <Package className="w-5 h-5 text-gray-600" />
                            {selectedOrder.order_items.length} Items
                          </h3>
                          <div className="flex flex-wrap gap-6">
                            <div className="text-right sm:text-left">
                              <p className="text-xs text-gray-500">Total</p>
                              <p className="text-2xl font-bold text-green-600">₱{(selectedOrder.total_amount ?? 0).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          {selectedOrder.order_items.length === 0 ? (
                            <Card>
                              <CardContent className="text-center py-12">
                                <div className="bg-gradient-to-r from-orange-100 to-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <Package className="w-8 h-8 text-orange-500" />
                                </div>
                                <p className="text-lg font-medium text-gray-700">No order items found</p>
                                <p className="text-sm mt-1 text-gray-500">Your order items will appear here</p>
                              </CardContent>
                            </Card>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {selectedOrder.order_items.map((item) => (
                                <Card key={item.id} className="p-3 overflow-hidden hover:shadow-md transition-shadow rounded-lg">
                                  <CardHeader className="p-0">
                                    <div className="relative h-48 w-full">
                                      <Image src={getImageUrl(item.image_url)} alt={item.name} fill className="object-cover border rounded-lg" />
                                    </div>
                                  </CardHeader>
                                  <CardContent className="p-4 space-y-3">
                                    <div>
                                      <h3 className="font-semibold text-base sm:text-lg">{item.name}</h3>
                                      <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <Badge variant="outline">{item.category}</Badge>
                                      {item.is_spicy && <Badge variant="destructive">Spicy</Badge>}
                                      {item.is_vegetarian && <Badge className="bg-green-100 text-green-700">Vegetarian</Badge>}
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t text-sm">
                                      <div>
                                        <p className="text-gray-500">Price</p>
                                        <p className="font-medium">₱{item.price.toFixed(2)}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500">Quantity</p>
                                        <p className="font-medium">{item.quantity}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500">Subtotal</p>
                                        <p className="font-semibold text-green-600">₱{item.subtotal.toFixed(2)}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )
      },
    },
  ]

  // Initialize table instance
  const table = useReactTable({
    data: orders,
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
                    Loading Orders
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
              <Image
                src="/logo.jpg"
                alt="Lumè Bean and Bar Logo"
                width={40}
                height={40}
                className="object-contain rounded-full"
              />
              <h1 className={`${playfair.className} text-lg font-semibold text-white`}>Lumè Bean and Bar</h1>
            </div>
          )}

          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
            <div className="max-w-full space-y-4 sm:space-y-6">
              {/* Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Order Management</h1>
                  <p className="text-gray-600 mt-1">Manage customer orders and track delivery status</p>
                </div>

                <div className="flex items-center gap-4 bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-orange-100">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600 font-medium">Total Revenue:</span>
                    <span className="font-bold text-green-600 text-lg">₱{calculateTotalRevenue(orders)}</span>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {["pending", "out_for_delivery", "delivered", "cancelled"].map((status) => {
                  const statusInfo = orderStatuses.find((s) => s.value === status)
                  return (
                    <Card
                      key={status}
                      className="group relative overflow-hidden border border-gray-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm"
                    >
                      <div className="absolute left-0 top-0 h-full w-[2px] bg-[#E5A834]" />

                      <CardContent className="px-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-blue-100 text-gray-700">
                            {statusInfo?.icon && <statusInfo.icon className="h-6 w-6 text-[#162A3A]" />}
                          </div>
                          <p className="text-lg font-bold uppercase tracking-wider text-blue-950">{statusInfo?.label || status}</p>
                        </div>

                        <div className="mt-4 flex items-center justify-center gap-2">
                          <p className="text-3xl font-extrabold text-gray-900">{statusCounts[status] || 0}</p>
                          <p className="text-sm text-gray-500">Orders</p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Filters and Search */}
              <Card className="bg-white/70 backdrop-blur-sm shadow-xl p-0 pb-5 border-blue-100">
                <CardHeader className="p-3 bg-[#162A3A] text-white rounded-t-lg">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-950" />
                        <Input
                          placeholder="Search orders..."
                          value={globalFilter || ""}
                          onChange={(event) => setGlobalFilter(event.target.value)}
                          className="pl-9 pr-3 py-2 w-full bg-blue-100 border-blue-950 text-gray-950 placeholder:text-gray-950 focus:bg-blue-50 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-32 border-white/20 bg-blue-200/60 text-white focus:bg-white/30 focus:border-white/50">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            {orderStatuses.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                          <SelectTrigger className="w-32 border-white/20 bg-blue-200/60 text-white focus:bg-white/30 focus:border-white/50">
                            <SelectValue placeholder="Payment" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Payments</SelectItem>
                            {paymentMethods.map((method) => (
                              <SelectItem key={method.value} value={method.value}>
                                {method.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600 mb-4 font-medium">
                    Showing {table.getFilteredRowModel().rows.length} of {orders.length} orders
                  </div>

                  {/* Orders Table */}
                  <div className="w-full">
                    <div className="rounded-lg border border-blue-200 overflow-hidden shadow-lg">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                          <thead className="bg-gradient-to-r from-blue-100 to-blue-100 h-10 text-gray-950 font-semibold">
                            <tr className="border-b border-blue-200">
                              {table.getHeaderGroups().map((headerGroup) =>
                                headerGroup.headers.map((header) => (
                                  <th key={header.id} className="text-left p-2 sm:p-3 text-md font-semibold text-gray-700">
                                    {header.isPlaceholder ? null : (
                                      <div>
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
                            {table.getRowModel().rows.map((row, index) => (
                              <tr
                                key={row.id}
                                className={`border-b border-orange-100 hover:bg-gradient-to-r hover:from-orange-50 hover:to-blue-50 transition-all duration-200 ${index % 2 === 0 ? "bg-white" : "bg-orange-25"}`}
                              >
                                {row.getVisibleCells().map((cell) => (
                                  <td key={cell.id} className="p-2 sm:p-3 text-xs sm:text-sm">
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
                      <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-orange-200 mt-4">
                        <div className="bg-gradient-to-r from-orange-100 to-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Package className="w-8 h-8 text-orange-500" />
                        </div>
                        <p className="text-lg font-medium text-gray-700">No orders found</p>
                        {globalFilter && <p className="text-sm mt-1 text-gray-500">Try adjusting your search terms or filters</p>}
                      </div>
                    )}
                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        Showing {startIdx + 1} to {Math.min(endIdx, filteredOrders.length)} of {filteredOrders.length} results
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-8 h-8 p-0 bg-[#162A3A] text-white hover:bg-[#162A3A]/90"
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
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
