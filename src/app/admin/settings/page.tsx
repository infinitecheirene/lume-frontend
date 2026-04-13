"use client"

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Settings, Save, Shield, Globe, DollarSign, Edit, Delete, Trash, Trash2, Eye } from "lucide-react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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

type SettingsType = {
  restaurantName: string
  email: string
  phone: string
  address: string
  deliveryFee: number
  maintenanceMode: boolean
}

type PaymentMethod = {
  id: number
  key: string
  display_name: string
  type: "cash" | "ewallet" | "bank"
  account_number?: string
  account_name?: string
  qr_code?: string
  is_enabled: boolean
}

export default function SettingsPage() {
  const { toast } = useToast()
  const [isMobile, setIsMobile] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null)
  const [editPaymentId, setEditPaymentId] = useState<number | null>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [settings, setSettings] = useState<SettingsType>({
    restaurantName: "",
    email: "",
    phone: "",
    address: "",
    deliveryFee: 0,
    maintenanceMode: false,
  })

  const [paymentform, setPaymentForm] = useState({
    key: "",
    display_name: "",
    type: "",
    account_number: "",
    account_name: "",
    qr_code: "",
    is_enabled: true,
  })

  const resetPaymentForm = () => {
    setPaymentForm({
      key: "",
      display_name: "",
      type: "",
      account_number: "",
      account_name: "",
      qr_code: "",
      is_enabled: true,
    })
    setQrCodeFile(null)
    setEditPaymentId(null)
  }

  // FETCH
  const fetchMethods = async () => {
    try {
      setLoading(true)

      const res = await fetch("/api/payment-methods")
      const json = await res.json()

      if (!json.success) {
        setMethods([])
        throw new Error(json.message)
      }

      setMethods(json.data)
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsPaymentDialogOpen(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMethods()
  }, [])

  const handleCreate = async () => {
    try {
      const fd = new FormData()

      fd.append("key", paymentform.key)
      fd.append("display_name", paymentform.display_name)
      fd.append("type", paymentform.type)
      fd.append("account_number", paymentform.account_number || "")
      fd.append("account_name", paymentform.account_name || "")
      fd.append("is_enabled", paymentform.is_enabled ? "1" : "0")

      if (qrCodeFile) {
        fd.append("qr_code", qrCodeFile)
      }

      const res = await fetch("/api/payment-methods", {
        method: "POST",
        body: fd,
      })

      const json = await res.json()
      if (!json.success) throw new Error(json.message)

      toast({
        title: "Success",
        description: "Payment method created",
      })

      resetPaymentForm()
      fetchMethods()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  const handleUpdate = async () => {
    if (!editPaymentId) return

    try {
      const fd = new FormData()

      fd.append("key", paymentform.key)
      fd.append("display_name", paymentform.display_name)
      fd.append("type", paymentform.type)
      fd.append("account_number", paymentform.account_number || "")
      fd.append("account_name", paymentform.account_name || "")
      fd.append("is_enabled", paymentform.is_enabled ? "1" : "0")

      if (qrCodeFile) {
        fd.append("qr_code", qrCodeFile)
      }

      const res = await fetch(`/api/payment-methods/${editPaymentId}`, {
        method: "PUT",
        headers: {
          "X-HTTP-Method-Override": "PUT",
        },
        body: fd,
      })

      const json = await res.json()
      if (!json.success) throw new Error(json.message)

      toast({
        title: "Updated",
        description: "Payment method updated",
      })
      setIsPaymentDialogOpen(false)
      resetPaymentForm()
      fetchMethods()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  // ---------------- DELETE ----------------
  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/payment-methods/${id}`, {
        method: "DELETE",
      })

      const json = await res.json()

      if (!json.success) throw new Error(json.message)

      toast({
        title: "Deleted",
        description: "Payment method removed",
      })

      fetchMethods()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  // ---------------- EDIT ----------------
  const handleEdit = (m: PaymentMethod) => {
    setEditPaymentId(m.id)

    setPaymentForm({
      key: m.key,
      display_name: m.display_name,
      type: m.type,
      account_number: m.account_number || "",
      account_name: m.account_name || "",
      qr_code: m.qr_code || "",
      is_enabled: m.is_enabled,
    })
    setIsPaymentDialogOpen(true)
    setQrCodeFile(null)
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Fetch settings from API proxy
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)

        const res = await fetch("/api/settings", {
          method: "GET",
          cache: "no-store",
        })

        const json = await res.json()

        if (!res.ok || !json.success) {
          throw new Error(json?.message || "Failed to fetch settings.")
        }

        const data = json.data

        setSettings({
          restaurantName: data.restaurant_name ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          deliveryFee: Number(data.delivery_fee ?? 0),
          maintenanceMode: Boolean(data.maintenance_mode ?? false),
        })
      } catch (error: any) {
        console.error("Fetch settings error:", error)

        toast({
          title: "Error",
          description: error.message || "Failed to load settings.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [toast])

  const handleSave = async () => {
    try {
      setSaving(true)

      const payload = {
        restaurant_name: settings.restaurantName,
        email: settings.email,
        phone: settings.phone,
        address: settings.address,
        delivery_fee: settings.deliveryFee,
        maintenance_mode: settings.maintenanceMode,
      }

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json?.message || "Failed to update settings.")
      }

      toast({
        title: "Settings Saved",
        description: "Your settings have been updated successfully.",
      })
    } catch (error: any) {
      console.error("Save settings error:", error)

      toast({
        title: "Save Failed",
        description: error.message || "Something went wrong while saving.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-yellow-50 to-yellow-50">
        <AppSidebar />

        <div className={`flex-1 min-w-0 ${isMobile ? "ml-0" : "ml-72"}`}>
          {isMobile && (
            <div className="sticky top-0 z-50 flex h-12 items-center gap-2 border-b bg-white/90 backdrop-blur-sm px-4 md:hidden shadow-sm">
              <SidebarTrigger className="-ml-1" />
              <span className="text-sm font-semibold bg-gradient-to-r from-yellow-600 to-yellow-600 bg-clip-text text-transparent">Settings</span>
            </div>
          )}

          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
            <div className="max-w-4xl space-y-6">
              {/* Header */}
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-yellow-100">
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-600 bg-clip-text text-transparent flex items-center gap-2">
                  <Settings className="w-6 h-6 text-yellow-600" />
                  Settings
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your restaurant settings and preferences</p>
              </div>

              {loading ? (
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-yellow-100">
                  <p className="text-sm text-gray-600">Loading settings...</p>
                </div>
              ) : (
                <>
                  {/* Restaurant Information */}
                  <Card className="gap-0 p-0 bg-white/70 backdrop-blur-sm shadow-lg border-yellow-100">
                    <CardHeader className="p-4 bg-gradient-to-r from-yellow-500 to-yellow-500 text-white rounded-t-lg">
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        Restaurant Information
                      </CardTitle>
                      <CardDescription className="text-white/80">Basic information about your restaurant</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 py-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="restaurantName">Restaurant Name</Label>
                          <Input
                            id="restaurantName"
                            value={settings.restaurantName}
                            onChange={(e) => setSettings({ ...settings, restaurantName: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={settings.email}
                            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input id="phone" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input id="address" value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pricing Settings */}
                  <Card className="gap-0 p-0 bg-white/70 backdrop-blur-sm shadow-lg border-yellow-100">
                    <CardHeader className="p-4 bg-gradient-to-r from-yellow-500 to-yellow-500 text-white rounded-t-lg">
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Pricing Settings
                      </CardTitle>
                      <CardDescription className="text-white/80">Configure delivery fees</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 py-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="deliveryFee">Delivery Fee (₱)</Label>
                          <Input
                            id="deliveryFee"
                            type="number"
                            value={settings.deliveryFee}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                deliveryFee: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* System Settings */}
                  <Card className="gap-0 p-0 bg-white/70 backdrop-blur-sm shadow-lg border-yellow-100">
                    <CardHeader className="p-4 bg-gradient-to-r from-yellow-500 to-yellow-500 text-white rounded-t-lg">
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        System Settings
                      </CardTitle>
                      <CardDescription className="text-white/80">Advanced system configuration</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 py-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                          <p className="text-sm text-gray-500">Temporarily disable customer orders</p>
                        </div>

                        <Switch
                          id="maintenanceMode"
                          checked={settings.maintenanceMode}
                          onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-gradient-to-r from-yellow-500 to-yellow-500 hover:from-yellow-600 hover:to-yellow-600"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? "Saving..." : "Save Settings"}
                    </Button>
                  </div>

                  <div className="p-0 space-y-6">
                    {/* ================= LIST ================= */}
                    <Card className="gap-0 p-0 bg-white/70 backdrop-blur-sm shadow-lg border-yellow-100">
                      <CardHeader className="p-4 bg-gradient-to-r from-yellow-500 to-yellow-500 text-white rounded-t-lg flex items-center justify-between">
                        <div className="flex flex-col">
                          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                            <DollarSign className="w-5 h-5" />
                            Payment Methods
                          </CardTitle>
                          <CardDescription className="text-white/80 text-sm">Configure your available payment options</CardDescription>
                        </div>
                        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => {
                                resetPaymentForm()
                                setIsPaymentDialogOpen(true)
                              }}
                              className="bg-white text-yellow-600 hover:bg-yellow-100 font-medium shadow-sm"
                            >
                              Add Payment Method
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg text-gray-800">
                            <DialogHeader>
                              <DialogTitle className="text-yellow-600 font-bold">
                                {editPaymentId ? "Edit Payment Method" : "Add Payment Method"}
                              </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4">
                              {/* Mode */}
                              <div className="space-y-1">
                                <Label className="text-gray-700">Mode</Label>
                                <Input
                                  placeholder="e.g. gcash, cash, bpi"
                                  value={paymentform.key}
                                  onChange={(e) => setPaymentForm({ ...paymentform, key: e.target.value })}
                                />
                              </div>

                              {/* Display Name */}
                              <div className="space-y-1">
                                <Label className="text-gray-700">Display Name</Label>
                                <Input
                                  placeholder="J**** G****"
                                  value={paymentform.display_name}
                                  onChange={(e) => setPaymentForm({ ...paymentform, display_name: e.target.value })}
                                />
                              </div>

                              {/* Type */}
                              <div className="space-y-1">
                                <Label className="text-gray-700">Type</Label>
                                <select
                                  className="w-full border rounded p-2 focus:ring-2 focus:ring-yellow-500 text-gray-700"
                                  value={paymentform.type}
                                  onChange={(e) => setPaymentForm({ ...paymentform, type: e.target.value as any })}
                                >
                                  <option value="">Select Type</option>
                                  <option value="cash">Cash</option>
                                  <option value="ewallet">E-Wallet</option>
                                  <option value="bank">Bank</option>
                                </select>
                              </div>

                              {/* Account Number */}
                              <div className="space-y-1">
                                <Label className="text-gray-700">Account Number</Label>
                                <Input
                                  placeholder="Optional"
                                  value={paymentform.account_number}
                                  onChange={(e) => setPaymentForm({ ...paymentform, account_number: e.target.value })}
                                />
                              </div>

                              {/* Account Name */}
                              <div className="space-y-1">
                                <Label className="text-gray-700">Account Name</Label>
                                <Input
                                  placeholder="Optional"
                                  value={paymentform.account_name}
                                  onChange={(e) => setPaymentForm({ ...paymentform, account_name: e.target.value })}
                                />
                              </div>

                              {/* QR Upload */}
                              <div className="space-y-2">
                                <Label className="text-gray-700">QR Code</Label>
                                <Input type="file" accept="image/*" onChange={(e) => setQrCodeFile(e.target.files?.[0] || null)} />
                                {qrCodeFile && (
                                  <div className="mt-2">
                                    <img src={URL.createObjectURL(qrCodeFile)} alt="QR Preview" className="w-32 h-32 object-cover rounded border" />
                                  </div>
                                )}
                              </div>

                              {/* Enabled */}
                              <div className="flex items-center gap-2">
                                <Switch checked={paymentform.is_enabled} onCheckedChange={(v) => setPaymentForm({ ...paymentform, is_enabled: v })} />
                                <Label className="text-gray-700">Enabled</Label>
                              </div>

                              {/* Action */}
                              <Button
                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold"
                                onClick={editPaymentId ? handleUpdate : handleCreate}
                              >
                                {editPaymentId ? "Update Payment Method" : "Create Payment Method"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardHeader>

                      <CardContent className="space-y-3 py-6">
                        {methods.length === 0 ? (
                          <div className="flex flex-col items-center justify-center p-6 text-gray-500">
                            <p className="font-medium">No payment methods added yet</p>
                            <p className="text-sm">Click “Add New” to configure one.</p>
                          </div>
                        ) : (
                          methods.map((m) => (
                            <div key={m.id} className="flex items-center justify-between border p-3 rounded-lg bg-white shadow-sm">
                              <div className="flex flex-col gap-1 p-3">
                                {/* Header: Key + Status */}
                                <div className="flex items-center">
                                  <p className="font-semibold text-gray-900 text-lg">{m.key}</p>
                                  <Badge
                                    className={
                                      m.is_enabled
                                        ? "ml-2 bg-green-100 text-green-800 border border-green-200"
                                        : "ml-2 bg-red-100 text-red-800 border border-red-200"
                                    }
                                  >
                                    {m.is_enabled ? "Enabled" : "Disabled"}
                                  </Badge>
                                </div>

                                {/* Metadata */}
                                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                  <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium">{m.type}</span>
                                  <span className="text-gray-500">• {m.display_name}</span>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                {/* View Modal */}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Eye className="w-4 h-4 text-gray-600 hover:text-yellow-700" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-md text-gray-800">
                                    <DialogHeader>
                                      <DialogTitle className="text-yellow-600 font-bold text-lg">
                                        {m.key}{" "}
                                        <span
                                          className={
                                            m.is_enabled
                                              ? "ml-2 bg-green-100 text-green-800 border border-green-200 px-2 rounded-4xl"
                                              : "ml-2 bg-red-100 text-red-800 border border-red-200 px-2 rounded-4xl"
                                          }
                                        >
                                          {m.is_enabled ? "Enabled" : "Disabled"}
                                        </span>
                                      </DialogTitle>
                                      <DialogDescription className="text-gray-500">Detailed information about this payment method</DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-4">
                                      {/* Type */}
                                      <div className="pt-2">
                                        <p className="text-sm text-gray-600">
                                          <span className="font-semibold text-yellow-700">Type:</span> {m.type}
                                        </p>
                                      </div>

                                      {/* Key */}
                                      <div className="pt-2">
                                        <p className="text-sm text-gray-600">
                                          <span className="font-semibold text-yellow-700">Display Name:</span> {m.display_name}
                                        </p>
                                      </div>

                                      {/* Account Number */}
                                      {m.account_number && (
                                        <div className="pt-2">
                                          <p className="text-sm text-gray-600">
                                            <span className="font-semibold text-yellow-700">Account Number:</span> {m.account_number}
                                          </p>
                                        </div>
                                      )}

                                      {/* Account Name */}
                                      {m.account_name && (
                                        <div className="pt-2">
                                          <p className="text-sm text-gray-600">
                                            <span className="font-semibold text-yellow-700">Account Name:</span> {m.account_name}
                                          </p>
                                        </div>
                                      )}

                                      {/* QR Code */}
                                      {m.qr_code && (
                                        <div className="pt-2">
                                          <span className="font-semibold text-yellow-700">QR Code:</span>
                                          <div className="mt-2">
                                            <Image
                                              src={`${process.env.NEXT_PUBLIC_API_URL}/${m.qr_code}`}
                                              alt="QR"
                                              width={128}
                                              height={128}
                                              className="rounded border border-yellow-200 shadow-sm"
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                {/* Edit */}
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(m)}>
                                  <Edit className="w-4 h-4 text-yellow-600" />
                                </Button>

                                {/* Delete */}
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>

                                  <AlertDialogContent className="text-gray-800">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Payment Method?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this payment method? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>

                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(m.id)} className="bg-red-600 hover:bg-red-700 text-white">
                                        Yes, Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
