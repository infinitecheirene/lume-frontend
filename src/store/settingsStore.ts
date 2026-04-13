import { create } from "zustand"

type SettingsState = {
  restaurantName: string
  email: string
  phone: string
  address: string

  deliveryFee: number
  maintenanceMode: boolean

  loaded: boolean
  loading: boolean

  fetchSettings: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  restaurantName: "",
  email: "",
  phone: "",
  address: "",

  deliveryFee: 0,
  maintenanceMode: false,

  loaded: false,
  loading: false,

  fetchSettings: async () => {
    const { loaded, loading } = get()

    // prevent duplicate calls
    if (loaded || loading) return

    set({ loading: true })

    try {
      const res = await fetch("/api/settings", {
        method: "GET",
        cache: "no-store",
      })

      const json = await res.json()

      if (json.success) {
        const data = json.data

        set({
          restaurantName: data.restaurant_name ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",

          deliveryFee: Number(data.delivery_fee ?? 0),
          maintenanceMode: Boolean(data.maintenance_mode ?? false),

          loaded: true,
        })
      }
    } catch (error) {
      console.error("Settings fetch failed:", error)
    } finally {
      set({ loading: false })
    }
  },
}))