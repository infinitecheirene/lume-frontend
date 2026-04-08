"use client"

import { useState, useEffect } from "react"

import HeroSection from "@/components/sections/Hero"
import OfferSection from "@/components/sections/OfferSection"
import CTASection from "@/components/sections/CTASection"
import FeaturedMenu from "@/components/sections/FeaturedMenu"
import TestimonialsSection from "@/components/sections/testimonials"
import LumeLoaderMinimal from "@/components/oppa-loader"
import BlogPreview from "@/components/sections/BlogPreview"
import AnnouncementsSection from "@/components/sections/Announcements"

export default function Home() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 800) // adjust or remove if not needed

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <LumeLoaderMinimal />
    )
  }

  return (
    <div className="min-h-screen">

      <HeroSection />
      <OfferSection />
      <FeaturedMenu />
      <BlogPreview />
      <AnnouncementsSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  )
}
