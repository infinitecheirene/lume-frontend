import Link from "next/link"
import { WifiOff, Home } from "lucide-react"

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0b1d26] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <WifiOff className="w-24 h-24 text-[#d4a24c] mx-auto mb-4" />
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            You're Offline
          </h1>
          <p className="text-white/70 text-lg max-w-md mx-auto">
            It looks like you've lost your internet connection. Don't worry, you can still browse some pages when you're back online.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#d4a24c] text-black px-6 py-3 rounded-full font-semibold hover:brightness-110 transition"
          >
            <Home size={20} />
            Go Home
          </Link>

          <p className="text-white/50 text-sm">
            Try refreshing the page when you're back online
          </p>
        </div>
      </div>
    </div>
  )
}