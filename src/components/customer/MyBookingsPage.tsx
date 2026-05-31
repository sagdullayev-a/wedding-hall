'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Users, Building2, Music, Utensils, Car, X,
  ChevronLeft, Clock, AlertCircle, Loader2, PartyPopper
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  upcoming: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', label: 'Upcoming' },
  completed: { color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200', label: 'Completed' },
  cancelled: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', label: 'Cancelled' },
}

const SERVICE_ICONS: Record<string, typeof Music> = {
  singer: Music,
  menu: Utensils,
  car: Car,
  karnay_surnay: Music,
}

const SERVICE_LABELS: Record<string, string> = {
  singer: 'Singer',
  menu: 'Menu',
  car: 'Car',
  karnay_surnay: 'Karnay-Surnay',
}

export default function MyBookingsPage() {
  const { navigateTo, token } = useAppStore()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('upcoming')
  const [cancelDialogId, setCancelDialogId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const loadBookings = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const res = await api.getMyBookings({ status: statusFilter, limit: 50 })
      setBookings(res.bookings || [])
    } catch (error) {
      console.error('Failed to load bookings:', error)
    } finally {
      setLoading(false)
    }
  }, [token, statusFilter])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  const handleCancelBooking = async () => {
    if (!cancelDialogId) return
    try {
      setCancelling(true)
      await api.cancelBooking(cancelDialogId)
      toast.success('Booking cancelled successfully')
      setCancelDialogId(null)
      loadBookings()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to cancel booking'
      toast.error(message)
    } finally {
      setCancelling(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white">
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
            className="mb-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-0"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Home
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
              My Bookings
            </span>
          </h1>
          <p className="text-muted-foreground mt-1">Manage your wedding hall reservations</p>
        </motion.div>

        {/* Status Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-6">
          <TabsList className="bg-rose-50">
            <TabsTrigger
              value="upcoming"
              className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
            >
              <Clock className="w-4 h-4 mr-1.5" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="data-[state=active]:bg-gray-500 data-[state=active]:text-white"
            >
              <PartyPopper className="w-4 h-4 mr-1.5" />
              Completed
            </TabsTrigger>
            <TabsTrigger
              value="cancelled"
              className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
            >
              <X className="w-4 h-4 mr-1.5" />
              Cancelled
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Bookings List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-rose-100">
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
            <Card className="p-12 text-center border-rose-100">
              <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                {statusFilter === 'upcoming' ? (
                  <Calendar className="w-10 h-10 text-rose-300" />
                ) : statusFilter === 'completed' ? (
                  <PartyPopper className="w-10 h-10 text-rose-300" />
                ) : (
                  <AlertCircle className="w-10 h-10 text-rose-300" />
                )}
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {statusFilter === 'upcoming' && 'No Upcoming Bookings'}
                {statusFilter === 'completed' && 'No Completed Bookings'}
                {statusFilter === 'cancelled' && 'No Cancelled Bookings'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {statusFilter === 'upcoming'
                  ? 'Start planning your dream wedding by booking a hall!'
                  : `You don't have any ${statusFilter} bookings yet.`}
              </p>
              {statusFilter === 'upcoming' && (
                <Button
                  onClick={() => navigateTo('halls')}
                  className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Browse Halls
                </Button>
              )}
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {bookings.map((booking, index) => {
                const statusConfig = STATUS_CONFIG[booking.bookingStatus] || STATUS_CONFIG.upcoming
                const hallImage = booking.hall.images?.[0]?.imageUrl

                return (
                  <motion.div
                    key={booking.bookingId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="border-rose-100 hover:shadow-md hover:shadow-rose-100/50 transition-all duration-300 overflow-hidden">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex gap-4">
                          {/* Hall Image */}
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-rose-100">
                            {hallImage ? (
                              <img
                                src={hallImage}
                                alt={booking.hall.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building2 className="w-8 h-8 text-rose-300" />
                              </div>
                            )}
                          </div>

                          {/* Booking Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-semibold text-base truncate">
                                {booking.hall.name}
                              </h3>
                              <Badge
                                className={`shrink-0 border ${statusConfig.bg} ${statusConfig.color} text-xs`}
                              >
                                {statusConfig.label}
                              </Badge>
                            </div>

                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <span>{formatDate(booking.bookingDate)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <span>{booking.guestCount} guests</span>
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
                                      className="text-xs bg-rose-50/50 border-rose-100 text-rose-700"
                                    >
                                      <IconComp className="w-3 h-3 mr-0.5" />
                                      {SERVICE_LABELS[service.serviceType] || service.serviceType}
                                    </Badge>
                                  )
                                })}
                              </div>
                            )}

                            {/* Price & Actions */}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-rose-50">
                              <div className="space-y-0.5">
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Total: </span>
                                  <span className="font-semibold text-rose-600">
                                    {formatPrice(booking.totalPrice)}
                                  </span>
                                </div>
                                <div className="text-xs">
                                  <span className="text-muted-foreground">Advance Paid: </span>
                                  <span className="font-medium text-amber-600">
                                    {formatPrice(booking.advancePayment)}
                                  </span>
                                </div>
                              </div>

                              {booking.bookingStatus === 'upcoming' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCancelDialogId(booking.bookingId)}
                                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                  <X className="w-3.5 h-3.5 mr-1" />
                                  Cancel
                                </Button>
                              )}
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
              <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel this booking? This action cannot be undone.
                Your advance payment may not be refundable.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={cancelling}>Keep Booking</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Yes, Cancel Booking'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
