'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import {
  Search, Plus, UserCheck, ChevronLeft, ChevronRight, Loader2, Users, Building2
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface Owner {
  userId: string
  firstName: string
  lastName: string
  email: string
  username: string
  phone: string
  _count?: { ownedHalls: number }
}

export default function AdminOwnersPage() {
  const { token } = useAppStore()
  const [owners, setOwners] = useState<Owner[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 10

  // Create owner form
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
  })

  const loadOwners = useCallback(async () => {
    try {
      setLoading(true)
      const params: Record<string, string | number | undefined> = {
        page,
        limit,
      }
      if (search) params.search = search
      const data = await api.getAdminOwners(params)
      setOwners(data.owners || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch {
      toast.error('Egalarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }, [token, page, search])

  useEffect(() => {
    const timer = setTimeout(() => {
      api.setToken(token)
      loadOwners()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadOwners, token])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
    }, 0)
    return () => clearTimeout(timer)
  }, [search])

  const handleCreateOwner = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.username || !form.password) {
      toast.error('Barcha maydonlarni to\'ldiring')
      return
    }

    try {
      setCreating(true)
      await api.createOwner(form)
      toast.success('Ega muvaffaqiyatli yaratildi')
      setDialogOpen(false)
      setForm({ firstName: '', lastName: '', email: '', phone: '', username: '', password: '' })
      loadOwners()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ega yaratishda xatolik')
    } finally {
      setCreating(false)
    }
  }

  const updateForm = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-background dark:via-background dark:to-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-foreground">Egalar Boshqaruvi</h1>
            <p className="text-gray-500 dark:text-muted-foreground mt-1">To&apos;yxona egalarini boshqarish</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-md shadow-rose-500/20 dark:shadow-none">
                <Plus className="w-4 h-4 mr-2" />
                Ega Qo&apos;shish
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Yangi Ega Yaratish</DialogTitle>
                <DialogDescription>
                  Yangi to&apos;yxona egasi hisobini yarating
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">Ism</Label>
                    <Input
                      id="firstName"
                      value={form.firstName}
                      onChange={e => updateForm('firstName', e.target.value)}
                      className="border-rose-200 focus:border-rose-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Familiya</Label>
                    <Input
                      id="lastName"
                      value={form.lastName}
                      onChange={e => updateForm('lastName', e.target.value)}
                      className="border-rose-200 focus:border-rose-400"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={e => updateForm('email', e.target.value)}
                    className="border-rose-200 focus:border-rose-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={e => updateForm('phone', e.target.value)}
                    className="border-rose-200 focus:border-rose-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="username">Foydalanuvchi nomi</Label>
                  <Input
                    id="username"
                    value={form.username}
                    onChange={e => updateForm('username', e.target.value)}
                    className="border-rose-200 focus:border-rose-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Parol</Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={e => updateForm('password', e.target.value)}
                    className="border-rose-200 focus:border-rose-400"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="border-rose-200"
                >
                  Bekor Qilish
                </Button>
                <Button
                  onClick={handleCreateOwner}
                  disabled={creating}
                  className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white"
                >
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Yaratish
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Ism yoki email bo'yicha qidirish..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 border-rose-200 focus:border-rose-400 bg-white dark:bg-card"
            />
          </div>
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
              ) : owners.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Egalar topilmadi</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-rose-100 dark:border-rose-900/20 bg-rose-50/50 dark:bg-rose-900/10">
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-muted-foreground">Ism</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-muted-foreground">Email</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-muted-foreground">Foydalanuvchi</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-muted-foreground">Telefon</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-muted-foreground">To&apos;yxonalar</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-muted-foreground">Amallar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {owners.map((owner) => (
                        <tr key={owner.userId} className="border-b border-rose-50 dark:border-rose-900/20 hover:bg-rose-50/30 dark:hover:bg-rose-900/10 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-white flex items-center justify-center text-xs font-bold">
                                {owner.firstName.charAt(0)}{owner.lastName.charAt(0)}
                              </div>
                              <span className="font-medium text-gray-900 dark:text-foreground">
                                {owner.firstName} {owner.lastName}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-muted-foreground">{owner.email}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-muted-foreground">@{owner.username}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-muted-foreground">{owner.phone}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-medium">
                              <Building2 className="w-3 h-3" />
                              {owner._count?.ownedHalls || 0}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10"
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Ko&apos;rish
                            </Button>
                          </td>
                        </tr>
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
    </div>
  )
}
