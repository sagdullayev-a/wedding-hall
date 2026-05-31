'use client'

import { useAppStore } from '@/lib/store'
import { Heart, Mail, Phone, MapPin } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export default function Footer() {
  const { navigateTo } = useAppStore()

  return (
    <footer className="mt-auto border-t border-rose-100 bg-rose-950 text-rose-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-800/50 border border-rose-700/50">
                <Heart className="h-4 w-4 text-rose-400 fill-rose-400" />
              </div>
              <span className="text-lg font-bold tracking-tight text-rose-50">
                Wedding Hall
              </span>
            </div>
            <p className="text-sm text-rose-300/70 leading-relaxed">
              Find and book the perfect wedding hall for your special day. We connect couples with beautiful venues across the region.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-rose-200">
              Quick Links
            </h3>
            <nav className="flex flex-col gap-2">
              <button
                onClick={() => navigateTo('halls')}
                className="text-sm text-rose-300/70 hover:text-rose-200 transition-colors text-left"
              >
                Browse Halls
              </button>
              <button
                onClick={() => navigateTo('register')}
                className="text-sm text-rose-300/70 hover:text-rose-200 transition-colors text-left"
              >
                List Your Hall
              </button>
              <button
                onClick={() => navigateTo('login')}
                className="text-sm text-rose-300/70 hover:text-rose-200 transition-colors text-left"
              >
                Sign In
              </button>
              <button
                onClick={() => navigateTo('register')}
                className="text-sm text-rose-300/70 hover:text-rose-200 transition-colors text-left"
              >
                Create Account
              </button>
            </nav>
          </div>

          {/* Services */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-rose-200">
              Services
            </h3>
            <nav className="flex flex-col gap-2">
              <span className="text-sm text-rose-300/70">Wedding Halls</span>
              <span className="text-sm text-rose-300/70">Singers & Entertainment</span>
              <span className="text-sm text-rose-300/70">Catering & Menus</span>
              <span className="text-sm text-rose-300/70">Luxury Car Rentals</span>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-rose-200">
              Contact Us
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
                <span className="text-sm text-rose-300/70">
                  123 Wedding Avenue, Suite 100<br />
                  Celebration City, WC 10001
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-rose-400 shrink-0" />
                <span className="text-sm text-rose-300/70">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-rose-400 shrink-0" />
                <span className="text-sm text-rose-300/70">info@weddinghall.com</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-rose-800/50" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-rose-400/60">
            &copy; {new Date().getFullYear()} Wedding Hall Booking. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-rose-400/60 hover:text-rose-300 cursor-pointer transition-colors">
              Privacy Policy
            </span>
            <span className="text-xs text-rose-400/60 hover:text-rose-300 cursor-pointer transition-colors">
              Terms of Service
            </span>
            <span className="text-xs text-rose-400/60 hover:text-rose-300 cursor-pointer transition-colors">
              Support
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
