'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Users, Building2, Music, Utensils, Car, X,
  ChevronLeft, Clock, AlertCircle, Loader2, PartyPopper,
  Download, LayoutList, AlignJustify, MapPin, DollarSign,
  Sparkles, CheckCircle2, FileText
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/translations'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface BookingService {
  bookingServiceId: string
  bookingId: string
  serviceType: string
  serviceId: string
  servicePrice: number
}

interface Booking {
  bookingId: string
  hallId: string
  customerId: string
  bookingDate: string
  guestCount: number
  totalPrice: number
  advancePayment: number
  bookingStatus: string
  createdAt: string
  hall: {
    hallId: string
    name: string
    district: string
    address: string
    seatPrice: number
    images?: { imageId: string; imageUrl: string }[]
  }
  services: BookingService[]
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('uz-UZ').format(price) + " so'm"

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string; icon: React.ElementType; darkColor?: string; darkBg?: string; darkBorder?: string }> = {
  upcoming: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Kutilmoqda', icon: Clock, darkColor: 'dark:text-emerald-300', darkBg: 'dark:bg-emerald-900/20', darkBorder: 'dark:border-emerald-800' },
  completed: { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', label: 'Tugallangan', icon: CheckCircle2, darkColor: 'dark:text-gray-300', darkBg: 'dark:bg-gray-800/20', darkBorder: 'dark:border-gray-700' },
  cancelled: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Bekor Qilingan', icon: X, darkColor: 'dark:text-red-400', darkBg: 'dark:bg-red-900/20', darkBorder: 'dark:border-red-800' },
}

const SERVICE_ICONS: Record<string, React.ElementType> = {
  singer: Music,
  menu: Utensils,
  car: Car,
  karnay_surnay: Music,
}

const SERVICE_LABELS: Record<string, string> = {
  singer: 'Xonanda',
  menu: 'Menyu',
  car: 'Mashina',
  karnay_surnay: 'Karnay-Surnay',
}

const FILTER_CHIPS = [
  { key: 'upcoming', label: 'Kutilmoqda', icon: Clock, color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800' },
  { key: 'completed', label: 'Tugallangan', icon: CheckCircle2, color: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/20 dark:text-gray-300 dark:border-gray-700' },
  { key: 'cancelled', label: 'Bekor', icon: X, color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' },
]

export default function MyBookingsPage() {
  const { navigateTo, token } = useAppStore()
  const { t } = useTranslation()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('upcoming')
  const [cancelDialogId, setCancelDialogId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [viewMode, setViewMode] = useState<'card' | 'timeline'>('card')

  const loadBookings = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const res = await api.getMyBookings({ status: statusFilter, limit: 50 })
      setBookings(res.bookings || [])
    } catch {
      toast.error(t('bookingsLoadError'))
    } finally {
      setLoading(false)
    }
  }, [token, statusFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBookings()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadBookings])

  const handleCancelBooking = async () => {
    if (!cancelDialogId) return
    try {
      setCancelling(true)
      await api.cancelBooking(cancelDialogId)
      toast.success(t('cancelSuccess'))
      setCancelDialogId(null)
      loadBookings()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Bronni bekor qilishda xatolik'
      toast.error(message)
    } finally {
      setCancelling(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('uz-UZ', {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatShortDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('uz-UZ', {
      month: 'short',
      day: 'numeric',
    })
  }

  const handleDownloadReceipt = (booking: Booking) => {
    const receiptLines = [
      '═══════════════════════════════════════',
      '       TO\'YXONA BRON CHEKI',
      '═══════════════════════════════════════',
      '',
      `To'yxona: ${booking.hall.name}`,
      `Manzil: ${booking.hall.district}, ${booking.hall.address}`,
      `Bron sanasi: ${formatDate(booking.bookingDate)}`,
      `Mehmonlar soni: ${booking.guestCount} kishi`,
      '',
      '───────────────────────────────────────',
      'XIZMATLAR:',
      `  O'rindiq narxi: ${formatPrice(booking.hall.seatPrice)} x ${booking.guestCount}`,
      ...booking.services.map(s =>
        `  ${SERVICE_LABELS[s.serviceType] || s.serviceType}: ${formatPrice(s.servicePrice)}`
      ),
      '───────────────────────────────────────',
      '',
      `Jami narx: ${formatPrice(booking.totalPrice)}`,
      `Oldindan to'lov (20%): ${formatPrice(booking.advancePayment)}`,
      `Qoldiq: ${formatPrice(booking.totalPrice - booking.advancePayment)}`,
      '',
      `Holat: ${STATUS_CONFIG[booking.bookingStatus]?.label || booking.bookingStatus}`,
      `Bron ID: ${booking.bookingId.slice(0, 8)}`,
      '',
      '═══════════════════════════════════════',
      '    Rahmat! Yaxshi to\'y tilaymiz! 🎉',
      '═══════════════════════════════════════',
    ].join('\n')

    const blob = new Blob([receiptLines], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bron-cheki-${booking.bookingId.slice(0, 8)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(t('receiptDownloaded'))
  }

  const getEmptyStateConfig = () => ({
    upcoming: {
      icon: Calendar,
      title: t('emptyUpcomingTitle'),
      desc: t('emptyUpcomingDesc'),
    },
    completed: {
      icon: PartyPopper,
      title: t('emptyCompletedTitle'),
      desc: t('emptyCompletedDesc'),
    },
    cancelled: {
      icon: AlertCircle,
      title: t('emptyCancelledTitle'),
      desc: t('emptyCancelledDesc'),
    },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-background dark:via-background dark:to-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => navigateTo('landing')}
            className="mb-2 text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 p-0"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {t('backHome')}
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-foreground flex items-center gap-2">
                <Sparkles className="w-7 h-7 text-rose-500" />
                Mening Bronlarim
              </h1>
              <p className="text-gray-500 dark:text-muted-foreground mt-1">To&apos;yxona bronlaringizni boshqaring</p>
            </div>
            {bookings.length > 0 && (
              <div className="flex items-center gap-1 bg-white dark:bg-card rounded-lg border border-rose-200 dark:border-rose-800 p-1">
                <Button
                  variant={viewMode === 'card' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('card')}
                  className={`h-8 w-8 p-0 ${viewMode === 'card' ? 'bg-rose-500 text-white' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  <LayoutList className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('timeline')}
                  className={`h-8 w-8 p-0 ${viewMode === 'timeline' ? 'bg-rose-500 text-white' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  <AlignJustify className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Filter Chips */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6 flex-wrap"
        >
          {[
            { key: 'upcoming', label: t('statusUpcoming'), icon: Clock, color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800' },
            { key: 'completed', label: t('statusCompleted'), icon: CheckCircle2, color: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/20 dark:text-gray-300 dark:border-gray-700' },
            { key: 'cancelled', label: t('statusCancelled'), icon: X, color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' },
          ].map(chip => {
            const isActive = statusFilter === chip.key
            return (
              <button
                key={chip.key}
                onClick={() => setStatusFilter(chip.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                  isActive
                    ? chip.color + ' shadow-sm'
                    : 'bg-white dark:bg-card text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-rose-200 dark:hover:border-rose-800 hover:text-rose-600 dark:hover:text-rose-400'
                }`}
              >
                <chip.icon className="w-3.5 h-3.5" />
                {chip.label}
              </button>
            )
          })}
        </motion.div>

        {/* Bookings List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 dark:border dark:border-rose-900/20 shadow-md bg-white dark:bg-card">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Skeleton className="w-24 h-24 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-12 text-center border-dashed border-2 border-rose-200 dark:border-rose-800 bg-white/50 dark:bg-card/50 shadow-none">
              {(() => {
                const config = getEmptyStateConfig()[statusFilter as keyof ReturnType<typeof getEmptyStateConfig>] || getEmptyStateConfig().upcoming
                return (
                  <>
                    <div className="bg-rose-50 dark:bg-rose-900/20 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <config.icon className="w-12 h-12 text-rose-300 dark:text-rose-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-600 dark:text-foreground mb-2">{config.title}</h3>
                    <p className="text-gray-400 dark:text-muted-foreground mb-6 max-w-sm mx-auto">{config.desc}</p>
                    {statusFilter === 'upcoming' && (
                      <Button
                        onClick={() => navigateTo('halls')}
                        className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30"
                      >
                        <Building2 className="w-4 h-4 mr-2" />
                        {t('browseHallsBtn')}
                      </Button>
                    )}
                  </>
                )
              })()}
            </Card>
          </motion.div>
        ) : viewMode === 'timeline' ? (
          /* Timeline View */
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-rose-100 dark:bg-rose-900/30" />
            <div className="space-y-6">
              <AnimatePresence>
                {bookings.map((booking, index) => {
                  const statusConfig = STATUS_CONFIG[booking.bookingStatus] || STATUS_CONFIG.upcoming
                  const hallImage = booking.hall.images?.[0]?.imageUrl
                  const StatusIcon = statusConfig.icon

                  return (
                    <motion.div
                      key={booking.bookingId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="relative pl-14"
                    >
                      {/* Timeline dot */}
                      <div className={`absolute left-4 top-4 w-5 h-5 rounded-full border-2 border-white dark:border-card shadow-md ${booking.bookingStatus === 'upcoming' ? 'bg-emerald-500' : booking.bookingStatus === 'completed' ? 'bg-gray-400 dark:bg-gray-500' : 'bg-red-500'}`} />

                      <Card className="border-0 dark:border dark:border-rose-900/20 shadow-md bg-white dark:bg-card hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-rose-100 dark:bg-rose-900/30">
                              {hallImage ? (
                                <img src={hallImage} alt={booking.hall.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Building2 className="w-6 h-6 text-rose-300 dark:text-rose-600" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h3 className="font-bold text-gray-900 dark:text-foreground truncate">{booking.hall.name}</h3>
                                <Badge className={`shrink-0 border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} ${statusConfig.darkBg || ''} ${statusConfig.darkColor || ''} ${statusConfig.darkBorder || ''} text-xs`}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusConfig.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-1">
                                <Calendar className="w-3.5 h-3.5 text-rose-400" />
                                <span>{formatShortDate(booking.bookingDate)}</span>
                                <span className="text-gray-300 dark:text-gray-600 mx-1">•</span>
                                <Users className="w-3.5 h-3.5 text-rose-400" />
                                <span>{booking.guestCount} kishi</span>
                              </div>
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-rose-50 dark:border-rose-900/20">
                                <span className="font-semibold text-rose-600 dark:text-rose-400 text-sm">{formatPrice(booking.totalPrice)}</span>
                                <div className="flex gap-1.5">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownloadReceipt(booking)}
                                    className="h-7 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 px-2"
                                  >
                                    <Download className="w-3 h-3 mr-1" />
                                    {t('receiptBtn')}
                                  </Button>
                                  {booking.bookingStatus === 'upcoming' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setCancelDialogId(booking.bookingId)}
                                      className="h-7 text-xs text-red-500 dark:text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2"
                                    >
                                      <X className="w-3 h-3 mr-1" />
                                      {t('cancelBtn')}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          /* Card View */
          <div className="space-y-4">
            <AnimatePresence>
              {bookings.map((booking, index) => {
                const statusConfig = STATUS_CONFIG[booking.bookingStatus] || STATUS_CONFIG.upcoming
                const hallImage = booking.hall.images?.[0]?.imageUrl
                const StatusIcon = statusConfig.icon

                return (
                  <motion.div
                    key={booking.bookingId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="border-0 dark:border dark:border-rose-900/20 shadow-md bg-white dark:bg-card hover:shadow-lg hover:shadow-rose-100/50 dark:hover:shadow-rose-900/20 transition-all duration-300 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex">
                          {/* Hall Image */}
                          <div className="w-28 sm:w-36 shrink-0 relative">
                            {hallImage ? (
                              <img
                                src={hallImage}
                                alt={booking.hall.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 flex items-center justify-center min-h-[140px]">
                                <Building2 className="w-8 h-8 text-rose-300 dark:text-rose-600" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 dark:to-card/10" />
                          </div>

                          {/* Booking Info */}
                          <div className="flex-1 min-w-0 p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-bold text-gray-900 dark:text-foreground text-base truncate">
                                {booking.hall.name}
                              </h3>
                              <Badge className={`shrink-0 border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} ${statusConfig.darkBg || ''} ${statusConfig.darkColor || ''} ${statusConfig.darkBorder || ''} text-xs`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                            </div>

                            <div className="space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <span>{formatDate(booking.bookingDate)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <span className="truncate">{booking.hall.district}, {booking.hall.address}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <span>{booking.guestCount} kishi</span>
                              </div>
                            </div>

                            {/* Services */}
                            {booking.services.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {booking.services.map((service) => {
                                  const IconComp = SERVICE_ICONS[service.serviceType] || Music
                                  return (
                                    <Badge
                                      key={service.bookingServiceId}
                                      variant="outline"
                                      className="text-xs bg-rose-50/50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-300 py-0"
                                    >
                                      <IconComp className="w-3 h-3 mr-0.5" />
                                      {SERVICE_LABELS[service.serviceType] || service.serviceType}
                                    </Badge>
                                  )
                                })}
                              </div>
                            )}

                            {/* Price & Actions */}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-rose-50 dark:border-rose-900/20">
                              <div className="space-y-0.5">
                                <div className="text-sm">
                                  <span className="text-gray-500 dark:text-gray-400">{t('totalLabel')}: </span>
                                  <span className="font-bold text-rose-600 dark:text-rose-400">
                                    {formatPrice(booking.totalPrice)}
                                  </span>
                                </div>
                                <div className="text-xs">
                                  <span className="text-gray-400 dark:text-gray-500">{t('advanceLabel')}: </span>
                                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                                    {formatPrice(booking.advancePayment)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadReceipt(booking)}
                                  className="border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 h-8 text-xs"
                                >
                                  <FileText className="w-3.5 h-3.5 mr-1" />
                                  {t('receiptBtn')}
                                </Button>
                                {booking.bookingStatus === 'upcoming' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCancelDialogId(booking.bookingId)}
                                    className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 h-8 text-xs"
                                  >
                                    <X className="w-3.5 h-3.5 mr-1" />
                                    {t('cancelBtn')}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Cancel Confirmation Dialog */}
        <AlertDialog open={!!cancelDialogId} onOpenChange={(open) => !open && setCancelDialogId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('cancelDialogTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('cancelDialogDesc')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={cancelling}>{t('keepBookingBtn')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('cancellingText')}
                  </>
                ) : (
                  t('confirmCancelBtn')
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
