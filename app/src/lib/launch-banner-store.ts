'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LaunchBannerStore {
  dismissed: boolean
  setDismissed: (dismissed: boolean) => void
}

export const useLaunchBannerStore = create<LaunchBannerStore>()(
  persist(
    set => ({
      dismissed: false,
      setDismissed: dismissed => set({ dismissed }),
    }),
    { name: 'tmfoodstuff-launch-banner' }
  )
)
