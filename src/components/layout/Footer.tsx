"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { Instagram, Facebook, Twitter } from "lucide-react"
import logo from "@/assets/logo.jpg"
import { Playfair_Display } from "next/font/google"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

const Footer = () => {
  const pathname = usePathname()

  if (pathname.startsWith("/admin")) return null

  return (
    <footer className="relative bg-[#0b1d26] border-t border-yellow-500/10 overflow-hidden">

      <div className="relative container mx-auto px-4 pt-20">

        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 px-12">

          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-3 mb-5">
              <Image
                src={logo}
                alt="Lumè Bean and Bar"
                width={42}
                height={42}
                className="rounded-full object-cover"
              />
              <span className={`${playfair.className} text-xl font-semibold text-[#d4a24c]`}>
                Lumè Bean & Bar
              </span>
            </Link>

            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Artisan coffee by day, craft cocktails by night. A place to slow down,
              connect, and savor every moment.
            </p>

            {/* Socials */}
            <div className="flex gap-4">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <div
                  key={i}
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-yellow-500/20 text-white/70 hover:text-yellow-500 hover:border-yellow-500 transition cursor-pointer"
                >
                  <Icon size={16} />
                </div>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-white text-lg font-semibold mb-5">Explore</h4>
            <div className="space-y-3 text-sm">
              {[
                { name: "Menu", href: "/menu" },
                { name: "Reserve", href: "/reservations" },
                { name: "About", href: "/about" },
                { name: "Contact", href: "/contact" },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block text-white/60 hover:text-yellow-500 transition"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Hours */}
          <div>
            <h4 className="text-white text-lg font-semibold mb-5">Hours</h4>
            <div className="space-y-3 text-sm text-white/60">
              <p>Mon–Fri: 7:00 AM – 12:00 AM</p>
              <p>Saturday: 8:00 AM – 1:00 AM</p>
              <p>Sunday: 8:00 AM – 11:00 PM</p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white text-lg font-semibold mb-5">Contact</h4>
            <div className="space-y-3 text-sm text-white/60">
              <p>42 Crescent Lane, Downtown</p>
              <p>hello@crescentcoffee.com</p>
              <p>(555) 234-5678</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-yellow-500/10 py-6 flex flex-col justify-center items-center gap-4 text-sm text-white/50">
          <p>
            © {new Date().getFullYear()} Lumè Bean & Bar. All rights reserved.
          </p>
          <p>
            Powered by Infinitech Advertising Corporation
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer