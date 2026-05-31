'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, MapPin, Users, Phone, Music, ChevronLeft, ChevronRight,
  Building2, Utensils, Car, Calendar, Star, Check, Heart, MessageSquare,
  Send, Share2, X, Eye, Camera, Link2, Navigation, MessageCircle
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface HallImage {
  imageId: string
  imageUrl: string
}

interface Singer {
  singerId: string
  singerName: string
  price: number
  imageUrl: string | null
}

interface Menu {
  menuId: string
  menuName: string
}

interface CarItem {
  carId: string
  brand: string
  price: number
  imageUrl: string | null
}

interface Review {
  reviewId: string
  userId: string
  rating: number
  comment: string | null
  ownerResponse: string | null
  respondedAt: string | null
  createdAt: string
  user: {
    firstName: string
    lastName: string
  }
}

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
  ownerId: string
  images: HallImage[]
  singers: Singer[]
  menus: Menu[]
  cars: CarItem[]
}

interface CalendarDay {
  date: string
  status: 'available' | 'booked' | 'past'
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('uz-UZ').format(price) + " so'm"

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= rating
              ? 'text-amber-400 fill-amber-400'
              : 'text-gray-200 fill-gray-200 dark:text-gray-700 dark:fill-gray-700'
          }`}
        />
      ))}
    </div>
  )
}

function ClickableStarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-7 h-7 ${
              star <= (hover || value)
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-200 fill-gray-200 dark:text-gray-700 dark:fill-gray-700'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  )
}

// Section navigation items
const SECTIONS = [
  { id: 'info', label: 'Ma\'lumotlar', icon: Building2 },
  { id: 'services', label: 'Xizmatlar', icon: Music },
  { id: 'reviews', label: 'Sharhlar', icon: MessageSquare },
  { id: 'calendar', label: 'Taqvim', icon: Calendar },
]

export default function HallDetailPage() {
  const { selectedHallId, navigateTo, selectHall, setSelectedBookingDate, token, user } = useAppStore()
  const [hall, setHall] = useState<Hall | null>(null)
  const [loading, setLoading] = useState(true)

  // Calendar state
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1)
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([])
  const [calLoading, setCalLoading] = useState(false)

  // Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Favorite state
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [newReviewRating, setNewReviewRating] = useState(0)
  const [newReviewComment, setNewReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  // Owner response state
  const [respondingReviewId, setRespondingReviewId] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [submittingResponse, setSubmittingResponse] = useState(false)

  // Share state
  const [shareToast, setShareToast] = useState(false)

  // Scroll refs
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  useEffect(() => {
    if (selectedHallId) {
      loadHall()
      loadReviews()
      checkFav()
    }
  }, [selectedHallId])

  useEffect(() => {
    if (selectedHallId) {
      loadCalendar()
    }
  }, [selectedHallId, calMonth, calYear])

  const loadHall = async () => {
    if (!selectedHallId) return
    try {
      setLoading(true)
      const res = await api.getHall(selectedHallId)
      setHall(res.hall)
    } catch (error) {
      console.error('Failed to load hall:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCalendar = useCallback(async () => {
    if (!selectedHallId) return
    try {
      setCalLoading(true)
      const data = await api.getHallCalendar(selectedHallId, calMonth, calYear)
      setCalendarData(data || [])
    } catch (error) {
      console.error('Failed to load calendar:', error)
    } finally {
      setCalLoading(false)
    }
  }, [selectedHallId, calMonth, calYear])

  const loadReviews = async () => {
    if (!selectedHallId) return
    try {
      setReviewsLoading(true)
      const res = await api.getHallReviews(selectedHallId)
      setReviews(res.reviews || [])
    } catch {
      // Reviews endpoint may not exist yet; silently ignore
    } finally {
      setReviewsLoading(false)
    }
  }

  const checkFav = async () => {
    if (!selectedHallId || !token) return
    try {
      const res = await api.checkFavorite(selectedHallId)
      setIsFavorite(res.isFavorited || false)
    } catch {
      // Silently ignore
    }
  }

  const toggleFavorite = async () => {
    if (!selectedHallId || !token) {
      toast.error('Please login to add favorites')
      navigateTo('login')
      return
    }
    try {
      setFavoriteLoading(true)
      if (isFavorite) {
        await api.removeFavorite(selectedHallId)
        setIsFavorite(false)
        toast.success('Removed from favorites')
      } else {
        await api.addFavorite(selectedHallId)
        setIsFavorite(true)
        toast.success('Added to favorites')
      }
    } catch {
      toast.error('Failed to update favorite')
    } finally {
      setFavoriteLoading(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!selectedHallId || !token) {
      toast.error('Please login to write a review')
      navigateTo('login')
      return
    }
    if (newReviewRating === 0) {
      toast.error('Please select a rating')
      return
    }
    try {
      setSubmittingReview(true)
      await api.createReview(selectedHallId, {
        rating: newReviewRating,
        comment: newReviewComment || undefined,
      })
      toast.success('Review submitted!')
      setReviewDialogOpen(false)
      setNewReviewRating(0)
      setNewReviewComment('')
      loadReviews()
    } catch {
      toast.error('Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  const getDayStatus = (day: number): 'available' | 'booked' | 'past' => {
    const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const found = calendarData.find((d) => d.date === dateStr)
    if (found) return found.status as 'available' | 'booked' | 'past'
    return 'available'
  }

  const handleDateClick = (day: number) => {
    const status = getDayStatus(day)
    if (status !== 'available') return
    const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedBookingDate(dateStr)
    navigateTo('booking')
  }

  const handleBookNow = () => {
    navigateTo('booking')
  }

  const prevMonth = () => {
    if (calMonth === 1) {
      setCalMonth(12)
      setCalYear(calYear - 1)
    } else {
      setCalMonth(calMonth - 1)
    }
  }

  const nextMonth = () => {
    if (calMonth === 12) {
      setCalMonth(1)
      setCalYear(calYear + 1)
    } else {
      setCalMonth(calMonth + 1)
    }
  }

  // Gallery navigation
  const prevImage = () => {
    if (!hall) return
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : (hall.images.length - 1)))
  }
  const nextImage = () => {
    if (!hall) return
    setActiveImageIndex((prev) => (prev < hall.images.length - 1 ? prev + 1 : 0))
  }

  const getCalendarDays = () => {
    const firstDay = new Date(calYear, calMonth - 1, 1).getDay()
    const daysInMonth = new Date(calYear, calMonth, 0).getDate()
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  // Share handler
  const handleShare = async () => {
    const shareData = {
      title: hall?.name || 'Wedding Hall',
      text: `Check out ${hall?.name} - ${hall?.district}. Capacity: ${hall?.capacity} guests, ${formatPrice(hall?.seatPrice || 0)}/seat`,
      url: window.location.href,
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled sharing
      }
    } else {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = sectionRefs.current[sectionId]
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white dark:from-background dark:to-background max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-24 mb-6" />
        <Skeleton className="h-64 sm:h-96 mb-6 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!hall) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white dark:from-background dark:to-background max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-12 text-center">
          <Building2 className="w-16 h-16 mx-auto text-rose-200 dark:text-rose-700 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Hall Not Found</h3>
          <Button onClick={() => navigateTo('halls')} className="bg-rose-500 hover:bg-rose-600 text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Halls
          </Button>
        </Card>
      </div>
    )
  }

  const calendarDays = getCalendarDays()

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white dark:from-background dark:to-background pb-20 sm:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between"
        >
          <Button
            variant="ghost"
            onClick={() => navigateTo('halls')}
            className="mb-4 text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Halls
          </Button>
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
            >
              <Share2 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFavorite}
              disabled={favoriteLoading}
              className="text-gray-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  isFavorite
                    ? 'text-rose-500 fill-rose-500'
                    : 'text-gray-400 hover:text-rose-400 dark:text-gray-500 dark:hover:text-rose-400'
                }`}
              />
            </Button>
          </div>
        </motion.div>

        {/* Image Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          {hall.images && hall.images.length > 0 ? (
            <div className="relative rounded-2xl overflow-hidden group cursor-pointer" onClick={() => setLightboxOpen(true)}>
              {/* Main Image */}
              <div className="relative aspect-[16/9] sm:aspect-[21/9]">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={hall.images[activeImageIndex]?.imageId}
                    src={hall.images[activeImageIndex]?.imageUrl}
                    alt={hall.name}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </AnimatePresence>
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                {/* Expand icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-white/80 dark:bg-card/80 rounded-full flex items-center justify-center shadow-lg">
                    <Eye className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </div>
                </div>

                {/* Image counter badge */}
                <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <Camera className="w-3 h-3" />
                  {activeImageIndex + 1} / {hall.images.length}
                </div>

                {/* Nav arrows */}
                {hall.images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); prevImage() }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white dark:bg-card/80 dark:hover:bg-card rounded-full h-10 w-10 shadow-lg"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); nextImage() }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white dark:bg-card/80 dark:hover:bg-card rounded-full h-10 w-10 shadow-lg"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </>
                )}

                {/* Navigation Dots */}
                {hall.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    {hall.images.map((img, idx) => (
                      <button
                        key={img.imageId}
                        onClick={(e) => { e.stopPropagation(); setActiveImageIndex(idx) }}
                        className={`transition-all duration-300 rounded-full ${
                          idx === activeImageIndex
                            ? 'w-8 h-2.5 bg-white'
                            : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/75'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="aspect-[21/9] bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/30 dark:to-amber-900/30 rounded-2xl flex items-center justify-center">
              <Building2 className="w-20 h-20 text-rose-300 dark:text-rose-600" />
            </div>
          )}
        </motion.div>

        {/* Section Navigation - Sticky on scroll */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-rose-100 dark:border-rose-900/30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-6">
          <div className="flex items-center gap-1 py-2 overflow-x-auto">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors whitespace-nowrap"
              >
                <section.icon className="w-3.5 h-3.5" />
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hall Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Basic Info */}
            <div ref={(el) => { sectionRefs.current['info'] = el }}>
              <Card className="border-rose-100 dark:border-rose-900/30">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="min-w-0">
                      <h1 className="text-2xl sm:text-3xl font-bold dark:text-foreground">{hall.name}</h1>
                      {averageRating > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating rating={Math.round(averageRating)} size="md" />
                          <span className="text-sm text-muted-foreground">
                            {averageRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="dark:text-gray-300">{hall.district}, {hall.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="dark:text-gray-300">Capacity: {hall.capacity} guests</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="dark:text-gray-300">{hall.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="font-semibold text-rose-600 dark:text-rose-400">{formatPrice(hall.seatPrice)} per seat</span>
                    </div>
                  </div>
                  {hall.hasKarnaySurnay && (
                    <div className="mt-4">
                      <Badge className="bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                        <Music className="w-3.5 h-3.5 mr-1" />
                        Karnay-Surnay Available — {formatPrice(hall.karnaySurnayPrice || 0)}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Virtual Tour Placeholder */}
            <Card className="border-rose-100 dark:border-rose-900/30 overflow-hidden">
              <div className="relative aspect-[16/7] bg-gradient-to-br from-rose-100 via-amber-50 to-pink-100 dark:from-rose-900/20 dark:via-amber-900/10 dark:to-pink-900/20 flex items-center justify-center">
                <div className="absolute inset-0 opacity-10 dark:opacity-5" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
                  backgroundSize: '24px 24px'
                }} />
                <div className="text-center relative z-10">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/60 dark:bg-card/60 flex items-center justify-center">
                    <Navigation className="w-8 h-8 text-rose-500 dark:text-rose-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-foreground mb-1">Virtual Tour</h3>
                  <p className="text-sm text-gray-600 dark:text-muted-foreground mb-3">Tez kunda 360° virtual tur mavjud bo&apos;ladi</p>
                  <Badge variant="outline" className="border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400">
                    <Camera className="w-3 h-3 mr-1" />
                    Coming Soon
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Tabs for Services */}
            <div ref={(el) => { sectionRefs.current['services'] = el }}>
              <Card className="border-rose-100 dark:border-rose-900/30">
                <CardContent className="p-6">
                  <Tabs defaultValue="singers">
                    <TabsList className="mb-4 bg-rose-50 dark:bg-rose-900/20">
                      <TabsTrigger value="singers" className="data-[state=active]:bg-rose-500 data-[state=active]:text-white">
                        <Music className="w-4 h-4 mr-1.5" />
                        Singers
                      </TabsTrigger>
                      <TabsTrigger value="menus" className="data-[state=active]:bg-rose-500 data-[state=active]:text-white">
                        <Utensils className="w-4 h-4 mr-1.5" />
                        Menus
                      </TabsTrigger>
                      <TabsTrigger value="cars" className="data-[state=active]:bg-rose-500 data-[state=active]:text-white">
                        <Car className="w-4 h-4 mr-1.5" />
                        Cars
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="singers">
                      {hall.singers.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No singers available</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {hall.singers.map((singer) => (
                            <motion.div
                              key={singer.singerId}
                              whileHover={{ scale: 1.02, y: -2 }}
                              transition={{ type: 'spring', stiffness: 300 }}
                              className="flex items-center gap-3 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-colors hover:shadow-md dark:hover:shadow-rose-900/10"
                            >
                              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-rose-100 dark:bg-rose-900/30">
                                {singer.imageUrl ? (
                                  <img src={singer.imageUrl} alt={singer.singerName} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Music className="w-5 h-5 text-rose-400 dark:text-rose-500" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm truncate dark:text-foreground">{singer.singerName}</p>
                                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{formatPrice(singer.price)}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="menus">
                      {hall.menus.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No menus available</p>
                      ) : (
                        <div className="space-y-2">
                          {hall.menus.map((menu) => (
                            <motion.div
                              key={menu.menuId}
                              whileHover={{ scale: 1.01, x: 4 }}
                              transition={{ type: 'spring', stiffness: 300 }}
                              className="flex items-center gap-3 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-colors"
                            >
                              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                                <Utensils className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                              </div>
                              <p className="font-medium text-sm dark:text-foreground">{menu.menuName}</p>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="cars">
                      {hall.cars.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No cars available</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {hall.cars.map((car) => (
                            <motion.div
                              key={car.carId}
                              whileHover={{ scale: 1.02, y: -2 }}
                              transition={{ type: 'spring', stiffness: 300 }}
                              className="flex items-center gap-3 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-colors hover:shadow-md dark:hover:shadow-rose-900/10"
                            >
                              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-rose-100 dark:bg-rose-900/30">
                                {car.imageUrl ? (
                                  <img src={car.imageUrl} alt={car.brand} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Car className="w-5 h-5 text-rose-400 dark:text-rose-500" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm truncate dark:text-foreground">{car.brand}</p>
                                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{formatPrice(car.price)}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Reviews Section */}
            <div ref={(el) => { sectionRefs.current['reviews'] = el }}>
              <Card className="border-rose-100 dark:border-rose-900/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2 dark:text-foreground">
                        <MessageSquare className="w-5 h-5 text-rose-500" />
                        Reviews
                      </h3>
                      {averageRating > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating rating={Math.round(averageRating)} size="md" />
                          <span className="text-sm font-medium dark:text-foreground">{averageRating.toFixed(1)} out of 5</span>
                          <span className="text-sm text-muted-foreground">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
                        </div>
                      )}
                    </div>
                    <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                      <Button onClick={() => { if (!token) { toast.error('Please login'); navigateTo('login'); return; } setReviewDialogOpen(true) }} className="bg-rose-500 hover:bg-rose-600 text-white">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Write a Review
                      </Button>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Write a Review</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-2">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Your Rating</label>
                            <ClickableStarRating value={newReviewRating} onChange={setNewReviewRating} />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Comment (optional)</label>
                            <Textarea
                              placeholder="Share your experience..."
                              value={newReviewComment}
                              onChange={(e) => setNewReviewComment(e.target.value)}
                              rows={4}
                              className="resize-none border-rose-100 dark:border-rose-900/30 focus:border-rose-300"
                            />
                          </div>
                          <Button
                            onClick={handleSubmitReview}
                            disabled={submittingReview || newReviewRating === 0}
                            className="w-full bg-rose-500 hover:bg-rose-600 text-white"
                          >
                            {submittingReview ? (
                              <>Submitting...</>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                Submit Review
                              </>
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {reviewsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="flex items-center gap-3 mb-2">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <Skeleton className="h-4 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 mx-auto text-rose-200 dark:text-rose-700 mb-3" />
                      <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                      {reviews.map((review) => (
                        <motion.div
                          key={review.reviewId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-xl border border-rose-100 dark:border-rose-900/30 hover:bg-rose-50/30 dark:hover:bg-rose-900/10 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center text-white text-xs font-bold">
                                {review.user.firstName.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-sm dark:text-foreground">{review.user.firstName} {review.user.lastName}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'short', day: 'numeric'
                              })}
                            </span>
                          </div>
                          <StarRating rating={review.rating} size="sm" />
                          {review.comment && (
                            <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                          )}

                          {/* Owner Response */}
                          {review.ownerResponse ? (
                            <div className="mt-3 ml-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-900/30">
                              <div className="flex items-center gap-1.5 mb-1">
                                <MessageCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Owner Response</span>
                                {review.respondedAt && (
                                  <span className="text-[10px] text-amber-600/60 dark:text-amber-500/60">
                                    &middot; {new Date(review.respondedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-amber-800 dark:text-amber-300">{review.ownerResponse}</p>
                            </div>
                          ) : user?.role === 'owner' && hall?.ownerId === user.userId ? (
                            <div className="mt-3">
                              {respondingReviewId === review.reviewId ? (
                                <div className="space-y-2">
                                  <Textarea
                                    placeholder="Write your response..."
                                    value={responseText}
                                    onChange={(e) => setResponseText(e.target.value)}
                                    rows={2}
                                    className="resize-none border-amber-200 dark:border-amber-900/30 focus:border-amber-400 text-sm"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={async () => {
                                        if (!responseText.trim()) return
                                        try {
                                          setSubmittingResponse(true)
                                          await api.createReviewResponse(hall.hallId, review.reviewId, responseText)
                                          toast.success('Response submitted!')
                                          setRespondingReviewId(null)
                                          setResponseText('')
                                          loadReviews()
                                        } catch {
                                          toast.error('Failed to submit response')
                                        } finally {
                                          setSubmittingResponse(false)
                                        }
                                      }}
                                      disabled={submittingResponse || !responseText.trim()}
                                      className="bg-amber-500 hover:bg-amber-600 text-white text-xs h-7"
                                    >
                                      {submittingResponse ? 'Sending...' : 'Submit'}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setRespondingReviewId(null)
                                        setResponseText('')
                                      }}
                                      className="text-xs h-7"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setRespondingReviewId(review.reviewId)}
                                  className="text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-xs h-7"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 mr-1" />
                                  Respond
                                </Button>
                              )}
                            </div>
                          ) : null}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Right Sidebar - Calendar & Book */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            {/* Calendar */}
            <div ref={(el) => { sectionRefs.current['calendar'] = el }}>
              <Card className="border-rose-100 dark:border-rose-900/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <h3 className="font-semibold text-sm dark:text-foreground">
                      {MONTH_NAMES[calMonth - 1]} {calYear}
                    </h3>
                    <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {DAY_NAMES.map((day) => (
                      <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => {
                      if (day === null) {
                        return <div key={`empty-${index}`} className="aspect-square" />
                      }
                      const status = getDayStatus(day)
                      const isClickable = status === 'available'
                      return (
                        <button
                          key={day}
                          onClick={() => isClickable && handleDateClick(day)}
                          disabled={!isClickable}
                          className={`
                            aspect-square rounded-lg text-xs font-medium flex items-center justify-center transition-all
                            ${status === 'available' && 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer border border-green-200 hover:scale-105 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 dark:hover:bg-green-900/30'}
                            ${status === 'booked' && 'bg-red-100 text-red-800 cursor-not-allowed border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'}
                            ${status === 'past' && 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 dark:bg-gray-800/30 dark:text-gray-500 dark:border-gray-700'}
                          `}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-3 mt-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-green-100 border border-green-200 dark:bg-green-900/20 dark:border-green-800" />
                      <span className="text-muted-foreground">Available</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-red-100 border border-red-200 dark:bg-red-900/20 dark:border-red-800" />
                      <span className="text-muted-foreground">Booked</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-gray-100 border border-gray-200 dark:bg-gray-800/30 dark:border-gray-700" />
                      <span className="text-muted-foreground">Past</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Book Button */}
            <Button
              onClick={handleBookNow}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-xl h-12 text-base shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Book This Hall
            </Button>

            {/* Share Hall Card */}
            <Card className="border-rose-100 dark:border-rose-900/30 bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-950/20 dark:to-amber-950/20">
              <CardContent className="p-4">
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="w-full border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/20 mb-3"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share This Hall
                </Button>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="dark:text-gray-300">Instant booking confirmation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="dark:text-gray-300">20% advance payment</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="dark:text-gray-300">Free cancellation</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="sm:max-w-4xl p-0 bg-black/95 border-none overflow-hidden">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLightboxOpen(false)}
              className="absolute top-3 right-3 z-10 bg-white/20 hover:bg-white/40 text-white rounded-full h-9 w-9"
            >
              <X className="w-5 h-5" />
            </Button>

            {hall.images.length > 0 && (
              <div className="relative aspect-[16/9]">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={hall.images[activeImageIndex]?.imageId}
                    src={hall.images[activeImageIndex]?.imageUrl}
                    alt={hall.name}
                    className="w-full h-full object-contain"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                </AnimatePresence>

                {hall.images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full h-10 w-10"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full h-10 w-10"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </>
                )}

                {/* Thumbnails strip */}
                {hall.images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/50 p-1.5 rounded-xl">
                    {hall.images.map((img, idx) => (
                      <button
                        key={img.imageId}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-10 h-10 rounded-lg overflow-hidden transition-all ${
                          idx === activeImageIndex
                            ? 'ring-2 ring-white scale-110'
                            : 'opacity-50 hover:opacity-80'
                        }`}
                      >
                        <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Sticky Book Bar - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-card/95 backdrop-blur-sm border-t border-rose-100 dark:border-rose-900/30 p-3 sm:hidden z-50">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate dark:text-foreground">{hall.name}</p>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{formatPrice(hall.seatPrice)}/seat</p>
          </div>
          <Button
            onClick={handleBookNow}
            className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-xl h-11 shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30"
          >
            <Calendar className="w-4 h-4 mr-1.5" />
            Book Now
          </Button>
        </div>
      </div>
    </div>
  )
}
