import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"

/**
 * Hook to protect routes that require authentication
 * Redirects to login if user is not logged in
 */
export function useProtectedRoute() {
  const router = useRouter()
  const { isLoggedIn } = useAuthStore()

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login")
    }
  }, [isLoggedIn, router])

  return { isLoggedIn }
}

/**
 * Hook to protect admin routes that require admin role
 * Redirects to home if user is not admin
 */
export function useAdminRoute() {
  const router = useRouter()
  const { isLoggedIn, user } = useAuthStore()
  const isAdmin = user?.role === "admin"

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login")
    } else if (!isAdmin) {
      router.replace("/")
    }
  }, [isLoggedIn, isAdmin, router])

  return { isLoggedIn, isAdmin }
}
