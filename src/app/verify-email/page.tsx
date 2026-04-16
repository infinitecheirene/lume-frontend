"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import logo from "@/assets/logo.jpg"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { Playfair_Display } from "next/font/google"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

function VerifyEmailContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  )
  const [message, setMessage] = useState("")
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("Invalid or missing verification link.")
      return
    }
    

    const verifyEmail = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await res.json()

        if (res.ok) {
          setStatus("success")
          setMessage(data.message || "Your email has been verified successfully.")
        } else {
          setStatus("error")
          setMessage(data.message || "Verification failed. Please try again.")
        }
      } catch {
        setStatus("error")
        setMessage("Something went wrong. Please try again later.")
      }
    }

    verifyEmail()
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1d26] relative overflow-hidden p-6">

      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#e5a834]/20 blur-[120px] rounded-full" />
      </div>

      <Card className="w-full max-w-md bg-[#162A3A]/90 backdrop-blur-2xl border border-[#e5a834]/30 shadow-2xl rounded-2xl overflow-hidden relative">

        {/* Header */}
        <div className="flex flex-col items-center gap-2 p-6 border-b border-[#e5a834]/20">
          <Image
            src={logo}
            alt="Lumè"
            width={64}
            height={64}
            className="rounded-full shadow-lg"
          />

          <h1
            className={`${playfair.className} text-2xl text-[#e5a834] font-semibold`}
          >
            Lumè Bean & Bar
          </h1>

          <p className="text-xs text-white/60 tracking-widest uppercase">
            Email Verification
          </p>
        </div>

        <CardContent className="p-8 text-center text-white">

          {/* LOADING */}
          {status === "loading" && (
            <div className="space-y-4">
              <div className="relative flex justify-center">
                <Loader2 className="w-12 h-12 text-[#e5a834] animate-spin" />
              </div>
              <p className="text-white/70 text-sm">
                Verifying your email address...
              </p>
            </div>
          )}

          {/* SUCCESS */}
          {status === "success" && (
            <div className="space-y-5">
              <div className="flex justify-center">
                <CheckCircle className="w-14 h-14 text-green-400" />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-green-400">
                  Verified Successfully
                </h2>
                <p className="text-sm text-white/70 mt-2">{message}</p>
              </div>

              <Link href="/login">
                <Button className="w-full bg-[#e5a834] text-black hover:bg-[#d49f2c] font-semibold rounded-xl">
                  Continue to Login
                </Button>
              </Link>
            </div>
          )}

          {/* ERROR */}
          {status === "error" && (
            <div className="space-y-5">
              <div className="flex justify-center">
                <XCircle className="w-14 h-14 text-red-400" />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-red-400">
                  Verification Failed
                </h2>
                <p className="text-sm text-white/70 mt-2">{message}</p>
              </div>

              <div className="space-y-3">
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                  >
                    Back to Login
                  </Button>
                </Link>

                <Link href="/register">
                  <Button className="w-full bg-[#e5a834] text-black hover:bg-[#d49f2c] font-semibold">
                    Create New Account
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0b1d26]">
          <Loader2 className="w-10 h-10 text-[#e5a834] animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}