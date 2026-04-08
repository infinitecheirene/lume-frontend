"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import logo from "@/assets/logo.jpg"
import { CheckCircle, XCircle, Loader2, Coffee } from "lucide-react"
import Link from "next/link"
import { Playfair_Display } from "next/font/google"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link. No token provided.')
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage(data.message || 'Email verified successfully!')
        } else {
          setStatus('error')
          setMessage(data.message || 'Email verification failed.')
        }
      } catch {
        setStatus('error')
        setMessage('An error occurred during verification. Please try again.')
      }
    }

    verifyEmail()
  }, [token, router])

  return (
    <div className="min-h-screen py-26 flex items-center justify-center p-4 bg-[#0b1d26]">
      <Card className="w-full max-w-md backdrop-blur-xl bg-[#162A3A] border border-[#E5A834] shadow-2xl rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="flex flex-col justify-center items-center p-3 border-b border-[#E5A834]/30">
          <div className="flex justify-center items-center gap-3">
            <Image src={logo} alt="Lume" width={60} height={40} className="rounded-full" />
            <h1 className={`${playfair.className} text-3xl font-semibold text-[#e5a834] tracking-wide`}>
              Lumè Bean & Bar
            </h1>
          </div>
          <span className="text-gray-400">Email Verification</span>
        </div>

        <CardContent className="py-8 text-center text-white">

          {status === 'loading' && (
            <div className="space-y-4">
              <Loader2 className="w-14 h-14 text-[#e5a834] animate-spin mx-auto" />
              <p className="text-sm text-white/80">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="w-14 h-14 text-green-400 mx-auto" />
              <h2 className="text-xl font-semibold text-green-400">Success!</h2>
              <p className="text-md text-white/80">{message}</p>
              <Link href="/login">
                <Button className="mt-4 bg-[#e5a834] text-black hover:bg-[#d49f2c] font-semibold rounded-lg px-6">
                  Go to Login
                </Button>
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div>
              <XCircle className="w-14 h-14 text-red-400 mx-auto" />
              <h2 className="text-xl font-semibold text-red-400">Verification Failed</h2>
              <p className="text-sm text-white/80">{message}</p>

              <div className="flex flex-col gap-2 mt-4">
                <Link href="/login">
                  <Button variant="outline" className="w-full border-white/30 bg-white/10 text-white hover:bg-white/60">
                    Go to Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="w-full bg-[#e5a834] text-black hover:bg-[#d49f2c]/60 font-semibold">
                    Register Again
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
          <Loader2 className="w-12 h-12 text-[#e5a834] animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
