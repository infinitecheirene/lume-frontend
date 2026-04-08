"use client"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Playfair_Display } from "next/font/google"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

export default function LumeLoaderMinimal() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  if (!loading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1d26]">
      {/* Background glow */}
      <div className="absolute w-80 h-80 bg-[#d4a24c]/10 rounded-full blur-3xl animate-pulse" />
      <div className="relative flex flex-col items-center">
        {/* ☕ Creative Coffee Cup */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-28 h-28 flex items-end justify-center">
            {/* Cup */}
            <div className="relative w-20 h-14 bg-[#d4a24c] rounded-b-3xl rounded-t-lg overflow-hidden shadow-xl">
              {/* Coffee liquid */}
              <div className="absolute bottom-0 w-full h-3/4 bg-[#3b2a1a]">
                {/* Wave animation */}
                <div className="absolute top-0 left-0 w-[200%] h-full animate-wave">
                  <div className="w-1/2 h-full bg-[#4b3621] opacity-80 rounded-full"></div>
                </div>
              </div>
              {/* Shine */}
              <div className="absolute top-2 left-2 w-3 h-3 bg-white/30 rounded-full blur-sm"></div>
            </div>
            {/* Handle */}
            <div className="absolute right-[2px] bottom-5 w-6 h-6 border-4 border-[#d4a24c] rounded-full"></div>
            {/* Steam */}
            {[...Array(3)].map((_, i) => (
              <span
                key={i}
                className="absolute top-0 w-1 h-10 bg-[#d4a24c]/70 rounded-full blur-sm animate-steam"
                style={{
                  left: `${40 + i * 10}%`,
                  animationDelay: `${i * 0.4}s`,
                }}
              />
            ))}
          </div>
        </div>
        {/* Brand */}
        <h1 className={`${playfair.className} text-4xl font-semibold text-white tracking-wide`}>
          Lumè
        </h1>
        <p className="text-[#d4a24c] text-lg  tracking-[0.4em] mt-1">
          BEAN AND BAR
        </p>
        {/* Loading text */}
        <p className="text-white/50 text-md mt-4 tracking-widest">
          Brewing your experience...
        </p>
      </div>
      {/* Animations */}
      <style>{`
        @keyframes wave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-wave {
          animation: wave 2.5s linear infinite;
        }
        @keyframes steam {
          0% {
            transform: translateY(10px) scaleX(1);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-30px) scaleX(1.5);
            opacity: 0;
          }
        }
        .animate-steam {
          animation: steam 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
