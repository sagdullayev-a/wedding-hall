'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { Search, Heart, Users, Building2, Star, MapPin, ArrowRight, Sparkles, Calendar, Clock, ChevronUp, X, History, Loader2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import FaqSection from '@/components/customer/FaqSection'
import ContactForm from '@/components/customer/ContactForm'
import { useTranslation } from '@/lib/translations'

interface Hall {
  hallId: string
  name: string
  district: string
  address: string
  capacity: number
  seatPrice: number
  phone: string
  hasKarnaySurnay: boolean
  karnaySurnayPrice: number | null
  status: string
  images: { imageId: string; imageUrl: string }[]
  singers: { singerId: string }[]
  menus: { menuId: string }[]
  cars: { carId: string }[]
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('uz-UZ').format(price) + " so'm"

// Animated Counter Component
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const duration = 2000
    const increment = target / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [isInView, target])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

const PARTNERS = [
  { name: 'Saroy Palace',  gradient: 'from-rose-600 to-rose-700' },
  { name: 'Guliston',      gradient: 'from-amber-500 to-amber-600' },
  { name: "Navro'z",      gradient: 'from-rose-700 to-pink-700' },
  { name: 'Bunyodkor',    gradient: 'from-pink-600 to-rose-600' },
  { name: 'Osiyo',        gradient: 'from-rose-800 to-rose-900' },
  { name: 'Shodlik',      gradient: 'from-rose-500 to-amber-500' },
]

const DISTRICTS = [
  { name: 'Tashkent',   localName: 'Toshkent',   russianName: 'Ташкент',   halls: 24, gradient: 'from-rose-600 to-rose-700' },
  { name: 'Samarkand',  localName: 'Samarqand',   russianName: 'Самарканд', halls: 12, gradient: 'from-rose-700 to-rose-800' },
  { name: 'Bukhara',    localName: 'Buxoro',      russianName: 'Бухара',    halls: 8,  gradient: 'from-rose-800 to-rose-900' },
  { name: 'Andijan',    localName: 'Andijon',     russianName: 'Андижан',   halls: 6,  gradient: 'from-rose-500 to-amber-600' },
  { name: 'Namangan',   localName: 'Namangan',    russianName: 'Наманган',  halls: 5,  gradient: 'from-amber-500 to-amber-600' },
]

