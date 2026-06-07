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
  Moon,
  Sun,
  GitCompareArrows,
  Globe,
} from 'lucide-react'
import NotificationBell from '@/components/notifications/NotificationBell'
import { useTranslation } from '@/lib/translations'
import WeddingHallLogo from './WeddingHallLogo'

function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 hover:bg-[#eef1f8] dark:hover:bg-white/10"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-[#3d5fa0]" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-[#8b9abf]" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

function LanguageSelector() {
  const { language, setLanguage } = useAppStore()
  const languages = { uz: "O'zbek", en: 'English', ru: 'Русский' }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-2.5 text-[#3d5fa0] dark:text-[#8b9abf] hover:bg-[#eef1f8] dark:hover:bg-white/10">
          <Globe className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase">{language}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuLabel className="text-xs">Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(languages).map(([code, name]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLanguage(code as 'uz' | 'en' | 'ru')}
            className={`cursor-pointer text-xs font-medium ${language === code ? 'text-[#3d5fa0] font-bold' : ''}`}
          >
            {name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function Header() {
  const { user, token, logout, navigateTo, currentView, compareHallIds } = useAppStore()
  const { t } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { api.setToken(token) }, [token])

  const handleLogout = () => { logout(); setMobileOpen(false) }
  const handleNavigate = (view: Parameters<typeof navigateTo>[0]) => { navigateTo(view); setMobileOpen(false) }
  const isActive = (view: string) => currentView === view

  const navLinkClass = (view: string) =>
    `text-sm font-medium transition-colors hover:text-[#3d5fa0] dark:hover:text-[#8b9abf] ${
      isActive(view)
        ? 'text-[#3d5fa0] dark:text-[#8b9abf]'
        : 'text-[#5a7090] dark:text-[#8b9abf]/70'
    }`

  const getNavItems = () => {
    if (!user || !token) return [{ label: t('halls'), view: 'halls' as const, icon: Landmark }]
    switch (user.role) {
      case 'admin': return [
        { label: t('dashboard'), view: 'admin-dashboard' as const, icon: LayoutDashboard },
        { label: t('halls'), view: 'admin-halls' as const, icon: Building2 },
        { label: 'Owners', view: 'admin-owners' as const, icon: Users },
        { label: 'Bookings', view: 'admin-bookings' as const, icon: ClipboardList },
      ]
      case 'owner': return [
        { label: t('myHallsTitle'), view: 'owner-halls' as const, icon: Building2 },
        { label: t('myBookings'), view: 'owner-bookings' as const, icon: CalendarDays },
        { label: t('halls'), view: 'halls' as const, icon: Landmark },
      ]
      default: return [
        { label: t('halls'), view: 'halls' as const, icon: Landmark },
        { label: t('myBookings'), view: 'my-bookings' as const, icon: CalendarDays },
        { label: t('favorites'), view: 'favorites' as const, icon: Heart },
      ]
    }
  }

  const navItems = getNavItems()

  const roleBadgeColor = user?.role === 'admin'
    ? 'bg-[#f0e6d3] text-[#a07830] hover:bg-[#f0e6d3]'
    : user?.role === 'owner'
      ? 'bg-[#eef1f8] text-[#3d5fa0] hover:bg-[#eef1f8]'
      : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'

  const userInitials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : ''

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#d0d8e8] dark:border-white/10 bg-white/90 dark:bg-[#16274a]/90 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <button
          onClick={() => handleNavigate(user ? (user.role === 'admin' ? 'admin-dashboard' : user.role === 'owner' ? 'owner-halls' : 'halls') : 'landing')}
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <WeddingHallLogo size={22} />
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold tracking-tight text-[#1a2a4a] dark:text-[#e8edf5]">
              Wedding Hall
            </h1>
            <p className="text-[10px] leading-tight text-[#c8a96a] font-medium -mt-0.5 tracking-wider uppercase">
              Booking
            </p>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <button key={item.view} onClick={() => handleNavigate(item.view)} className={navLinkClass(item.view)}>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
        </div>

        <NotificationBell />

        {/* Compare Badge */}
        {compareHallIds.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateTo('compare')}
            className="relative border-[#d0d8e8] dark:border-[#243660] text-[#3d5fa0] dark:text-[#8b9abf] hover:bg-[#eef1f8] dark:hover:bg-[#243660]"
          >
            <GitCompareArrows className="w-4 h-4 mr-1.5" />
            {t('compare')}
            <Badge className="ml-1.5 bg-[#3d5fa0] text-white text-[10px] h-4 min-w-4 px-1">
              {compareHallIds.length}
            </Badge>
          </Button>
        )}

        {/* User Menu / Auth Buttons */}
        <div className="flex items-center gap-3">
          {user && token ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 gap-2 px-2 hover:bg-[#eef1f8] dark:hover:bg-[#243660] rounded-full">
                  <Avatar className="h-8 w-8 border border-[#d0d8e8] dark:border-[#243660] overflow-hidden bg-muted">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-[#eef1f8] dark:bg-[#243660] text-[#3d5fa0] dark:text-[#8b9abf] text-xs font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium text-[#1a2a4a] dark:text-[#e8edf5] max-w-[120px] truncate">
                    {user.firstName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.firstName} {user.lastName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    <Badge variant="secondary" className={`w-fit mt-1 text-[10px] ${roleBadgeColor}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNavigate(user.role === 'admin' ? 'admin-dashboard' : user.role === 'owner' ? 'owner-halls' : 'halls')} className="cursor-pointer">
                  <LayoutDashboard className="mr-2 h-4 w-4" />{t('dashboard')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigate('profile')} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />{t('profile')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigate('my-bookings')} className="cursor-pointer">
                  <CalendarDays className="mr-2 h-4 w-4" />{t('myBookings')}
                </DropdownMenuItem>
                {user?.role === 'customer' && (
                  <DropdownMenuItem onClick={() => handleNavigate('favorites')} className="cursor-pointer">
                    <Heart className="mr-2 h-4 w-4" />{t('favorites')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                  <LogOut className="mr-2 h-4 w-4" />{t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => handleNavigate('login')}
                className="text-[#3d5fa0] dark:text-[#8b9abf] hover:bg-[#eef1f8] dark:hover:bg-[#243660]"
              >
                {t('login')}
              </Button>
              <Button
                onClick={() => handleNavigate('register')}
                className="bg-[#3d5fa0] hover:bg-[#2d4a8a] text-white"
              >
                {t('register')}
              </Button>
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden hover:bg-[#eef1f8] dark:hover:bg-[#243660]">
                <Menu className="h-5 w-5 text-[#3d5fa0] dark:text-[#8b9abf]" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[360px] bg-white dark:bg-[#16274a]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-[#1a2a4a] dark:text-[#e8edf5]">
                  <Heart className="h-5 w-5 text-[#3d5fa0] fill-[#3d5fa0]" />
                  Wedding Hall Booking
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-1">
                {user && token && (
                  <div className="mb-4 px-3 py-3 rounded-lg bg-[#eef1f8] dark:bg-[#243660] border border-[#d0d8e8] dark:border-[#243660]">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-[#d0d8e8] dark:border-[#243660] overflow-hidden bg-muted">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <AvatarFallback className="bg-[#eef1f8] dark:bg-[#243660] text-[#3d5fa0] dark:text-[#8b9abf] text-sm font-semibold">
                            {userInitials}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-[#1a2a4a] dark:text-[#e8edf5]">
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
                          ? 'bg-[#eef1f8] dark:bg-[#243660] text-[#3d5fa0] dark:text-[#8b9abf]'
                          : 'text-[#5a7090] dark:text-[#8b9abf]/70 hover:bg-[#eef1f8] dark:hover:bg-[#243660] hover:text-[#3d5fa0] dark:hover:text-[#8b9abf]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  )
                })}
                {user && token ? (
                  <>
                    <div className="my-2 border-t border-[#d0d8e8] dark:border-[#243660]" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('logout')}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="my-2 border-t border-[#d0d8e8] dark:border-[#243660]" />
                    <Button
                      onClick={() => handleNavigate('login')}
                      className="w-full bg-[#3d5fa0] hover:bg-[#2d4a8a] text-white"
                    >
                      {t('login')}
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
