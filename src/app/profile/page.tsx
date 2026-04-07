"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Plus, Edit, Trash2, Check, MapPin, Mail, Phone, User } from "lucide-react"
import { AddAddressModal, type AddressFormData } from "@/components/add-address-modal"
import { toast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { motion } from "framer-motion"
import LumeLoaderMinimal from "@/components/oppa-loader"
import { Playfair_Display } from "next/font/google"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

interface Address {
  id: number
  street: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
}

interface User {
  id: string | number
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  zip_code?: string
  token: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingData, setEditingData] = useState<AddressFormData | undefined>()
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [addressToDelete, setAddressToDelete] = useState<number | null>(null)
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false)
  const [phoneInput, setPhoneInput] = useState("")
  const [updatingPhone, setUpdatingPhone] = useState(false)

  useEffect(() => {
    const loadUserData = () => {
      try {
        const storedUser = localStorage.getItem("user_data")
        const storedToken = localStorage.getItem("auth_token")

        if (!storedUser || !storedToken) {
          router.push("/login")
          return
        }

        const parsedUser = JSON.parse(storedUser)
        setUser({ ...parsedUser, token: storedToken })
        fetchAddresses(storedToken)
      } catch (error) {
        console.error("Error loading user:", error)
        router.push("/login")
      }
    }

    loadUserData()
  }, [router])

  const fetchAddresses = async (token: string) => {
    try {
      setLoading(true)
      const response = await fetch("/api/addresses", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch addresses")
      }

      const data = await response.json()
      setAddresses(data.addresses || [])
    } catch (error) {
      console.error("Error fetching addresses:", error)
      toast({
        title: "Error",
        description: "Failed to load addresses. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePhone = async () => {
    if (!user?.token) return

    try {
      setUpdatingPhone(true)

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ phone: phoneInput }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to update phone")
      }

      setUser((prev) => (prev ? { ...prev, phone: phoneInput } : prev))

      toast({
        title: "Success",
        description: "Phone number updated successfully.",
      })

      setIsPhoneModalOpen(false)
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to update phone number.",
        variant: "destructive",
      })
    } finally {
      setUpdatingPhone(false)
    }
  }

  const handleAddAddress = async (formData: AddressFormData) => {
    if (!user?.token) return

    try {
      const url = editingId ? `/api/addresses/${editingId}` : "/api/addresses"
      const method = editingId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${editingId ? "update" : "add"} address`)
      }

      const data = await response.json()
      const newAddress = data.data || data.address

      if (editingId) {
        setAddresses(addresses.map((addr) => (addr.id === editingId ? newAddress : addr)))
        setEditingId(null)
        toast({
          title: "Success",
          description: "Address updated successfully.",
        })
      } else {
        setAddresses([...addresses, newAddress])
        toast({
          title: "Success",
          description: "Address added successfully.",
        })
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Failed to save address. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAddress = async (id: number) => {
    if (!user?.token) return

    try {
      const response = await fetch(`/api/addresses/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete address")
      }

      setAddresses(addresses.filter((addr) => addr.id !== id))
      toast({
        title: "Success",
        description: "Address deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting address:", error)
      toast({
        title: "Error",
        description: "Failed to delete address. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setAddressToDelete(null)
    }
  }

  const confirmDelete = (id: number) => {
    setAddressToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleSetDefault = async (id: number) => {
    if (!user?.token) return

    try {
      const response = await fetch(`/api/addresses/${id}/set-default`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to set default address")
      }

      setAddresses(
        addresses.map((addr) => ({
          ...addr,
          is_default: addr.id === id,
        })),
      )
      toast({
        title: "Success",
        description: "Default address updated successfully.",
      })
    } catch (error) {
      console.error("Error setting default address:", error)
      toast({
        title: "Error",
        description: "Failed to set default address. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditClick = async (address: Address) => {
    if (!user?.token) return

    setIsLoadingAddress(true)

    try {
      const response = await fetch("/api/addresses", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch addresses")
      }

      const data = await response.json()
      const updatedAddresses = data.addresses || []
      setAddresses(updatedAddresses)

      const currentAddress = updatedAddresses.find((addr: Address) => addr.id === address.id)

      if (!currentAddress) {
        throw new Error("Address not found")
      }

      setEditingId(currentAddress.id)
      const formData = {
        street: currentAddress.street,
        city: currentAddress.city,
        state: currentAddress.state,
        postal_code: currentAddress.postal_code,
        country: currentAddress.country,
      }
      setEditingData(formData)

      setTimeout(() => {
        setIsModalOpen(true)
        setIsLoadingAddress(false)
      }, 100)
    } catch (error) {
      console.error("Error fetching address:", error)
      setIsLoadingAddress(false)
      toast({
        title: "Error",
        description: "Failed to load address details. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setEditingData(undefined)
  }

  if (loading) {
    return (
      <LumeLoaderMinimal />
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen py-24 bg-[#0b1d26] text-white">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#d4a24c]/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#d4a24c]/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-[#d4a24c]/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`${playfair.className} text-5xl font-bold text-white text-center mb-2`}>Account Settings</h1>
          <p className="text-white/70 text-center">Manage your personal information and delivery addresses</p>
        </div>

        {/* User Profile Card */}
        <Card className="mb-8 overflow-hidden bg-[#0c222b] rounded-2xl p-8 border border-[#a47015]/60 text-center hover:border-[#d4a24c]/40 transition shadow-[0_0_20px_rgba(212,162,76,0.35)]">
          {/* Header */}
          <div className="flex items-center gap-4 px-5">
            <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{user.name}</h2>
              <p className="text-white/70">Valued Customer</p>
            </div>
          </div>

          {/* Contact info */}
          <div className="p-8 grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-2 text-sm text-white/70 uppercase tracking-wide mb-2">
                <Mail className="h-4 w-4" />
                EMAIL ADDRESS
              </div>
              <p className="text-lg font-semibold text-white">{user.email}</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-white/70 uppercase tracking-wide">
                  <Phone className="h-4 w-4" />
                  PHONE NUMBER
                </div>

                <Button
                  className="bg-[#d4a24c] hover:bg-[#d4a24c]/70 border-white/30 text-black "
                  onClick={() => {
                    setPhoneInput(user.phone || "")
                    setIsPhoneModalOpen(true)
                  }}
                >
                  <Edit className="h-4 w-4 mr-1.5" />
                  Update Phone
                </Button>
              </div>

              <p className="text-lg font-semibold text-white">{user.phone || "Not provided"}</p>
            </div>
          </div>
        </Card>

        {/* Delivery Addresses Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-[#d4a24c] flex items-center justify-center flex-shrink-0">
                <MapPin className="h-6 w-6 text-[#0c222b] " />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Delivery Addresses</h2>
                <p className="text-sm text-white/70">Manage where we deliver your orders</p>
              </div>
            </div>
            {addresses.length < 5 && (
              <Button
                onClick={() => {
                  setEditingId(null)
                  setEditingData(undefined)
                  setIsModalOpen(true)
                }}
                className="bg-[#d4a24c] hover:bg-[#d4a24c]/90 text-[#0c222b] shadow-md w-full sm:w-auto font-bold"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Address
              </Button>
            )}
          </div>

          {/* Addresses List */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-white/70">Loading addresses...</p>
            </div>
          ) : addresses.length === 0 ? (
            <Card className="p-12 text-center border-2 border-dashed border-white/30 bg-[#0c222b] /70 backdrop-blur-sm">
              <MapPin className="h-12 w-12 text-white/50 mx-auto mb-4" />
              <p className="text-white text-lg font-medium">No addresses yet</p>
              <p className="text-white/70 text-sm mt-1">Add your first delivery address to get started</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {addresses.map((address, index) => (
                <Card
                  key={address.id}
                  className={`overflow-hidden transition-all ${
                    address.is_default
                      ? "ring-2 ring-[#d4a24c] shadow-2xl bg-[#0c222b] /90 backdrop-blur-sm border-white/50"
                      : "border-white/30 shadow-xl hover:shadow-2xl bg-[#0c222b] /70 backdrop-blur-sm"
                  }`}
                >
                  {/* Address Content */}
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="h-12 w-12 rounded-xl bg-[#d4a24c] flex items-center justify-center flex-shrink-0 shadow-md">
                        <span className="text-white text-xl font-bold">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-base font-bold text-white break-words leading-tight">{address.street}</h3>
                          {address.is_default && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#d4a24c]  text-white text-xs font-semibold rounded-full shadow-sm flex-shrink-0">
                              <Check className="h-3 w-3" />
                              Default
                            </span>
                          )}
                        </div>
                        <div className="space-y-0.5 text-sm text-white/70">
                          <p>
                            {address.city}, {address.state}
                          </p>
                          <p className="text-white/60">
                            {address.postal_code}, {address.country}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-white/20">
                      {!address.is_default && (
                        <Button
                          onClick={() => handleSetDefault(address.id)}
                          variant="outline"
                          size="sm"
                          className="bg-slate-700 flex-1 min-w-[140px] border-white/30 text-white hover:bg-white/10 font-medium"
                        >
                          <Check className="h-4 w-4 mr-1.5" />
                          Set as Default
                        </Button>
                      )}
                      <Button
                        onClick={() => handleEditClick(address)}
                        variant="outline"
                        size="sm"
                        className={`${!address.is_default ? "flex-1 min-w-[100px]" : "flex-1"} bg-slate-700 border-white/30 text-white hover:bg-white/10 font-medium`}
                        disabled={isLoadingAddress}
                      >
                        <Edit className="h-4 w-4 mr-1.5" />
                        {isLoadingAddress ? "Loading..." : "Edit"}
                      </Button>
                      <Button
                        onClick={() => confirmDelete(address.id)}
                        variant="outline"
                        size="sm"
                        className={`${!address.is_default ? "flex-1 min-w-[100px]" : "flex-1"} bg-transparent border-red-300 text-red-300 hover:bg-red-500/20 font-medium`}
                      >
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* update phone number modal */}
      <Dialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
        <DialogContent className="bg-[#0c222b] border border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Update Phone Number</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <Label className="text-white/70">Phone Number</Label>
            <Input
              value={phoneInput}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={11}
              onChange={(e) => {
                const onlyNumbers = e.target.value.replace(/\D/g, "")
                setPhoneInput(onlyNumbers)
              }}
              placeholder="Enter phone number"
              className="bg-[#0b1d26] border-white/20 text-white"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="bg-transparent border-white/30 text-white hover:bg-white/10"
              onClick={() => setIsPhoneModalOpen(false)}
            >
              Cancel
            </Button>

            <Button
              onClick={handleUpdatePhone}
              disabled={updatingPhone || !phoneInput.trim()}
              className="bg-[#d4a24c] hover:bg-[#d4a24c]/90 text-[#0c222b] font-bold"
            >
              {updatingPhone ? "Updating..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Address Modal */}
      <AddAddressModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleAddAddress}
        isEditing={editingId !== null}
        initialData={editingData}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-black">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this delivery address. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-black">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => addressToDelete && handleDeleteAddress(addressToDelete)} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
