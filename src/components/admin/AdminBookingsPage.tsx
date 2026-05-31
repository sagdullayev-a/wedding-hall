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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search, XCircle, CalendarDays, ChevronLeft, ChevronRight, ClipboardList,
  CheckCircle2, Clock, ArrowRight, AlertCircle
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

const STATUS_OPTIONS = [
  { value: 'completed', label: 'Tugallangan (Completed)', icon: CheckCircle2, color: 'text-gray-600' },
  { value: 'cancelled', label: 'Bekor Qilingan (Cancelled)', icon: XCircle, color: 'text-red-600' },
]

export default function AdminBookingsPage() {
  const { token } = useAppStore()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [hallSearch, setHallSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  // Status change state
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [changingStatus, setChangingStatus] = useState(false)

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

  const handleStatusChange = async () => {
    if (!selectedBooking || !newStatus) return

    try {
      setChangingStatus(true)
      await api.updateBookingStatus(selectedBooking.bookingId, newStatus)
      setBookings(prev =>
        prev.map(b =>
          b.bookingId === selectedBooking.bookingId ? { ...b, bookingStatus: newStatus } : b
        )
      )
      toast.success(`Bron holati muvaffaqiyatli o'zgartirildi`)
      setStatusChangeDialogOpen(false)
      setSelectedBooking(null)
      setNewStatus('')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Holatni o\'zgartirishda xatolik'
      toast.error(message)
    } finally {
      setChangingStatus(false)
    }
  }

  const openStatusDialog = (booking: Booking) => {
    setSelectedBooking(booking)
    setNewStatus('')
    setStatusChangeDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-background dark:via-background dark:to-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-foreground">Bronlar Boshqaruvi</h1>
          <p className="text-gray-500 dark:text-muted-foreground mt-1">Barcha bronlarni ko&apos;rish va boshqarish</p>
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
              className="pl-10 border-rose-200 focus:border-rose-400 bg-white dark:bg-card"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 border-rose-200 bg-white dark:bg-card">
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
          <Card className="shadow-md border-0 dark:border dark:border-rose-900/20">
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
                      <tr className="border-b border-rose-100 dark:border-rose-900/20 bg-rose-50/50 dark:bg-rose-900/10">
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-muted-foreground">To&apos;yxona</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-muted-foreground">Mijoz</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-muted-foreground">Sana</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-muted-foreground">Mehmonlar</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-muted-foreground">Jami Narx</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-muted-foreground">Oldindan</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-muted-foreground">Holat</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-muted-foreground">Amallar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking) => {
                        const status = statusConfig[booking.bookingStatus] || statusConfig.upcoming
                        return (
                          <tr key={booking.bookingId} className="border-b border-rose-50 dark:border-rose-900/20 hover:bg-rose-50/30 dark:hover:bg-rose-900/10 transition-colors">
                            <td className="py-3 px-4 font-medium text-gray-900 dark:text-foreground">
                              {booking.hall?.name || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-gray-600 dark:text-muted-foreground">
                              {booking.customer
                                ? `${booking.customer.firstName} ${booking.customer.lastName}`
                                : 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-gray-600 dark:text-muted-foreground">{formatDate(booking.bookingDate)}</td>
                            <td className="py-3 px-4 text-gray-600 dark:text-muted-foreground">{booking.guestCount}</td>
                            <td className="py-3 px-4 text-gray-600 dark:text-muted-foreground">{formatPrice(booking.totalPrice)}</td>
                            <td className="py-3 px-4 text-gray-600 dark:text-muted-foreground">{formatPrice(booking.advancePayment)}</td>
                            <td className="py-3 px-4">
                              <Badge className={status.className}>{status.label}</Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1">
                                {booking.bookingStatus === 'upcoming' && (
                                  <>
                                    {/* Quick Status Change */}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openStatusDialog(booking)}
                                      className="text-amber-600 border-amber-200 dark:border-amber-900/30 hover:bg-amber-50 dark:hover:bg-amber-900/10 h-8 text-xs"
                                    >
                                      <ArrowRight className="w-3.5 h-3.5 mr-1" />
                                      O&apos;zgartirish
                                    </Button>
                                    {/* Cancel Button */}
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="text-red-600 border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10 h-8"
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
                                  </>
                                )}
                                {booking.bookingStatus === 'completed' && (
                                  <Badge className="bg-gray-100 text-gray-500 text-xs">Tugallangan</Badge>
                                )}
                                {booking.bookingStatus === 'cancelled' && (
                                  <Badge className="bg-red-100 text-red-500 text-xs">Bekor</Badge>
                                )}
                              </div>
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
                <div className="flex items-center justify-between p-4 border-t border-rose-100 dark:border-rose-900/20">
                  <p className="text-sm text-gray-500 dark:text-muted-foreground">
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

      {/* Status Change Dialog */}
      <Dialog open={statusChangeDialogOpen} onOpenChange={setStatusChangeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Change Booking Status
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 pt-2">
              {/* Booking Summary */}
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30">
                <p className="font-medium text-sm">{selectedBooking.hall?.name || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedBooking.customer?.firstName} {selectedBooking.customer?.lastName} &middot; {formatDate(selectedBooking.bookingDate)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={statusConfig[selectedBooking.bookingStatus]?.className}>
                    {statusConfig[selectedBooking.bookingStatus]?.label}
                  </Badge>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">New Status</span>
                </div>
              </div>

              {/* Status Options */}
              <div className="space-y-2">
                {STATUS_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setNewStatus(option.value)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      newStatus === option.value
                        ? 'border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20 shadow-sm'
                        : 'border-rose-100 dark:border-rose-900/30 hover:bg-rose-50/50 dark:hover:bg-rose-900/10'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      newStatus === option.value ? 'bg-rose-500 text-white' : 'bg-rose-100 dark:bg-rose-900/30'
                    }`}>
                      <option.icon className="w-4 h-4" />
                    </div>
                    <span className={`text-sm font-medium ${
                      newStatus === option.value ? 'text-rose-700 dark:text-rose-300' : ''
                    }`}>
                      {option.label}
                    </span>
                    {newStatus === option.value && (
                      <CheckCircle2 className="w-4 h-4 text-rose-500 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              variant="outline"
              onClick={() => setStatusChangeDialogOpen(false)}
              className="border-rose-200 dark:border-rose-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={changingStatus || !newStatus}
              className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white"
            >
              {changingStatus ? 'Changing...' : 'Change Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
