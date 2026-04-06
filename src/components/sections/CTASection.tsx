"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Playfair_Display } from "next/font/google"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

export default function CTASection() {
  return (
    <section className="py-24 bg-[#0b1d26]">
      <div className="container mx-auto px-4">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <p className="text-[#d4a24c] tracking-[0.3em] uppercase text-sm mb-3">
            Reserve a Table
          </p>

          <h2 className={`${playfair.className} text-white text-4xl md:text-5xl font-bold mb-6`}>
            Your Table{" "}
            <span className="text-[#d4a24c] italic">Awaits</span>
          </h2>

          <p className="text-white/60 text-lg leading-relaxed mb-10">
            Whether it &apos;s a quiet morning espresso or an evening of craft cocktails with friends,
            reserve your spot and let us take care of the rest.
          </p>

          <Link
            href="/reserve"
            className="inline-block rounded-full bg-[#d4a24c] px-10 py-4 font-semibold text-black hover:brightness-110 transition text-lg"
          >
            Book Your Table
          </Link>
        </motion.div>

      </div>
    </section>
  )
}