'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, Calendar, Users, Music, Utensils,
  Car, Check, CreditCard, User, ChevronLeft, ChevronRight,
  Building2, Sparkles, Loader2
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'

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

interface MenuItem {
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
  menus: MenuItem[]
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

const STEPS = [
  { label: 'Date', icon: Calendar },
  { label: 'Guests', icon: Users },
  { label: 'Services', icon: Music },
  { label: 'Info', icon: User },
  { label: 'Payment', icon: CreditCard },
]

export default function BookingPage() {
  const { selectedHallId, selectedBookingDate, navigateTo, token, user, setSelectedBookingDate } = useAppStore()
  const [hall, setHall] = useState<Hall | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1: Date
  const [bookingDate, setBookingDate] = useState(selectedBookingDate || '')
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1)
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([])

  // Step 2: Guest count
  const [guestCount, setGuestCount] = useState('')

  // Step 3: Services
  const [selectedSingers, setSelectedSingers] = useState<string[]>([])
  const [selectedMenus, setSelectedMenus] = useState<string[]>([])
  const [selectedCars, setSelectedCars] = useState<string[]>([])
  const [includeKarnaySurnay, setIncludeKarnaySurnay] = useState(false)

  // Step 4: Personal info
  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [phone, setPhone] = useState(user?.phone || '')

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

  // Pre-fill user info when user data loads
  useEffect(() => {
    if (user) {
      if (!firstName) setFirstName(user.firstName)
      if (!lastName) setLastName(user.lastName)
      if (!phone) setPhone(user.phone)
    }
  }, [user])

