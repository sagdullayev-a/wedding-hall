'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ViewType =
  | 'landing'
  | 'login'
  | 'register'
  | 'verify-otp'
  | 'halls'
  | 'hall-detail'
  | 'booking'
  | 'my-bookings'
  | 'owner-halls'
  | 'owner-hall-form'
  | 'owner-bookings'
  | 'admin-dashboard'
  | 'admin-halls'
  | 'admin-owners'
  | 'admin-bookings'
  | 'favorites'
  | 'profile'
  | 'compare'

interface User {
  userId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  username: string
  role: 'admin' | 'owner' | 'customer'
  isVerified: boolean
  avatarUrl?: string | null
}

interface AppState {
  // Language
  language: 'uz' | 'en' | 'ru'
  setLanguage: (lang: 'uz' | 'en' | 'ru') => void

  // Auth
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  updateUser: (fields: Partial<User>) => void
  logout: () => void

  // Navigation
  currentView: ViewType
  navigateTo: (view: ViewType) => void

  // Selected hall for detail/booking
  selectedHallId: string | null
  selectHall: (hallId: string) => void

  // Selected booking date
  selectedBookingDate: string | null
  setSelectedBookingDate: (date: string | null) => void

  // Owner hall edit
  editingHallId: string | null
  setEditingHallId: (hallId: string | null) => void

  // OTP user
  otpUserId: string | null
  setOtpUserId: (userId: string | null) => void

  // Hall comparison
  compareHallIds: string[]
  addToCompare: (hallId: string) => void
  removeFromCompare: (hallId: string) => void
  clearCompare: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Language
      language: 'uz',
      setLanguage: (lang) => set({ language: lang }),

      // Auth
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      updateUser: (fields) => set((state) => ({
        user: state.user ? { ...state.user, ...fields } : null
      })),
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
        }
        // Dynamic import not needed — api is a singleton module
        try {
          const { api } = require('@/lib/api');
          api.setToken(null);
        } catch {}
        set({ token: null, user: null, currentView: 'landing', compareHallIds: [] });
      },

      // Navigation
      currentView: 'landing',
      navigateTo: (view) => set({ currentView: view }),

      // Selected hall
      selectedHallId: null,
      selectHall: (hallId) => set({ selectedHallId: hallId }),

      // Selected booking date
      selectedBookingDate: null,
      setSelectedBookingDate: (date) => set({ selectedBookingDate: date }),

      // Owner hall edit
      editingHallId: null,
      setEditingHallId: (hallId) => set({ editingHallId: hallId }),

      // OTP user
      otpUserId: null,
      setOtpUserId: (userId) => set({ otpUserId: userId }),

      // Hall comparison
      compareHallIds: [],
      addToCompare: (hallId) => set((state) => {
        if (state.compareHallIds.includes(hallId) || state.compareHallIds.length >= 3) return state
        return { compareHallIds: [...state.compareHallIds, hallId] }
      }),
      removeFromCompare: (hallId) => set((state) => ({
        compareHallIds: state.compareHallIds.filter(id => id !== hallId),
      })),
      clearCompare: () => set({ compareHallIds: [] }),
    }),
    {
      name: 'wedding-hall-store',
      partialize: (state) => ({
        language: state.language,
        token: state.token,
        user: state.user,
        compareHallIds: state.compareHallIds,
      }),
    }
  )
)
