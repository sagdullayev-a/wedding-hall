'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Check, Minus, Star, Users, MapPin, Music, Utensils, Car,
  Building2, ArrowRight, Crown
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface HallImage {
  imageId: string
  imageUrl: string
}

interface Singer {
  singerId: string
  singerName: string
  price: number
}

interface Menu {
  menuId: string
  menuName: string
}

interface CarItem {
  carId: string
  brand: string
  price: number
}

interface Review {
  reviewId: string
  rating: number
}

interface Hall {
  hallId: string
  name: string
  district: string
  address: string
  capacity: number
  seatPrice: number
  hasKarnaySurnay: boolean
  karnaySurnayPrice: number | null
  images: HallImage[]
  singers: Singer[]
  menus: Menu[]
  cars: CarItem[]
  reviews: Review[]
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('uz-UZ').format(price) + " so'm"

interface CompareRowProps {
  label: string
  icon: React.ElementType
  values: (string | number | boolean | null)[]
  isBest?: (val: (string | number | boolean | null)) => boolean
  format?: (val: (string | number | boolean | null)) => string
}

function CompareRow({ label, icon: Icon, values, isBest, format }: CompareRowProps) {
  return (
    <div className="grid grid-cols-[140px_1fr_1fr_1fr] gap-2 items-center py-3 border-b border-rose-100/50 dark:border-rose-900/20 last:border-0">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="w-4 h-4 text-rose-400 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      {values.map((val, idx) => {
        const best = isBest ? isBest(val) : false
        const display = format ? format(val) : val === null ? '—' : String(val)
        return (
          <div
            key={idx}
            className={`text-center text-sm font-medium ${
              best
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-foreground'
            }`}
          >
            {typeof val === 'boolean' ? (
              val ? (
                <Check className="w-5 h-5 mx-auto text-emerald-500" />
              ) : (
                <Minus className="w-5 h-5 mx-auto text-gray-300 dark:text-gray-600" />
              )
            ) : (
              <span className="flex items-center justify-center gap-1">
                {best && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                {display}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function HallComparisonPage() {
  const { compareHallIds, removeFromCompare, clearCompare, navigateTo, selectHall } = useAppStore()
  const [halls, setHalls] = useState<Hall[]>([])
  const [loading, setLoading] = useState(true)

  const loadHalls = async () => {
    if (compareHallIds.length === 0) {
      setHalls([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const loadedHalls = await Promise.all(
        compareHallIds.map(id => api.getHall(id))
      )
      setHalls(loadedHalls.map(r => r.hall).filter(Boolean))
    } catch {
      toast.error('Failed to load hall details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadHalls()
    }, 0)
    return () => clearTimeout(timer)
  }, [compareHallIds])

  const handleViewHall = (hallId: string) => {
    selectHall(hallId)
    navigateTo('hall-detail')
  }

  const avgRating = (hall: Hall) => {
    if (!hall.reviews || hall.reviews.length === 0) return 0
    return hall.reviews.reduce((sum, r) => sum + r.rating, 0) / hall.reviews.length
  }

  if (compareHallIds.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white dark:from-background dark:to-background flex items-center justify-center">
        <Card className="p-12 text-center max-w-md mx-auto border-rose-100 dark:border-rose-900/30">
          <Building2 className="w-16 h-16 mx-auto text-rose-200 dark:text-rose-700 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Halls to Compare</h3>
          <p className="text-muted-foreground mb-4">Add halls to compare by clicking the &quot;Compare&quot; button on hall cards</p>
          <Button onClick={() => navigateTo('halls')} className="bg-rose-500 hover:bg-rose-600 text-white">
            Browse Halls
          </Button>
        </Card>
      </div>
    )
  }

  // Pad halls array to 3 for grid alignment
  const paddedHalls = [...halls]
  while (paddedHalls.length < 3 && paddedHalls.length < compareHallIds.length + 2) {
    paddedHalls.push(null as unknown as Hall)
  }

  const capacityValues = halls.map(h => h.capacity)
  const priceValues = halls.map(h => h.seatPrice)
  const ratingValues = halls.map(h => avgRating(h))

  const bestCapacity = Math.max(...capacityValues)
  const bestPrice = Math.min(...priceValues.filter(p => p > 0))
  const bestRating = Math.max(...ratingValues.filter(r => r > 0))

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white dark:from-background dark:to-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                Compare Halls
              </span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Comparing {halls.length} wedding hall{halls.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigateTo('halls')}
              className="border-rose-200 dark:border-rose-800"
            >
              Browse More
            </Button>
            <Button
              variant="outline"
              onClick={clearCompare}
              className="border-red-200 dark:border-red-900/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-[140px_1fr_1fr_1fr] gap-4">
            <div />
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-rose-100 dark:border-rose-900/30 overflow-hidden">
              <CardContent className="p-6">
                {/* Hall Headers */}
                <div className="grid grid-cols-[140px_1fr_1fr_1fr] gap-2 mb-4">
                  <div />
                  {halls.map((hall) => (
                    <div key={hall.hallId} className="text-center">
                      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-3">
                        {hall.images?.[0]?.imageUrl ? (
                          <img
                            src={hall.images[0].imageUrl}
                            alt={hall.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/30 dark:to-amber-900/30 flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-rose-300 dark:text-rose-600" />
                          </div>
                        )}
                        <button
                          onClick={() => removeFromCompare(hall.hallId)}
                          className="absolute top-2 right-2 h-6 w-6 rounded-full bg-red-500/90 text-white hover:bg-red-600 flex items-center justify-center shadow-md transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h3 className="font-bold text-base mb-1">{hall.name}</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewHall(hall.hallId)}
                        className="border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs"
                      >
                        View Details
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  ))}
                  {/* Empty placeholder columns */}
                  {Array.from({ length: Math.max(0, 3 - halls.length) }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="flex items-center justify-center">
                      <div className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/10 flex items-center justify-center">
                        <div className="text-center">
                          <Building2 className="w-8 h-8 mx-auto text-rose-300 dark:text-rose-700 mb-1" />
                          <p className="text-xs text-muted-foreground">Add a hall</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-0">
                  {/* Comparison Rows */}
                  <CompareRow
                    label="District"
                    icon={MapPin}
                    values={halls.map(h => h.district)}
                  />
                  <CompareRow
                    label="Capacity"
                    icon={Users}
                    values={halls.map(h => h.capacity)}
                    isBest={(val) => val === bestCapacity}
                    format={(val) => val ? `${val} guests` : '—'}
                  />
                  <CompareRow
                    label="Seat Price"
                    icon={Star}
                    values={halls.map(h => h.seatPrice)}
                    isBest={(val) => val === bestPrice}
                    format={(val) => val ? formatPrice(val as number) : '—'}
                  />
                  <CompareRow
                    label="Rating"
                    icon={Star}
                    values={halls.map(h => avgRating(h))}
                    isBest={(val) => val === bestRating && val > 0}
                    format={(val) => val ? `${Number(val).toFixed(1)} / 5` : 'No reviews'}
                  />
                  <CompareRow
                    label="Karnay-Surnay"
                    icon={Music}
                    values={halls.map(h => h.hasKarnaySurnay)}
                  />
                  <CompareRow
                    label="K-S Price"
                    icon={Music}
                    values={halls.map(h => h.karnaySurnayPrice)}
                    format={(val) => val ? formatPrice(val as number) : '—'}
                  />
                  <CompareRow
                    label="Singers"
                    icon={Music}
                    values={halls.map(h => h.singers?.length || 0)}
                    isBest={(val) => val === Math.max(...halls.map(h => h.singers?.length || 0))}
                    format={(val) => val ? `${val} available` : '0'}
                  />
                  <CompareRow
                    label="Menus"
                    icon={Utensils}
                    values={halls.map(h => h.menus?.length || 0)}
                    isBest={(val) => val === Math.max(...halls.map(h => h.menus?.length || 0))}
                    format={(val) => val ? `${val} options` : '0'}
                  />
                  <CompareRow
                    label="Cars"
                    icon={Car}
                    values={halls.map(h => h.cars?.length || 0)}
                    isBest={(val) => val === Math.max(...halls.map(h => h.cars?.length || 0))}
                    format={(val) => val ? `${val} available` : '0'}
                  />
                  <CompareRow
                    label="Reviews"
                    icon={Star}
                    values={halls.map(h => h.reviews?.length || 0)}
                    isBest={(val) => val === Math.max(...halls.map(h => h.reviews?.length || 0))}
                    format={(val) => val ? `${val} reviews` : '0'}
                  />
                </div>

                {/* Quick Legend */}
                <div className="mt-6 pt-4 border-t border-rose-100 dark:border-rose-900/20 flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    <span>Best value</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Minus className="w-3.5 h-3.5 text-gray-300" />
                    <span>Not available</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Bottom Action */}
        {halls.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center"
          >
            <Card className="border-rose-100 dark:border-rose-900/30 bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/20 dark:to-amber-950/20">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Ready to Book?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose the hall that best fits your needs and book it now
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {halls.map(hall => (
                    <Button
                      key={hall.hallId}
                      onClick={() => handleViewHall(hall.hallId)}
                      className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white"
                    >
                      Book {hall.name}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}
