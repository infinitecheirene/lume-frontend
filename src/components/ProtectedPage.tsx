"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/store/authStore"

interface ProtectedPageProps {
  children: React.ReactNode
  requiredRole?: "admin" | "user"
  fallback?: React.ReactNode
}

/**
 * Component to wrap pages that require authentication
 * Shows a loading state while checking auth, then renders children or fallback
 */
export function ProtectedPage({ children, requiredRole, fallback }: ProtectedPageProps) {
  const [mounted, setMounted] = useState(false)
  const { isLoggedIn, user } = useAuthStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  // While checking auth status
  if (!mounted) {
    return fallback || <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  // Check if user is authenticated
  if (!isLoggedIn) {
    return fallback || <div className="min-h-screen flex items-center justify-center">Redirecting to login...</div>
  }

  // Check if user has required role
  if (requiredRole === "admin" && user?.role !== "admin") {
    return fallback || <div className="min-h-screen flex items-center justify-center">Access denied.</div>
  }

  return <>{children}</>
}
