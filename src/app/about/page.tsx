"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import heroImage from "@/assets/hero-coffee.jpg"
import { Playfair_Display } from "next/font/google"
import LumeLoaderMinimal from "@/components/oppa-loader"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

const values = [
  {
    title: "Sourced with Care",
    desc: "We partner with small-batch farms across Ethiopia, Colombia, and Guatemala to bring you beans that are ethically sourced and impeccably roasted.",
  },
  {
    title: "Crafted by Hand",
    desc: "Every cup is brewed with precision. From pour-over to espresso, our baristas are trained to bring out the best in every bean.",
  },
  {
    title: "A Space to Linger",
    desc: "Crescent isn't just a coffee shop — it's a retreat. A place to slow down, reconnect, and savor the moment.",
  },
]

const About = () => {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 800) // adjust or remove if not needed

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return <LumeLoaderMinimal />
  }

  return (
    <div className="min-h-screen bg-[#0f2a33] text-white">

      {/* Hero */}
      <section className="relative h-[55vh] flex items-center justify-center overflow-hidden">

        {/* Image */}
        <Image
          src={heroImage}
          alt="Coffee shop"
          fill
          priority
          className="object-cover scale-105"
        />

        {/* Overlay (dark + gradient fade bottom) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2a33]/70 via-[#0f2a33]/60 to-[#0f2a33]" />

        {/* Title */}
        <div className="relative z-10 text-center px-4">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center font-heading"
          >
            <p className=" text-[#d4a24c] tracking-[0.3em] uppercase text-sm mb-3">
              Lumè Bean & Bar
            </p>
            <h1 className={`${playfair.className} font-heading text-6xl font-bold`}>
              Our <span className=" text-[#d4a24c] italic">Story</span>
            </h1>
          </motion.h1>
        </div>
      </section>

      {/* Story */}
      <section className="py-28">
        <div className="max-w-3xl mx-auto text-center px-6">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {/* EST */}
            <p className="text-[#d4a24c] tracking-[0.35em] uppercase text-xs mb-6">
              EST. 2018
            </p>

            {/* Title */}
            <h2 className={`${playfair.className} font-heading text-4xl md:text-5xl font-semibold mb-8`}>
              Born from a Love of Coffee
            </h2>

            {/* Paragraph */}
            <p className="text-white/70 text-lg leading-relaxed mb-6">
              Crescent began with a simple belief: that a great cup of coffee can transform your entire day. What started as a tiny corner café has grown into a beloved neighborhood gathering place — where mornings smell of fresh roasts and evenings glow with warm conversation.
            </p>

            <p className="text-white/70 text-lg leading-relaxed">
              Our founder, inspired by the crescent moon&apos;s quiet beauty, envisioned a space that blends artisan coffee culture with the warmth of a neighborhood bar. Today, Crescent is where strangers become regulars, and regulars become family.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-[#0b1d26]">
        <div className="max-w-5xl mx-auto px-6">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <p className="text-[#d4a24c] tracking-[0.35em] uppercase text-xs mb-3">
              What Drives Us
            </p>

            <h2 className={`${playfair.className} font-heading text-4xl md:text-5xl font-bold`}>
              Our Values
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="bg-[#0c222b]/10 rounded-2xl p-8 border border-[#a47015]/60 text-center hover:border-[#d4a24c]/40 transition shadow-[0_0_20px_rgba(212,162,76,0.35)]"
              >
                <h3 className={`${playfair.className} font-heading text-2xl font-semibold mb-3`}>
                  {v.title}
                </h3>

                <p className="text-white/60 text-sm leading-relaxed">
                  {v.desc}
                </p>
              </motion.div>
            ))}
          </div>

        </div>
      </section>
    </div>
  )
}

export default About