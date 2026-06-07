'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Building2, Plus, MapPin, Users, DollarSign, CheckCircle, Clock, Home,
  Sparkles, ArrowRight, Eye, FileEdit, TrendingUp, BarChart3, Wallet,
  CalendarDays
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface HallImage {
  imageId: string
  imageUrl: string
}

interface Hall {
  hallId: string
  name: string
  district: string
  address: string
  capacity: number
  seatPrice: number
  status: string
  hasKarnaySurnay: boolean
  images: HallImage[]
  _count?: { singers: number; menus: number; cars: number }
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('uz-UZ').format(price) + " so'm"
}

const STATUS_STEPS = [
  { key: 'created', label: 'Yaratilgan', icon: FileEdit },
  { key: 'pending', label: 'Kutilmoqda', icon: Clock },
  { key: 'approved', label: 'Tasdiqlangan', icon: CheckCircle },
]

export default function OwnerHallsPage() {
  const { token, navigateTo, selectHall, setEditingHallId } = useAppStore()
  const [halls, setHalls] = useState<Hall[]>([])
  const [loading, setLoading] = useState(true)

  // Revenue analytics state
  const [revenueData, setRevenueData] = useState<{
    totalRevenue: number
    totalAdvance: number
    totalBookings: number
    upcomingBookings: number
    completedBookings: number
    expenses: number
    profit: number
    monthlyData: { month: string; revenue: number; bookings: number }[]
    topHalls: { hallId: string; name: string; revenue: number; bookings: number }[]
  } | null>(null)
  const [revenueLoading, setRevenueLoading] = useState(false)
  const [revenueMonths, setRevenueMonths] = useState('6')
  const [showRevenue, setShowRevenue] = useState(false)

  const loadRevenue = async () => {
    try {
      setRevenueLoading(true)
      const data = await api.getOwnerRevenue({ months: revenueMonths })
      setRevenueData(data)
    } catch {
      // Silently handle - revenue analytics is optional
    } finally {
      setRevenueLoading(false)
    }
  }

  const loadHalls = async () => {
    try {
      setLoading(true)
      const data = await api.getMyHalls()
      setHalls(data.halls || [])
    } catch {
      toast.error('To\'yxonalarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    api.setToken(token)
    const timer = setTimeout(() => {
      loadHalls()
    }, 0)
    return () => clearTimeout(timer)
  }, [token])

  useEffect(() => {
    if (showRevenue && token) {
      const timer = setTimeout(() => {
        loadRevenue()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [showRevenue, token, revenueMonths])

  const handleAddHall = () => {
    setEditingHallId(null)
    navigateTo('owner-hall-form')
  }

  const handleEditHall = (hallId: string) => {
    selectHall(hallId)
    setEditingHallId(hallId)
    navigateTo('owner-hall-form')
  }

  const handleViewHall = (hallId: string) => {
    selectHall(hallId)
    navigateTo('hall-detail')
  }

  const totalHalls = halls.length
  const approvedHalls = halls.filter(h => h.status === 'approved').length
  const pendingHalls = halls.filter(h => h.status === 'pending').length
  const totalCapacity = halls.reduce((sum, h) => sum + h.capacity, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-background dark:via-background dark:to-background p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-background dark:via-background dark:to-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-foreground flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-rose-500" />
              Mening To&apos;yxonalarim
            </h1>
            <p className="text-gray-500 dark:text-muted-foreground mt-1">To&apos;yxonalaringizni boshqaring</p>
          </div>
          {halls.length > 0 && (
            <Button
              onClick={handleAddHall}
              className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg shadow-rose-200/50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Yangi To&apos;yxona
            </Button>
          )}
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
        >
          <Card className="bg-gradient-to-br from-rose-500 to-pink-600 text-white border-0 shadow-lg shadow-rose-200/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-white/20 rounded-xl p-2">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white/75 text-xs font-medium">Jami</p>
                <p className="text-xl font-bold">{totalHalls}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-lg shadow-emerald-200/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-white/20 rounded-xl p-2">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white/75 text-xs font-medium">Tasdiqlangan</p>
                <p className="text-xl font-bold">{approvedHalls}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-lg shadow-amber-200/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-white/20 rounded-xl p-2">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white/75 text-xs font-medium">Kutilmoqda</p>
                <p className="text-xl font-bold">{pendingHalls}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-lg shadow-purple-200/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-white/20 rounded-xl p-2">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white/75 text-xs font-medium">Jami Sig&apos;im</p>
                <p className="text-xl font-bold">{new Intl.NumberFormat('uz-UZ').format(totalCapacity)}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Revenue Analytics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <Card className="border-0 dark:border dark:border-rose-900/20 shadow-md bg-white dark:bg-card overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-rose-500" />
                  Revenue Analytics
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={revenueMonths} onValueChange={setRevenueMonths}>
                    <SelectTrigger className="w-32 h-8 text-xs border-rose-200 dark:border-rose-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 months</SelectItem>
                      <SelectItem value="6">6 months</SelectItem>
                      <SelectItem value="12">12 months</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRevenue(!showRevenue)}
                    className="border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs"
                  >
                    {showRevenue ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            {showRevenue && (
              <CardContent className="pt-0">
                {revenueLoading ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
                    </div>
                    <Skeleton className="h-64 rounded-xl" />
                  </div>
                ) : revenueData ? (
                  <div className="space-y-4">
                    {/* Revenue Stats Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/10 border border-rose-100 dark:border-rose-900/30">
                        <div className="flex items-center gap-2 mb-1">
                          <Wallet className="w-4 h-4 text-rose-500" />
                          <span className="text-xs text-muted-foreground">Total Revenue</span>
                        </div>
                        <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{formatPrice(revenueData.totalRevenue)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/10 border border-emerald-100 dark:border-emerald-900/30">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs text-muted-foreground">Profit</span>
                        </div>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(revenueData.profit)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border border-amber-100 dark:border-amber-900/30">
                        <div className="flex items-center gap-2 mb-1">
                          <CalendarDays className="w-4 h-4 text-amber-500" />
                          <span className="text-xs text-muted-foreground">Bookings</span>
                        </div>
                        <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{revenueData.totalBookings}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/30 dark:to-slate-800/20 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span className="text-xs text-muted-foreground">Expenses</span>
                        </div>
                        <p className="text-lg font-bold text-gray-600 dark:text-gray-400">{formatPrice(revenueData.expenses)}</p>
                      </div>
                    </div>

                    {/* Monthly Revenue Chart */}
                    {revenueData.monthlyData.length > 0 && (
                      <div className="h-64 rounded-xl bg-gradient-to-br from-rose-50/50 to-amber-50/50 dark:from-rose-900/10 dark:to-amber-900/5 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={revenueData.monthlyData}>
                            <defs>
                              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#fecdd3" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#f43f5e" />
                            <YAxis tick={{ fontSize: 11 }} stroke="#f43f5e" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgba(255,255,255,0.95)',
                                border: '1px solid #fecdd3',
                                borderRadius: '12px',
                                fontSize: '12px',
                              }}
                              formatter={(value: number) => [formatPrice(value), 'Revenue']}
                            />
                            <Area
                              type="monotone"
                              dataKey="revenue"
                              stroke="#e11d48"
                              strokeWidth={2}
                              fill="url(#revenueGradient)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Top Halls by Revenue */}
                    {revenueData.topHalls.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-muted-foreground">Top Halls by Revenue</h4>
                        <div className="space-y-2">
                          {revenueData.topHalls.map((hall, idx) => (
                            <div key={hall.hallId} className="flex items-center gap-3 p-2.5 rounded-lg bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100/50 dark:border-rose-900/20">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                idx === 0 ? 'bg-amber-500 text-white' :
                                idx === 1 ? 'bg-gray-400 text-white' :
                                'bg-amber-700 text-white'
                              }`}>
                                {idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{hall.name}</p>
                                <p className="text-xs text-muted-foreground">{hall.bookings} bookings</p>
                              </div>
                              <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">{formatPrice(hall.revenue)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto text-rose-200 dark:text-rose-700 mb-3" />
                    <p>Unable to load revenue data</p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </motion.div>

        {/* Halls Grid */}
        {halls.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-dashed border-2 border-rose-200 dark:border-rose-800 bg-white/50 dark:bg-card/50 shadow-none">
              <CardContent className="p-16 text-center">
                <div className="bg-rose-50 dark:bg-rose-900/30 rounded-2xl w-28 h-28 flex items-center justify-center mx-auto mb-6">
                  <Building2 className="w-14 h-14 text-rose-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-700 dark:text-foreground mb-2">Hech qanday to&apos;yxona yo&apos;q</h3>
                <p className="text-gray-500 dark:text-muted-foreground mb-6 max-w-sm mx-auto">
                  Birinchi to&apos;yxonangizni qo&apos;shing va biznesingizni boshlang. To&apos;yxona yaratish oson va tez!
                </p>
                <Button
                  onClick={handleAddHall}
                  size="lg"
                  className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg shadow-rose-200/50 px-8"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Birinchi To&apos;yxonani Qo&apos;shish
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Add New Hall - Dashed Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 }}
            >
              <Card
                className="border-2 border-dashed border-rose-300 dark:border-rose-700 bg-rose-50/30 dark:bg-rose-900/10 hover:bg-rose-50/60 dark:hover:bg-rose-900/20 hover:border-rose-400 cursor-pointer transition-all duration-300 group min-h-[320px] flex items-center justify-center"
                onClick={handleAddHall}
              >
                <CardContent className="p-6 text-center">
                  <div className="bg-rose-100 dark:bg-rose-900/40 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:bg-rose-200 dark:group-hover:bg-rose-900/60 transition-colors">
                    <Plus className="w-8 h-8 text-rose-400 group-hover:text-rose-500 transition-colors" />
                  </div>
                  <p className="font-semibold text-rose-600 group-hover:text-rose-700 transition-colors">Yangi To&apos;yxona Qo&apos;shish</p>
                  <p className="text-sm text-gray-400 mt-1">Klik qiling</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Hall Cards */}
            {halls.map((hall, index) => (
              <motion.div
                key={hall.hallId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Card className="overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 group border-0 dark:border dark:border-rose-900/20 shadow-md bg-white dark:bg-card">
                  {/* Image with Gradient Overlay */}
                  <div className="relative h-44 overflow-hidden">
                    {hall.images && hall.images.length > 0 ? (
                      <img
                        src={hall.images[0].imageUrl}
                        alt={hall.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                        <Building2 className="w-12 h-12 text-rose-300" />
                      </div>
                    )}
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      {hall.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/90 text-white backdrop-blur-sm">
                          <CheckCircle className="w-3 h-3" />
                          Tasdiqlangan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/90 text-white backdrop-blur-sm">
                          <Clock className="w-3 h-3" />
                          Kutilmoqda
                        </span>
                      )}
                    </div>

                    {/* Hall Name on Image */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-bold text-white text-lg truncate drop-shadow-md">
                        {hall.name}
                      </h3>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    {/* Status Timeline for Pending Halls */}
                    {hall.status === 'pending' && (
                      <div className="mb-3 p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-900/30">
                        <div className="flex items-center justify-between">
                          {STATUS_STEPS.map((step, idx) => {
                            const isCompleted = idx < 2
                            const isCurrent = idx === 1
                            return (
                              <div key={step.key} className="flex items-center">
                                <div className="flex flex-col items-center">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                    isCurrent ? 'bg-amber-500 text-white' :
                                    isCompleted ? 'bg-emerald-500 text-white' :
                                    'bg-gray-200 text-gray-400'
                                  }`}>
                                    {isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : <step.icon className="w-3 h-3" />}
                                  </div>
                                  <span className={`text-[9px] mt-0.5 ${isCurrent ? 'text-amber-700 font-semibold' : 'text-gray-400'}`}>
                                    {step.label}
                                  </span>
                                </div>
                                {idx < STATUS_STEPS.length - 1 && (
                                  <div className={`w-8 h-0.5 mx-1 ${idx < 1 ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 text-sm text-gray-600 dark:text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="truncate">{hall.district}, {hall.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{hall.capacity} kishi</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="font-semibold text-gray-900 dark:text-foreground">{formatPrice(hall.seatPrice)} / o&apos;rindiq</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-rose-50 dark:border-rose-900/20">
                      {hall.status === 'approved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleViewHall(hall.hallId) }}
                          className="flex-1 border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 h-8 text-xs"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Ko&apos;rish
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleEditHall(hall.hallId) }}
                        className="flex-1 border-rose-200 dark:border-rose-800 text-gray-600 dark:text-muted-foreground hover:bg-rose-50 dark:hover:bg-rose-900/20 h-8 text-xs"
                      >
                        <FileEdit className="w-3.5 h-3.5 mr-1" />
                        Tahrirlash
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Approval Progress Summary */}
        {halls.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            <Card className="shadow-md border-0 dark:border dark:border-rose-900/20 bg-white dark:bg-card">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-foreground">Tasdiqlash Jarayoni</h3>
                    <p className="text-sm text-gray-500 dark:text-muted-foreground">{approvedHalls} / {totalHalls} to&apos;yxonalar tasdiqlangan</p>
                  </div>
                  <div className="flex-1 max-w-xs">
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-gray-600 dark:text-muted-foreground">Tasdiqlangan</span>
                      <span className="font-semibold text-rose-600">{totalHalls > 0 ? Math.round((approvedHalls / totalHalls) * 100) : 0}%</span>
                    </div>
                    <Progress value={totalHalls > 0 ? (approvedHalls / totalHalls) * 100 : 0} className="h-2.5 bg-rose-100 [&>[data-slot=indicator]]:bg-gradient-to-r [&>[data-slot=indicator]]:from-rose-500 [&>[data-slot=indicator]]:to-pink-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}
