"use client"

import { Home, Package, Megaphone, Users, ShoppingCart, LogOut, ChevronDown, Calendar, Mail, Phone } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"

import Image from "next/image"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

const items = [
  { title: "Dashboard", url: "/admin/dashboard", icon: Home },
  { title: "Products", url: "/admin/product", icon: Package },
  { title: "Orders", url: "/admin/order", icon: ShoppingCart },
  { title: "Reservations", url: "/admin/reservations", icon: Calendar },
  { title: "Inquiries", url: "/admin/contacts", icon: Mail },
  { title: "Customers", url: "/admin/users", icon: Users },
    {
    title: "Content Management",
    icon: Megaphone,
    items: [
      { title: "Announcements", url: "/admin/announcements" },
      { title: "Blog Posts", url: "/admin/blog" },
      { title: "Testimonials", url: "/admin/testimonials" },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { setOpen, isMobile } = useSidebar()

  const handleLogout = () => {
    localStorage.clear()
    router.push("/")
  }

  const handleNavigate = () => {
    if (isMobile) setOpen(false)
  }

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-blue-950">
      <SidebarContent className="bg-amber-50 lg:px-5">
        <SidebarGroup>
          {/* Header */}
          <div className="px-4 py-6 bg-[#162A3A] text-white rounded-lg mx-3 mt-3 mb-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 overflow-hidden">
                <Image src="/logo.jpg" alt="Lumè Bean and Bar Logo" fill className="object-contain rounded-full" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Admin Panel</h2>
                <p className="text-amber-300 text-xs">Management Portal</p>
              </div>
            </div>
          </div>

          <SidebarGroupContent className="px-2">
            <SidebarMenu className="space-y-1">
              {items.map((item) => {
                const isParentActive = item.items?.some((sub) => pathname.startsWith(sub.url)) ?? false

                return (
                  <SidebarMenuItem key={item.title}>
                    {item.items ? (
                      <Collapsible defaultOpen={isParentActive}>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="mx-1 rounded-lg">
                            <item.icon className="h-5 w-5 text-[#162A3A]" />
                            <span>{item.title}</span>
                            <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <SidebarMenuSub className="ml-6 mt-1">
                            {item.items.map((sub) => (
                              <SidebarMenuSubItem key={sub.title}>
                                <SidebarMenuSubButton asChild isActive={pathname === sub.url} onClick={handleNavigate}>
                                  <Link href={sub.url} className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#162A3A]" />
                                    {sub.title}
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <SidebarMenuButton asChild isActive={pathname === item.url} onClick={handleNavigate} className="mx-1 rounded-lg">
                        <Link href={item.url!} className="flex items-center gap-3">
                          <item.icon className="h-5 w-5 text-[#162A3A]" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-blue-200">
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2 text-[#162A3A]" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
