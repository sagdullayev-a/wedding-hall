'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, MapPin, Users, Phone, Music, ChevronLeft, ChevronRight,
  Building2, Utensils, Car, Calendar, Star, Check
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'

interface HallImage {
  imageId: string
  imageUrl: string
}

interface Singer {
  singerId: string
  singerName: string
  price: number
  imageUrl: string | null
}

interface Menu {
  menuId: string
  menuName: string
}

interface CarItem {
  carId: string
  brand: string
  price: number
  imageUrl: string | null
}

interface Hall {
  hallId: string
  name: string
  district: string
  address: string
  capacity: number
  seatPrice: number
  phone: string
  hasKarnaySurnay: boolean
  karnaySurnayPrice: number | null
  status: string
  images: HallImage[]
  singers: Singer[]
  menus: Menu[]
  cars: CarItem[]
}

interface CalendarDay {
  date: string
  status: 'available' | 'booked' | 'past'
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('uz-UZ').format(price) + " so'm"

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function HallDetailPage() {
  const { selectedHallId, navigateTo, selectHall, setSelectedBookingDate } = useAppStore()
  const [hall, setHall] = useState<Hall | null>(null)
  const [loading, setLoading] = useState(true)

  // Calendar state
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1)
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([])
  const [calLoading, setCalLoading] = useState(false)

  useEffect(() => {
    if (selectedHallId) {
      loadHall()
    }
  }, [selectedHallId])

  useEffect(() => {
    if (selectedHallId) {
      loadCalendar()
    }
  }, [selectedHallId, calMonth, calYear])

  const loadHall = async () => {
    if (!selectedHallId) return
    try {
      setLoading(true)
      const res = await api.getHall(selectedHallId)
      setHall(res.hall)
    } catch (error) {
      console.error('Failed to load hall:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCalendar = useCallback(async () => {
    if (!selectedHallId) return
    try {
      setCalLoading(true)
      const data = await api.getHallCalendar(selectedHallId, calMonth, calYear)
      setCalendarData(data || [])
    } catch (error) {
      console.error('Failed to load calendar:', error)
    } finally {
      setCalLoading(false)
    }
  }, [selectedHallId, calMonth, calYear])

  const getDayStatus = (day: number): 'available' | 'booked' | 'past' => {
    const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const found = calendarData.find((d) => d.date === dateStr)
    if (found) return found.status as 'available' | 'booked' | 'past'
    return 'available'
  }

  const handleDateClick = (day: number) => {
    const status = getDayStatus(day)
    if (status !== 'available') return
    const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedBookingDate(dateStr)
    navigateTo('booking')
  }

  const handleBookNow = () => {
    navigateTo('booking')
  }

  const prevMonth = () => {
    if (calMonth === 1) {
      setCalMonth(12)
      setCalYear(calYear - 1)
    } else {
      setCalMonth(calMonth - 1)
    }
  }

  const nextMonth = () => {
    if (calMonth === 12) {
      setCalMonth(1)
      setCalYear(calYear + 1)
    } else {
      setCalMonth(calMonth + 1)
    }
  }

  // Get calendar grid data
  const getCalendarDays = () => {
    const firstDay = new Date(calYear, calMonth - 1, 1).getDay()
    const daysInMonth = new Date(calYear, calMonth, 0).getDate()
    const days: (number | null)[] = []

    // Add padding for first row
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Add days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-24 mb-6" />
        <Skeleton className="h-64 sm:h-96 mb-6 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!hall) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-12 text-center">
          <Building2 className="w-16 h-16 mx-auto text-rose-200 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Hall Not Found</h3>
          <Button onClick={() => navigateTo('halls')} className="bg-rose-500 hover:bg-rose-600 text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Halls
          </Button>
        </Card>
      </div>
    )
  }

