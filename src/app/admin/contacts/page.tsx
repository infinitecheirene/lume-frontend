"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Eye, Search } from "lucide-react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

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
  const [isDesktop, setIsDesktop] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [viewContact, setViewContact] = useState<ContactInquiry | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Detect desktop
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024)
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

  return (
    <SidebarProvider defaultOpen={!isDesktop}>
      <div className="flex min-h-screen w-full bg-gray-50">
        <AppSidebar />
        <div className={`flex-1 min-w-0 ${isDesktop ? "ml-0" : "ml-72"}`}>
          <main className="p-8 max-w-7xl mx-auto space-y-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Inquiries Management</h1>
            <p className="text-gray-600 mt-1">View contact inquiries submitted via the website.</p>

            <Card className="bg-white shadow-xl p-0 pb-5">
              <CardHeader className="p-3 bg-blue-900 text-white rounded-t-lg flex justify-between items-center">
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
              <DialogContent className="text-black max-w-lg">
                <DialogHeader>
                  <DialogTitle>Contact Details</DialogTitle>
                  <DialogDescription>View contact inquiry information.</DialogDescription>
                </DialogHeader>

                {viewContact && (
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-semibold">Name</p>
                      <p className="text-gray-700">{viewContact.name}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Email</p>
                      <p className="text-gray-700">{viewContact.email}</p>
                    </div>
                    {viewContact.phone && (
                      <div>
                        <p className="font-semibold">Phone</p>
                        <p className="text-gray-700">{viewContact.phone}</p>
                      </div>
                    )}
                    {viewContact.subject && (
                      <div>
                        <p className="font-semibold">Subject</p>
                        <p className="text-gray-700">{viewContact.subject}</p>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">Message</p>
                      <p className="text-gray-700 whitespace-pre-wrap">{viewContact.message}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Date Submitted</p>
                      <p className="text-gray-700">{new Date(viewContact.created_at).toLocaleString()}</p>
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
