'use client'

import { useEffect, useState, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Building2, CheckCircle, Clock, CalendarDays, Users, DollarSign,
  UserCheck, UserPlus, Database, TrendingUp, BarChart3, Settings,
  FilePlus, Shield, Activity, Eye
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('uz-UZ').format(price) + " so'm"
}

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })
  } catch {
    return dateStr
  }
}

const PIE_COLORS = [
  '#f43f5e', '#ec4899', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#a855f7', '#d946ef', '#fb7185', '#fbbf24'
]

interface DashboardData {
  totalHalls: number
  approvedHalls: number
  pendingHalls: number
  totalBookings: number
  upcomingBookings: number
  completedBookings: number
  cancelledBookings: number
  totalRevenue: number
  totalOwners: number
  totalCustomers: number
  recentBookings: Array<{
    bookingId: string
    bookingDate: string
    guestCount: number
    totalPrice: number
    bookingStatus: string
    hall?: { name: string }
    customer?: { firstName: string; lastName: string }
  }>
  hallsByDistrict: Array<{ district: string; count: number }>
  monthlyBookings: Array<{ month: string; count: number }>
}

const statusBadge: Record<string, { label: string; className: string; dot: string }> = {
  upcoming: { label: 'Kutilmoqda', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
  completed: { label: 'Tugallangan', className: 'bg-gray-50 text-gray-600 border border-gray-200', dot: 'bg-gray-400' },
  cancelled: { label: 'Bekor', className: 'bg-red-50 text-red-600 border border-red-200', dot: 'bg-red-500' },
}

/* Animated counter hook */
function useAnimatedCounter(target: number, duration = 1200, enabled = true) {
  const [count, setCount] = useState(0)
  const prevRef = useRef<number>(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    cancelAnimationFrame(rafRef.current)

    if (!enabled || target === 0) {
      prevRef.current = target
      // Use rAF to avoid calling setState synchronously in the effect body
      rafRef.current = requestAnimationFrame(() => setCount(target))
      return
    }
    const start = prevRef.current
    const diff = target - start
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const nextVal = Math.round(start + diff * eased)
      setCount(nextVal)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        prevRef.current = target
      }
    }
    rafRef.current = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration, enabled])

  return count
}

