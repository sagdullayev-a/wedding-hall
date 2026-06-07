'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import Layout from '@/components/layout/Layout';

// Auth
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import OtpVerification from '@/components/auth/OtpVerification';

// Customer
import LandingPage from '@/components/customer/LandingPage';
import HallListPage from '@/components/customer/HallListPage';
import HallDetailPage from '@/components/customer/HallDetailPage';
import BookingPage from '@/components/customer/BookingPage';
import MyBookingsPage from '@/components/customer/MyBookingsPage';
import FavoritesPage from '@/components/customer/FavoritesPage';
import ProfilePage from '@/components/customer/ProfilePage';
import HallComparisonPage from '@/components/customer/HallComparisonPage';

// Owner
import OwnerHallsPage from '@/components/owner/OwnerHallsPage';
import OwnerHallFormPage from '@/components/owner/OwnerHallFormPage';
import OwnerBookingsPage from '@/components/owner/OwnerBookingsPage';

// Admin
import AdminDashboardPage from '@/components/admin/AdminDashboardPage';
import AdminHallsPage from '@/components/admin/AdminHallsPage';
import AdminOwnersPage from '@/components/admin/AdminOwnersPage';
import AdminBookingsPage from '@/components/admin/AdminBookingsPage';

const viewRoleMap: Record<string, string[]> = {
  landing: ['admin', 'owner', 'customer', 'guest'],
  login: ['admin', 'owner', 'customer', 'guest'],
  register: ['admin', 'owner', 'customer', 'guest'],
  'verify-otp': ['admin', 'owner', 'customer', 'guest'],
  halls: ['admin', 'owner', 'customer', 'guest'],
  'hall-detail': ['admin', 'owner', 'customer', 'guest'],
  compare: ['admin', 'owner', 'customer', 'guest'],

  booking: ['customer'],
  'my-bookings': ['customer'],
  favorites: ['customer'],
  profile: ['admin', 'owner', 'customer'],

  'owner-halls': ['owner'],
  'owner-hall-form': ['owner'],
  'owner-bookings': ['owner'],

  'admin-dashboard': ['admin'],
  'admin-halls': ['admin'],
  'admin-owners': ['admin'],
  'admin-bookings': ['admin'],
};

/** Map a URL pathname to the best view for a given role */
function resolveInitialView(pathname: string, role: string): string {
  const primary = pathname.replace(/^\//, '').split('/')[0] || '';
  const resolvedView = primary === '' ? 'landing' : primary;

  // Unknown view → fall back
  if (!(resolvedView in viewRoleMap)) {
    return getDefaultView(role);
  }

  const allowed = viewRoleMap[resolvedView];
  if (allowed.includes(role)) {
    return resolvedView;
  }

  return getDefaultView(role);
}

function getDefaultView(role: string): string {
  if (role === 'admin') return 'admin-dashboard';
  if (role === 'owner') return 'owner-halls';
  return 'landing';
}

export default function CatchAllPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentView, navigateTo, setAuth, logout } = useAppStore();
  const [isReady, setIsReady] = useState(false);
  const bootDone = useRef(false);

  // ── Step 1: Boot — verify token & resolve initial view (runs ONCE) ──
  useEffect(() => {
    if (bootDone.current) return;
    bootDone.current = true;

    // Try to find a stored token
    let storedToken = localStorage.getItem('authToken');
    if (!storedToken) {
      try {
        const persisted = JSON.parse(localStorage.getItem('wedding-hall-store') || '{}');
        storedToken = persisted?.state?.token || null;
      } catch {
        storedToken = null;
      }
    }

    if (storedToken) {
      api.setToken(storedToken);
      api.getMe()
        .then(res => {
          localStorage.setItem('authToken', storedToken!);
          setAuth(storedToken!, res.user);
          const view = resolveInitialView(pathname, res.user.role);
          navigateTo(view as any);
          setIsReady(true);
        })
        .catch(() => {
          localStorage.removeItem('authToken');
          api.setToken(null);
          logout();
          const view = resolveInitialView(pathname, 'guest');
          navigateTo(view as any);
          setIsReady(true);
        });
    } else {
      const view = resolveInitialView(pathname, 'guest');
      navigateTo(view as any);
      setIsReady(true);
    }
  }, []);

  // ── Step 2: Keep URL in sync with currentView (one‑way: store → URL) ──
  useEffect(() => {
    if (!isReady) return;
    const target = currentView === 'landing' ? '/' : `/${currentView}`;
    if (pathname !== target) {
      router.replace(target);
    }
  }, [currentView, isReady]);

  // ── Render‑time guard ─────────────────────────────────────────────────
  const renderView = () => {
    const role = useAppStore.getState().user?.role || 'guest';
    const allowed = viewRoleMap[currentView] || [];

    if (!allowed.includes(role)) {
      return <LandingPage />;
    }

    switch (currentView) {
      case 'login':
        return <LoginForm />;
      case 'register':
        return <RegisterForm />;
      case 'verify-otp':
        return <OtpVerification />;

      case 'landing':
        return <LandingPage />;
      case 'halls':
        return <HallListPage />;
      case 'hall-detail':
        return <HallDetailPage />;
      case 'booking':
        return <BookingPage />;
      case 'my-bookings':
        return <MyBookingsPage />;
      case 'favorites':
        return <FavoritesPage />;
      case 'profile':
        return <ProfilePage />;
      case 'compare':
        return <HallComparisonPage />;

      case 'owner-halls':
        return <OwnerHallsPage />;
      case 'owner-hall-form':
        return <OwnerHallFormPage />;
      case 'owner-bookings':
        return <OwnerBookingsPage />;

      case 'admin-dashboard':
        return <AdminDashboardPage />;
      case 'admin-halls':
        return <AdminHallsPage />;
      case 'admin-owners':
        return <AdminOwnersPage />;
      case 'admin-bookings':
        return <AdminBookingsPage />;

      default:
        return <LandingPage />;
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-background dark:via-background dark:to-background flex items-center justify-center">
        <p className="text-gray-600 dark:text-muted-foreground">Yuklanmoqda…</p>
      </div>
    );
  }

  return <Layout>{renderView()}</Layout>;
}
