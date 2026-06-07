'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Heart, Mail, Phone, MapPin, ArrowUp, Send, Clock, Instagram, Youtube } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import WeddingHallLogo from './WeddingHallLogo'

export default function Footer() {
  const { navigateTo } = useAppStore()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      toast.error('Iltimos, to\'g\'ri email manzilini kiriting')
      return
    }
    setSubscribed(true)
    toast.success('Obuna bo\'ldingiz! Yangiliklar emailga yuboriladi.')
    setEmail('')
    setTimeout(() => setSubscribed(false), 3000)
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto relative">
      {/* Animated luxury gold border at top */}
      <div className="h-[2px] bg-gradient-to-r from-amber-600 via-amber-300 to-amber-600 bg-[length:200%_100%] animate-[gradient_4s_ease-in-out_infinite]" />

      <div className="bg-[#0b1329] text-slate-100 dark:bg-[#070c1b]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Brand & Newsletter */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <WeddingHallLogo className="bg-[#111e38] dark:bg-[#0c1527] border-amber-500/30 h-10 w-10" iconClassName="text-amber-400" size={24} />
                <div>
                  <span className="text-lg font-bold tracking-tight text-amber-50 block leading-tight">
                    Wedding Hall
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-amber-400/80 font-semibold">Booking Platform</span>
                </div>
              </div>
              <p className="text-sm text-slate-300/80 leading-relaxed max-w-sm">
                O'zbekiston bo'ylab eng muhtasham to'yxonalarni topish va bron qilish uchun yagona ishonchli va eksklyuziv platforma.
              </p>

              {/* Newsletter */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Yangiliklarga obuna
                </p>
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      type="email"
                      placeholder="Email manzilingiz"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-9 bg-[#111e38] border-slate-800/85 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/30 text-sm"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={subscribed}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-semibold h-9 px-3"
                  >
                    <AnimatePresence mode="wait">
                      {subscribed ? (
                        <motion.span
                          key="check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          ✓
                        </motion.span>
                      ) : (
                        <motion.span key="send" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                          <Send className="w-4 h-4 text-slate-900" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </form>
              </div>

              {/* Social Media */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400/60 mr-1">Ijtimoiy tarmoqlar:</span>
                <a href="#" className="w-8 h-8 rounded-full bg-[#111e38] border border-slate-800/80 flex items-center justify-center hover:bg-slate-800 hover:border-slate-700 transition-colors">
                  <Instagram className="w-4 h-4 text-slate-300" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-[#111e38] border border-slate-800/80 flex items-center justify-center hover:bg-slate-800 hover:border-slate-700 transition-colors">
                  <svg className="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.67-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.36-.48 1-.73 3.92-1.71 6.53-2.84 7.84-3.38 3.73-1.55 4.5-1.82 5.01-1.83.11 0 .36.03.52.17.14.12.18.28.2.46-.01.06.01.24 0 .38z"/>
                  </svg>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-[#111e38] border border-slate-800/80 flex items-center justify-center hover:bg-slate-800 hover:border-slate-700 transition-colors">
                  <Youtube className="w-4 h-4 text-slate-300" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-[#111e38] border border-slate-800/80 flex items-center justify-center hover:bg-slate-800 hover:border-slate-700 transition-colors">
                  <svg className="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400">
                Tezkor Havolalar
              </h3>
              <nav className="flex flex-col gap-2.5">
                <button
                  onClick={() => navigateTo('halls')}
                  className="text-sm text-slate-300/70 hover:text-amber-400 transition-colors text-left flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                  To'yxonalarni Ko'rish
                </button>
                <button
                  onClick={() => navigateTo('register')}
                  className="text-sm text-slate-300/70 hover:text-amber-400 transition-colors text-left flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                  To'yxona Ro'yxatdan O'tkazish
                </button>
                <button
                  onClick={() => navigateTo('login')}
                  className="text-sm text-slate-300/70 hover:text-amber-400 transition-colors text-left flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                  Tizimga Kirish
                </button>
                <button
                  onClick={() => navigateTo('register')}
                  className="text-sm text-slate-300/70 hover:text-amber-400 transition-colors text-left flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                  Hisob Yaratish
                </button>
              </nav>
            </div>

            {/* Xizmatlar & Popular */}
            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400">
                  Xizmatlar
                </h3>
                <nav className="flex flex-col gap-2.5">
                  <span className="text-sm text-slate-300/70 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                    To'yxonalar
                  </span>
                  <span className="text-sm text-slate-300/70 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                    Xonandalar
                  </span>
                  <span className="text-sm text-slate-300/70 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                    Oshxona va Menyu
                  </span>
                  <span className="text-sm text-slate-300/70 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                    Hashamatli Avtoulovlar
                  </span>
                  <span className="text-sm text-slate-300/70 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                    Karnay-Surnay
                  </span>
                </nav>
              </div>
            </div>

            {/* Aloqa */}
            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400">
                  Aloqa
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-slate-300/70">
                      Toshkent shahri,<br />Amir Temur ko'chasi, 107A
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="text-sm text-slate-300/70">+998 90 123 45 67</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="text-sm text-slate-300/70">info@weddinghall.uz</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="text-sm text-slate-300/70">Dush-Shan: 9:00 - 18:00</span>
                  </div>
                </div>
              </div>

              {/* To'lov usullari */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-500/60">
                  To'lov usullari
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#111e38] border border-slate-800 text-slate-300/70 font-medium">VISA</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#111e38] border border-slate-800 text-slate-300/70 font-medium">Mastercard</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#111e38] border border-slate-800 text-slate-300/70 font-medium">UZCARD</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#111e38] border border-slate-800 text-slate-300/70 font-medium">HUMO</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#111e38] border border-slate-800 text-slate-300/70 font-medium">Payme</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#111e38] border border-slate-800 text-slate-300/70 font-medium">Click</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-8 bg-slate-800/50 dark:bg-slate-800/30" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400/60">
              &copy; {currentYear} Wedding Hall Booking. Barcha huquqlar himoyalangan.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400/60 hover:text-slate-300 cursor-pointer transition-colors">
                Maxfiylik Siyosati
              </span>
              <span className="text-xs text-slate-400/60 hover:text-slate-300 cursor-pointer transition-colors">
                Foydalanish Shartlari
              </span>
              <span className="text-xs text-slate-400/60 hover:text-slate-300 cursor-pointer transition-colors">
                Yordam
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={scrollToTop}
              className="text-slate-400/60 hover:text-slate-200 hover:bg-slate-900/40 h-8 gap-1"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              Yuqoriga
            </Button>
          </div>
        </div>
      </div>
    </footer>
  )
}