export default function LandingPage() {
  const { navigateTo, selectHall } = useAppStore()
  const { t, language } = useTranslation()
  const [featuredHalls, setFeaturedHalls] = useState<Hall[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({ totalHalls: 0, happyCouples: 0, districts: 0 })

  // Autocomplete state
  const [autocompleteResults, setAutocompleteResults] = useState<any[]>([])
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Parallax scroll for hero blurs
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const blurY1 = useTransform(scrollYProgress, [0, 1], [0, 80])
  const blurY2 = useTransform(scrollYProgress, [0, 1], [0, -60])
  const blurY3 = useTransform(scrollYProgress, [0, 1], [0, 40])

  // Back to top
  const [showBackToTop, setShowBackToTop] = useState(false)
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 500)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const loadFeaturedHalls = async () => {
    try {
      setLoading(true)
      const res = await api.getHalls({ limit: 4, sort: 'createdAt', order: 'desc' })
      setFeaturedHalls(res.halls || [])
      setStats({
        totalHalls: res.total || 0,
        happyCouples: Math.max(res.total * 12, 150),
        districts: 14,
      })
    } catch (error) {
      console.error('Failed to load featured halls:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadFeaturedHalls()
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('recentSearches')
      if (stored) {
        const timer = setTimeout(() => {
          setRecentSearches(JSON.parse(stored))
        }, 0)
        return () => clearTimeout(timer)
      }
    } catch {
      // ignore
    }
  }, [])

  // Click outside to close autocomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const saveRecentSearch = useCallback((query: string) => {
    try {
      const stored = localStorage.getItem('recentSearches')
      const existing: string[] = stored ? JSON.parse(stored) : []
      const updated = [query, ...existing.filter((s) => s !== query)].slice(0, 5)
      localStorage.setItem('recentSearches', JSON.stringify(updated))
      setRecentSearches(updated)
    } catch {
      // ignore
    }
  }, [])

  const clearRecentSearches = useCallback(() => {
    try {
      localStorage.removeItem('recentSearches')
      setRecentSearches([])
    } catch {
      // ignore
    }
  }, [])

  const getTestimonials = () => {
    if (language === 'uz') {
      return [
        { name: 'Dilnoza & Aziz', location: 'Toshkent', text: 'Biz ushbu platforma orqali mukammal to\'yxonani topdik. Bron qilish jarayoni juda oson kechdi va zal barcha kutganlarimizdan ham a\'lo darajada bo\'ldi!', rating: 5 },
        { name: 'Gulnora & Bobur', location: 'Samarqand', text: 'Ajoyib zallar tanlovi! Biz narxlarni solishtirish, bandlikni tekshirish va barchasini bir joyda bron qilishga muvaffaq bo\'ldik. Juda tavsiya qilamiz!', rating: 5 },
        { name: 'Nodira & Sardor', location: 'Buxoro', text: 'Karnay-surnay va xonandalar xizmatlari to\'yimizni chindan ham unutilmas qildi. Oldindan to\'lov tizimi bizga xotirjamlik berdi. Rahmat!', rating: 4 },
      ]
    }
    if (language === 'ru') {
      return [
        { name: 'Дильноза и Азиз', location: 'Ташкент', text: 'Мы нашли идеальный зал для нашей свадьбы через эту платформу. Процесс бронирования был очень простым, а сам зал превзошел все наши ожидания!', rating: 5 },
        { name: 'Гульнора и Бобур', location: 'Самарканд', text: 'Потрясающий выбор мест! Мы смогли сравнить цены, проверить свободные даты и забронировать всё в одном месте. Очень рекомендуем!', rating: 5 },
        { name: 'Нодира и Сардор', location: 'Бухара', text: 'Услуги карнай-сурнай и певцов сделали нашу свадьбу по-настоящему особенной. Система предоплаты дала нам уверенность. Спасибо!', rating: 4 },
      ]
    }
    return [
      { name: 'Dilnoza & Aziz', location: 'Tashkent', text: 'We found the perfect hall for our wedding through this platform. The booking process was so easy and the hall exceeded our expectations!', rating: 5 },
      { name: 'Gulnora & Bobur', location: 'Samarkand', text: 'Amazing selection of venues! We were able to compare prices, check availability, and book everything in one place. Highly recommended!', rating: 5 },
      { name: 'Nodira & Sardor', location: 'Bukhara', text: 'The karnay-surnay and singer options made our wedding truly special. The advance payment system gave us peace of mind. Thank you!', rating: 4 },
    ]
  }

  const searchHalls = useCallback(async (query: string) => {
    if (query.trim().length < 1) {
      setAutocompleteResults([])
      setShowAutocomplete(false)
      return
    }
    try {
      setSuggestionsLoading(true)
      const res = await api.getHallAutocomplete(query)
      setAutocompleteResults(res.suggestions || [])
      setShowAutocomplete(true)
      setActiveSuggestionIdx(-1)
    } catch {
      setAutocompleteResults([])
    } finally {
      setSuggestionsLoading(false)
    }
  }, [])

  const handleSearch = () => {
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim())
    }
    setShowAutocomplete(false)
    selectHall('')
    navigateTo('halls')
  }

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    if (value.trim().length >= 1) {
      setShowAutocomplete(true)
      setSuggestionsLoading(true)
      debounceRef.current = setTimeout(() => {
        searchHalls(value)
      }, 300)
    } else {
      setAutocompleteResults([])
      setShowAutocomplete(false)
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showAutocomplete || autocompleteResults.length === 0) {
      if (e.key === 'Enter') handleSearch()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSuggestionIdx(prev => Math.min(prev + 1, autocompleteResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSuggestionIdx(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeSuggestionIdx >= 0 && activeSuggestionIdx < autocompleteResults.length) {
        const selected = autocompleteResults[activeSuggestionIdx]
        setShowAutocomplete(false)
        saveRecentSearch(selected.name)
        handleHallClick(selected.hallId)
      } else {
        setShowAutocomplete(false)
        handleSearch()
      }
    } else if (e.key === 'Escape') {
      setShowAutocomplete(false)
    }
  }

  const handleHallClick = (hallId: string) => {
    selectHall(hallId)
    navigateTo('hall-detail')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-amber-50 dark:from-rose-950/30 dark:via-background dark:to-amber-950/20 overflow-x-hidden">
      {/* Hero Section */}
      <section ref={heroRef} className="relative">
        {/* Decorative background elements with parallax */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            style={{ y: blurY1 }}
            className="absolute -top-40 -right-40 w-96 h-96 bg-rose-200/30 dark:bg-rose-800/20 rounded-full blur-3xl"
          />
          <motion.div
            style={{ y: blurY2 }}
            className="absolute top-20 -left-20 w-72 h-72 bg-amber-200/30 dark:bg-amber-800/20 rounded-full blur-3xl"
          />
          <motion.div
            style={{ y: blurY3 }}
            className="absolute bottom-0 right-1/4 w-64 h-64 bg-pink-200/20 dark:bg-pink-800/20 rounded-full blur-3xl"
          />
        </div>

        {/* Decorative wedding rings ornament */}
        <div className="absolute top-10 left-10 opacity-[0.04] dark:opacity-[0.03] pointer-events-none hidden lg:block">
          <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
            <circle cx="80" cy="100" r="40" stroke="currentColor" strokeWidth="6" className="text-rose-600" />
            <circle cx="120" cy="100" r="40" stroke="currentColor" strokeWidth="6" className="text-amber-600" />
            <path d="M80 60 C80 30 120 30 120 60" stroke="currentColor" strokeWidth="3" className="text-rose-400" fill="none" />
            <circle cx="100" cy="45" r="6" fill="currentColor" className="text-amber-400" />
          </svg>
        </div>
        <div className="absolute bottom-20 right-10 opacity-[0.04] dark:opacity-[0.03] pointer-events-none hidden lg:block">
          <svg width="160" height="160" viewBox="0 0 160 160" fill="none">
            <path d="M80 20 C60 20 50 40 50 60 C50 90 80 110 80 140 C80 110 110 90 110 60 C110 40 100 20 80 20Z" stroke="currentColor" strokeWidth="3" className="text-rose-500" fill="none" />
            <path d="M80 40 C70 40 65 50 65 60 C65 75 80 85 80 100 C80 85 95 75 95 60 C95 50 90 40 80 40Z" stroke="currentColor" strokeWidth="2" className="text-amber-500" fill="none" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4" />
              Uzbekistan&apos;s #1 Wedding Hall Platform
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 bg-clip-text text-transparent">
                {t('heroTitle')}
              </span>
              <br />
              <span className="bg-gradient-to-r from-amber-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">
                {t('heroSpan')}
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              {t('heroSub')}
            </p>

            {/* Search Bar with Autocomplete */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="max-w-2xl mx-auto"
            >
              <div ref={searchRef} className="relative">
                <div className="flex gap-2 p-2 bg-white dark:bg-card rounded-2xl shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30 border border-rose-100 dark:border-rose-900/30">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder={t('search') + '...'}
                      value={searchQuery}
                      onChange={(e) => handleSearchInputChange(e.target.value)}
                      onFocus={() => {
                        if (searchQuery.trim().length >= 1 || recentSearches.length > 0) {
                          setShowAutocomplete(true)
                        }
                      }}
                      onKeyDown={handleSearchKeyDown}
                      className="pl-10 pr-16 border-0 focus-visible:ring-0 text-base h-11 bg-transparent"
                      autoComplete="off"
                    />
                    {suggestionsLoading && (
                      <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400 animate-spin z-10" />
                    )}
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('')
                          setAutocompleteResults([])
                          setShowAutocomplete(false)
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                  <Button
                    onClick={handleSearch}
                    className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-xl px-6 h-11"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {t('search')}
                  </Button>
                </div>

                {/* Autocomplete Dropdown */}
                <AnimatePresence>
                  {showAutocomplete && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-card rounded-xl shadow-xl shadow-rose-200/40 dark:shadow-rose-900/30 border border-rose-100 dark:border-rose-900/30 overflow-hidden z-50"
                    >
                      {/* Recent searches */}
                      {searchQuery.trim().length < 1 && recentSearches.length > 0 && (
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Searches</span>
                            <button
                              onClick={clearRecentSearches}
                              className="text-xs text-rose-500 hover:text-rose-600 transition-colors"
                            >
                              Clear all
                            </button>
                          </div>
                          {recentSearches.map((search, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setSearchQuery(search)
                                handleSearchInputChange(search)
                              }}
                              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-foreground hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-lg transition-colors"
                            >
                              <History className="w-3.5 h-3.5 text-muted-foreground" />
                              {search}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Autocomplete results */}
                      {autocompleteResults.length > 0 && (
                        <div className="p-1.5 max-h-[300px] overflow-y-auto">
                          <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider px-3.5 py-2 block">
                            {language === 'uz' ? 'TAVSIYALAR' : language === 'ru' ? 'РЕКОМЕНДАЦИИ' : 'SUGGESTIONS'}
                          </span>
                          {autocompleteResults.map((hall, idx) => (
                            <button
                              key={hall.hallId}
                              onClick={() => {
                                setShowAutocomplete(false)
                                saveRecentSearch(hall.name)
                                handleHallClick(hall.hallId)
                              }}
                              onMouseEnter={() => setActiveSuggestionIdx(idx)}
                              className={`flex items-center gap-3.5 w-full px-3.5 py-2.5 text-left rounded-xl transition-all duration-100 ${
                                idx === activeSuggestionIdx
                                  ? 'bg-rose-50 dark:bg-rose-900/20'
                                  : 'hover:bg-rose-50/60 dark:hover:bg-rose-900/10'
                              }`}
                            >
                              <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/30 dark:to-amber-900/30 flex items-center justify-center">
                                {hall.images?.[0]?.imageUrl ? (
                                  <img
                                    src={hall.images[0].imageUrl}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Building2 className="w-5 h-5 text-rose-300 dark:text-rose-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-foreground truncate">{hall.name}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
                                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                                  <span>{hall.district}</span>
                                  <span className="text-rose-300 dark:text-rose-700">•</span>
                                  <Users className="w-3.5 h-3.5 shrink-0" />
                                  <span>{hall.capacity} {language === 'uz' ? 'kishi' : language === 'ru' ? 'гостей' : 'Guests'}</span>
                                  <span className="text-rose-300 dark:text-rose-700">•</span>
                                  <span className="text-rose-600 dark:text-rose-400 font-medium">{formatPrice(hall.seatPrice)}/{language === 'uz' ? 'joy' : language === 'ru' ? 'место' : 'seat'}</span>
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* No results */}
                      {searchQuery.trim().length >= 1 && autocompleteResults.length === 0 && !suggestionsLoading && (
                        <div className="px-4 py-8 text-center bg-white dark:bg-card">
                          <Building2 className="w-9 h-9 mx-auto text-rose-200 dark:text-rose-700 mb-2.5" />
                          <p className="text-sm text-muted-foreground font-medium">
                            {language === 'uz' ? 'Hech qanday to\'yxona topilmadi' : language === 'ru' ? 'Залы не найдены' : 'No wedding halls found'}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Quick District Filter Buttons */}
                <div className="flex flex-wrap items-center gap-2 mt-3 justify-center">
                  {['Tashkent', 'Samarkand', 'Bukhara', 'Andijan', 'Namangan'].map((district) => (
                    <button
                      key={district}
                      onClick={() => {
                        setSearchQuery(district)
                        handleSearchInputChange(district)
                      }}
                      className="text-xs px-3 py-1.5 rounded-full bg-white/60 dark:bg-card/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-200 dark:hover:border-rose-800 transition-colors backdrop-blur-sm"
                    >
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {district}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Partners & Venues */}
      <section className="py-10 border-y border-rose-100/50 dark:border-rose-900/20 bg-white/50 dark:bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-sm text-muted-foreground mb-6 uppercase tracking-widest">Trusted by top venues across Uzbekistan</p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              {PARTNERS.map((partner, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.08 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-2.5 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${partner.gradient} flex items-center justify-center shadow-sm`}>
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-sm text-muted-foreground">{partner.name}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Halls */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">
                <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                  {t('popularHalls')}
                </span>
              </h2>
              <p className="text-muted-foreground mt-1">{t('popularHallsSub')}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigateTo('halls')}
              className="border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hidden sm:flex"
            >
              {t('viewDetails')}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="h-48 bg-rose-100 dark:bg-rose-900/20" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-rose-100 dark:bg-rose-900/20 rounded mb-2" />
                    <div className="h-3 bg-rose-50 dark:bg-rose-900/10 rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredHalls.length === 0 ? (
            <Card className="p-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('noHallsFound')}</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredHalls.map((hall, index) => (
                <motion.div
                  key={hall.hallId}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card
                    className="overflow-hidden cursor-pointer group hover:shadow-lg hover:shadow-rose-200/50 dark:hover:shadow-rose-900/20 transition-all duration-300 border-rose-100 dark:border-rose-900/30"
                    onClick={() => handleHallClick(hall.hallId)}
                  >
                    <div className="relative h-48 overflow-hidden">
                      {hall.images?.[0]?.imageUrl ? (
                        <img
                          src={hall.images[0].imageUrl}
                          alt={hall.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/30 dark:to-amber-900/30 flex items-center justify-center">
                          <Building2 className="w-12 h-12 text-rose-300 dark:text-rose-600" />
                        </div>
                      )}
                      {hall.hasKarnaySurnay && (
                        <Badge className="absolute top-3 right-3 bg-amber-500 text-white text-xs">
                          {t('karnaySurnay')}
                        </Badge>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-base mb-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-1">
                        {hall.name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="line-clamp-1">{hall.district}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="w-3.5 h-3.5 text-rose-500" />
                          <span>{hall.capacity} {t('hallCapacity')}</span>
                        </div>
                        <div className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                          {formatPrice(hall.seatPrice)}/{t('seatPrice')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Button
              onClick={() => navigateTo('halls')}
              className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white"
            >
              {t('viewDetails')}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Statistics Section with Animated Counters */}
      <section className="relative overflow-hidden bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 py-16">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6bTAtMzBWMkgydjJoMzR6TTIgMjJoMzR2LTJIMnYyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center text-white"
          >
            <div>
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <Building2 className="w-10 h-10 mx-auto mb-3 opacity-80" />
              </motion.div>
              <div className="text-3xl sm:text-4xl font-bold mb-1">
                <AnimatedCounter target={stats.totalHalls} suffix="+" />
              </div>
              <div className="text-white/80 text-sm">{t('statsTotalHalls')}</div>
            </div>
            <div>
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Heart className="w-10 h-10 mx-auto mb-3 opacity-80" />
              </motion.div>
              <div className="text-3xl sm:text-4xl font-bold mb-1">
                <AnimatedCounter target={stats.happyCouples} suffix="+" />
              </div>
              <div className="text-white/80 text-sm">{t('statsHappyClients')}</div>
            </div>
            <div>
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <MapPin className="w-10 h-10 mx-auto mb-3 opacity-80" />
              </motion.div>
              <div className="text-3xl sm:text-4xl font-bold mb-1">
                <AnimatedCounter target={stats.districts} />
              </div>
              <div className="text-white/80 text-sm">{t('district')}</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trusted by Counter Strip */}
      <section className="bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/20 dark:to-amber-950/20 py-4 border-b border-rose-100/50 dark:border-rose-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span><strong className="text-foreground dark:text-foreground">2,500+</strong> bookings this month</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span><strong className="text-foreground dark:text-foreground">98%</strong> satisfaction rate</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span><strong className="text-foreground dark:text-foreground">24/7</strong> customer support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Districts */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
              {t('popularDistrictsTitle')}
            </span>
          </h2>
          <p className="text-muted-foreground">{t('popularDistrictsSub')}</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {DISTRICTS.map((district, index) => (
            <motion.div
              key={district.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card
                className="overflow-hidden cursor-pointer group hover:shadow-lg hover:shadow-rose-200/40 dark:hover:shadow-rose-900/20 transition-all duration-300 border-0"
                onClick={() => {
                  selectHall('')
                  navigateTo('halls')
                }}
              >
                <div className={`relative h-36 sm:h-44 bg-gradient-to-br ${district.gradient} p-4 flex flex-col justify-end`}>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div className="relative z-10">
                    <h3 className="font-bold text-white text-lg">
                      {language === 'uz' ? district.localName : language === 'ru' ? district.russianName : district.name}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {language === 'uz' ? 'O\'zbekiston' : language === 'ru' ? 'Узбекистан' : 'Uzbekistan'}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <Building2 className="w-3.5 h-3.5 text-white/80" />
                      <span className="text-white/90 text-sm font-medium">
                        {district.halls} {t('hallsCount')}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
              {t('whyChooseUs')}
            </span>
          </h2>
          <p className="text-muted-foreground">{t('whyChooseUsSub')}</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Search,
              title: t('easySearchTitle'),
              desc: t('easySearchDesc'),
            },
            {
              icon: Star,
              title: t('premiumHallsTitle'),
              desc: t('premiumHallsDesc'),
            },
            {
              icon: Heart,
              title: t('completePackagesTitle'),
              desc: t('completePackagesDesc'),
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 text-center border-rose-100 dark:border-rose-900/30 hover:shadow-md hover:shadow-rose-100/50 dark:hover:shadow-rose-900/20 transition-all duration-300 h-full">
                <div className="w-14 h-14 bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/30 dark:to-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gradient-to-b from-white to-rose-50/50 dark:from-background dark:to-rose-950/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                {t('howItWorks')}
              </span>
            </h2>
            <p className="text-muted-foreground">{t('howItWorksSub')}</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', icon: Search, title: t('step1Title'), desc: t('step1Desc') },
              { step: '02', icon: Calendar, title: t('step2Title'), desc: t('step2Desc') },
              { step: '03', icon: Sparkles, title: t('step3Title'), desc: t('step3Desc') },
              { step: '04', icon: Heart, title: t('step4Title'), desc: t('step4Desc') },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.15 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 text-center border-rose-100 dark:border-rose-900/30 hover:shadow-lg hover:shadow-rose-100/50 dark:hover:shadow-rose-900/20 transition-all duration-300 h-full relative overflow-hidden group">
                  <div className="absolute top-3 right-3 text-5xl font-black text-rose-100/50 dark:text-rose-900/20 group-hover:text-rose-200/50 transition-colors">
                    {item.step}
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/30 dark:to-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <item.icon className="w-7 h-7 text-rose-600 dark:text-rose-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
              {t('happyCouplesTitle')}
            </span>
          </h2>
          <p className="text-muted-foreground">{t('happyCouplesSub')}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {getTestimonials().map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 border-rose-100 dark:border-rose-900/30 hover:shadow-md transition-shadow h-full flex flex-col">
                <div className="flex items-center gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < testimonial.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200 dark:text-gray-700 dark:fill-gray-700'}`} />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm mb-4 flex-1 italic">&ldquo;{testimonial.text}&rdquo;</p>
                <Separator className="mb-4" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center text-white font-bold text-sm">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {testimonial.location}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <FaqSection />

      {/* Contact Section */}
      <ContactForm />

      {/* CTA Section with Sparkle Effects */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Card className="relative overflow-hidden border-0 dark:border dark:border-rose-900/30 bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 dark:from-rose-950/20 dark:via-rose-950/10 dark:to-amber-950/20">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-100/30 to-amber-100/30 dark:from-rose-900/10 dark:to-amber-900/10" />
            {/* Animated sparkle decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${15 + i * 15}%`,
                    top: `${20 + (i % 3) * 25}%`,
                  }}
                  animate={{
                    opacity: [0.2, 0.8, 0.2],
                    scale: [0.8, 1.2, 0.8],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    delay: i * 0.4,
                  }}
                >
                  <Sparkles className="w-4 h-4 text-rose-400/40 dark:text-rose-400/20" />
                </motion.div>
              ))}
            </div>
            <div className="relative p-8 sm:p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                viewport={{ once: true }}
                className="w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30"
              >
                <Heart className="w-8 h-8 text-white fill-white" />
              </motion.div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                {t('readyToFindTitle')}
              </h2>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                {t('readyToFindSub')}
              </p>
              <Button
                onClick={() => navigateTo('halls')}
                size="lg"
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-xl px-8"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {t('exploreHallsBtn')}
              </Button>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Back to Top Button */}
      {showBackToTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-300/50 dark:shadow-rose-900/30 flex items-center justify-center hover:from-rose-600 hover:to-pink-700 transition-all"
        >
          <ChevronUp className="w-5 h-5" />
        </motion.button>
      )}
    </div>
  )
}
