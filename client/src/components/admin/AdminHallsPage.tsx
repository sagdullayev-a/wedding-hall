'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search, CheckCircle, Trash2, Building2, ChevronLeft, ChevronRight,
  Eye, CheckCheck, MapPin, Users, DollarSign, Sparkles, X, Loader2, Clock, Plus
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface HallOwner {
  userId?: string
  firstName: string
  lastName: string
}

interface HallImage {
  imageId: string
  imageUrl: string
}

interface HallItem {
  hallId: string
  name: string
  district: string
  address: string
  capacity: number
  seatPrice: number
  status: string
  owner?: HallOwner
  images?: HallImage[]
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkApproving, setBulkApproving] = useState(false)
  const [previewHall, setPreviewHall] = useState<HallItem | null>(null)
  const [owners, setOwners] = useState<{ userId: string; firstName: string; lastName: string }[]>([])
  const [assigningOwnerId, setAssigningOwnerId] = useState<string>('')
  const [isAssigning, setIsAssigning] = useState(false)

  // Add Hall dialog state
  const [addHallOpen, setAddHallOpen] = useState(false)
  const [addHallSubmitting, setAddHallSubmitting] = useState(false)
  const [addHallForm, setAddHallForm] = useState({
    name: '', district: '', address: '', capacity: '', seatPrice: '', phone: '',
    hasKarnaySurnay: false, karnaySurnayPrice: '', ownerId: '',
  })

  const handleAddHall = async () => {
    const { name, district, address, capacity, seatPrice, phone, ownerId } = addHallForm
    if (!name || !district || !address || !capacity || !seatPrice || !phone || !ownerId) {
      toast.error('Barcha majburiy maydonlarni to\'ldiring va egani tanlang')
      return
    }
    try {
      setAddHallSubmitting(true)
      await api.createHall({
        name, district, address,
        capacity: parseInt(capacity, 10),
        seatPrice: parseFloat(seatPrice),
        phone,
        hasKarnaySurnay: addHallForm.hasKarnaySurnay,
        karnaySurnayPrice: addHallForm.karnaySurnayPrice ? parseFloat(addHallForm.karnaySurnayPrice) : null,
        ownerId,
      })
      toast.success('To\'yxona muvaffaqiyatli qo\'shildi va tasdiqlandi')
      setAddHallOpen(false)
      setAddHallForm({ name: '', district: '', address: '', capacity: '', seatPrice: '', phone: '', hasKarnaySurnay: false, karnaySurnayPrice: '', ownerId: '' })
      loadHalls()
    } catch (err: any) {
      toast.error(err.message || 'To\'yxona qo\'shishda xatolik')
    } finally {
      setAddHallSubmitting(false)
    }
  }

  const limit = 10

  useEffect(() => {
    const fetchOwners = async () => {
      try {
        const data = await api.getAdminOwners({ limit: 100 })
        setOwners(data.owners || [])
      } catch (e) {
        console.error(e)
      }
    }
    if (token) {
      fetchOwners()
    }
  }, [token])

  const handleAssignOwner = async (hallId: string, ownerId: string) => {
    try {
      setIsAssigning(true)
      await api.updateHall(hallId, { ownerId })
      setHalls(prev =>
        prev.map(h => h.hallId === hallId ? { ...h, owner: owners.find(o => o.userId === ownerId) } : h)
      )
      toast.success('To\'yxona egasi muvaffaqiyatli o\'zgartirildi')
    } catch {
      toast.error('Egasi o\'zgartirishda xatolik yuz berdi')
    } finally {
      setIsAssigning(false)
    }
  }

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
    const timer = setTimeout(() => {
      api.setToken(token)
      loadHalls()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadHalls, token])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      setSelectedIds(new Set())
    }, 0)
    return () => clearTimeout(timer)
  }, [search, statusFilter])

  const handleApprove = async (hallId: string) => {
    try {
      setApproving(hallId)
      await api.approveHall(hallId)
      setHalls(prev =>
        prev.map(h => h.hallId === hallId ? { ...h, status: 'approved' } : h)
      )
      setSelectedIds(prev => {
        const next = new Set(prev)
        next.delete(hallId)
        return next
      })
      toast.success('To\'yxona tasdiqlandi')
    } catch {
      toast.error('Tasdiqlashda xatolik')
    } finally {
      setApproving(null)
    }
  }

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return
    try {
      setBulkApproving(true)
      let successCount = 0
      for (const hallId of selectedIds) {
        try {
          await api.approveHall(hallId)
          successCount++
        } catch {
          // continue with others
        }
      }
      setHalls(prev =>
        prev.map(h => selectedIds.has(h.hallId) ? { ...h, status: 'approved' } : h)
      )
      setSelectedIds(new Set())
      toast.success(`${successCount} ta to'yxona tasdiqlandi`)
    } catch {
      toast.error('Tasdiqlashda xatolik')
    } finally {
      setBulkApproving(false)
    }
  }

  const handleDelete = async (hallId: string) => {
    try {
      setDeleting(hallId)
      await api.deleteHall(hallId)
      setHalls(prev => prev.filter(h => h.hallId !== hallId))
      setSelectedIds(prev => {
        const next = new Set(prev)
        next.delete(hallId)
        return next
      })
      toast.success('To\'yxona o\'chirildi')
    } catch {
      toast.error('O\'chirishda xatolik')
    } finally {
      setDeleting(null)
    }
  }

  const toggleSelect = (hallId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(hallId)) next.delete(hallId)
      else next.add(hallId)
      return next
    })
  }

  const toggleSelectAll = () => {
    const pendingHallIds = halls.filter(h => h.status === 'pending').map(h => h.hallId)
    if (selectedIds.size === pendingHallIds.length && pendingHallIds.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(pendingHallIds))
    }
  }

  const pendingCount = halls.filter(h => h.status === 'pending').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-background dark:via-background dark:to-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-foreground flex items-center gap-2">
                <Building2 className="w-7 h-7 text-rose-500" />
                To&apos;yxonalar Boshqaruvi
              </h1>
              <p className="text-gray-500 dark:text-muted-foreground mt-1">Barcha to&apos;yxonalarni ko&apos;rish va boshqarish</p>
            </div>
            {/* Add Hall Button + Dialog */}
            <Dialog open={addHallOpen} onOpenChange={setAddHallOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-md shadow-rose-500/20 dark:shadow-none">
                  <Plus className="w-4 h-4 mr-2" />
                  Yangi To&apos;yxona Qo&apos;shish
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-rose-500" />
                    Yangi To&apos;yxona Qo&apos;shish
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="ah-name">To&apos;yxona nomi *</Label>
                      <Input id="ah-name" value={addHallForm.name} onChange={e => setAddHallForm(p => ({ ...p, name: e.target.value }))} className="border-rose-200 focus:border-rose-400" placeholder="Saroy To'yi" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ah-district">Tuman *</Label>
                      <Input id="ah-district" value={addHallForm.district} onChange={e => setAddHallForm(p => ({ ...p, district: e.target.value }))} className="border-rose-200 focus:border-rose-400" placeholder="Chilonzor" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ah-address">Manzil *</Label>
                    <Input id="ah-address" value={addHallForm.address} onChange={e => setAddHallForm(p => ({ ...p, address: e.target.value }))} className="border-rose-200 focus:border-rose-400" placeholder="To'liq manzil" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="ah-capacity">Sig&apos;imi (kishi) *</Label>
                      <Input id="ah-capacity" type="number" value={addHallForm.capacity} onChange={e => setAddHallForm(p => ({ ...p, capacity: e.target.value }))} className="border-rose-200 focus:border-rose-400" placeholder="500" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ah-price">Joy narxi (so&apos;m) *</Label>
                      <Input id="ah-price" type="number" value={addHallForm.seatPrice} onChange={e => setAddHallForm(p => ({ ...p, seatPrice: e.target.value }))} className="border-rose-200 focus:border-rose-400" placeholder="150000" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ah-phone">Telefon *</Label>
                    <Input id="ah-phone" value={addHallForm.phone} onChange={e => setAddHallForm(p => ({ ...p, phone: e.target.value }))} className="border-rose-200 focus:border-rose-400" placeholder="+998901234567" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ega (Owner) *</Label>
                    <Select value={addHallForm.ownerId} onValueChange={val => setAddHallForm(p => ({ ...p, ownerId: val }))}>
                      <SelectTrigger className="border-rose-200">
                        <SelectValue placeholder="Egani tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {owners.map(o => (
                          <SelectItem key={o.userId} value={o.userId}>{o.firstName} {o.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setAddHallOpen(false)} className="border-rose-200">Bekor Qilish</Button>
                  <Button onClick={handleAddHall} disabled={addHallSubmitting} className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white">
                    {addHallSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Qo&apos;shish
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
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
              className="pl-10 border-rose-200 focus:border-rose-400 bg-white dark:bg-card"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 border-rose-200 bg-white dark:bg-card">
              <SelectValue placeholder="Holat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="pending">Kutilmoqda</SelectItem>
              <SelectItem value="approved">Tasdiqlangan</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800 shadow-sm">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCheck className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">
                      {selectedIds.size} ta to&apos;yxona tanlangan
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleBulkApprove}
                      disabled={bulkApproving}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white h-8"
                    >
                      {bulkApproving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
                      Hammasini Tasdiqlash
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedIds(new Set())}
                      className="h-8 text-amber-700 hover:bg-amber-100"
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Bekor Qilish
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="shadow-md border-0 bg-white dark:bg-card dark:border dark:border-rose-900/20">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}
                </div>
              ) : halls.length === 0 ? (
                <div className="text-center py-16 text-gray-400 dark:text-muted-foreground">
                  <div className="bg-rose-50 dark:bg-rose-900/20 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-12 h-12 text-rose-300 dark:text-rose-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-500 dark:text-muted-foreground mb-1">To&apos;yxonalar topilmadi</h3>
                  <p className="text-sm text-gray-400 dark:text-muted-foreground">Qidiruv shartlarini o&apos;zgartirib ko&apos;ring</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-rose-100 dark:border-rose-900/20 bg-gradient-to-r from-rose-50/50 to-amber-50/30 dark:from-rose-900/10 dark:to-amber-900/10">
                        <th className="text-left py-3 px-3 w-10">
                          <Checkbox
                            checked={pendingCount > 0 && selectedIds.size === pendingCount}
                            onCheckedChange={toggleSelectAll}
                            className="border-rose-300"
                          />
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-muted-foreground">Nomi</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-muted-foreground">Ega</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-muted-foreground">Tuman</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-muted-foreground">Sig&apos;imi</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-muted-foreground">Narx</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-muted-foreground">Holat</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-muted-foreground">Amallar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {halls.map((hall, index) => (
                        <motion.tr
                          key={hall.hallId}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className={`border-b border-rose-50 dark:border-rose-900/10 hover:bg-rose-50/30 dark:hover:bg-rose-900/10 transition-all duration-200 ${selectedIds.has(hall.hallId) ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}
                        >
                          <td className="py-3 px-3">
                            {hall.status === 'pending' && (
                              <Checkbox
                                checked={selectedIds.has(hall.hallId)}
                                onCheckedChange={() => toggleSelect(hall.hallId)}
                                className="border-amber-400"
                              />
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => setPreviewHall(hall)}
                              className="font-medium text-gray-900 dark:text-foreground hover:text-rose-600 transition-colors flex items-center gap-1.5 group"
                            >
                              {hall.name}
                              <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-rose-400 transition-opacity" />
                            </button>
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-muted-foreground">
                            {hall.owner ? `${hall.owner.firstName} ${hall.owner.lastName}` : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-muted-foreground">{hall.district}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-muted-foreground">{hall.capacity}</td>
                          <td className="py-3 px-4 text-gray-900 dark:text-foreground font-medium">{formatPrice(hall.seatPrice)}</td>
                          <td className="py-3 px-4">
                            {hall.status === 'approved' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Tasdiqlangan
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Kutilmoqda
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPreviewHall(hall)}
                                className="text-gray-500 hover:text-rose-600 hover:bg-rose-50 h-8 w-8 p-0"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {hall.status === 'pending' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(hall.hallId)}
                                  disabled={approving === hall.hallId}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white h-8"
                                >
                                  {approving === hall.hallId ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
                                  Tasdiqlash
                                </Button>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                                    disabled={deleting === hall.hallId}
                                  >
                                    <Trash2 className="w-4 h-4" />
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
                        </motion.tr>
                      ))}
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

      {/* Hall Preview Modal */}
      <Dialog open={!!previewHall} onOpenChange={(open) => !open && setPreviewHall(null)}>
        <DialogContent className="sm:max-w-lg">
          {previewHall && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-500" />
                  To&apos;yxona Tafsilotlari
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Image */}
                <div className="rounded-xl overflow-hidden h-48 bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30">
                  {previewHall.images && previewHall.images.length > 0 ? (
                    <img
                      src={previewHall.images[0].imageUrl}
                      alt={previewHall.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-16 h-16 text-rose-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-foreground">{previewHall.name}</h3>
                    {previewHall.status === 'approved' ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Tasdiqlangan
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50">
                        <Clock className="w-3 h-3 mr-1" />
                        Kutilmoqda
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-muted-foreground">
                      <MapPin className="w-4 h-4 text-rose-400" />
                      <span>{previewHall.district}, {previewHall.address || 'Manzil ko\'rsatilmagan'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-muted-foreground">
                      <Users className="w-4 h-4 text-rose-400" />
                      <span>{previewHall.capacity} kishi sig&apos;imi</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-muted-foreground">
                      <DollarSign className="w-4 h-4 text-rose-400" />
                      <span className="font-semibold text-gray-900 dark:text-foreground">{formatPrice(previewHall.seatPrice)} / o&apos;rindiq</span>
                    </div>
                    <div className="space-y-1 mt-2">
                      <span className="text-xs font-semibold text-gray-500 dark:text-muted-foreground block">
                        To&apos;yxona Egasi:
                      </span>
                      <Select
                        value={previewHall.owner?.userId || assigningOwnerId}
                        onValueChange={(val) => {
                          setAssigningOwnerId(val)
                          handleAssignOwner(previewHall.hallId, val)
                        }}
                        disabled={isAssigning}
                      >
                        <SelectTrigger className="w-full border-rose-200 bg-white dark:bg-card h-9">
                          <SelectValue placeholder="Egani tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {owners.map(o => (
                            <SelectItem key={o.userId} value={o.userId}>
                              {o.firstName} {o.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {previewHall.status === 'pending' && (
                  <Button
                    onClick={() => {
                      handleApprove(previewHall.hallId)
                      setPreviewHall(null)
                    }}
                    disabled={approving === previewHall.hallId}
                    className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-200/50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Tasdiqlash
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
