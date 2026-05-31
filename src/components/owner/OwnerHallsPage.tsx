'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Building2, Plus, MapPin, Users, DollarSign, CheckCircle, Clock, Home } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

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
  images: HallImage[]
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('uz-UZ').format(price) + " so'm"
}

export default function OwnerHallsPage() {
  const { token, navigateTo, selectHall, setEditingHallId } = useAppStore()
  const [halls, setHalls] = useState<Hall[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.setToken(token)
    loadHalls()
  }, [token])

  const loadHalls = async () => {
    try {
      setLoading(true)
      const data = await api.getMyHalls()
      setHalls(data.halls || [])
    } catch (error) {
      toast.error('To\'yxonalarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const handleAddHall = () => {
    setEditingHallId(null)
    navigateTo('owner-hall-form')
  }

  const handleEditHall = (hallId: string) => {
    selectHall(hallId)
    setEditingHallId(hallId)
    navigateTo('owner-hall-form')
  }

  const totalHalls = halls.length
  const approvedHalls = halls.filter(h => h.status === 'approved').length
  const pendingHalls = halls.filter(h => h.status === 'pending').length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Mening To&apos;yxonalarim</h1>
            <p className="text-gray-500 mt-1">To&apos;yxonalarngizni boshqaring</p>
          </div>
          <Button
            onClick={handleAddHall}
            className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg shadow-rose-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yangi To&apos;yxona
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
        >
          <Card className="bg-gradient-to-br from-rose-500 to-pink-600 text-white border-0 shadow-lg shadow-rose-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-white/20 rounded-lg p-2.5">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Jami To&apos;yxonalar</p>
                <p className="text-2xl font-bold">{totalHalls}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-lg shadow-emerald-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-white/20 rounded-lg p-2.5">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Tasdiqlangan</p>
                <p className="text-2xl font-bold">{approvedHalls}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-lg shadow-amber-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-white/20 rounded-lg p-2.5">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Kutilmoqda</p>
                <p className="text-2xl font-bold">{pendingHalls}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Halls Grid */}
        {halls.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-dashed border-2 border-rose-200 bg-white/50">
              <CardContent className="p-12 text-center">
                <div className="bg-rose-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-10 h-10 text-rose-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Hech qanday to&apos;yxona yo&apos;q</h3>
                <p className="text-gray-500 mb-4">Birinchi to&apos;yxonangizni qo&apos;shing va biznesingizni boshlang</p>
                <Button
                  onClick={handleAddHall}
                  className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  To&apos;yxona Qo&apos;shish
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {halls.map((hall, index) => (
              <motion.div
                key={hall.hallId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 group border-0 shadow-md bg-white"
                  onClick={() => handleEditHall(hall.hallId)}
                >
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
                    <div className="absolute top-3 right-3">
                      <Badge
                        className={
                          hall.status === 'approved'
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : 'bg-amber-500 text-white hover:bg-amber-600'
                        }
                      >
                        {hall.status === 'approved' ? 'Tasdiqlangan' : 'Kutilmoqda'}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-rose-600 transition-colors">
                      {hall.name}
                    </h3>
                    <div className="space-y-1.5 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        <span>{hall.district}, {hall.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-rose-400" />
                        <span>{hall.capacity} kishi</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-rose-400" />
                        <span>{formatPrice(hall.seatPrice)} / o&apos;rindiq</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
