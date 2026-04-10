import type React from "react"
import type { Metadata } from "next"
import ClientLayout from "./ClientLayout"
import ServiceWorkerProvider from "@/components/ServiceWorkerProvider"
import "./globals.css"
export const metadata: Metadata = {
    metadataBase: new URL("https://lumebeanandbar.com"),

    title: {
        default: "Lumè Bean & Bar - Premium Coffee Shop & Cocktail Bar Philippines",
        template: "%s | Lumè Bean & Bar",
    },

    description:
        "Experience premium artisan coffee by day, craft cocktails by night at Lumè Bean & Bar. A sophisticated café and bar offering curated coffee, gourmet meals, and signature cocktails in a premium ambiance.",

    keywords: [
        // Location-specific keywords
        "coffee shop Philippines",
        "best coffee shop Philippines",
        "premium coffee shop",
        "coffee bar Philippines",
        "cafe near me Philippines",
        "cocktail bar Philippines",
        "craft cocktails Philippines",
        "artisan coffee Philippines",

        // Service-specific keywords
        "specialty coffee",
        "gourmet coffee",
        "single origin coffee",
        "coffee tasting",
        "barista coffee",
        "premium cocktails",
        "craft beer",
        "wine bar",
        "happy hour cocktails",

        // Menu keywords
        "gourmet breakfast",
        "brunch menu",
        "coffee and pastries",
        "craft coffee drinks",
        "signature cocktails",
        "wine selection",
        "beer menu",
        "healthy breakfast",
        "premium desserts",

        // Experience keywords
        "coffee shop ambiance",
        "premium dining experience",
        "coffee and cocktails",
        "date night venue",
        "business meeting venue",
        "cozy cafe",
        "elegant bar",
        "coffee culture",

        // Occasion keywords
        "morning coffee",
        "afternoon tea",
        "evening cocktails",
        "weekend brunch",
        "birthday celebration",
        "anniversary dinner",
        "corporate events",

        // Brand keywords
        "Lumè Bean & Bar",
        "Lume Bean and Bar",
        "Lumè Cafe",
        "Lumè Bar",
        "premium cafe Philippines",
    ],

    authors: [{ name: "Lumè Bean & Bar" }],
    creator: "Lumè Bean & Bar",
    publisher: "Lumè Bean & Bar",
    applicationName: "Lumè Bean & Bar",
    referrer: "origin-when-cross-origin",
    manifest: "/manifest.json",

    openGraph: {
        type: "website",
        locale: "en_PH",
        alternateLocale: ["en_US"],
        url: "https://lumebeanandbar.com",
        siteName: "Lumè Bean & Bar",
        title: "Lumè Bean & Bar - Premium Coffee Shop & Cocktail Bar Philippines",
        description:
            "Artisan coffee by day, craft cocktails by night. Experience premium café culture with gourmet meals and signature drinks at Lumè Bean & Bar.",
        images: [
            {
                url: "https://lumebeanandbar.com/og-image.jpg",
                width: 1200,
                height: 630,
                alt: "Lumè Bean & Bar - Premium Coffee Shop & Cocktail Bar",
                type: "image/jpeg",
            },
            {
                url: "https://lumebeanandbar.com/restaurant-exterior.jpg",
                width: 1200,
                height: 630,
                alt: "Lumè Bean & Bar Exterior",
                type: "image/jpeg",
            },
            {
                url: "https://lumebeanandbar.com/restaurant-interior.jpg",
                width: 1200,
                height: 630,
                alt: "Lumè Bean & Bar Interior Ambiance",
                type: "image/jpeg",
            },
            {
                url: "https://lumebeanandbar.com/coffee-menu.jpg",
                width: 1200,
                height: 630,
                alt: "Premium Coffee and Cocktails at Lumè Bean & Bar",
                type: "image/jpeg",
            },
        ],
        countryName: "Philippines",
    },

    twitter: {
        card: "summary_large_image",
        title: "Lumè Bean & Bar - Premium Coffee Shop & Cocktail Bar Philippines",
        description:
            "Experience premium artisan coffee by day, craft cocktails by night at Lumè Bean & Bar. Sophisticated café and bar with gourmet meals and signature drinks.",
        images: ["https://lumebeanandbar.com/og-image.jpg"],
        creator: "@lumebeanandbar",
        site: "@lumebeanandbar",
    },

    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Lumè Bean & Bar",
        startupImage: [
            {
                url: "/apple-touch-icon.png",
                media: "(device-width: 768px) and (device-height: 1024px)",
            },
        ],
    },

    icons: {
        icon: [
            { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
            { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
        ],
        apple: [
            { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        ],
    },

    category: "cafe",
    classification: "Coffee Shop and Bar",

    robots: {
        index: true,
        follow: true,
        nocache: false,
        noarchive: false,
        noimageindex: false,
        nosnippet: false,
        googleBot: {
            index: true,
            follow: true,
            noimageindex: false,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },

    alternates: {
        canonical: "https://lumebeanandbar.com",
        languages: {
            "en-PH": "https://lumebeanandbar.com",
            "en-US": "https://lumebeanandbar.com/en",
        },
    },

    verification: {
        google: "your-google-search-console-verification-code",
        other: {
            "facebook-domain-verification": "your-facebook-domain-verification",
        },
    },

    other: {
        "mobile-web-app-capable": "yes",
        "apple-mobile-web-app-capable": "yes",
        "apple-mobile-web-app-status-bar-style": "default",
        "apple-mobile-web-app-title": "Lumè Bean & Bar",
        "application-name": "Lumè Bean & Bar",
        "msapplication-TileColor": "#d4a24c",
        "msapplication-config": "/browserconfig.xml",
    },
}
export const viewport = {
    themeColor: "#0b1d26",
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: "cover",
}
export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Business Schema - Enhanced for Coffee Shop & Bar
    const businessSchema = {
        "@context": "https://schema.org",
        "@type": "CafeOrCoffeeShop",
        "@id": "https://lumebeanandbar.com/#cafe",
        "name": "Lumè Bean & Bar",
        "image": [
            "https://lumebeanandbar.com/restaurant-exterior.jpg",
            "https://lumebeanandbar.com/restaurant-interior.jpg",
            "https://lumebeanandbar.com/coffee-menu.jpg"
        ],
        "description": "Premium coffee shop and cocktail bar offering artisan coffee by day and craft cocktails by night. A sophisticated café experience with gourmet meals, specialty coffee drinks, and signature cocktails in an elegant ambiance.",
        "servesCuisine": ["Coffee", "Cafe", "Cocktails", "Gourmet Meals", "Desserts"],
        "priceRange": "₱₱-₱₱₱",
        "currenciesAccepted": "PHP",
        "paymentAccepted": "Cash, Credit Card, Debit Card, GCash, Maya",

        "telephone": "+63-XX-XXX-XXXX", // Replace with actual phone
        "email": "reservations@lumebeanandbar.com",
        "url": "https://lumebeanandbar.com",

        "menu": "https://lumebeanandbar.com/menu",
        "acceptsReservations": true,
        "hasMenu": "https://lumebeanandbar.com/menu",

        "openingHoursSpecification": [
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "opens": "07:00",
                "closes": "23:00"
            },
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Saturday", "Sunday"],
                "opens": "08:00",
                "closes": "24:00"
            }
        ],

        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Your Street Address", // Replace with actual address
            "addressLocality": "Your City",
            "addressRegion": "Your Province",
            "postalCode": "XXXX",
            "addressCountry": "PH"
        },

        "geo": {
            "@type": "GeoCoordinates",
            "latitude": "XX.XXXX", // Replace with actual coordinates
            "longitude": "XXX.XXXX"
        },

        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "156",
            "bestRating": "5",
            "worstRating": "1"
        },

        "amenityFeature": [
            {
                "@type": "LocationFeatureSpecification",
                "name": "Free Wi-Fi",
                "value": true
            },
            {
                "@type": "LocationFeatureSpecification",
                "name": "Family Friendly",
                "value": true
            },
            {
                "@type": "LocationFeatureSpecification",
                "name": "Dine-in",
                "value": true
            },
            {
                "@type": "LocationFeatureSpecification",
                "name": "Takeout",
                "value": true
            },
            {
                "@type": "LocationFeatureSpecification",
                "name": "Wheelchair Accessible",
                "value": true
            },
            {
                "@type": "LocationFeatureSpecification",
                "name": "Pet Friendly Outdoor Seating",
                "value": true
            }
        ],

        "potentialAction": {
            "@type": "ReserveAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://lumebeanandbar.com/reservations",
                "actionPlatform": [
                    "http://schema.org/DesktopWebPlatform",
                    "http://schema.org/MobileWebPlatform"
                ]
            },
            "result": {
                "@type": "Reservation",
                "name": "Table Reservation"
            }
        }
    }

    // Organization Schema
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": "https://lumebeanandbar.com/#organization",
        "name": "Lumè Bean & Bar",
        "url": "https://lumebeanandbar.com",
        "logo": "https://lumebeanandbar.com/logo.jpg",
        "image": "https://lumebeanandbar.com/og-image.jpg",
        "description": "Premium coffee shop and cocktail bar offering artisan coffee and craft cocktails",
        "email": "info@lumebeanandbar.com",
        "telephone": "+63-XX-XXX-XXXX",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Your Street Address",
            "addressLocality": "Your City",
            "addressRegion": "Your Province",
            "postalCode": "XXXX",
            "addressCountry": "PH"
        },
        "sameAs": [
            "https://www.facebook.com/lumebeanandbar",
            "https://www.instagram.com/lumebeanandbar",
            "https://twitter.com/lumebeanandbar"
        ],
        "foundingDate": "2024",
        "numberOfEmployees": {
            "@type": "QuantitativeValue",
            "value": "10-25"
        }
    }

    // WebSite Schema
    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": "https://lumebeanandbar.com/#website",
        "url": "https://lumebeanandbar.com",
        "name": "Lumè Bean & Bar - Premium Coffee Shop & Cocktail Bar Philippines",
        "description": "Experience premium artisan coffee by day, craft cocktails by night at Lumè Bean & Bar",
        "publisher": {
            "@id": "https://lumebeanandbar.com/#organization"
        },
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://lumebeanandbar.com/search?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
        },
        "inLanguage": "en-PH"
    }

    // Breadcrumb Schema
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://lumebeanandbar.com"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Menu",
                "item": "https://lumebeanandbar.com/menu"
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": "Reservations",
                "item": "https://lumebeanandbar.com/reservations"
            }
        ]
    }

    // FAQ Schema
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "What makes Lumè Bean & Bar special?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Lumè Bean & Bar offers a unique experience of premium artisan coffee by day and craft cocktails by night. We feature specialty coffee drinks, gourmet meals, and signature cocktails in a sophisticated ambiance perfect for any occasion."
                }
            },
            {
                "@type": "Question",
                "name": "Does Lumè Bean & Bar accept reservations?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, we accept reservations for both dining and special events. You can book through our website or call us directly to secure your table."
                }
            },
            {
                "@type": "Question",
                "name": "What are your operating hours?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "We're open Monday to Friday from 7:00 AM to 11:00 PM, and Saturday to Sunday from 8:00 AM to 12:00 AM (midnight)."
                }
            },
            {
                "@type": "Question",
                "name": "Do you serve food at Lumè Bean & Bar?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, we offer a curated menu of gourmet breakfast items, brunch options, light meals, premium desserts, and small plates that perfectly complement our coffee and cocktails."
                }
            },
            {
                "@type": "Question",
                "name": "What payment methods do you accept?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "We accept cash, major credit cards, debit cards, GCash, and Maya for convenient digital payments."
                }
            },
            {
                "@type": "Question",
                "name": "Is Lumè Bean & Bar family-friendly?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Absolutely! We're family-friendly with a welcoming atmosphere suitable for families, couples, and business gatherings. We also offer outdoor seating for those with pets."
                }
            }
        ]
    }

    // Menu Schema
    const menuSchema = {
        "@context": "https://schema.org",
        "@type": "Menu",
        "@id": "https://lumebeanandbar.com/#menu",
        "name": "Lumè Bean & Bar Menu",
        "description": "Premium coffee, gourmet meals, and craft cocktails menu",
        "hasMenuSection": [
            {
                "@type": "MenuSection",
                "name": "Specialty Coffee",
                "description": "Artisan coffee drinks made by expert baristas",
                "image": "https://lumebeanandbar.com/coffee-menu.jpg"
            },
            {
                "@type": "MenuSection",
                "name": "Gourmet Breakfast & Brunch",
                "description": "Premium breakfast and brunch options",
                "image": "https://lumebeanandbar.com/breakfast-menu.jpg"
            },
            {
                "@type": "MenuSection",
                "name": "Signature Cocktails",
                "description": "Craft cocktails and premium beverages",
                "image": "https://lumebeanandbar.com/cocktails-menu.jpg"
            },
            {
                "@type": "MenuSection",
                "name": "Light Meals & Desserts",
                "description": "Gourmet small plates and premium desserts",
                "image": "https://lumebeanandbar.com/desserts-menu.jpg"
            },
            {
                "@type": "MenuSection",
                "name": "Non-Alcoholic Beverages",
                "description": "Specialty drinks, teas, and mocktails",
                "image": "https://lumebeanandbar.com/beverages-menu.jpg"
            }
        ],
        "inLanguage": "en-PH"
    }

    return (
        <html lang="en-PH">
            <head>
                {/* Primary Structured Data - Business */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
                />

                {/* Organization Schema */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
                />

                {/* Website Schema */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
                />

                {/* Breadcrumb Schema */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
                />

                {/* FAQ Schema */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
                />

                {/* Menu Schema */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(menuSchema) }}
                />

                {/* Open Graph Image Tags */}
                <meta property="og:image" content="https://lumebeanandbar.com/og-image.jpg" />
                <meta property="og:image:secure_url" content="https://lumebeanandbar.com/og-image.jpg" />
                <meta property="og:image:type" content="image/jpeg" />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:image:alt" content="Lumè Bean & Bar - Premium Coffee Shop & Cocktail Bar" />

                {/* Twitter Card Image */}
                <meta name="twitter:image" content="https://lumebeanandbar.com/og-image.jpg" />
                <meta name="twitter:image:alt" content="Lumè Bean & Bar" />

                {/* Preconnect to external domains for performance */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link rel="dns-prefetch" href="https://www.google-analytics.com" />
                <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

                {/* Preload critical assets */}
                <link rel="preload" as="image" href="/logo.jpg" />

                {/* Geographic meta tags */}
                <meta name="geo.region" content="PH" />
                <meta name="geo.placename" content="Philippines" />
                <meta name="geo.position" content="XX.XXXX;XXX.XXXX" />
                <meta name="ICBM" content="XX.XXXX, XXX.XXXX" />

                {/* Additional meta tags */}
                <meta name="format-detection" content="telephone=yes" />
                <meta name="language" content="English" />
                <meta name="revisit-after" content="7 days" />
                <meta name="distribution" content="global" />
                <meta name="rating" content="general" />
                <meta name="target" content="all" />
                <meta name="HandheldFriendly" content="True" />
                <meta name="MobileOptimized" content="320" />

                {/* Canonical URL */}
                <link rel="canonical" href="https://lumebeanandbar.com" />

                {/* Sitemap */}
                <link rel="sitemap" type="application/xml" href="https://lumebeanandbar.com/sitemap.xml" />

                {/* Alternative languages */}
                <link rel="alternate" hrefLang="en-ph" href="https://lumebeanandbar.com" />
                <link rel="alternate" hrefLang="en" href="https://lumebeanandbar.com/en" />
                <link rel="alternate" hrefLang="x-default" href="https://lumebeanandbar.com" />
            </head>

            <body className="bg-[#0b1d26] text-white font-sans antialiased">
                <ServiceWorkerProvider />
                <ClientLayout>{children}</ClientLayout>
            </body>
        </html>
    )
}

