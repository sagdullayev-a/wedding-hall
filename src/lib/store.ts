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

interface User {
  userId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  username: string
  role: 'admin' | 'owner' | 'customer'
  isVerified: boolean
}

interface AppState {
  // Auth
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
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
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null, currentView: 'landing' }),

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
    }),
    {
      name: 'wedding-hall-store',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
)
