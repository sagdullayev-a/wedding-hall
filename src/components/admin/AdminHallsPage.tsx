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
  Search, CheckCircle, Trash2, Building2, ChevronLeft, ChevronRight
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface HallOwner {
  firstName: string
  lastName: string
}

interface HallItem {
  hallId: string
  name: string
  district: string
  capacity: number
  seatPrice: number
  status: string
  owner?: HallOwner
  _count?: { images: number }
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('uz-UZ').format(price) + " so'm"
}

export default function AdminHallsPage() {
  const { token } = useAppStore()
  const [halls, setHalls] = useState<HallItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [approving, setApproving] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const limit = 10

  const loadHalls = useCallback(async () => {
    try {
      setLoading(true)
      const params: Record<string, string | number | undefined> = {
        page,
        limit,
      }
      if (search) params.search = search
      if (statusFilter !== 'all') params.status = statusFilter
      const data = await api.getAdminHalls(params)
      setHalls(data.halls || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch {
      toast.error('To\'yxonalarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }, [token, page, search, statusFilter])

  useEffect(() => {
    api.setToken(token)
    loadHalls()
  }, [loadHalls])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  const handleApprove = async (hallId: string) => {
    try {
      setApproving(hallId)
      await api.approveHall(hallId)
      setHalls(prev =>
        prev.map(h => h.hallId === hallId ? { ...h, status: 'approved' } : h)
      )
      toast.success('To\'yxona tasdiqlandi')
    } catch {
      toast.error('Tasdiqlashda xatolik')
    } finally {
      setApproving(null)
    }
  }

  const handleDelete = async (hallId: string) => {
    try {
      setDeleting(hallId)
      await api.deleteHall(hallId)
      setHalls(prev => prev.filter(h => h.hallId !== hallId))
      toast.success('To\'yxona o\'chirildi')
    } catch {
      toast.error('O\'chirishda xatolik')
    } finally {
      setDeleting(null)
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">To&apos;yxonalar Boshqaruvi</h1>
          <p className="text-gray-500 mt-1">Barcha to&apos;yxonalarni ko&apos;rish va boshqarish</p>
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
              placeholder="To'yxona nomi bo'yicha qidirish..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 border-rose-200 focus:border-rose-400 bg-white"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 border-rose-200 bg-white">
              <SelectValue placeholder="Holat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="pending">Kutilmoqda</SelectItem>
              <SelectItem value="approved">Tasdiqlangan</SelectItem>
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
              ) : halls.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>To&apos;yxonalar topilmadi</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-rose-100 bg-rose-50/50">
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Nomi</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Ega</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Tuman</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Sig&apos;imi</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Narx</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Holat</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Amallar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {halls.map((hall) => (
                        <tr key={hall.hallId} className="border-b border-rose-50 hover:bg-rose-50/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900">{hall.name}</td>
                          <td className="py-3 px-4 text-gray-600">
                            {hall.owner ? `${hall.owner.firstName} ${hall.owner.lastName}` : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-gray-600">{hall.district}</td>
                          <td className="py-3 px-4 text-gray-600">{hall.capacity}</td>
                          <td className="py-3 px-4 text-gray-600">{formatPrice(hall.seatPrice)}</td>
                          <td className="py-3 px-4">
                            <Badge
                              className={
                                hall.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                              }
                            >
                              {hall.status === 'approved' ? 'Tasdiqlangan' : 'Kutilmoqda'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {hall.status === 'pending' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(hall.hallId)}
                                  disabled={approving === hall.hallId}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white h-8"
                                >
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                  Tasdiqlash
                                </Button>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-200 hover:bg-red-50 h-8"
                                    disabled={deleting === hall.hallId}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>To&apos;yxonani o&apos;chirish</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      &quot;{hall.name}&quot; to&apos;yxonasini o&apos;chirishni xohlaysizmi? Bu amalni qaytarib bo&apos;lmaydi.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Bekor Qilish</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(hall.hallId)}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      O&apos;chirish
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      ))}
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
