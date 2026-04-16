"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { usePathname, useRouter } from "next/navigation"
import logo from "@/assets/logo.jpg"
import {
  Menu,
  X,
  User,
  LogOut,
  ShoppingCart,
  Calendar,
  Settings,
  Package,
  Download,
  LayoutDashboard
} from "lucide-react"
import { useCartStore } from "@/store/cartStore"
import { Playfair_Display } from "next/font/google"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/menu" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [tabletMenuOpen, setTabletMenuOpen] = useState(false)

  const desktopDropdownRef = useRef<HTMLDivElement | null>(null)
  const tabletDropdownRef = useRef<HTMLDivElement | null>(null)
  const mobileDropdownRef = useRef<HTMLDivElement | null>(null)

  const itemCount = useCartStore((state) => state.getItemCount())
  const pathname = usePathname()
  const router = useRouter()

  const isAdmin = user?.role === "admin"

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  const loadUser = useCallback(() => {
    try {
      const storedUser = localStorage.getItem("user_data")
      const token = localStorage.getItem("auth_token")

      if (storedUser && token) {
        setUser({ ...JSON.parse(storedUser), token })
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    loadUser()

    const handleUpdate = () => loadUser()

    window.addEventListener("userDataUpdated", handleUpdate)
    window.addEventListener("storage", handleUpdate)

    return () => {
      window.removeEventListener("userDataUpdated", handleUpdate)
      window.removeEventListener("storage", handleUpdate)
    }
  }, [loadUser])

  // close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node

      if (
        !desktopDropdownRef.current?.contains(target) &&
        !tabletDropdownRef.current?.contains(target) &&
        !mobileDropdownRef.current?.contains(target)
      ) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstallable(false)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  if (pathname.startsWith("/admin")) return null

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
    setUser(null)
    setUserMenuOpen(false)
    window.dispatchEvent(new Event("userDataUpdated"))
    router.push("/login")
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setIsInstallable(false)
  }

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0b1d26]/70 border-b border-[#d4a24c]/20"
    >
      <div className="container mx-auto px-4 flex items-center justify-between py-4">

        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3">
          <Image src={logo} alt="Lume" width={40} height={40} className="rounded-full" />
          <span className={`${playfair.className} text-xl font-semibold text-[#d4a24c]`}>
            Lumè Bean & Bar
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden lg:flex items-center gap-6">

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm ${isActive(link.href) ? "text-[#d4a24c]" : "text-white/70 hover:text-[#d4a24c]"}`}
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <div ref={desktopDropdownRef} className="relative">

              {/* ICON SWITCH (ADMIN vs USER) */}
              <button onClick={() => setUserMenuOpen(!userMenuOpen)}>
                {isAdmin ? (
                  <User size={22} className="text-[#d4a24c] hover:brightness-110 -mb-1" />
                ) : (
                  <User size={22} className="text-white/70 hover:text-[#d4a24c] -mb-1" />
                )}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-[#0b1d26] border border-white/10 rounded-xl shadow-xl z-50">

                  {/* ADMIN MENU */}
                  {isAdmin ? (
                    <>
                      <Link
                        href="/admin/dashboard"
                        className="flex gap-2 px-4 py-2 hover:bg-white/10"
                      >
                        <LayoutDashboard size={16} /> Dashboard
                      </Link>

                      <div className="border-t border-white/10 my-1" />

                      <button
                        onClick={handleLogout}
                        className="flex gap-2 px-4 py-2 text-[#d4a24c] w-full hover:bg-white/10"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </>
                  ) : (
                    <>
                      {/* CUSTOMER MENU */}
                      <Link
                        href="/orders"
                        className="flex gap-2 px-4 py-2 hover:bg-white/10"
                      >
                        <Package size={16} /> Orders
                      </Link>

                      <Link
                        href="/reservation-history"
                        className="flex gap-2 px-4 py-2 hover:bg-white/10"
                      >
                        <Calendar size={16} /> Reservations
                      </Link>

                      <Link
                        href="/profile"
                        className="flex gap-2 px-4 py-2 hover:bg-white/10"
                      >
                        <Settings size={16} /> Account
                      </Link>

                      <div className="border-t border-white/10 my-1" />

                      <button
                        onClick={handleLogout}
                        className="flex gap-2 px-4 py-2 text-[#d4a24c] w-full hover:bg-white/10"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="text-white/70 hover:text-[#d4a24c]">
              Log In
            </Link>
          )}

          {/* CTA */}
          <Link href="/reservations" className="bg-[#d4a24c] text-black px-5 py-2 rounded-full">
            Book a Table
          </Link>

          {/* PWA (UNCHANGED) */}
          {isInstallable && (
            <button onClick={handleInstallClick} className="bg-white/10 text-[#d4a24c] px-4 py-2 rounded-full flex items-center gap-2">
              <Download size={16} /> Install App
            </button>
          )}
        </nav>
      </div>
    </motion.header>
  )
}