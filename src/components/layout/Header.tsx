'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { useTheme } from 'next-themes'
import {
  Heart,
  Menu,
  LogOut,
  User,
  Building2,
  CalendarDays,
  LayoutDashboard,
  Users,
  ClipboardList,
  Landmark,
  Star,
  Moon,
  Sun,
} from 'lucide-react'

function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 hover:bg-rose-50 dark:hover:bg-rose-900/20"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-rose-600" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-rose-400" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export default function Header() {
  const { user, token, logout, navigateTo, currentView } = useAppStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Sync API token with store token
  useEffect(() => {
    api.setToken(token)
  }, [token])

  const handleLogout = () => {
    logout()
    setMobileOpen(false)
  }

  const handleNavigate = (view: Parameters<typeof navigateTo>[0]) => {
    navigateTo(view)
    setMobileOpen(false)
  }

  const isActive = (view: string) => currentView === view

  const navLinkClass = (view: string) =>
    `text-sm font-medium transition-colors hover:text-rose-600 dark:hover:text-rose-400 ${
      isActive(view) ? 'text-rose-600 dark:text-rose-400' : 'text-rose-800/70 dark:text-rose-200/70'
    }`

  // Navigation items based on role
  const getNavItems = () => {
    if (!user || !token) {
      return [
        { label: 'Browse Halls', view: 'halls' as const, icon: Landmark },
        { label: 'Login', view: 'login' as const, icon: User },
        { label: 'Register', view: 'register' as const, icon: Heart },
      ]
    }

    switch (user.role) {
      case 'admin':
        return [
          { label: 'Dashboard', view: 'admin-dashboard' as const, icon: LayoutDashboard },
          { label: 'Halls', view: 'admin-halls' as const, icon: Building2 },
          { label: 'Owners', view: 'admin-owners' as const, icon: Users },
          { label: 'Bookings', view: 'admin-bookings' as const, icon: ClipboardList },
        ]
      case 'owner':
        return [
          { label: 'My Halls', view: 'owner-halls' as const, icon: Building2 },
          { label: 'My Bookings', view: 'owner-bookings' as const, icon: CalendarDays },
          { label: 'Browse Halls', view: 'halls' as const, icon: Landmark },
        ]
      case 'customer':
      default:
        return [
          { label: 'Browse Halls', view: 'halls' as const, icon: Landmark },
          { label: 'My Bookings', view: 'my-bookings' as const, icon: CalendarDays },
          { label: 'Favorites', view: 'favorites' as const, icon: Heart },
        ]
    }
  }

  const navItems = getNavItems()

  const roleBadgeColor = user?.role === 'admin'
    ? 'bg-amber-100 text-amber-800 hover:bg-amber-100'
    : user?.role === 'owner'
      ? 'bg-rose-100 text-rose-800 hover:bg-rose-100'
      : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'

  const userInitials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : ''

  return (
    <header className="sticky top-0 z-50 w-full border-b border-rose-100 dark:border-rose-900/30 bg-white/80 dark:bg-[oklch(0.17_0.015_15)]/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-[oklch(0.17_0.015_15)]/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <button
          onClick={() => handleNavigate(user ? (user.role === 'admin' ? 'admin-dashboard' : user.role === 'owner' ? 'owner-halls' : 'halls') : 'landing')}
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/30">
            <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold tracking-tight text-rose-900 dark:text-rose-100">
              Wedding Hall
            </h1>
            <p className="text-[10px] leading-tight text-rose-400 dark:text-rose-500 font-medium -mt-0.5 tracking-wider uppercase">
              Booking
            </p>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => handleNavigate(item.view)}
              className={navLinkClass(item.view)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu / Auth Buttons */}
        <div className="flex items-center gap-3">
          {user && token ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 gap-2 px-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full">
                  <Avatar className="h-8 w-8 border border-rose-200 dark:border-rose-800/30">
                    <AvatarFallback className="bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium text-rose-900 dark:text-rose-100 max-w-[120px] truncate">
                    {user.firstName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    <Badge variant="secondary" className={`w-fit mt-1 text-[10px] ${roleBadgeColor}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleNavigate(user.role === 'admin' ? 'admin-dashboard' : user.role === 'owner' ? 'owner-halls' : 'halls')}
                  className="cursor-pointer"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleNavigate('profile')}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleNavigate('my-bookings')}
                  className="cursor-pointer"
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  My Bookings
                </DropdownMenuItem>
                {user?.role === 'customer' && (
                  <DropdownMenuItem
                    onClick={() => handleNavigate('favorites')}
                    className="cursor-pointer"
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    Favorites
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => handleNavigate('login')}
                className="text-rose-700 dark:text-rose-300 hover:text-rose-800 dark:hover:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-900/20"
              >
                Sign In
              </Button>
              <Button
                onClick={() => handleNavigate('register')}
                className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600 text-white"
              >
                Get Started
              </Button>
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden hover:bg-rose-50 dark:hover:bg-rose-900/20"
              >
                <Menu className="h-5 w-5 text-rose-700 dark:text-rose-300" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[360px] bg-white dark:bg-[oklch(0.21_0.015_15)]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-rose-900 dark:text-rose-100">
                  <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
                  Wedding Hall Booking
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-1">
                {user && token && (
                  <div className="mb-4 px-3 py-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/20">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-rose-200 dark:border-rose-800/30">
                        <AvatarFallback className="bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-sm font-semibold">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-rose-900 dark:text-rose-100">
                          {user.firstName} {user.lastName}
                        </p>
                        <Badge variant="secondary" className={`mt-0.5 text-[10px] ${roleBadgeColor}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.view}
                      onClick={() => handleNavigate(item.view)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive(item.view)
                          ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'
                          : 'text-rose-800/70 dark:text-rose-200/70 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-700 dark:hover:text-rose-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  )
                })}
                {user && token ? (
                  <>
                    <div className="my-2 border-t border-rose-100 dark:border-rose-800/20" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <div className="my-2 border-t border-rose-100 dark:border-rose-800/20" />
                    <Button
                      onClick={() => handleNavigate('login')}
                      className="w-full bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600 text-white"
                    >
                      Sign In
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