  const calendarDays = getCalendarDays()

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigateTo('halls')}
            className="mb-4 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Halls
          </Button>
        </motion.div>

        {/* Image Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          {hall.images && hall.images.length > 0 ? (
            <Carousel className="w-full">
              <CarouselContent>
                {hall.images.map((img) => (
                  <CarouselItem key={img.imageId}>
                    <div className="relative h-56 sm:h-72 md:h-96 rounded-2xl overflow-hidden">
                      <img
                        src={img.imageUrl}
                        alt={hall.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {hall.images.length > 1 && (
                <>
                  <CarouselPrevious className="left-2 sm:left-4 bg-white/80 hover:bg-white border-rose-100" />
                  <CarouselNext className="right-2 sm:right-4 bg-white/80 hover:bg-white border-rose-100" />
                </>
              )}
            </Carousel>
          ) : (
            <div className="h-56 sm:h-72 md:h-96 bg-gradient-to-br from-rose-100 to-amber-100 rounded-2xl flex items-center justify-center">
              <Building2 className="w-20 h-20 text-rose-300" />
            </div>
          )}
        </motion.div>

        {/* Hall Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Basic Info */}
            <Card className="border-rose-100">
              <CardContent className="p-6">
                <h1 className="text-2xl sm:text-3xl font-bold mb-4">{hall.name}</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{hall.district}, {hall.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Capacity: {hall.capacity} guests</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{hall.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="font-semibold text-rose-600">{formatPrice(hall.seatPrice)} per seat</span>
                  </div>
                </div>
                {hall.hasKarnaySurnay && (
                  <div className="mt-4">
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                      <Music className="w-3.5 h-3.5 mr-1" />
                      Karnay-Surnay Available — {formatPrice(hall.karnaySurnayPrice || 0)}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs for Services */}
            <Card className="border-rose-100">
              <CardContent className="p-6">
                <Tabs defaultValue="singers">
                  <TabsList className="mb-4 bg-rose-50">
                    <TabsTrigger value="singers" className="data-[state=active]:bg-rose-500 data-[state=active]:text-white">
                      <Music className="w-4 h-4 mr-1.5" />
                      Singers
                    </TabsTrigger>
                    <TabsTrigger value="menus" className="data-[state=active]:bg-rose-500 data-[state=active]:text-white">
                      <Utensils className="w-4 h-4 mr-1.5" />
                      Menus
                    </TabsTrigger>
                    <TabsTrigger value="cars" className="data-[state=active]:bg-rose-500 data-[state=active]:text-white">
                      <Car className="w-4 h-4 mr-1.5" />
                      Cars
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="singers">
                    {hall.singers.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No singers available</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {hall.singers.map((singer) => (
                          <div
                            key={singer.singerId}
                            className="flex items-center gap-3 p-3 rounded-xl border border-rose-100 hover:bg-rose-50/50 transition-colors"
                          >
                            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-rose-100">
                              {singer.imageUrl ? (
                                <img src={singer.imageUrl} alt={singer.singerName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Music className="w-5 h-5 text-rose-400" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{singer.singerName}</p>
                              <p className="text-xs text-rose-600 font-medium">{formatPrice(singer.price)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="menus">
                    {hall.menus.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No menus available</p>
                    ) : (
                      <div className="space-y-2">
                        {hall.menus.map((menu) => (
                          <div
                            key={menu.menuId}
                            className="flex items-center gap-3 p-3 rounded-xl border border-rose-100 hover:bg-rose-50/50 transition-colors"
                          >
                            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                              <Utensils className="w-5 h-5 text-amber-500" />
                            </div>
                            <p className="font-medium text-sm">{menu.menuName}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="cars">
                    {hall.cars.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No cars available</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {hall.cars.map((car) => (
                          <div
                            key={car.carId}
                            className="flex items-center gap-3 p-3 rounded-xl border border-rose-100 hover:bg-rose-50/50 transition-colors"
                          >
                            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-rose-100">
                              {car.imageUrl ? (
                                <img src={car.imageUrl} alt={car.brand} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Car className="w-5 h-5 text-rose-400" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{car.brand}</p>
                              <p className="text-xs text-rose-600 font-medium">{formatPrice(car.price)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Sidebar - Calendar & Book */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            {/* Calendar */}
            <Card className="border-rose-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 hover:bg-rose-50">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h3 className="font-semibold text-sm">
                    {MONTH_NAMES[calMonth - 1]} {calYear}
                  </h3>
                  <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 hover:bg-rose-50">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAY_NAMES.map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => {
                    if (day === null) {
                      return <div key={`empty-${index}`} className="aspect-square" />
                    }
                    const status = getDayStatus(day)
                    const isClickable = status === 'available'
                    return (
                      <button
                        key={day}
                        onClick={() => isClickable && handleDateClick(day)}
                        disabled={!isClickable}
                        className={`
                          aspect-square rounded-lg text-xs font-medium flex items-center justify-center transition-all
                          ${status === 'available' && 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer border border-emerald-200'}
                          ${status === 'booked' && 'bg-red-50 text-red-400 cursor-not-allowed border border-red-100'}
                          ${status === 'past' && 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-100'}
                        `}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 mt-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-emerald-50 border border-emerald-200" />
                    <span className="text-muted-foreground">Available</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-50 border border-red-100" />
                    <span className="text-muted-foreground">Booked</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-gray-50 border border-gray-100" />
                    <span className="text-muted-foreground">Past</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Book Button */}
            <Button
              onClick={handleBookNow}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-xl h-12 text-base"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Book This Hall
            </Button>

            {/* Quick Info Card */}
            <Card className="border-rose-100 bg-gradient-to-br from-rose-50 to-amber-50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Instant booking confirmation</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>20% advance payment</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Free cancellation</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
