"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { usePathname, useRouter } from "next/navigation"
import logo from "@/assets/logo.jpg"
import { Menu, X, User, LogOut, ShoppingCart, Calendar, Settings, Package, Download } from "lucide-react"
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

  // PWA install prompt handling
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      // Hide the install button
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  if (pathname.startsWith("/admin")) {
    return null
  }

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

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice

    // Reset the deferred prompt
    setDeferredPrompt(null)
    setIsInstallable(false)
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
        <nav className="hidden lg:flex items-center gap-6 relative">

          {/* NAV LINKS */}
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
            <Link
              href="/cart"
              className="relative text-white/70 hover:text-[#d4a24c]"
            >
              <ShoppingCart size={22} />

              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#d4a24c] text-black text-xs font-bold px-1.5 rounded-full min-w-[18px] text-center">
                  {itemCount}
                </span>
              )}
            </Link>
          )}

          {/* USER MENU */}
          {user ? (
            <div ref={dropdownRef} className="relative -mb-2">
              <button
                onClick={() => setUserMenuOpen((p) => !p)}
                className="text-white/70 hover:text-[#d4a24c]"
              >
                <User size={22} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#0b1d26] border border-white/10 rounded-lg shadow-lg overflow-hidden">
                  <Link href="/orders" className="flex items-center gap-2 px-4 py-2 hover:bg-white/10">
                    <Package size={16} /> Orders
                  </Link>
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
            <Link
              href="/login"
              className="text-white/70 hover:text-[#d4a24c] text-sm"
            >
              Log In
            </Link>
          )}

          {/* CTA */}
          <Link
            href="/reservations"
            className="ml-2 bg-[#d4a24c] text-black px-5 py-2 rounded-full text-sm font-semibold hover:brightness-110 transition whitespace-nowrap"
          >
            Book a Table
          </Link>

          {/* PWA INSTALL BUTTON */}
          {isInstallable && (
            <button
              onClick={handleInstallClick}
              className="ml-2 bg-white/10 border border-[#d4a24c]/30 text-[#d4a24c] px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#d4a24c]/10 transition flex items-center gap-2 whitespace-nowrap"
              title="Install Lumè Bean & Bar App"
            >
              <Download size={16} />
              Install App
            </button>
          )}

        </nav>

        {/* TABLET NAV */}
        <div className="hidden md:flex lg:hidden items-center gap-4">
          {/* CART */}
          {user && (
            <Link
              href="/cart"
              className="relative flex items-center justify-center text-white hover:text-[#d4a24c]"
            >
              <ShoppingCart size={22} />

              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#d4a24c] text-black text-xs font-bold px-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>
          )}

          {/* USER */}
          {user ? (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setUserMenuOpen((p) => !p)}
                className="text-white hover:text-[#d4a24c]"
              >
                <User size={22} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#0b1d26] border border-white/10 rounded-lg shadow-lg overflow-hidden z-50">
                  <Link href="/orders" className="block px-4 py-2 hover:bg-white/10">Orders</Link>
                  <Link href="/reservation-history" className="block px-4 py-2 hover:bg-white/10">Reservations</Link>
                  <Link href="/profile" className="block px-4 py-2 hover:bg-white/10">Account</Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-[#d4a24c] hover:bg-white/10"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="text-white text-sm">
              Log In
            </Link>
          )}

          {/* CTA */}
          <Link
            href="/reservations"
            className="bg-[#d4a24c] text-black px-4 py-2 rounded-full text-sm font-semibold"
          >
            Book
          </Link>

          {/* MENU BUTTON */}
          <button
            onClick={() => setTabletMenuOpen((p) => !p)}
            className="text-white"
          >
            {tabletMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {tabletMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="hidden md:block lg:hidden absolute top-full left-0 w-full z-50 bg-[#162a3a]"
          >
            <div className="px-6 py-6 space-y-4">

              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setTabletMenuOpen(false)}
                  className="block text-white/80 hover:text-[#d4a24c]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* MOBILE */}
        <div className="md:hidden flex items-center gap-5">

          {/* CART */}
          {user && (
            <>
              <Link
                href="/cart"
                className="relative flex items-center justify-center text-white hover:text-[#d4a24c]"
              >
                <ShoppingCart size={22} className="sm:w-6 sm:h-6" />

                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 
                    bg-[#d4a24c] text-black text-[10px] sm:text-xs font-bold 
                    px-1.5 min-w-[16px] sm:min-w-[18px] h-[16px] sm:h-[18px]
                    flex items-center justify-center rounded-full leading-none">
                    {itemCount}
                  </span>
                )}
              </Link>
            </>
          )}

                    {/* USER */}
          {user ? (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setUserMenuOpen((p) => !p)}
                className="text-white hover:text-[#d4a24c]"
              >
                <User size={22} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#0b1d26] border border-white/10 rounded-lg shadow-lg overflow-hidden z-50">
                  <Link href="/orders" className="block px-4 py-2 hover:bg-white/10">Orders</Link>
                  <Link href="/reservation-history" className="block px-4 py-2 hover:bg-white/10">Reservations</Link>
                  <Link href="/profile" className="block px-4 py-2 hover:bg-white/10">Account</Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-[#d4a24c] hover:bg-white/10"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="text-white text-sm">
              Log In
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

            {/* PWA INSTALL BUTTON - MOBILE */}
            {isInstallable && (
              <button
                onClick={handleInstallClick}
                className="w-full mt-4 bg-[#d4a24c] text-black px-4 py-3 rounded-full text-sm font-semibold hover:brightness-110 transition flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Install App
              </button>
            )}

          </div>
        </motion.div>
      )}
    </motion.header>
  )
}