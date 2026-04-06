"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import heroImage from "@/assets/hero-coffee.jpg"
import { Button } from "@/components/ui/button"
import { Playfair_Display } from "next/font/google"
import { Great_Vibes } from "next/font/google"

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={heroImage}
          alt="Coffee shop interior"
          fill
          priority
          sizes="100vw"
          className="object-cover scale-105 brightness-[0.55]"
        />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0b1d26]/80 via-[#0b1d26]/50 to-transparent" />

      {/* Content */}
      <div className="relative z-20 container mx-auto text-center px-4">

        {/* Top label */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[#d4a24c] font-medium tracking-[0.35em] uppercase text-xs md:text-sm mb-6"
        >
          COFFEE · KITCHEN · BAR
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className={`${playfair.className} text-5xl md:text-6xl lg:text-8xl font-bold leading-tight mb-6 text-white`}
        >
          Where Every Cup
          <br />
          <span className="text-[#d4a24c] italic font-semibold">
            Tells a Story
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-white/70 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed"
        >
          Artisan coffee by day, craft cocktails by night. A curated experience
          for those who savor the finer things.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/menu">
            <Button className="rounded-full px-12 py-6 bg-[#d4a24c] hover:bg-[#c0903a] text-black font-semibold transition">
              Explore Menu
            </Button>
          </Link>

          <Link href="/reserve">
            <Button
              variant="outline"
              className="rounded-full px-12 py-6 border border-[#d4a24c]/60 text-white hover:bg-white/10 bg-transparent transition"
            >
              Reserve a Table
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <div className="w-5 h-8 rounded-full border-2 border-white/30 flex justify-center pt-1.5">
          <div className="w-1 h-2 rounded-full bg-[#d4a24c]" />
        </div>
      </motion.div>
    </section>
  )
}