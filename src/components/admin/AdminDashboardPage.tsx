'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Building2, CheckCircle, Clock, CalendarDays, Users, DollarSign,
  UserCheck, UserPlus, Database, TrendingUp
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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
  '#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4'
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

const statusBadge: Record<string, { label: string; className: string }> = {
  upcoming: { label: 'Kutilmoqda', className: 'bg-emerald-100 text-emerald-700' },
  completed: { label: 'Tugallangan', className: 'bg-gray-100 text-gray-700' },
  cancelled: { label: 'Bekor', className: 'bg-red-100 text-red-700' },
}

export default function AdminDashboardPage() {
  const { token } = useAppStore()
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
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </div>
    )
  }

  const statsCards = [
    { title: 'Jami To\'yxonalar', value: data.totalHalls, icon: Building2, gradient: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-200' },
    { title: 'Tasdiqlangan', value: data.approvedHalls, icon: CheckCircle, gradient: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-200' },
    { title: 'Kutilmoqda', value: data.pendingHalls, icon: Clock, gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-200' },
    { title: 'Jami Bronlar', value: data.totalBookings, icon: CalendarDays, gradient: 'from-pink-500 to-rose-600', shadow: 'shadow-pink-200' },
    { title: 'Kelayotgan', value: data.upcomingBookings, icon: TrendingUp, gradient: 'from-teal-500 to-emerald-600', shadow: 'shadow-teal-200' },
    { title: 'Tugallangan', value: data.completedBookings, icon: CheckCircle, gradient: 'from-gray-500 to-gray-600', shadow: 'shadow-gray-200' },
    { title: 'Bekor Qilingan', value: data.cancelledBookings, icon: CalendarDays, gradient: 'from-red-500 to-rose-600', shadow: 'shadow-red-200' },
    { title: 'Jami Daromad', value: formatPrice(data.totalRevenue), icon: DollarSign, gradient: 'from-amber-500 to-yellow-600', shadow: 'shadow-amber-200' },
    { title: 'Egalar', value: data.totalOwners, icon: UserCheck, gradient: 'from-purple-500 to-pink-600', shadow: 'shadow-purple-200' },
    { title: 'Mijozlar', value: data.totalCustomers, icon: UserPlus, gradient: 'from-orange-500 to-red-500', shadow: 'shadow-orange-200' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Tizimning umumiy ko&apos;rinishi</p>
          </div>
          <Button
            onClick={handleSeed}
            disabled={seeding}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200"
          >
            <Database className="w-4 h-4 mr-2" />
            {seeding ? 'Yuklanmoqda...' : 'Demo Ma\'lumotlar'}
          </Button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className={`bg-gradient-to-br ${stat.gradient} text-white border-0 shadow-lg ${stat.shadow}`}>
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between mb-1">
                    <stat.icon className="w-4 h-4 md:w-5 md:h-5 opacity-80" />
                  </div>
                  <p className="text-lg md:text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-white/80 truncate">{stat.title}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-md border-0">
              <CardHeader>
                <CardTitle className="text-lg">Oylik Bronlar</CardTitle>
              </CardHeader>
              <CardContent>
                {data.monthlyBookings && data.monthlyBookings.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.monthlyBookings}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Bronlar" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-gray-400">
                    Ma&apos;lumot yo&apos;q
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="shadow-md border-0">
              <CardHeader>
                <CardTitle className="text-lg">Tumanlar Bo&apos;yicha To&apos;yxonalar</CardTitle>
              </CardHeader>
              <CardContent>
                {data.hallsByDistrict && data.hallsByDistrict.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={data.hallsByDistrict}
                        dataKey="count"
                        nameKey="district"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ district, count }) => `${district}: ${count}`}
                      >
                        {data.hallsByDistrict.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-gray-400">
                    Ma&apos;lumot yo&apos;q
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle className="text-lg">So&apos;nggi Bronlar</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentBookings && data.recentBookings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-rose-100">
                        <th className="text-left py-3 px-2 font-semibold text-gray-600">To&apos;yxona</th>
                        <th className="text-left py-3 px-2 font-semibold text-gray-600">Mijoz</th>
                        <th className="text-left py-3 px-2 font-semibold text-gray-600">Sana</th>
                        <th className="text-left py-3 px-2 font-semibold text-gray-600">Mehmonlar</th>
                        <th className="text-left py-3 px-2 font-semibold text-gray-600">Narx</th>
                        <th className="text-left py-3 px-2 font-semibold text-gray-600">Holat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentBookings.map((booking) => {
                        const st = statusBadge[booking.bookingStatus] || statusBadge.upcoming
                        return (
                          <tr key={booking.bookingId} className="border-b border-rose-50 hover:bg-rose-50/50">
                            <td className="py-3 px-2 font-medium text-gray-900">
                              {booking.hall?.name || 'N/A'}
                            </td>
                            <td className="py-3 px-2 text-gray-600">
                              {booking.customer ? `${booking.customer.firstName} ${booking.customer.lastName}` : 'N/A'}
                            </td>
                            <td className="py-3 px-2 text-gray-600">{formatDate(booking.bookingDate)}</td>
                            <td className="py-3 px-2 text-gray-600">{booking.guestCount}</td>
                            <td className="py-3 px-2 text-gray-600">{formatPrice(booking.totalPrice)}</td>
                            <td className="py-3 px-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${st.className}`}>
                                {st.label}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <CalendarDays className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Hali bronlar yo&apos;q</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
