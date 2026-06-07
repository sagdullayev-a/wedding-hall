'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import {
  CalendarDays, Users, DollarSign, XCircle, ClipboardList,
  TrendingUp, Clock, CheckCircle2, AlertCircle, BarChart3, ArrowUpRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

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
  hall?: { name: string; district: string }
  customer?: { firstName: string; lastName: string }
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('uz-UZ').format(price) + " so'm"
}

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return dateStr
  }
}

const statusConfig: Record<string, { label: string; className: string; darkClassName: string; icon: typeof Clock }> = {
  upcoming: {
    label: 'Kutilmoqda',
    className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
    darkClassName: 'dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    icon: Clock,
  },
  completed: {
    label: 'Tugallangan',
    className: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
    darkClassName: 'dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Bekor qilingan',
    className: 'bg-red-100 text-red-700 hover:bg-red-100',
    darkClassName: 'dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    icon: AlertCircle,
  },
}

export default function OwnerBookingsPage() {
  const { token } = useAppStore()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'timeline'>('cards')

  const loadBookings = async () => {
    try {
      setLoading(true)
      const data = await api.getBookings()
      setBookings(data.bookings || [])
    } catch {
      toast.error('Bronlarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    api.setToken(token)
    const timer = setTimeout(() => {
      loadBookings()
    }, 0)
    return () => clearTimeout(timer)
  }, [token])

  const handleCancel = async (bookingId: string) => {
    try {
      setCancellingId(bookingId)
      await api.cancelBooking(bookingId)
      setBookings(prev =>
        prev.map(b => b.bookingId === bookingId ? { ...b, bookingStatus: 'cancelled' } : b)
      )
      toast.success('Bron muvaffaqiyatli bekor qilindi')
    } catch {
      toast.error('Bronni bekor qilishda xatolik')
    } finally {
      setCancellingId(null)
    }
  }

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'all') return true
    return b.bookingStatus === activeTab
  })

  const upcomingCount = bookings.filter(b => b.bookingStatus === 'upcoming').length
  const completedCount = bookings.filter(b => b.bookingStatus === 'completed').length
  const cancelledCount = bookings.filter(b => b.bookingStatus === 'cancelled').length
  const totalRevenue = bookings
    .filter(b => b.bookingStatus !== 'cancelled')
    .reduce((sum, b) => sum + b.totalPrice, 0)
  const upcomingRevenue = bookings
    .filter(b => b.bookingStatus === 'upcoming')
    .reduce((sum, b) => sum + b.advancePayment, 0)

  // Monthly revenue calculation
  const monthlyRevenue: Record<string, number> = {}
  bookings.filter(b => b.bookingStatus !== 'cancelled').forEach(b => {
    const date = new Date(b.bookingDate)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthlyRevenue[key] = (monthlyRevenue[key] || 0) + b.totalPrice
  })
  const maxMonthlyRevenue = Math.max(...Object.values(monthlyRevenue), 1)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-background dark:via-background dark:to-background p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-56 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-background dark:via-background dark:to-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-foreground">Bronlar</h1>
          <p className="text-gray-500 dark:text-muted-foreground mt-1">To&apos;yxonalaringizga qilingan bronlar</p>
        </motion.div>

        {/* Quick Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
        >
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200 dark:from-emerald-950/30 dark:to-emerald-900/10 dark:border-emerald-800/30 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-200/30 dark:bg-emerald-800/10 rounded-bl-full" />
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-200/50 dark:bg-emerald-800/30 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Kutilmoqda</span>
              </div>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{upcomingCount}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200 dark:from-gray-900/30 dark:to-gray-800/10 dark:border-gray-700/30 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gray-200/30 dark:bg-gray-700/10 rounded-bl-full" />
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gray-200/50 dark:bg-gray-700/30 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Tugallangan</span>
              </div>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{completedCount}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200 dark:from-rose-950/30 dark:to-rose-900/10 dark:border-rose-800/30 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-16 h-16 bg-rose-200/30 dark:bg-rose-800/10 rounded-bl-full" />
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-rose-200/50 dark:bg-rose-800/30 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </div>
                <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Jami Daromad</span>
              </div>
              <p className="text-lg font-bold text-rose-700 dark:text-rose-300">{formatPrice(totalRevenue)}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200 dark:from-amber-950/30 dark:to-amber-900/10 dark:border-amber-800/30 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-200/30 dark:bg-amber-800/10 rounded-bl-full" />
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-200/50 dark:bg-amber-800/30 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Oldindan</span>
              </div>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{formatPrice(upcomingRevenue)}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Revenue Chart */}
        {Object.keys(monthlyRevenue).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Card className="border-0 dark:border dark:border-rose-900/20 bg-white dark:bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-foreground flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-rose-500" />
                    Oylik Daromad
                  </h3>
                  <Badge variant="outline" className="text-xs border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    {Object.keys(monthlyRevenue).length} oy
                  </Badge>
                </div>
                <div className="flex items-end gap-2 h-32">
                  {Object.entries(monthlyRevenue)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([month, revenue], index) => {
                      const height = Math.max(8, (revenue / maxMonthlyRevenue) * 100)
                      const monthLabel = month.split('-')[1]
                      return (
                        <div key={month} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {new Intl.NumberFormat('uz-UZ', { notation: 'compact' }).format(revenue)}
                          </span>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
                            className="w-full bg-gradient-to-t from-rose-500 to-pink-400 dark:from-rose-600 dark:to-pink-500 rounded-t-md min-h-[8px]"
                          />
                          <span className="text-[10px] text-muted-foreground">
                            {monthLabel}
                          </span>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* View Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="flex items-center justify-between mb-4"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white dark:bg-card shadow-sm">
              <TabsTrigger value="upcoming" className="text-xs">Kutilmoqda ({upcomingCount})</TabsTrigger>
              <TabsTrigger value="completed" className="text-xs">Tugallangan ({completedCount})</TabsTrigger>
              <TabsTrigger value="cancelled" className="text-xs">Bekor ({cancelledCount})</TabsTrigger>
              <TabsTrigger value="all" className="text-xs">Barchasi</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-1 bg-white dark:bg-card rounded-lg p-1 shadow-sm">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className={viewMode === 'cards' ? 'bg-rose-500 text-white h-7 text-xs' : 'h-7 text-xs'}
            >
              Kartalar
            </Button>
            <Button
              variant={viewMode === 'timeline' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('timeline')}
              className={viewMode === 'timeline' ? 'bg-rose-500 text-white h-7 text-xs' : 'h-7 text-xs'}
            >
              Timeline
            </Button>
          </div>
        </motion.div>

        {/* Content */}
        <div>
            <AnimatePresence mode="wait">
              {filteredBookings.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="border-dashed border-2 border-rose-200 dark:border-rose-800 bg-white/50 dark:bg-rose-900/10">
                    <CardContent className="p-12 text-center">
                      <div className="bg-rose-100 dark:bg-rose-900/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                        <ClipboardList className="w-10 h-10 text-rose-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-foreground mb-2">Bronlar yo&apos;q</h3>
                      <p className="text-gray-500 dark:text-muted-foreground">Bu toifada hali bronlar mavjud emas</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : viewMode === 'timeline' ? (
                /* Timeline View */
                <div className="relative pl-6 border-l-2 border-rose-200 dark:border-rose-900/30 space-y-6">
                  {filteredBookings.map((booking, index) => {
                    const status = statusConfig[booking.bookingStatus] || statusConfig.upcoming
                    const StatusIcon = status.icon
                    return (
                      <motion.div
                        key={booking.bookingId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative"
                      >
                        {/* Timeline dot */}
                        <div className={`absolute -left-8 top-2 w-4 h-4 rounded-full border-2 ${
                          booking.bookingStatus === 'upcoming'
                            ? 'bg-emerald-500 border-emerald-300 dark:border-emerald-700'
                            : booking.bookingStatus === 'completed'
                            ? 'bg-gray-400 border-gray-300 dark:border-gray-600'
                            : 'bg-red-500 border-red-300 dark:border-red-700'
                        }`} />

                        <Card className="shadow-sm border-0 dark:border dark:border-rose-900/20 bg-white dark:bg-card hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                  <StatusIcon className="w-4 h-4 text-muted-foreground" />
                                  <h3 className="font-bold text-gray-900 dark:text-foreground text-sm">
                                    {booking.hall?.name || 'Noma\'lum to\'yxona'}
                                  </h3>
                                  <Badge className={`${status.className} ${status.darkClassName}`}>
                                    {status.label}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <CalendarDays className="w-3.5 h-3.5 text-rose-400" />
                                    {formatDate(booking.bookingDate)}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5 text-rose-400" />
                                    {booking.guestCount} kishi
                                  </div>
                                </div>
                                {booking.customer && (
                                  <p className="text-sm text-gray-500 dark:text-muted-foreground">
                                    Mijoz: {booking.customer.firstName} {booking.customer.lastName}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 pt-1">
                                  <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                                    {formatPrice(booking.totalPrice)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Oldindan: {formatPrice(booking.advancePayment)}
                                  </span>
                                </div>
                              </div>
                              {booking.bookingStatus === 'upcoming' && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-700 shrink-0"
                                      disabled={cancellingId === booking.bookingId}
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Bekor
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Bronni bekor qilish</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Rostdan ham bu bronni bekor qilmoqchimisiz? Bu amalni qaytarib bo&apos;lmaydi.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Yo&apos;q</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleCancel(booking.bookingId)}
                                        className="bg-red-500 hover:bg-red-600"
                                      >
                                        Ha, Bekor Qilish
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                /* Cards View */
                <div className="space-y-3">
                  {filteredBookings.map((booking, index) => {
                    const status = statusConfig[booking.bookingStatus] || statusConfig.upcoming
                    const StatusIcon = status.icon
                    const isUpcoming = booking.bookingStatus === 'upcoming'
                    return (
                      <motion.div
                        key={booking.bookingId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Card className={`shadow-sm border-0 dark:border dark:border-rose-900/20 bg-white dark:bg-card hover:shadow-md transition-all ${
                          isUpcoming ? 'border-l-4 border-l-emerald-400 dark:border-l-emerald-500' : ''
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-gray-900 dark:text-foreground">
                                    {booking.hall?.name || 'Noma\'lum to\'yxona'}
                                  </h3>
                                  <Badge className={`${status.className} ${status.darkClassName}`}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {status.label}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <CalendarDays className="w-3.5 h-3.5 text-rose-400" />
                                    {formatDate(booking.bookingDate)}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5 text-rose-400" />
                                    {booking.guestCount} kishi
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="w-3.5 h-3.5 text-rose-400" />
                                    {formatPrice(booking.totalPrice)}
                                  </div>
                                </div>
                                {booking.customer && (
                                  <p className="text-sm text-gray-500 dark:text-muted-foreground">
                                    Mijoz: {booking.customer.firstName} {booking.customer.lastName}
                                  </p>
                                )}
                                <p className="text-xs text-gray-400 dark:text-muted-foreground">
                                  Oldindan to&apos;lov: {formatPrice(booking.advancePayment)}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {isUpcoming && (
                                  <>
                                    <div className="w-24">
                                      <p className="text-[10px] text-muted-foreground mb-1">To'lov</p>
                                      <Progress value={20} className="h-1.5" />
                                      <p className="text-[10px] text-muted-foreground mt-0.5">20% oldindan</p>
                                    </div>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="text-red-600 border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-700"
                                          disabled={cancellingId === booking.bookingId}
                                        >
                                          <XCircle className="w-4 h-4 mr-1" />
                                          Bekor Qilish
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Bronni bekor qilish</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Rostdan ham bu bronni bekor qilmoqchimisiz? Bu amalni qaytarib bo&apos;lmaydi.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Yo&apos;q</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleCancel(booking.bookingId)}
                                            className="bg-red-500 hover:bg-red-600"
                                          >
                                            Ha, Bekor Qilish
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                                {!isUpcoming && booking.bookingStatus === 'completed' && (
                                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Tugallangan
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </AnimatePresence>
          </div>
      </div>
    </div>
  )
}
