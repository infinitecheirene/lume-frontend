
import HeroSection from "@/components/sections/Hero"
import OfferSection from "@/components/sections/OfferSection"
import AboutPreview from "@/components/sections/HomePreview"
import CTASection from "@/components/sections/CTASection"
import FeaturedMenu from "@/components/sections/FeaturedMenu"
import BlogSection from "@/components/sections/blog-section"

export default function Home() {
  return (
    <>
      <HeroSection />
      <OfferSection />
      <FeaturedMenu />
      {/* <BlogSection />
      <AboutPreview /> */}
      <CTASection />
    </>
  )
}
