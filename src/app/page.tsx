'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import Layout from '@/components/layout/Layout'

// Auth
import LoginForm from '@/components/auth/LoginForm'
import RegisterForm from '@/components/auth/RegisterForm'
import OtpVerification from '@/components/auth/OtpVerification'

// Customer
import LandingPage from '@/components/customer/LandingPage'
import HallListPage from '@/components/customer/HallListPage'
import HallDetailPage from '@/components/customer/HallDetailPage'
import BookingPage from '@/components/customer/BookingPage'
import MyBookingsPage from '@/components/customer/MyBookingsPage'
import FavoritesPage from '@/components/customer/FavoritesPage'
import ProfilePage from '@/components/customer/ProfilePage'
import HallComparisonPage from '@/components/customer/HallComparisonPage'

// Owner
import OwnerHallsPage from '@/components/owner/OwnerHallsPage'
import OwnerHallFormPage from '@/components/owner/OwnerHallFormPage'
import OwnerBookingsPage from '@/components/owner/OwnerBookingsPage'

// Admin
import AdminDashboardPage from '@/components/admin/AdminDashboardPage'
import AdminHallsPage from '@/components/admin/AdminHallsPage'
import AdminOwnersPage from '@/components/admin/AdminOwnersPage'
import AdminBookingsPage from '@/components/admin/AdminBookingsPage'

export default function Home() {
  const { currentView, token } = useAppStore()

  // Sync API token with store
  useEffect(() => {
    api.setToken(token)
  }, [token])

  const renderView = () => {
    switch (currentView) {
      // Auth
      case 'login':
        return <LoginForm />
      case 'register':
        return <RegisterForm />
      case 'verify-otp':
        return <OtpVerification />

      // Customer
      case 'landing':
        return <LandingPage />
      case 'halls':
        return <HallListPage />
      case 'hall-detail':
        return <HallDetailPage />
      case 'booking':
        return <BookingPage />
      case 'my-bookings':
        return <MyBookingsPage />
      case 'favorites':
        return <FavoritesPage />
      case 'profile':
        return <ProfilePage />
      case 'compare':
        return <HallComparisonPage />

      // Owner
      case 'owner-halls':
        return <OwnerHallsPage />
      case 'owner-hall-form':
        return <OwnerHallFormPage />
      case 'owner-bookings':
        return <OwnerBookingsPage />

      // Admin
      case 'admin-dashboard':
        return <AdminDashboardPage />
      case 'admin-halls':
        return <AdminHallsPage />
      case 'admin-owners':
        return <AdminOwnersPage />
      case 'admin-bookings':
        return <AdminBookingsPage />

      default:
        return <LandingPage />
    }
  }

  return <Layout>{renderView()}</Layout>
}
