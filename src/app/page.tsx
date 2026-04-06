
import HeroSection from "@/components/sections/Hero"
import OfferSection from "@/components/sections/OfferSection"
import CTASection from "@/components/sections/CTASection"
import FeaturedMenu from "@/components/sections/FeaturedMenu"
import TestimonialsSection from "@/components/sections/testimonials"

export default function Home() {
  return (
    <div className="min-h-screen">
      
      <HeroSection />
      <OfferSection />
      <FeaturedMenu />
      <TestimonialsSection />
      <CTASection />
    </div>
  )
}
