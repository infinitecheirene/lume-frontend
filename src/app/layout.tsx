import type React from "react"
import type { Metadata } from "next"
import ClientLayout from "./ClientLayout"
import ServiceWorkerProvider from "@/components/ServiceWorkerProvider"
import "./globals.css"
export const metadata: Metadata = {
  metadataBase: new URL("https://lumebeanandbar.com"),
  title: {
    default: "Lumè Bean and Bar - Coffee · Kitchen · Bar",
    template: "%s | Lumè Bean and Bar",
  },
  description:
    "Artisan coffee by day, craft cocktails by night. Experience a premium café and bar at Lumè Bean and Bar.",
  keywords: [
    "coffee shop Philippines",
    "cafe near me",
    "coffee bar",
    "artisan coffee",
    "coffee and cocktails",
    "coffee shop with ambiance",
    "best cafe Philippines",
    "Lumè Bean and Bar",
  ],
  authors: [{ name: "Lumè Bean and Bar" }],
  creator: "Lumè Bean and Bar",
  publisher: "Lumè Bean and Bar",
  applicationName: "Lumè Bean and Bar",
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: "https://lumebeanandbar.com",
    siteName: "Lumè Bean and Bar",
    title: "Lumè Bean and Bar - Coffee · Kitchen · Bar",
    description:
      "Artisan coffee by day, craft cocktails by night. A curated café experience.",
    images: [
      {
        url: "https://lumebeanandbar.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Lumè Bean and Bar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lumè Bean and Bar",
    description: "Premium coffee and cocktail experience.",
    images: ["https://lumebeanandbar.com/og-image.jpg"],
  },
  category: "cafe",
  classification: "Coffee Shop and Bar",
}
export const viewport = {
  themeColor: "#0b1d26",
  width: "device-width",
  initialScale: 1,
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Updated Schema for Café / Bar
  const businessSchema = {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    name: "Lumè Bean and Bar",
    image: "https://lumebeanandbar.com/og-image.jpg",
    description:
      "A premium coffee shop and bar offering artisan coffee, curated meals, and craft cocktails.",
    servesCuisine: ["Coffee", "Cafe", "Desserts", "Cocktails"],
    priceRange: "₱₱",
    url: "https://lumebeanandbar.com",
    acceptsReservations: true,
  }
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Lumè Bean and Bar",
    url: "https://lumebeanandbar.com",
  }
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="bg-[#0b1d26] text-white font-sans antialiased">
        <ServiceWorkerProvider />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