  // Set calendar to selected date's month/year
  useEffect(() => {
    if (selectedBookingDate) {
      const d = new Date(selectedBookingDate)
      setCalMonth(d.getMonth() + 1)
      setCalYear(d.getFullYear())
    }
  }, [selectedBookingDate])

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
      const data = await api.getHallCalendar(selectedHallId, calMonth, calYear)
      setCalendarData(data || [])
    } catch (error) {
      console.error('Failed to load calendar:', error)
    }
  }, [selectedHallId, calMonth, calYear])

  const getDayStatus = (day: number): 'available' | 'booked' | 'past' => {
    const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const found = calendarData.find((d) => d.date === dateStr)
    if (found) return found.status as 'available' | 'booked' | 'past'
    return 'available'
  }

  const handleDateSelect = (day: number) => {
    const status = getDayStatus(day)
    if (status !== 'available') return
    const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setBookingDate(dateStr)
    setSelectedBookingDate(dateStr)
  }

  // Price calculations
  const guestNum = parseInt(guestCount) || 0
  const basePrice = hall ? hall.seatPrice * guestNum : 0
  const singersTotal = hall
    ? selectedSingers.reduce((sum, id) => {
        const singer = hall.singers.find((s) => s.singerId === id)
        return sum + (singer?.price || 0)
      }, 0)
    : 0
  const carsTotal = hall
    ? selectedCars.reduce((sum, id) => {
        const car = hall.cars.find((c) => c.carId === id)
        return sum + (car?.price || 0)
      }, 0)
    : 0
  const karnaySurnayTotal = includeKarnaySurnay ? (hall?.karnaySurnayPrice || 0) : 0
  const totalPrice = basePrice + singersTotal + carsTotal + karnaySurnayTotal
  const advancePayment = totalPrice * 0.2

  const getCalendarDays = () => {
    const firstDay = new Date(calYear, calMonth - 1, 1).getDay()
    const daysInMonth = new Date(calYear, calMonth, 0).getDate()
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  const calendarDays = getCalendarDays()

  // Validation
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!bookingDate) {
          toast.error('Please select a date')
          return false
        }
        return true
      case 2:
        if (!guestNum || guestNum <= 0) {
          toast.error('Please enter a valid guest count')
          return false
        }
        if (hall && guestNum > hall.capacity) {
          toast.error(`Guest count exceeds hall capacity of ${hall.capacity}`)
          return false
        }
        return true
      case 3:
        return true // Services are optional
      case 4:
        if (!firstName.trim()) {
          toast.error('First name is required')
          return false
        }
        if (!lastName.trim()) {
          toast.error('Last name is required')
          return false
        }
        if (!phone.trim()) {
          toast.error('Phone number is required')
          return false
        }
        return true
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(5, s + 1))
    }
  }

  const handleBack = () => {
    setCurrentStep((s) => Math.max(1, s - 1))
  }

  const handlePayment = async () => {
    if (!token) {
      toast.error('Please login to book a hall')
      navigateTo('login')
      return
    }

    try {
      setSubmitting(true)

      const services = [
        ...selectedSingers.map((id) => ({ serviceType: 'singer', serviceId: id })),
        ...selectedMenus.map((id) => ({ serviceType: 'menu', serviceId: id })),
        ...selectedCars.map((id) => ({ serviceType: 'car', serviceId: id })),
      ]

      if (includeKarnaySurnay) {
        services.push({ serviceType: 'karnay_surnay', serviceId: 'karnay_surnay' })
      }

      await api.createBooking({
        hallId: selectedHallId,
        bookingDate,
        guestCount: guestNum,
        services,
        firstName,
        lastName,
        phone,
      })

      toast.success('Payment Successful! Your booking has been confirmed.')
      setSelectedBookingDate(null)
      navigateTo('my-bookings')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create booking'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-40 bg-rose-100 rounded" />
          <div className="h-4 w-64 bg-rose-50 rounded" />
          <div className="h-64 bg-rose-50 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!hall) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white max-w-4xl mx-auto px-4 sm:px-6 py-8">
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigateTo('hall-detail')}
          className="mb-4 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Hall Details
        </Button>

        {/* Hall Info Banner */}
        <Card className="border-rose-100 mb-6 bg-gradient-to-r from-rose-50 to-amber-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-rose-100">
              {hall.images?.[0]?.imageUrl ? (
                <img src={hall.images[0].imageUrl} alt={hall.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-rose-400" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-lg truncate">{hall.name}</h2>
              <p className="text-sm text-muted-foreground">{hall.district} • {hall.capacity} guests • {formatPrice(hall.seatPrice)}/seat</p>
            </div>
          </CardContent>
        </Card>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((step, index) => {
              const stepNum = index + 1
              const isActive = stepNum === currentStep
              const isCompleted = stepNum < currentStep
              return (
                <div key={stepNum} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                      ${isActive ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-200' : ''}
                      ${isCompleted ? 'bg-emerald-500 text-white' : ''}
                      ${!isActive && !isCompleted ? 'bg-gray-100 text-gray-400' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className={`text-xs font-medium ${isActive ? 'text-rose-600' : isCompleted ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
          {/* Progress bar */}
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-rose-500 to-pink-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep - 1) / 4) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 1: Select Date */}
            {currentStep === 1 && (
              <Card className="border-rose-100">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-1">Select Your Date</h3>
                  <p className="text-muted-foreground text-sm mb-6">Choose an available date for your wedding</p>

                  <div className="max-w-sm mx-auto">
                    <div className="flex items-center justify-between mb-4">
                      <Button variant="ghost" size="icon" onClick={() => {
                        if (calMonth === 1) { setCalMonth(12); setCalYear(calYear - 1) }
                        else setCalMonth(calMonth - 1)
                      }} className="h-8 w-8 hover:bg-rose-50">
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <h4 className="font-semibold">{MONTH_NAMES[calMonth - 1]} {calYear}</h4>
                      <Button variant="ghost" size="icon" onClick={() => {
                        if (calMonth === 12) { setCalMonth(1); setCalYear(calYear + 1) }
                        else setCalMonth(calMonth + 1)
                      }} className="h-8 w-8 hover:bg-rose-50">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {DAY_NAMES.map((d) => (
                        <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((day, idx) => {
                        if (day === null) return <div key={`e-${idx}`} className="aspect-square" />
                        const status = getDayStatus(day)
                        const isSelected = bookingDate === `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                        return (
                          <button
                            key={day}
                            onClick={() => status === 'available' && handleDateSelect(day)}
                            disabled={status !== 'available'}
                            className={`
                              aspect-square rounded-lg text-sm font-medium flex items-center justify-center transition-all
                              ${status === 'available' && !isSelected && 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer border border-emerald-200'}
                              ${status === 'available' && isSelected && 'bg-rose-500 text-white cursor-pointer border-2 border-rose-500 shadow-md shadow-rose-200'}
                              ${status === 'booked' && 'bg-red-50 text-red-300 cursor-not-allowed border border-red-100 line-through'}
                              ${status === 'past' && 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100'}
                            `}
                          >
                            {day}
                          </button>
                        )
                      })}
                    </div>

                    <div className="flex items-center gap-3 mt-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-emerald-50 border border-emerald-200" />
                        <span className="text-muted-foreground">Available</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-rose-500 border-2 border-rose-500" />
                        <span className="text-muted-foreground">Selected</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-red-50 border border-red-100" />
                        <span className="text-muted-foreground">Booked</span>
                      </div>
                    </div>

                    {bookingDate && (
                      <div className="mt-4 p-3 bg-rose-50 rounded-xl border border-rose-100 text-center">
                        <p className="text-sm text-muted-foreground">Selected Date</p>
                        <p className="font-semibold text-rose-600">
                          {new Date(bookingDate + 'T00:00:00').toLocaleDateString('en-US', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Guest Count */}
            {currentStep === 2 && (
              <Card className="border-rose-100">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-1">Enter Guest Count</h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    Hall capacity: {hall.capacity} guests
                  </p>

                  <div className="max-w-sm mx-auto space-y-6">
                    <div>
                      <Label htmlFor="guestCount" className="text-base font-medium mb-2 block">
                        Number of Guests
                      </Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-400" />
                        <Input
                          id="guestCount"
                          type="number"
                          placeholder="Enter number of guests"
                          value={guestCount}
                          onChange={(e) => setGuestCount(e.target.value)}
                          min={1}
                          max={hall.capacity}
                          className="pl-10 h-12 text-lg"
                        />
                      </div>
                      {hall && parseInt(guestCount) > hall.capacity && (
                        <p className="text-sm text-red-500 mt-1">
                          Exceeds hall capacity of {hall.capacity} guests
                        </p>
                      )}
                    </div>

                    {guestNum > 0 && guestNum <= hall.capacity && (
                      <Card className="bg-gradient-to-r from-rose-50 to-amber-50 border-rose-100">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Price per seat</span>
                              <span>{formatPrice(hall.seatPrice)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Guest count</span>
                              <span>× {guestNum}</span>
                            </div>
                            <Separator className="bg-rose-200" />
                            <div className="flex justify-between font-semibold">
                              <span>Base Price</span>
                              <span className="text-rose-600">{formatPrice(basePrice)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Select Services */}
            {currentStep === 3 && (
              <Card className="border-rose-100">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-1">Select Optional Services</h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    Enhance your wedding with these additional services
                  </p>

                  <div className="space-y-6">
                    {/* Karnay Surnay */}
                    {hall.hasKarnaySurnay && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Music className="w-4 h-4 text-amber-500" />
                          Karnay-Surnay
                        </h4>
                        <div
                          className="flex items-center gap-3 p-3 rounded-xl border border-rose-100 cursor-pointer hover:bg-rose-50/50 transition-colors"
                          onClick={() => setIncludeKarnaySurnay(!includeKarnaySurnay)}
                        >
                          <Checkbox
                            checked={includeKarnaySurnay}
                            onCheckedChange={() => setIncludeKarnaySurnay(!includeKarnaySurnay)}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">Karnay-Surnay Service</p>
                            <p className="text-xs text-rose-600 font-medium">{formatPrice(hall.karnaySurnayPrice || 0)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Singers */}
                    {hall.singers.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Music className="w-4 h-4 text-rose-500" />
                          Singers
                        </h4>
                        <div className="space-y-2">
                          {hall.singers.map((singer) => (
                            <div
                              key={singer.singerId}
                              className="flex items-center gap-3 p-3 rounded-xl border border-rose-100 cursor-pointer hover:bg-rose-50/50 transition-colors"
                              onClick={() => {
                                setSelectedSingers((prev) =>
                                  prev.includes(singer.singerId)
                                    ? prev.filter((id) => id !== singer.singerId)
                                    : [...prev, singer.singerId]
                                )
                              }}
                            >
                              <Checkbox
                                checked={selectedSingers.includes(singer.singerId)}
                                onCheckedChange={() => {
                                  setSelectedSingers((prev) =>
                                    prev.includes(singer.singerId)
                                      ? prev.filter((id) => id !== singer.singerId)
                                      : [...prev, singer.singerId]
                                  )
                                }}
                              />
                              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-rose-100">
                                {singer.imageUrl ? (
                                  <img src={singer.imageUrl} alt={singer.singerName} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Music className="w-4 h-4 text-rose-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{singer.singerName}</p>
                                <p className="text-xs text-rose-600 font-medium">{formatPrice(singer.price)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Menus */}
                    {hall.menus.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Utensils className="w-4 h-4 text-amber-500" />
                          Menus
                        </h4>
                        <div className="space-y-2">
                          {hall.menus.map((menu) => (
                            <div
                              key={menu.menuId}
                              className="flex items-center gap-3 p-3 rounded-xl border border-rose-100 cursor-pointer hover:bg-rose-50/50 transition-colors"
                              onClick={() => {
                                setSelectedMenus((prev) =>
                                  prev.includes(menu.menuId)
                                    ? prev.filter((id) => id !== menu.menuId)
                                    : [...prev, menu.menuId]
                                )
                              }}
                            >
                              <Checkbox
                                checked={selectedMenus.includes(menu.menuId)}
                                onCheckedChange={() => {
                                  setSelectedMenus((prev) =>
                                    prev.includes(menu.menuId)
                                      ? prev.filter((id) => id !== menu.menuId)
                                      : [...prev, menu.menuId]
                                  )
                                }}
                              />
                              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                <Utensils className="w-4 h-4 text-amber-500" />
                              </div>
                              <p className="font-medium text-sm">{menu.menuName}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cars */}
                    {hall.cars.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Car className="w-4 h-4 text-rose-500" />
                          Cars
                        </h4>
                        <div className="space-y-2">
                          {hall.cars.map((car) => (
                            <div
                              key={car.carId}
                              className="flex items-center gap-3 p-3 rounded-xl border border-rose-100 cursor-pointer hover:bg-rose-50/50 transition-colors"
                              onClick={() => {
                                setSelectedCars((prev) =>
                                  prev.includes(car.carId)
                                    ? prev.filter((id) => id !== car.carId)
                                    : [...prev, car.carId]
                                )
                              }}
                            >
                              <Checkbox
                                checked={selectedCars.includes(car.carId)}
                                onCheckedChange={() => {
                                  setSelectedCars((prev) =>
                                    prev.includes(car.carId)
                                      ? prev.filter((id) => id !== car.carId)
                                      : [...prev, car.carId]
                                  )
                                }}
                              />
                              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-rose-100">
                                {car.imageUrl ? (
                                  <img src={car.imageUrl} alt={car.brand} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Car className="w-4 h-4 text-rose-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{car.brand}</p>
                                <p className="text-xs text-rose-600 font-medium">{formatPrice(car.price)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Running Total */}
                    <Card className="bg-gradient-to-r from-rose-50 to-amber-50 border-rose-100">
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-3">Price Summary</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Base Price ({guestNum} guests)</span>
                            <span>{formatPrice(basePrice)}</span>
                          </div>
                          {singersTotal > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Singers</span>
                              <span>{formatPrice(singersTotal)}</span>
                            </div>
                          )}
                          {carsTotal > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Cars</span>
                              <span>{formatPrice(carsTotal)}</span>
                            </div>
                          )}
                          {karnaySurnayTotal > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Karnay-Surnay</span>
                              <span>{formatPrice(karnaySurnayTotal)}</span>
                            </div>
                          )}
                          <Separator className="bg-rose-200" />
                          <div className="flex justify-between font-bold">
                            <span>Total</span>
                            <span className="text-rose-600">{formatPrice(totalPrice)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Advance (20%)</span>
                            <span className="font-medium text-amber-600">{formatPrice(advancePayment)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Personal Info */}
            {currentStep === 4 && (
              <Card className="border-rose-100">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-1">Enter Your Information</h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    We need your contact details for the booking
                  </p>

                  <div className="max-w-md mx-auto space-y-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="Enter your first name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Enter your last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="+998 90 123 45 67"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 5: Review & Payment */}
            {currentStep === 5 && (
              <Card className="border-rose-100">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-1">Review & Payment</h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    Please review your booking details before payment
                  </p>

                  <div className="space-y-4">
                    {/* Booking Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100">
                        <p className="text-xs text-muted-foreground mb-1">Wedding Hall</p>
                        <p className="font-semibold">{hall.name}</p>
                        <p className="text-sm text-muted-foreground">{hall.district}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100">
                        <p className="text-xs text-muted-foreground mb-1">Date</p>
                        <p className="font-semibold">
                          {new Date(bookingDate + 'T00:00:00').toLocaleDateString('en-US', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100">
                        <p className="text-xs text-muted-foreground mb-1">Guest Count</p>
                        <p className="font-semibold">{guestNum} guests</p>
                      </div>
                      <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100">
                        <p className="text-xs text-muted-foreground mb-1">Contact</p>
                        <p className="font-semibold">{firstName} {lastName}</p>
                        <p className="text-sm text-muted-foreground">{phone}</p>
                      </div>
                    </div>

                    {/* Services Summary */}
                    {(selectedSingers.length > 0 || selectedMenus.length > 0 || selectedCars.length > 0 || includeKarnaySurnay) && (
                      <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                        <p className="text-xs text-muted-foreground mb-2">Selected Services</p>
                        <div className="flex flex-wrap gap-1.5">
                          {includeKarnaySurnay && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                              <Music className="w-3 h-3 mr-1" />
                              Karnay-Surnay — {formatPrice(karnaySurnayTotal)}
                            </Badge>
                          )}
                          {selectedSingers.map((id) => {
                            const singer = hall.singers.find((s) => s.singerId === id)
                            return singer ? (
                              <Badge key={id} className="bg-rose-100 text-rose-800 border-rose-200">
                                <Music className="w-3 h-3 mr-1" />
                                {singer.singerName} — {formatPrice(singer.price)}
                              </Badge>
                            ) : null
                          })}
                          {selectedMenus.map((id) => {
                            const menu = hall.menus.find((m) => m.menuId === id)
                            return menu ? (
                              <Badge key={id} className="bg-amber-100 text-amber-800 border-amber-200">
                                <Utensils className="w-3 h-3 mr-1" />
                                {menu.menuName}
                              </Badge>
                            ) : null
                          })}
                          {selectedCars.map((id) => {
                            const car = hall.cars.find((c) => c.carId === id)
                            return car ? (
                              <Badge key={id} className="bg-rose-100 text-rose-800 border-rose-200">
                                <Car className="w-3 h-3 mr-1" />
                                {car.brand} — {formatPrice(car.price)}
                              </Badge>
                            ) : null
                          })}
                        </div>
                      </div>
                    )}

                    {/* Price Breakdown */}
                    <Card className="bg-gradient-to-r from-rose-50 to-amber-50 border-rose-100">
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-3">Price Breakdown</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Base Price ({formatPrice(hall.seatPrice)} × {guestNum})</span>
                            <span>{formatPrice(basePrice)}</span>
                          </div>
                          {singersTotal > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Singers</span>
                              <span>{formatPrice(singersTotal)}</span>
                            </div>
                          )}
                          {carsTotal > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Cars</span>
                              <span>{formatPrice(carsTotal)}</span>
                            </div>
                          )}
                          {karnaySurnayTotal > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Karnay-Surnay</span>
                              <span>{formatPrice(karnaySurnayTotal)}</span>
                            </div>
                          )}
                          <Separator className="bg-rose-200" />
                          <div className="flex justify-between font-bold text-base">
                            <span>Total Price</span>
                            <span className="text-rose-600">{formatPrice(totalPrice)}</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span>Advance Payment (20%)</span>
                            <span className="text-amber-600">{formatPrice(advancePayment)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? () => navigateTo('hall-detail') : handleBack}
            className="border-rose-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === 1 ? 'Back to Hall' : 'Previous'}
          </Button>

          {currentStep < 5 ? (
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white"
            >
              Next Step
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handlePayment}
              disabled={submitting}
              className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Pay Advance — {formatPrice(advancePayment)}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
