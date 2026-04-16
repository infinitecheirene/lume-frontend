"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Playfair_Display } from "next/font/google"

const playfair = Playfair_Display({
    subsets: ["latin"],
    weight: ["400", "600", "700"],
})

const highlights = [
    {
        title: "Artisan Coffee",
        desc: "Single-origin beans roasted in-house, brewed to perfection.",
        link: "/menu",
        cta: "See Menu",
    },
    {
        title: "Reserve Your Spot",
        desc: "Secure a table for your next morning ritual or evening rendezvous.",
        link: "/reservations",
        cta: "Book Now",
    },
]

export default function HeroSection() {
    return (
        <section className="py-24 bg-[#0b1d26]">
            <div className="container mx-auto px-4">

                {/* Heading */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <p className="tracking-[0.3em] uppercase text-sm mb-3 text-[#d4a24c]">
                        What We Offer
                    </p>

                    <h2 className={`${playfair.className} text-4xl md:text-5xl font-bold`}>
                        The Lumè Bean and Bar <span className="text-[#d4a24c] italic">Experience</span>
                    </h2>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                    {highlights.map((item, i) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.15, duration: 0.5 }}
                            viewport={{ once: true }}
                            className="bg-white/5 backdrop-blur rounded-2xl p-8 border border-yellow-500/20 text-center flex flex-col hover:shadow-lg hover:shadow-yellow-500/10 transition"
                        >
                            <h3 className={`${playfair.className} text-white text-2xl font-semibold mb-3`}>
                                {item.title}
                            </h3>

                            <p className="text-white/60 text-sm leading-relaxed mb-6 flex-1">
                                {item.desc}
                            </p>

                            <Link
                                href={item.link}
                                className="inline-block rounded-full border border-[#d4a24c] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#d4a24c] hover:text-black"
                            >
                                {item.cta}
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}