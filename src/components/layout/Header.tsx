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
  Settings
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
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const itemCount = useCartStore((state) => state.getItemCount())

  const pathname = usePathname()
  const router = useRouter()

  const dropdownRef = useRef<HTMLDivElement | null>(null)

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

  // close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
    setUser(null)
    setUserMenuOpen(false)
    window.dispatchEvent(new Event("userDataUpdated"))
    router.push("/login")
  }

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 2 }}
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
        <nav className="hidden md:flex items-center gap-6">

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition ${isActive(link.href)
                ? "text-[#d4a24c]"
                : "text-white/70 hover:text-[#d4a24c]"
                }`}
            >
              {link.label}
            </Link>
          ))}

          {/* CART */}
          {user && (
            <Link href="/cart" className="text-white/70 hover:text-[#d4a24c]">
              <ShoppingCart size={20} />

              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#d4a24c] text-black text-xs font-bold px-1.5 rounded-full min-w-[18px] text-center">
                  {itemCount}
                </span>
              )}
            </Link>
          )}

          {/* USER MENU */}
          {user ? (
            <div ref={dropdownRef}>
              <button
                onClick={() => setUserMenuOpen((p) => !p)}
                className="text-white/80 hover:text-[#d4a24c]"
              >
                <User size={20} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-3 w-52 bg-[#0b1d26] border border-white/10 rounded-xl shadow-lg overflow-hidden">

                  <Link href="/reservation-history" className="flex items-center gap-2 px-4 py-2 hover:bg-white/10">
                    <Calendar size={16} /> Reservations
                  </Link>

                  <Link href="/profile" className="flex items-center gap-2 px-4 py-2 hover:bg-white/10">
                    <Settings size={16} /> Account
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-[#d4a24c] hover:bg-white/10 w-full text-left"
                  >
                    <LogOut size={16} /> Logout
                  </button>

                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="text-white/70 hover:text-[#d4a24c] text-sm">
              Log In
            </Link>
          )}

          {/* CTA */}
          <Link
            href="/reservations"
            className="bg-[#d4a24c] text-black px-5 py-2 rounded-full text-sm font-semibold hover:brightness-110 transition"
          >
            Book a Table
          </Link>

        </nav>

        {/* MOBILE */}
        <div className="md:hidden flex items-center gap-5">

          {/* CART */}
          {user && (
            <Link href="/cart" className="text-white hover:text-[#d4a24c]">
              <ShoppingCart size={24} />

              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#d4a24c] text-black text-xs font-bold px-1.5 rounded-full min-w-[18px] text-center">
                  {itemCount}
                </span>
              )}
            </Link>
          )}

          <button onClick={() => setOpen(!open)} className="text-white">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden border-t border-gold bg-background/95 backdrop-blur-xl"
        >
          <div className="md:hidden bg-[#0b1d26]/95 border-t border-[#d4a24c]/20 px-6 py-6 space-y-4">

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block text-white/80 hover:text-[#d4a24c]"
              >
                {link.label}
              </Link>
            ))}

            {!user ? (
              <Link href="/login" className="block text-white/80">
                Log In
              </Link>
            ) : (
              <div className="space-y-2">

                <div className="border-t border-[#d4a24c]/50" />
                <Link href="/reservation-history" className="block text-white/80">Reservations</Link>
                <Link href="/profile" className="block text-white/80">Profile</Link>

                <button onClick={handleLogout} className="text-red-400">
                  Logout
                </button>

              </div>
            )}

          </div>
        </motion.div>
      )}
    </motion.header>
  )
}