function StatCard({ title, value, icon: Icon, gradient, shadow, delay, isPrice, rawValue }: {
  title: string; value: string | number; icon: React.ElementType; gradient: string; shadow: string; delay: number; isPrice?: boolean; rawValue?: number
}) {
  const animatedValue = useAnimatedCounter(typeof rawValue === 'number' ? rawValue : 0, 1200, true)
  const displayValue = isPrice && rawValue !== undefined
    ? formatPrice(animatedValue)
    : isPrice ? value : animatedValue

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
    >
      <Card className={`bg-gradient-to-br ${gradient} text-white border-0 shadow-lg ${shadow} overflow-hidden relative group`}>
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
        <CardContent className="p-4 relative">
          <div className="flex items-start justify-between mb-2">
            <div className="bg-white/20 rounded-xl p-2">
              <Icon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl md:text-2xl font-bold tracking-tight">{displayValue}</p>
          <p className="text-xs text-white/75 mt-1 font-medium">{title}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function AdminDashboardPage() {
  const { token, navigateTo } = useAppStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    api.setToken(token)
    loadDashboard()
  }, [token])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const result = await api.getAdminDashboard()
      setData(result)
    } catch {
      toast.error('Dashboard ma\'lumotlarini yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const handleSeed = async () => {
    try {
      setSeeding(true)
      await api.seedData()
      toast.success('Demo ma\'lumotlar muvaffaqiyatli qo\'shildi')
      loadDashboard()
    } catch {
      toast.error('Demo ma\'lumotlar qo\'shishda xatolik')
    } finally {
      setSeeding(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-background dark:via-background dark:to-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  const statsCards = [
    { title: 'Jami To\'yxonalar', value: data.totalHalls, rawValue: data.totalHalls, icon: Building2, gradient: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-200/60' },
    { title: 'Tasdiqlangan', value: data.approvedHalls, rawValue: data.approvedHalls, icon: CheckCircle, gradient: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-200/60' },
    { title: 'Kutilmoqda', value: data.pendingHalls, rawValue: data.pendingHalls, icon: Clock, gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-200/60' },
    { title: 'Jami Bronlar', value: data.totalBookings, rawValue: data.totalBookings, icon: CalendarDays, gradient: 'from-pink-500 to-rose-600', shadow: 'shadow-pink-200/60' },
    { title: 'Kelayotgan', value: data.upcomingBookings, rawValue: data.upcomingBookings, icon: TrendingUp, gradient: 'from-teal-500 to-emerald-600', shadow: 'shadow-teal-200/60' },
    { title: 'Tugallangan', value: data.completedBookings, rawValue: data.completedBookings, icon: CheckCircle, gradient: 'from-gray-500 to-gray-600', shadow: 'shadow-gray-200/60' },
    { title: 'Bekor Qilingan', value: data.cancelledBookings, rawValue: data.cancelledBookings, icon: CalendarDays, gradient: 'from-red-500 to-rose-600', shadow: 'shadow-red-200/60' },
    { title: 'Jami Daromad', value: formatPrice(data.totalRevenue), rawValue: data.totalRevenue, icon: DollarSign, gradient: 'from-amber-500 to-yellow-500', shadow: 'shadow-amber-200/60', isPrice: true },
    { title: 'Egalar', value: data.totalOwners, rawValue: data.totalOwners, icon: UserCheck, gradient: 'from-purple-500 to-pink-600', shadow: 'shadow-purple-200/60' },
    { title: 'Mijozlar', value: data.totalCustomers, rawValue: data.totalCustomers, icon: UserPlus, gradient: 'from-orange-500 to-red-500', shadow: 'shadow-orange-200/60' },
  ]

  const quickActions = [
    { title: 'To\'yxonalar', desc: 'Boshqarish', icon: Building2, gradient: 'from-rose-500 to-pink-600', view: 'admin-halls' as const },
    { title: 'Bronlar', desc: 'Ko\'rish', icon: CalendarDays, gradient: 'from-amber-500 to-orange-500', view: 'admin-bookings' as const },
    { title: 'Egalar', desc: 'Boshqarish', icon: Users, gradient: 'from-emerald-500 to-teal-600', view: 'admin-owners' as const },
    { title: 'Sozlamalar', desc: 'Boshqarish', icon: Settings, gradient: 'from-gray-500 to-gray-600', view: 'admin-dashboard' as const },
  ]

  const approvalRate = data.totalHalls > 0 ? Math.round((data.approvedHalls / data.totalHalls) * 100) : 0

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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-foreground flex items-center gap-2">
              <Activity className="w-7 h-7 text-rose-500" />
              Admin Dashboard
            </h1>
            <p className="text-gray-500 dark:text-muted-foreground mt-1">Tizimning umumiy ko&apos;rinishi</p>
          </div>
          <Button
            onClick={handleSeed}
            disabled={seeding}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200/50"
          >
            <Database className="w-4 h-4 mr-2" />
            {seeding ? 'Yuklanmoqda...' : 'Demo Ma\'lumotlar'}
          </Button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {statsCards.map((stat, index) => (
            <StatCard
              key={stat.title}
              {...stat}
              delay={index * 0.05}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold text-gray-800 dark:text-foreground mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-rose-500" />
            Tezkor Amallar
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 border-0 bg-white dark:bg-card dark:border dark:border-rose-900/20 group overflow-hidden"
                  onClick={() => navigateTo(action.view)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`bg-gradient-to-br ${action.gradient} rounded-xl p-2.5 text-white shadow-sm`}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-foreground text-sm group-hover:text-rose-600 transition-colors">{action.title}</p>
                      <p className="text-xs text-gray-500 dark:text-muted-foreground">{action.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="shadow-md border-0 bg-white dark:bg-card dark:border dark:border-rose-900/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-rose-500" />
                  Oylik Bronlar Trendi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.monthlyBookings && data.monthlyBookings.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data.monthlyBookings}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#f9a8d4" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#f9a8d4" />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #fecdd3',
                          boxShadow: '0 4px 12px rgba(244, 63, 94, 0.1)',
                          background: 'white',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#f43f5e"
                        strokeWidth={2.5}
                        fill="url(#colorCount)"
                        name="Bronlar"
                        dot={{ fill: '#f43f5e', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#e11d48' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-400 dark:text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>Ma&apos;lumot yo&apos;q</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <Card className="shadow-md border-0 bg-white dark:bg-card dark:border dark:border-rose-900/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="w-5 h-5 text-rose-500" />
                  Tumanlar Bo&apos;yicha To&apos;yxonalar
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.hallsByDistrict && data.hallsByDistrict.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.hallsByDistrict}
                        dataKey="count"
                        nameKey="district"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={50}
                        paddingAngle={3}
                        label={({ district, count }) => `${district}: ${count}`}
                      >
                        {data.hallsByDistrict.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #fecdd3',
                          boxShadow: '0 4px 12px rgba(244, 63, 94, 0.1)',
                          background: 'white',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-400 dark:text-muted-foreground">
                    <div className="text-center">
                      <Building2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>Ma&apos;lumot yo&apos;q</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Approval Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-6"
        >
          <Card className="shadow-md border-0 bg-white dark:bg-card dark:border dark:border-rose-900/20">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-foreground">Tasdiqlash Ko&apos;rsatkichi</h3>
                  <p className="text-sm text-gray-500 dark:text-muted-foreground">{data.approvedHalls} / {data.totalHalls} to&apos;yxonalar tasdiqlangan</p>
                </div>
                <div className="flex-1 max-w-xs">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-muted-foreground">Tasdiqlangan</span>
                    <span className="font-semibold text-rose-600">{approvalRate}%</span>
                  </div>
                  <Progress value={approvalRate} className="h-2.5 bg-rose-100 [&>[data-slot=indicator]]:bg-gradient-to-r [&>[data-slot=indicator]]:from-rose-500 [&>[data-slot=indicator]]:to-pink-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <Card className="shadow-md border-0 bg-white dark:bg-card dark:border dark:border-rose-900/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-rose-500" />
                So&apos;nggi Bronlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence>
                {data.recentBookings && data.recentBookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-rose-100 dark:border-rose-900/20">
                          <th className="text-left py-3 px-3 font-semibold text-gray-600 dark:text-muted-foreground">To&apos;yxona</th>
                          <th className="text-left py-3 px-3 font-semibold text-gray-600 dark:text-muted-foreground">Mijoz</th>
                          <th className="text-left py-3 px-3 font-semibold text-gray-600 dark:text-muted-foreground">Sana</th>
                          <th className="text-left py-3 px-3 font-semibold text-gray-600 dark:text-muted-foreground">Mehmonlar</th>
                          <th className="text-left py-3 px-3 font-semibold text-gray-600 dark:text-muted-foreground">Narx</th>
                          <th className="text-left py-3 px-3 font-semibold text-gray-600 dark:text-muted-foreground">Holat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentBookings.map((booking, index) => {
                          const st = statusBadge[booking.bookingStatus] || statusBadge.upcoming
                          return (
                            <motion.tr
                              key={booking.bookingId}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.04 }}
                              className="border-b border-rose-50 dark:border-rose-900/10 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-colors"
                            >
                              <td className="py-3 px-3 font-medium text-gray-900 dark:text-foreground">
                                {booking.hall?.name || 'N/A'}
                              </td>
                              <td className="py-3 px-3 text-gray-600 dark:text-muted-foreground">
                                {booking.customer ? `${booking.customer.firstName} ${booking.customer.lastName}` : 'N/A'}
                              </td>
                              <td className="py-3 px-3 text-gray-600 dark:text-muted-foreground">{formatDate(booking.bookingDate)}</td>
                              <td className="py-3 px-3 text-gray-600 dark:text-muted-foreground">{booking.guestCount}</td>
                              <td className="py-3 px-3 text-gray-900 dark:text-foreground font-medium">{formatPrice(booking.totalPrice)}</td>
                              <td className="py-3 px-3">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${st.className}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                  {st.label}
                                </span>
                              </td>
                            </motion.tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400 dark:text-muted-foreground">
                    <div className="bg-rose-50 dark:bg-rose-900/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <CalendarDays className="w-10 h-10 text-rose-300 dark:text-rose-600" />
                    </div>
                    <p className="font-medium text-gray-500 dark:text-muted-foreground">Hali bronlar yo&apos;q</p>
                    <p className="text-sm mt-1">Yangi bronlar qo&apos;shilganda bu yerda ko&apos;rinadi</p>
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
