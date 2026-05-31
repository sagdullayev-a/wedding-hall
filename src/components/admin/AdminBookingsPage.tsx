'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search, XCircle, CalendarDays, ChevronLeft, ChevronRight, ClipboardList
} from 'lucide-react'
import { motion } from 'framer-motion'
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
  hall?: { name: string }
  customer?: { firstName: string; lastName: string }
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('uz-UZ').format(price) + " so'm"
}

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

const statusConfig: Record<string, { label: string; className: string }> = {
  upcoming: { label: 'Kutilmoqda', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  completed: { label: 'Tugallangan', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100' },
  cancelled: { label: 'Bekor', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
}

export default function AdminBookingsPage() {
  const { token } = useAppStore()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [hallSearch, setHallSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const limit = 10

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true)
      const params: Record<string, string | number | undefined> = {
        page,
        limit,
      }
      if (statusFilter !== 'all') params.status = statusFilter
      if (hallSearch) params.hallId = hallSearch
      const data = await api.getAdminBookings(params)
      setBookings(data.bookings || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch {
      toast.error('Bronlarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }, [token, page, statusFilter, hallSearch])

  useEffect(() => {
    api.setToken(token)
    loadBookings()
  }, [loadBookings])

  useEffect(() => {
    setPage(1)
  }, [statusFilter])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Bronlar Boshqaruvi</h1>
          <p className="text-gray-500 mt-1">Barcha bronlarni ko&apos;rish va boshqarish</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 mb-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="To'yxona ID bo'yicha qidirish..."
              value={hallSearch}
              onChange={e => setHallSearch(e.target.value)}
              className="pl-10 border-rose-200 focus:border-rose-400 bg-white"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 border-rose-200 bg-white">
              <SelectValue placeholder="Holat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="upcoming">Kutilmoqda</SelectItem>
              <SelectItem value="completed">Tugallangan</SelectItem>
              <SelectItem value="cancelled">Bekor Qilingan</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="shadow-md border-0">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14" />)}
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Bronlar topilmadi</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-rose-100 bg-rose-50/50">
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">To&apos;yxona</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Mijoz</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Sana</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Mehmonlar</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Jami Narx</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Oldindan</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Holat</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Amallar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking) => {
                        const status = statusConfig[booking.bookingStatus] || statusConfig.upcoming
                        return (
                          <tr key={booking.bookingId} className="border-b border-rose-50 hover:bg-rose-50/30 transition-colors">
                            <td className="py-3 px-4 font-medium text-gray-900">
                              {booking.hall?.name || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {booking.customer
                                ? `${booking.customer.firstName} ${booking.customer.lastName}`
                                : 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-gray-600">{formatDate(booking.bookingDate)}</td>
                            <td className="py-3 px-4 text-gray-600">{booking.guestCount}</td>
                            <td className="py-3 px-4 text-gray-600">{formatPrice(booking.totalPrice)}</td>
                            <td className="py-3 px-4 text-gray-600">{formatPrice(booking.advancePayment)}</td>
                            <td className="py-3 px-4">
                              <Badge className={status.className}>{status.label}</Badge>
                            </td>
                            <td className="py-3 px-4">
                              {booking.bookingStatus === 'upcoming' && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 border-red-200 hover:bg-red-50 h-8"
                                      disabled={cancellingId === booking.bookingId}
                                    >
                                      <XCircle className="w-3.5 h-3.5 mr-1" />
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
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-rose-100">
                  <p className="text-sm text-gray-500">
                    Sahifa {page} / {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="border-rose-200"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="border-rose-200"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
