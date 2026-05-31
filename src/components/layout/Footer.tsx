'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Heart, Mail, Phone, MapPin, ArrowUp, Send, Clock, Instagram, Youtube } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

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
      {/* Animated gradient border at top */}
      <div className="h-1 bg-gradient-to-r from-rose-500 via-pink-500 via-amber-500 to-rose-500 bg-[length:200%_100%] animate-[gradient_3s_ease-in-out_infinite]" />

      <div className="bg-rose-950 dark:bg-rose-950 text-rose-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Brand & Newsletter */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-800/50 dark:bg-rose-800/30 border border-rose-700/50 dark:border-rose-700/30">
                  <Heart className="h-5 w-5 text-rose-400 fill-rose-400" />
                </div>
                <div>
                  <span className="text-lg font-bold tracking-tight text-rose-50 block leading-tight">
                    Wedding Hall
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-rose-400/70">Booking Platform</span>
                </div>
              </div>
              <p className="text-sm text-rose-300/70 leading-relaxed max-w-sm">
                O\'zbekiston bo\'ylab to\'yxonalarni topish va bron qilish uchun eng ishonchli platforma. Minglab baxtli juftliklar bizga ishonishadi.
              </p>

              {/* Newsletter */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-200">
                  Yangiliklarga obuna
                </p>
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-400/50" />
                    <Input
                      type="email"
                      placeholder="Email manzilingiz"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-9 bg-rose-900/40 border-rose-800/50 text-rose-100 placeholder:text-rose-400/50 focus:border-rose-500 focus:ring-rose-500/30 text-sm"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={subscribed}
                    className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white h-9 px-3"
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
                          <Send className="w-4 h-4" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </form>
              </div>

              {/* Social Media */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-rose-400/60 mr-1">Ijtimoiy tarmoqlar:</span>
                <a href="#" className="w-8 h-8 rounded-full bg-rose-900/40 border border-rose-800/40 flex items-center justify-center hover:bg-rose-800/60 hover:border-rose-700/60 transition-colors">
                  <Instagram className="w-4 h-4 text-rose-300" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-rose-900/40 border border-rose-800/40 flex items-center justify-center hover:bg-rose-800/60 hover:border-rose-700/60 transition-colors">
                  <svg className="w-4 h-4 text-rose-300" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.67-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.36-.48 1-.73 3.92-1.71 6.53-2.84 7.84-3.38 3.73-1.55 4.5-1.82 5.01-1.83.11 0 .36.03.52.17.14.12.18.28.2.46-.01.06.01.24 0 .38z"/>
                  </svg>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-rose-900/40 border border-rose-800/40 flex items-center justify-center hover:bg-rose-800/60 hover:border-rose-700/60 transition-colors">
                  <Youtube className="w-4 h-4 text-rose-300" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-rose-900/40 border border-rose-800/40 flex items-center justify-center hover:bg-rose-800/60 hover:border-rose-700/60 transition-colors">
                  <svg className="w-4 h-4 text-rose-300" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-rose-200">
                Tezkor Havolalar
              </h3>
              <nav className="flex flex-col gap-2.5">
                <button
                  onClick={() => navigateTo('halls')}
                  className="text-sm text-rose-300/70 hover:text-rose-200 transition-colors text-left flex items-center gap-2"
                >
                  <span className="w-1 h-1 rounded-full bg-rose-500/60" />
                  To\'yxonalarni Ko\'rish
                </button>
                <button
                  onClick={() => navigateTo('register')}
                  className="text-sm text-rose-300/70 hover:text-rose-200 transition-colors text-left flex items-center gap-2"
                >
                  <span className="w-1 h-1 rounded-full bg-rose-500/60" />
                  To\'yxona Ro\'yxatdan O\'tkazish
                </button>
                <button
                  onClick={() => navigateTo('login')}
                  className="text-sm text-rose-300/70 hover:text-rose-200 transition-colors text-left flex items-center gap-2"
                >
                  <span className="w-1 h-1 rounded-full bg-rose-500/60" />
                  Tizimga Kirish
                </button>
                <button
                  onClick={() => navigateTo('register')}
                  className="text-sm text-rose-300/70 hover:text-rose-200 transition-colors text-left flex items-center gap-2"
                >
                  <span className="w-1 h-1 rounded-full bg-rose-500/60" />
                  Hisob Yaratish
                </button>
              </nav>
            </div>

            {/* Xizmatlar & Popular */}
            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-rose-200">
                  Xizmatlar
                </h3>
                <nav className="flex flex-col gap-2.5">
                  <span className="text-sm text-rose-300/70 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-amber-500/60" />
                    To\'yxonalar
                  </span>
                  <span className="text-sm text-rose-300/70 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-amber-500/60" />
                    Xonandalar
                  </span>
                  <span className="text-sm text-rose-300/70 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-amber-500/60" />
                    Oshxona va Menyu
                  </span>
                  <span className="text-sm text-rose-300/70 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-amber-500/60" />
                    Hashamatli Avtoulovlar
                  </span>
                  <span className="text-sm text-rose-300/70 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-amber-500/60" />
                    Karnay-Surnay
                  </span>
                </nav>
              </div>
            </div>

            {/* Aloqa */}
            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-rose-200">
                  Aloqa
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-rose-300/70">
                      Toshkent shahri,<br />Amir Temur ko\'chasi, 107A
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 text-rose-400 shrink-0" />
                    <span className="text-sm text-rose-300/70">+998 90 123 45 67</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 text-rose-400 shrink-0" />
                    <span className="text-sm text-rose-300/70">info@weddinghall.uz</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 text-rose-400 shrink-0" />
                    <span className="text-sm text-rose-300/70">Dush-Shan: 9:00 - 18:00</span>
                  </div>
                </div>
              </div>

              {/* To'lov usullari */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-400/60">
                  To\'lov usullari
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-900/40 border border-rose-800/40 text-rose-300/70 font-medium">VISA</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-900/40 border border-rose-800/40 text-rose-300/70 font-medium">Mastercard</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-900/40 border border-rose-800/40 text-rose-300/70 font-medium">UZCARD</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-900/40 border border-rose-800/40 text-rose-300/70 font-medium">HUMO</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-900/40 border border-rose-800/40 text-rose-300/70 font-medium">Payme</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-900/40 border border-rose-800/40 text-rose-300/70 font-medium">Click</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-8 bg-rose-800/50 dark:bg-rose-800/30" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-rose-400/60">
              &copy; {currentYear} Wedding Hall Booking. Barcha huquqlar himoyalangan.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-rose-400/60 hover:text-rose-300 cursor-pointer transition-colors">
                Maxfiylik Siyosati
              </span>
              <span className="text-xs text-rose-400/60 hover:text-rose-300 cursor-pointer transition-colors">
                Foydalanish Shartlari
              </span>
              <span className="text-xs text-rose-400/60 hover:text-rose-300 cursor-pointer transition-colors">
                Yordam
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={scrollToTop}
              className="text-rose-400/60 hover:text-rose-200 hover:bg-rose-900/40 h-8 gap-1"
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
