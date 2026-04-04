"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import logo from "@/assets/logo.jpg"
import { Menu, X } from "lucide-react"

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/menu" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname?.startsWith(href)
  }

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0b1d26]/70 border-b border-[#d4a24c]/20"
    >
      <div className="container mx-auto px-4 flex items-center justify-between py-4">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={logo}
            alt="Crescent Coffee Logo"
            width={40}
            height={40}
            className="rounded-full object-cover"
            priority
          />
          <span className="text-xl font-semibold text-[#d4a24c]">
            Crescent
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "text-[#d4a24c]"
                  : "text-white/70 hover:text-[#d4a24c]"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* CTA */}
          <Link
            href="/reserve"
            className="rounded-full bg-[#d4a24c] px-5 py-2 text-sm font-semibold text-black hover:brightness-110 transition"
          >
            Book a Table
          </Link>
        </nav>

        {/* Mobile Toggle */}
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="md:hidden text-white"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-[#0b1d26]/95 backdrop-blur-xl border-t border-[#d4a24c]/20 overflow-hidden"
          >
            <div className="container mx-auto px-4 flex flex-col gap-4 py-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`transition-colors ${
                    isActive(link.href)
                      ? "text-[#d4a24c]"
                      : "text-white/70 hover:text-[#d4a24c]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <Link
                href="/reserve"
                onClick={() => setOpen(false)}
                className="text-[#d4a24c] font-medium"
              >
                Book a Table
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}