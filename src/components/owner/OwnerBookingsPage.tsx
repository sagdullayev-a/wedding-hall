'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { CalendarDays, Users, DollarSign, XCircle, ClipboardList } from 'lucide-react'
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

const statusConfig: Record<string, { label: string; className: string }> = {
  upcoming: { label: 'Kutilmoqda', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  completed: { label: 'Tugallangan', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100' },
  cancelled: { label: 'Bekor qilingan', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
}

export default function OwnerBookingsPage() {
  const { token } = useAppStore()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    api.setToken(token)
    loadBookings()
  }, [token])

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-56 mb-6" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Bronlar</h1>
          <p className="text-gray-500 mt-1">To&apos;yxonalarizga qilingan bronlar</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-emerald-700">{upcomingCount}</p>
              <p className="text-xs text-emerald-600">Kutilmoqda</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-gray-700">{completedCount}</p>
              <p className="text-xs text-gray-600">Tugallangan</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-red-700">{cancelledCount}</p>
              <p className="text-xs text-red-600">Bekor qilingan</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-4 bg-white shadow-sm">
              <TabsTrigger value="upcoming">Kutilmoqda</TabsTrigger>
              <TabsTrigger value="completed">Tugallangan</TabsTrigger>
              <TabsTrigger value="cancelled">Bekor</TabsTrigger>
              <TabsTrigger value="all">Barchasi</TabsTrigger>
            </TabsList>

            {['upcoming', 'completed', 'cancelled', 'all'].map(tab => (
              <TabsContent key={tab} value={tab}>
                <AnimatePresence mode="wait">
                  {filteredBookings.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Card className="border-dashed border-2 border-rose-200 bg-white/50">
                        <CardContent className="p-12 text-center">
                          <div className="bg-rose-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                            <ClipboardList className="w-10 h-10 text-rose-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-700 mb-2">Bronlar yo&apos;q</h3>
                          <p className="text-gray-500">Bu toifada hali bronlar mavjud emas</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      {filteredBookings.map((booking, index) => {
                        const status = statusConfig[booking.bookingStatus] || statusConfig.upcoming
                        return (
                          <motion.div
                            key={booking.bookingId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                          >
                            <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-bold text-gray-900">
                                        {booking.hall?.name || 'Noma\'lum to\'yxona'}
                                      </h3>
                                      <Badge className={status.className}>{status.label}</Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
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
                                      <p className="text-sm text-gray-500">
                                        Mijoz: {booking.customer.firstName} {booking.customer.lastName}
                                      </p>
                                    )}
                                    <p className="text-xs text-gray-400">
                                      Oldindan to&apos;lov: {formatPrice(booking.advancePayment)}
                                    </p>
                                  </div>
                                  {booking.bookingStatus === 'upcoming' && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
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
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </AnimatePresence>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
