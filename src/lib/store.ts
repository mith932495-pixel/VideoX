import React from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  credits: number
  created_at: string
}

interface Video {
  id: string
  user_id: string
  original_url: string
  enhanced_url?: string
  thumbnail_url?: string
  resolution: string
  status: 'processing' | 'completed' | 'failed'
  progress?: number
  created_at: string
  duration: number
  file_size: number
  credits_used: number
  input_resolution?: string
  quality_preset?: string
}

interface AppState {
  // User state
  user: User | null
  setUser: (user: User | null) => void
  updateUserCredits: (credits: number) => void

  // Video state
  videos: Video[]
  setVideos: (videos: Video[]) => void
  addVideo: (video: Video) => void
  updateVideo: (id: string, updates: Partial<Video>) => void
  removeVideo: (id: string) => void

  // UI state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  theme: 'dark' | 'light'
  setTheme: (theme: 'dark' | 'light') => void

  // Notification state
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    duration?: number
    timestamp: number
  }>
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void

  // Enhancement state
  currentEnhancement: {
    file: File | null
    settings: {
      resolution: '1080p' | '4K' | '8K'
      qualityPreset: 'cinema' | 'animation' | 'documentary' | 'custom'
      aiEnhancement: boolean
      colorGrading: boolean
      noiseReduction: boolean
    }
    progress: number
    isProcessing: boolean
  }
  setCurrentEnhancementFile: (file: File | null) => void
  updateEnhancementSettings: (settings: Partial<AppState['currentEnhancement']['settings']>) => void
  setEnhancementProgress: (progress: number) => void
  setEnhancementProcessing: (isProcessing: boolean) => void
  resetEnhancement: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User state
      user: null,
      setUser: (user) => set({ user }),
      updateUserCredits: (credits) =>
        set((state) =>
          state.user
            ? { user: { ...state.user, credits } }
            : state
        ),

      // Video state
      videos: [],
      setVideos: (videos) => set({ videos }),
      addVideo: (video) =>
        set((state) => ({
          videos: [video, ...state.videos]
        })),
      updateVideo: (id, updates) =>
        set((state) => ({
          videos: state.videos.map((video) =>
            video.id === id ? { ...video, ...updates } : video
          )
        })),
      removeVideo: (id) =>
        set((state) => ({
          videos: state.videos.filter((video) => video.id !== id)
        })),

      // UI state
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      theme: 'dark',
      setTheme: (theme) => set({ theme }),

      // Notification state
      notifications: [],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: Date.now().toString(),
              timestamp: Date.now()
            },
            ...state.notifications
          ]
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id)
        })),
      clearNotifications: () => set({ notifications: [] }),

      // Enhancement state
      currentEnhancement: {
        file: null,
        settings: {
          resolution: '1080p',
          qualityPreset: 'cinema',
          aiEnhancement: true,
          colorGrading: true,
          noiseReduction: false
        },
        progress: 0,
        isProcessing: false
      },
      setCurrentEnhancementFile: (file) =>
        set((state) => ({
          currentEnhancement: { ...state.currentEnhancement, file }
        })),
      updateEnhancementSettings: (settings) =>
        set((state) => ({
          currentEnhancement: {
            ...state.currentEnhancement,
            settings: { ...state.currentEnhancement.settings, ...settings }
          }
        })),
      setEnhancementProgress: (progress) =>
        set((state) => ({
          currentEnhancement: { ...state.currentEnhancement, progress }
        })),
      setEnhancementProcessing: (isProcessing) =>
        set((state) => ({
          currentEnhancement: { ...state.currentEnhancement, isProcessing }
        })),
      resetEnhancement: () =>
        set({
          currentEnhancement: {
            file: null,
            settings: {
              resolution: '1080p',
              qualityPreset: 'cinema',
              aiEnhancement: true,
              colorGrading: true,
              noiseReduction: false
            },
            progress: 0,
            isProcessing: false
          }
        })
    }),
    {
      name: 'videox-storage',
      partialize: (state) => ({
        user: state.user,
        theme: state.theme,
        currentEnhancement: {
          settings: state.currentEnhancement.settings
        }
      })
    }
  )
)

// Selectors for commonly used state combinations
export const useUserState = () => useAppStore((state) => state.user)
export const useVideos = () => useAppStore((state) => state.videos)
export const useNotifications = () => useAppStore((state) => state.notifications)
export const useEnhancementState = () => useAppStore((state) => state.currentEnhancement)
export const useTheme = () => useAppStore((state) => state.theme)

// Derived state selectors
export const useCompletedVideos = () =>
  useAppStore((state) => state.videos.filter((v) => v.status === 'completed'))
export const useProcessingVideos = () =>
  useAppStore((state) => state.videos.filter((v) => v.status === 'processing'))
export const useFailedVideos = () =>
  useAppStore((state) => state.videos.filter((v) => v.status === 'failed'))

// Utility hooks
export const useCreditManager = () => {
  const user = useUserState()
  const updateUserCredits = useAppStore((state) => state.updateUserCredits)
  const addNotification = useAppStore((state) => state.addNotification)

  const hasEnoughCredits = (required: number) => {
    return (user?.credits || 0) >= required
  }

  const deductCredits = (amount: number, reason: string) => {
    if (!user || !hasEnoughCredits(amount)) {
      addNotification({
        type: 'error',
        title: 'Insufficient Credits',
        message: `You need ${amount} credits for this enhancement.`
      })
      return false
    }

    updateUserCredits(user.credits - amount)
    addNotification({
      type: 'info',
      title: 'Credits Deducted',
      message: `${amount} credits used for ${reason}`
    })
    return true
  }

  return { hasEnoughCredits, deductCredits }
}

export const useNotificationManager = () => {
  const notifications = useNotifications()
  const addNotification = useAppStore((state) => state.addNotification)
  const removeNotification = useAppStore((state) => state.removeNotification)
  const clearNotifications = useAppStore((state) => state.clearNotifications)

  // Auto-remove notifications after duration
  React.useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now()
      notifications.forEach((notification) => {
        const duration = notification.duration || 5000
        if (now - notification.timestamp > duration) {
          removeNotification(notification.id)
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [notifications, removeNotification])

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    success: (title: string, message: string, duration?: number) =>
      addNotification({ type: 'success', title, message, duration }),
    error: (title: string, message: string, duration?: number) =>
      addNotification({ type: 'error', title, message, duration }),
    warning: (title: string, message: string, duration?: number) =>
      addNotification({ type: 'warning', title, message, duration }),
    info: (title: string, message: string, duration?: number) =>
      addNotification({ type: 'info', title, message, duration })
  }
}