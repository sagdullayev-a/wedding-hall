'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, Calendar, Users, Music, Utensils,
  Car, Check, CreditCard, User, ChevronLeft, ChevronRight,
  Building2, Sparkles, Loader2, PartyPopper, Star, Phone
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

// Confetti component
function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: {
      x: number
      y: number
      vx: number
      vy: number
      color: string
      size: number
      rotation: number
      rotationSpeed: number
      shape: 'circle' | 'rect'
    }[] = []

    const colors = ['#f43f5e', '#ec4899', '#f59e0b', '#10b981', '#a855f7', '#f97316']

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        shape: Math.random() > 0.5 ? 'circle' : 'rect',
      })
    }

    let animationId: number
    let frame = 0

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      frame++

      for (const p of particles) {
        p.x += p.vx
        p.vy += 0.1
        p.y += p.vy
        p.rotation += p.rotationSpeed
        p.vx *= 0.99

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.globalAlpha = Math.max(0, 1 - frame / 150)
        ctx.fillStyle = p.color

        if (p.shape === 'circle') {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        }

        ctx.restore()
      }

      if (frame < 150) {
        animationId = requestAnimationFrame(animate)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
    />
  )
}

export default function BookingPage() {
  const { selectedHallId, selectedBookingDate, navigateTo, token, user, setSelectedBookingDate } = useAppStore()
  const [hall, setHall] = useState<Hall | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [bookingComplete, setBookingComplete] = useState(false)

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

  useEffect(() => {
    if (user) {
      if (!firstName) setFirstName(user.firstName)
      if (!lastName) setLastName(user.lastName)
      if (!phone) setPhone(user.phone)
    }
  }, [user])

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
        return true
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

      setBookingComplete(true)
      toast.success('Payment Successful! Your booking has been confirmed.')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create booking'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white dark:from-background dark:to-background max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-40 bg-rose-100 dark:bg-rose-900/20 rounded" />
          <div className="h-4 w-64 bg-rose-50 dark:bg-rose-900/10 rounded" />
          <div className="h-64 bg-rose-50 dark:bg-rose-900/10 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!hall) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white dark:from-background dark:to-background max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Card className="p-12 text-center border-rose-100 dark:border-rose-900/30">
          <Building2 className="w-16 h-16 mx-auto text-rose-200 dark:text-rose-700 mb-4" />
          <h3 className="text-lg font-semibold mb-2 dark:text-foreground">Hall Not Found</h3>
          <Button onClick={() => navigateTo('halls')} className="bg-rose-500 hover:bg-rose-600 text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Halls
          </Button>
        </Card>
      </div>
    )
  }

  // Booking Complete Screen
  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white dark:from-background dark:to-background flex items-center justify-center">
        <Confetti />
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <motion.div
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="w-24 h-24 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-xl shadow-rose-200 dark:shadow-rose-900/30"
          >
            <PartyPopper className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2 dark:text-foreground">Booking Confirmed!</h2>
          <p className="text-muted-foreground mb-6">
            Your wedding hall has been booked successfully. We&apos;ve sent the details to your phone.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => {
                setSelectedBookingDate(null)
                navigateTo('my-bookings')
              }}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white"
            >
              View My Bookings
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedBookingDate(null)
                navigateTo('halls')
              }}
              className="w-full border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400"
            >
              Browse More Halls
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white dark:from-background dark:to-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigateTo('hall-detail')}
          className="mb-4 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Hall Details
        </Button>

        {/* Hall Info Banner */}
        <Card className="border-rose-100 dark:border-rose-900/30 mb-6 bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/20 dark:to-amber-950/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-rose-100 dark:bg-rose-900/30">
              {hall.images?.[0]?.imageUrl ? (
                <img src={hall.images[0].imageUrl} alt={hall.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-rose-400 dark:text-rose-600" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-lg truncate">{hall.name}</h2>
              <p className="text-sm text-muted-foreground">{hall.district} • {hall.capacity} guests • {formatPrice(hall.seatPrice)}/seat</p>
            </div>
          </CardContent>
        </Card>

        {/* Step Indicator with connecting lines */}
        <div className="mb-8">
          <div className="relative flex items-center justify-between mb-3">
            {/* Connecting line behind circles */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-100 dark:bg-gray-800" />
            <motion.div
              className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-rose-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep - 1) / 4) * 100}%` }}
              transition={{ duration: 0.4 }}
            />

            {STEPS.map((step, index) => {
              const stepNum = index + 1
              const isActive = stepNum === currentStep
              const isCompleted = stepNum < currentStep
              return (
                <div key={stepNum} className="relative flex flex-col items-center gap-1.5 z-10">
                  <motion.div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                      ${isActive ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-200' : ''}
                      ${isCompleted ? 'bg-emerald-500 text-white shadow-md shadow-emerald-100' : ''}
                      ${!isActive && !isCompleted ? 'bg-white dark:bg-card text-gray-400 border-2 border-gray-200 dark:border-gray-700' : ''}
                    `}
                    whileHover={isCompleted ? { scale: 1.1 } : {}}
                  >
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <Check className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                  </motion.div>
                  <span className={`text-xs font-medium ${isActive ? 'text-rose-600 dark:text-rose-400' : isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Main content area with sidebar */}
        <div className="flex gap-6">
          {/* Step Content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                {/* Step 1: Select Date */}
                {currentStep === 1 && (
                  <Card className="border-rose-100 dark:border-rose-900/30">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-1 dark:text-foreground">Select Your Date</h3>
                      <p className="text-muted-foreground text-sm mb-6">Choose an available date for your wedding</p>

                      <div className="max-w-sm mx-auto">
                        <div className="flex items-center justify-between mb-4">
                          <Button variant="ghost" size="icon" onClick={() => {
                            if (calMonth === 1) { setCalMonth(12); setCalYear(calYear - 1) }
                            else setCalMonth(calMonth - 1)
                          }} className="h-8 w-8 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <h4 className="font-semibold dark:text-foreground">{MONTH_NAMES[calMonth - 1]} {calYear}</h4>
                          <Button variant="ghost" size="icon" onClick={() => {
                            if (calMonth === 12) { setCalMonth(1); setCalYear(calYear + 1) }
                            else setCalMonth(calMonth + 1)
                          }} className="h-8 w-8 hover:bg-rose-50 dark:hover:bg-rose-900/20">
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
                              <motion.button
                                key={day}
                                onClick={() => status === 'available' && handleDateSelect(day)}
                                disabled={status !== 'available'}
                                whileHover={status === 'available' ? { scale: 1.1 } : {}}
                                whileTap={status === 'available' ? { scale: 0.95 } : {}}
                                className={`
                                  aspect-square rounded-lg text-sm font-medium flex items-center justify-center transition-all
                                  ${status === 'available' && !isSelected && 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 dark:hover:bg-green-900/30'}
                                  ${status === 'available' && isSelected && 'bg-rose-500 text-white cursor-pointer border-2 border-rose-500 shadow-md shadow-rose-200 dark:shadow-rose-900/30 scale-105'}
                                  ${status === 'booked' && 'bg-red-100 text-red-800 cursor-not-allowed border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800 line-through'}
                                  ${status === 'past' && 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 dark:bg-gray-800/30 dark:text-gray-500 dark:border-gray-700'}
                                `}
                              >
                                {day}
                              </motion.button>
                            )
                          })}
                        </div>

                        <div className="flex items-center gap-3 mt-4 text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-green-100 border border-green-200 dark:bg-green-900/30 dark:border-green-800" />
                            <span className="text-muted-foreground">Available</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-rose-500 border-2 border-rose-500" />
                            <span className="text-muted-foreground">Selected</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-red-100 border border-red-200 dark:bg-red-900/30 dark:border-red-800" />
                            <span className="text-muted-foreground">Booked</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:border-gray-700" />
                            <span className="text-muted-foreground">Past</span>
                          </div>
                        </div>

                        {bookingDate && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-4 bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-900/20 dark:to-amber-900/20 rounded-xl border border-rose-100 dark:border-rose-800/30 text-center"
                          >
                            <p className="text-sm text-muted-foreground">Selected Date</p>
                            <p className="font-bold text-rose-600 dark:text-rose-400 text-lg">
                              {new Date(bookingDate + 'T00:00:00').toLocaleDateString('en-US', {
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                              })}
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 2: Guest Count */}
                {currentStep === 2 && (
                  <Card className="border-rose-100 dark:border-rose-900/30">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-1 dark:text-foreground">Enter Guest Count</h3>
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

                        {/* Quick select buttons */}
                        <div className="flex flex-wrap gap-2">
                          {[50, 100, 150, 200, 300, 500].map((num) => (
                            <Button
                              key={num}
                              variant={guestNum === num ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setGuestCount(String(num))}
                              className={
                                guestNum === num
                                  ? 'bg-rose-500 text-white border-rose-500'
                                  : 'border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-900/20'
                              }
                            >
                              {num}
                            </Button>
                          ))}
                        </div>

                        {guestNum > 0 && guestNum <= hall.capacity && (
                          <Card className="bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-900/20 dark:to-amber-900/20 border-rose-100 dark:border-rose-800/30">
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
                                <Separator className="bg-rose-200 dark:bg-rose-800/50" />
                                <div className="flex justify-between font-semibold">
                                  <span>Base Price</span>
                                  <span className="text-rose-600 dark:text-rose-400">{formatPrice(basePrice)}</span>
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
                  <Card className="border-rose-100 dark:border-rose-900/30">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-1 dark:text-foreground">Select Optional Services</h3>
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
                            <motion.div
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                                includeKarnaySurnay
                                  ? 'border-rose-300 bg-rose-50 dark:border-rose-600 dark:bg-rose-900/20'
                                  : 'border-rose-100 dark:border-rose-800/30 hover:bg-rose-50/50 dark:hover:bg-rose-900/10'
                              }`}
                              onClick={() => setIncludeKarnaySurnay(!includeKarnaySurnay)}
                            >
                              <Checkbox
                                checked={includeKarnaySurnay}
                                onCheckedChange={() => setIncludeKarnaySurnay(!includeKarnaySurnay)}
                              />
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center shrink-0">
                                <Music className="w-6 h-6 text-amber-500" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm">Karnay-Surnay Service</p>
                                <p className="text-xs text-muted-foreground">Traditional wedding music</p>
                              </div>
                              <span className="text-sm font-semibold text-rose-600">{formatPrice(hall.karnaySurnayPrice || 0)}</span>
                            </motion.div>
                          </div>
                        )}

                        {/* Singers */}
                        {hall.singers.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Music className="w-4 h-4 text-rose-500" />
                              Singers
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {hall.singers.map((singer) => {
                                const isSelected = selectedSingers.includes(singer.singerId)
                                return (
                                  <motion.div
                                    key={singer.singerId}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                                      isSelected
                                        ? 'border-rose-300 bg-rose-50'
                                        : 'border-rose-100 hover:bg-rose-50/50'
                                    }`}
                                    onClick={() => {
                                      setSelectedSingers((prev) =>
                                        prev.includes(singer.singerId)
                                          ? prev.filter((id) => id !== singer.singerId)
                                          : [...prev, singer.singerId]
                                      )
                                    }}
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => {
                                        setSelectedSingers((prev) =>
                                          prev.includes(singer.singerId)
                                            ? prev.filter((id) => id !== singer.singerId)
                                            : [...prev, singer.singerId]
                                        )
                                      }}
                                    />
                                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-rose-100">
                                      {singer.imageUrl ? (
                                        <img src={singer.imageUrl} alt={singer.singerName} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <Music className="w-5 h-5 text-rose-400" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">{singer.singerName}</p>
                                      <p className="text-xs text-rose-600 font-medium">{formatPrice(singer.price)}</p>
                                    </div>
                                  </motion.div>
                                )
                              })}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {hall.menus.map((menu) => {
                                const isSelected = selectedMenus.includes(menu.menuId)
                                return (
                                  <motion.div
                                    key={menu.menuId}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                                      isSelected
                                        ? 'border-amber-300 bg-amber-50'
                                        : 'border-rose-100 hover:bg-rose-50/50'
                                    }`}
                                    onClick={() => {
                                      setSelectedMenus((prev) =>
                                        prev.includes(menu.menuId)
                                          ? prev.filter((id) => id !== menu.menuId)
                                          : [...prev, menu.menuId]
                                      )
                                    }}
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => {
                                        setSelectedMenus((prev) =>
                                          prev.includes(menu.menuId)
                                            ? prev.filter((id) => id !== menu.menuId)
                                            : [...prev, menu.menuId]
                                        )
                                      }}
                                    />
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center shrink-0">
                                      <Utensils className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <p className="font-medium text-sm">{menu.menuName}</p>
                                  </motion.div>
                                )
                              })}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {hall.cars.map((car) => {
                                const isSelected = selectedCars.includes(car.carId)
                                return (
                                  <motion.div
                                    key={car.carId}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                                      isSelected
                                        ? 'border-rose-300 bg-rose-50'
                                        : 'border-rose-100 hover:bg-rose-50/50'
                                    }`}
                                    onClick={() => {
                                      setSelectedCars((prev) =>
                                        prev.includes(car.carId)
                                          ? prev.filter((id) => id !== car.carId)
                                          : [...prev, car.carId]
                                      )
                                    }}
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => {
                                        setSelectedCars((prev) =>
                                          prev.includes(car.carId)
                                            ? prev.filter((id) => id !== car.carId)
                                            : [...prev, car.carId]
                                        )
                                      }}
                                    />
                                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-rose-100">
                                      {car.imageUrl ? (
                                        <img src={car.imageUrl} alt={car.brand} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <Car className="w-5 h-5 text-rose-400" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">{car.brand}</p>
                                      <p className="text-xs text-rose-600 font-medium">{formatPrice(car.price)}</p>
                                    </div>
                                  </motion.div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 4: Personal Info */}
                {currentStep === 4 && (
                  <Card className="border-rose-100 dark:border-rose-900/30">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-1 dark:text-foreground">Enter Your Information</h3>
                      <p className="text-muted-foreground text-sm mb-6">
                        We need your contact details for the booking
                      </p>

                      <div className="max-w-md mx-auto space-y-4">
                        <div>
                          <Label htmlFor="firstName" className="dark:text-foreground">First Name</Label>
                          <div className="relative mt-1.5">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400 dark:text-rose-500" />
                            <Input
                              id="firstName"
                              placeholder="Enter your first name"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              className="pl-10 border-rose-200 dark:border-rose-800/50 dark:bg-background/50 dark:text-foreground"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="lastName" className="dark:text-foreground">Last Name</Label>
                          <div className="relative mt-1.5">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400 dark:text-rose-500" />
                            <Input
                              id="lastName"
                              placeholder="Enter your last name"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              className="pl-10 border-rose-200 dark:border-rose-800/50 dark:bg-background/50 dark:text-foreground"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="phone" className="dark:text-foreground">Phone Number</Label>
                          <div className="relative mt-1.5">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400 dark:text-rose-500" />
                            <Input
                              id="phone"
                              placeholder="+998 90 123 45 67"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="pl-10 border-rose-200 dark:border-rose-800/50 dark:bg-background/50 dark:text-foreground"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 5: Review & Payment */}
                {currentStep === 5 && (
                  <Card className="border-rose-100 dark:border-rose-900/30">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-1 dark:text-foreground">Review & Payment</h3>
                      <p className="text-muted-foreground text-sm mb-6">
                        Please review your booking details before payment
                      </p>

                      <div className="space-y-4">
                        {/* Booking Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30">
                            <p className="text-xs text-muted-foreground mb-1">Wedding Hall</p>
                            <p className="font-semibold dark:text-foreground">{hall.name}</p>
                            <p className="text-sm text-muted-foreground">{hall.district}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30">
                            <p className="text-xs text-muted-foreground mb-1">Date</p>
                            <p className="font-semibold dark:text-foreground">
                              {new Date(bookingDate + 'T00:00:00').toLocaleDateString('en-US', {
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30">
                            <p className="text-xs text-muted-foreground mb-1">Guest Count</p>
                            <p className="font-semibold dark:text-foreground">{guestNum} guests</p>
                          </div>
                          <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30">
                            <p className="text-xs text-muted-foreground mb-1">Contact</p>
                            <p className="font-semibold dark:text-foreground">{firstName} {lastName}</p>
                            <p className="text-sm text-muted-foreground">{phone}</p>
                          </div>
                        </div>

                        {/* Price Breakdown with visual bars */}
                        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50/50 to-rose-50/50 dark:from-amber-900/10 dark:to-rose-900/10 border border-amber-100 dark:border-amber-800/30">
                          <p className="text-xs text-muted-foreground mb-3">Price Breakdown</p>
                          <div className="space-y-2.5">
                            {basePrice > 0 && (
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-muted-foreground">Base ({guestNum} guests)</span>
                                  <span className="font-medium dark:text-foreground">{formatPrice(basePrice)}</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${totalPrice > 0 ? (basePrice / totalPrice) * 100 : 0}%` }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                    className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full"
                                  />
                                </div>
                              </div>
                            )}
                            {singersTotal > 0 && (
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-muted-foreground">Singers</span>
                                  <span className="font-medium dark:text-foreground">{formatPrice(singersTotal)}</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${totalPrice > 0 ? (singersTotal / totalPrice) * 100 : 0}%` }}
                                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                                    className="h-full bg-gradient-to-r from-pink-400 to-pink-500 rounded-full"
                                  />
                                </div>
                              </div>
                            )}
                            {carsTotal > 0 && (
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-muted-foreground">Cars</span>
                                  <span className="font-medium dark:text-foreground">{formatPrice(carsTotal)}</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${totalPrice > 0 ? (carsTotal / totalPrice) * 100 : 0}%` }}
                                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
                                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                                  />
                                </div>
                              </div>
                            )}
                            {karnaySurnayTotal > 0 && (
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-muted-foreground">Karnay-Surnay</span>
                                  <span className="font-medium dark:text-foreground">{formatPrice(karnaySurnayTotal)}</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${totalPrice > 0 ? (karnaySurnayTotal / totalPrice) * 100 : 0}%` }}
                                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
                                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Services Summary */}
                        {(selectedSingers.length > 0 || selectedMenus.length > 0 || selectedCars.length > 0 || includeKarnaySurnay) && (
                          <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30">
                            <p className="text-xs text-muted-foreground mb-2">Selected Services</p>
                            <div className="flex flex-wrap gap-1.5">
                              {includeKarnaySurnay && (
                                <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                                  <Music className="w-3 h-3 mr-1" />
                                  Karnay-Surnay — {formatPrice(karnaySurnayTotal)}
                                </Badge>
                              )}
                              {selectedSingers.map((id) => {
                                const singer = hall.singers.find((s) => s.singerId === id)
                                return singer ? (
                                  <Badge key={id} className="bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800">
                                    <Music className="w-3 h-3 mr-1" />
                                    {singer.singerName} — {formatPrice(singer.price)}
                                  </Badge>
                                ) : null
                              })}
                              {selectedMenus.map((id) => {
                                const menu = hall.menus.find((m) => m.menuId === id)
                                return menu ? (
                                  <Badge key={id} className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                                    <Utensils className="w-3 h-3 mr-1" />
                                    {menu.menuName}
                                  </Badge>
                                ) : null
                              })}
                              {selectedCars.map((id) => {
                                const car = hall.cars.find((c) => c.carId === id)
                                return car ? (
                                  <Badge key={id} className="bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800">
                                    <Car className="w-3 h-3 mr-1" />
                                    {car.brand} — {formatPrice(car.price)}
                                  </Badge>
                                ) : null
                              })}
                            </div>
                          </div>
                        )}
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

          {/* Sticky Price Summary Sidebar */}
          <div className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-4">
              <Card className="border-rose-100 dark:border-rose-900/30 bg-gradient-to-b from-white to-rose-50/30 dark:from-card dark:to-rose-950/10 shadow-sm">
                <CardContent className="p-5">
                  <h4 className="font-bold mb-4 flex items-center gap-2 dark:text-foreground">
                    <Star className="w-4 h-4 text-amber-500" />
                    Price Summary
                  </h4>
                  <div className="space-y-3">
                    {bookingDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Date</span>
                        <span className="font-medium text-xs dark:text-foreground">
                          {new Date(bookingDate + 'T00:00:00').toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Guests</span>
                      <span className="font-medium dark:text-foreground">{guestNum || '—'}</span>
                    </div>
                    <Separator className="bg-rose-100 dark:bg-rose-800/50" />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Base Price</span>
                      <span className="dark:text-foreground">{guestNum > 0 ? formatPrice(basePrice) : '—'}</span>
                    </div>
                    {singersTotal > 0 && (
                      <div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Singers</span>
                          <span className="dark:text-foreground">{formatPrice(singersTotal)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-1">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${totalPrice > 0 ? (singersTotal / totalPrice) * 100 : 0}%` }}
                            className="h-full bg-gradient-to-r from-pink-400 to-pink-500 rounded-full"
                          />
                        </div>
                      </div>
                    )}
                    {carsTotal > 0 && (
                      <div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Cars</span>
                          <span className="dark:text-foreground">{formatPrice(carsTotal)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-1">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${totalPrice > 0 ? (carsTotal / totalPrice) * 100 : 0}%` }}
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                          />
                        </div>
                      </div>
                    )}
                    {karnaySurnayTotal > 0 && (
                      <div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Karnay-Surnay</span>
                          <span className="dark:text-foreground">{formatPrice(karnaySurnayTotal)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-1">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${totalPrice > 0 ? (karnaySurnayTotal / totalPrice) * 100 : 0}%` }}
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                          />
                        </div>
                      </div>
                    )}
                    <Separator className="bg-rose-200 dark:bg-rose-800/50" />
                    <div className="flex justify-between font-bold">
                      <span className="dark:text-foreground">Total</span>
                      <span className="text-rose-600 dark:text-rose-400">{totalPrice > 0 ? formatPrice(totalPrice) : '—'}</span>
                    </div>
                    {totalPrice > 0 && (
                      <div className="p-3 bg-gradient-to-r from-amber-50 to-rose-50 dark:from-amber-900/20 dark:to-rose-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Advance (20%)</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">{formatPrice(advancePayment)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Due now to confirm booking</p>
                      </div>
                    )}
                  </div>

                  {/* Progress dots */}
                  <div className="mt-5 pt-4 border-t border-rose-100 dark:border-rose-800/30">
                    <p className="text-xs text-muted-foreground mb-2">Booking Progress</p>
                    <div className="flex items-center gap-1.5">
                      {STEPS.map((_, index) => (
                        <div
                          key={index}
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            index < currentStep
                              ? 'bg-gradient-to-r from-rose-500 to-pink-500'
                              : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Step {currentStep} of 5
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
