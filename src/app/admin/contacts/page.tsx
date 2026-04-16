"use client"

import type React from "react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Eye, Search, Loader2 } from "lucide-react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Playfair_Display } from "next/font/google"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

interface ContactInquiry {
  id: number
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
  created_at: string
}

const ITEMS_PER_PAGE = 10

export default function ContactsAdmin() {
  const [contacts, setContacts] = useState<ContactInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [viewOpen, setViewOpen] = useState(false)
  const [viewContact, setViewContact] = useState<ContactInquiry | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth < 1024) // lg breakpoint
    }
    checkDesktop()
    window.addEventListener("resize", checkDesktop)
    return () => window.removeEventListener("resize", checkDesktop)
  }, [])

  // Fetch contacts
  useEffect(() => {
    fetchContacts()
  }, [])

  async function fetchContacts() {
    try {
      setLoading(true)
      const res = await fetch("/api/contacts")
      if (!res.ok) throw new Error("Failed to fetch contacts")
      const data = await res.json()
      setContacts(Array.isArray(data) ? data : data.data || [])
    } catch (error) {
      console.error("Failed to fetch contacts:", error)
    } finally {
      setLoading(false)
    }
  }

  function openViewModal(contact: ContactInquiry) {
    setViewContact(contact)
    setViewOpen(true)
  }

  // Filter & paginate
  const contactData = contacts.data || []

  const filtered = contactData.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.message && c.message.toLowerCase().includes(searchTerm.toLowerCase())),
  )
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
  const paginated = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE)

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
                  <p className="text-lg font-semibold text-white">Loading Inquiries</p>
                  <p className="text-sm text-white/60">Please wait while we fetch the data...</p>
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

          <main className="p-8 max-w-7xl mx-auto space-y-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Inquiries Management</h1>
            <p className="text-gray-600 mt-1">View contact inquiries submitted via the website.</p>

            <Card className="bg-white/70 backdrop-blur-sm shadow-xl p-0 pb-5 border-blue-100">
              <CardHeader className="p-3 bg-[#162A3A] text-white rounded-t-lg">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-700" />
                  <Input
                    placeholder="Search by name, email, or message..."
                    value={searchTerm || ""}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="pl-9 pr-3 py-2 w-full bg-blue-100 text-gray-900 placeholder:text-gray-600 focus:bg-white focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </CardHeader>

              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading contacts...</div>
                ) : paginated.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">{contacts.length === 0 ? "No contacts yet" : "No results found"}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-gray-100">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold">Name</th>
                          <th className="text-left py-3 px-4 font-semibold">Email</th>
                          <th className="text-left py-3 px-4 font-semibold">Subject</th>
                          <th className="text-left py-3 px-4 font-semibold">Message</th>
                          <th className="text-left py-3 px-4 font-semibold">Date</th>
                          <th className="text-left py-3 px-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginated.map((c) => (
                          <tr key={c.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{c.name}</td>
                            <td className="py-3 px-4 text-gray-600">{c.email}</td>
                            <td className="py-3 px-4 text-gray-700">
                              {c.subject === "general"
                                ? "General Inquiry"
                                : c.subject === "reservation"
                                  ? "Reservation"
                                  : c.subject === "complaint"
                                    ? "Complaint"
                                    : c.subject === "suggestion"
                                      ? "Suggestion"
                                      : c.subject || "-"}
                            </td>
                            <td className="py-3 px-4 max-w-xs truncate">{c.message}</td>
                            <td className="py-3 px-4 text-gray-600">{new Date(c.created_at).toLocaleDateString()}</td>
                            <td className="py-3 px-4">
                              <Button size="sm" variant="outline" onClick={() => openViewModal(c)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* View Modal */}
            <Dialog open={viewOpen} onOpenChange={setViewOpen}>
              <DialogContent className="max-w-lg bg-[#fdfaf6] border border-[#e7d7c9] rounded-2xl p-0 overflow-hidden">

                {/* Header */}
                <div className="bg-[#162a3a] text-white px-6 py-4">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                      Contact Details
                    </DialogTitle>
                    <DialogDescription className="text-[#d6c8bf] text-sm">
                      Guest inquiry information
                    </DialogDescription>
                  </DialogHeader>
                </div>

                {/* Body */}
                {viewContact && (
                  <div className="p-6 space-y-5 text-sm">

                    {/* Grid Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                      <div className="bg-white border border-[#eee2d8] rounded-lg p-3">
                        <p className="text-xs text-[#a89a94]">Name</p>
                        <p className="font-semibold text-[#3b2f2f]">{viewContact.name}</p>
                      </div>

                      <div className="bg-white border border-[#eee2d8] rounded-lg p-3">
                        <p className="text-xs text-[#a89a94]">Email</p>
                        <p className="font-semibold text-[#3b2f2f] break-all">
                          {viewContact.email}
                        </p>
                      </div>

                      {viewContact.phone && (
                        <div className="bg-white border border-[#eee2d8] rounded-lg p-3">
                          <p className="text-xs text-[#a89a94]">Phone</p>
                          <p className="font-semibold text-[#3b2f2f]">
                            {viewContact.phone}
                          </p>
                        </div>
                      )}

                      {viewContact.subject && (
                        <div className="bg-white border border-[#eee2d8] rounded-lg p-3">
                          <p className="text-xs text-[#a89a94]">Subject</p>
                          <p className="font-semibold text-[#3b2f2f]">
                            {viewContact.subject}
                          </p>
                        </div>
                      )}

                    </div>

                    {/* Message */}
                    <div className="bg-white border border-[#eee2d8] rounded-lg p-4">
                      <p className="text-xs text-[#a89a94] mb-2">Message</p>
                      <p className="text-[#3b2f2f] leading-relaxed whitespace-pre-wrap">
                        {viewContact.message}
                      </p>
                    </div>

                    {/* Date */}
                    <div className="flex justify-between items-center pt-2 border-t border-[#eee2d8]">
                      <p className="text-xs text-[#a89a94]">Date Submitted</p>
                      <p className="text-xs font-medium text-[#3b2f2f]">
                        {new Date(viewContact.created_at).toLocaleString()}
                      </p>
                    </div>

                  </div>
                )}
              </DialogContent>
            </Dialog>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
