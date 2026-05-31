'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Search, MapPin, Users, Building2, Music, SlidersHorizontal,
  ChevronLeft, ChevronRight, X, Star, Heart, LayoutGrid, List, GitCompareArrows
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

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
  images: { imageId: string; imageUrl: string }[]
  singers: { singerId: string; singerName: string; price: number }[]
  menus: { menuId: string; menuName: string }[]
  cars: { carId: string; brand: string; price: number }[]
  averageRating?: number
  reviewCount?: number
}

const DISTRICTS = [
  'Tashkent', 'Samarkand', 'Bukhara', 'Andijan', 'Namangan',
  'Fergana', 'Khorezm', 'Surkhandarya', 'Kashkadarya', 'Jizzakh',
  'Syrdarya', 'Navoi', 'Tashkent Region', 'Karakalpakstan'
]

const formatPrice = (price: number) =>
  new Intl.NumberFormat('uz-UZ').format(price) + " so'm"

function StarDisplay({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${
              i < Math.round(rating)
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-200 fill-gray-200 dark:text-gray-700 dark:fill-gray-700'
            }`}
          />
        ))}
      </div>
      {count > 0 && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </div>
  )
}

function HallCardGrid({ hall, onHallClick, onFavoriteToggle, favorites, onCompareToggle, compareHallIds }: {
  hall: Hall
  onHallClick: (id: string) => void
  onFavoriteToggle: (id: string) => void
  favorites: Set<string>
  onCompareToggle: (id: string) => void
  compareHallIds: string[]
}) {
  const isFav = favorites.has(hall.hallId)
  const isCompared = compareHallIds.includes(hall.hallId)
  return (
    <Card
      className="overflow-hidden cursor-pointer group hover:shadow-xl hover:shadow-rose-200/40 dark:hover:shadow-rose-900/20 transition-all duration-300 border-rose-100 dark:border-rose-900/30 hover:scale-[1.02]"
      onClick={() => onHallClick(hall.hallId)}
    >
      <div className="relative h-48 overflow-hidden">
        {hall.images?.[0]?.imageUrl ? (
          <img
            src={hall.images[0].imageUrl}
            alt={hall.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/30 dark:to-amber-900/30 flex items-center justify-center">
            <Building2 className="w-14 h-14 text-rose-300 dark:text-rose-600" />
          </div>
        )}
        {hall.hasKarnaySurnay && (
          <Badge className="absolute top-3 right-14 bg-amber-500 text-white text-xs">
            <Music className="w-3 h-3 mr-1" />
            Karnay-Surnay
          </Badge>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onFavoriteToggle(hall.hallId)
          }}
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 dark:bg-card/90 hover:bg-white dark:hover:bg-card flex items-center justify-center shadow-md transition-all hover:scale-110"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFav
                ? 'text-rose-500 fill-rose-500'
                : 'text-gray-500 hover:text-rose-400 dark:text-gray-400'
            }`}
          />
        </button>
        {/* Compare button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onCompareToggle(hall.hallId)
          }}
          className={`absolute top-3 left-3 h-8 w-8 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110 ${
            isCompared
              ? 'bg-rose-500 text-white'
              : 'bg-white/90 dark:bg-card/90 hover:bg-white dark:hover:bg-card text-gray-500 hover:text-rose-400 dark:text-gray-400'
          }`}
        >
          <GitCompareArrows className="w-4 h-4" />
        </button>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-base mb-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-1">
          {hall.name}
        </h3>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="line-clamp-1">{hall.district}</span>
        </div>
        {(hall.averageRating !== undefined && hall.averageRating > 0) && (
          <StarDisplay rating={hall.averageRating} count={hall.reviewCount || 0} />
        )}
        <div className="flex items-center justify-between mt-3">
          <Badge variant="secondary" className="bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-800">
            <Users className="w-3 h-3 mr-1" />
            {hall.capacity}
          </Badge>
          <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
            {formatPrice(hall.seatPrice)}/seat
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function HallCardList({ hall, onHallClick, onFavoriteToggle, favorites, onCompareToggle, compareHallIds }: {
  hall: Hall
  onHallClick: (id: string) => void
  onFavoriteToggle: (id: string) => void
  favorites: Set<string>
  onCompareToggle: (id: string) => void
  compareHallIds: string[]
}) {
  const isFav = favorites.has(hall.hallId)
  const isCompared = compareHallIds.includes(hall.hallId)
  return (
    <Card
      className="overflow-hidden cursor-pointer group hover:shadow-xl hover:shadow-rose-200/40 dark:hover:shadow-rose-900/20 transition-all duration-300 border-rose-100 dark:border-rose-900/30 hover:scale-[1.01]"
      onClick={() => onHallClick(hall.hallId)}
    >
      <div className="flex">
        <div className="relative w-40 sm:w-48 shrink-0 overflow-hidden">
          {hall.images?.[0]?.imageUrl ? (
            <img
              src={hall.images[0].imageUrl}
              alt={hall.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full min-h-[120px] bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/30 dark:to-amber-900/30 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-rose-300 dark:text-rose-600" />
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onFavoriteToggle(hall.hallId)
            }}
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 dark:bg-card/90 hover:bg-white dark:hover:bg-card flex items-center justify-center shadow-sm transition-all hover:scale-110"
          >
            <Heart
              className={`w-3.5 h-3.5 transition-colors ${
                isFav
                  ? 'text-rose-500 fill-rose-500'
                  : 'text-gray-500 hover:text-rose-400 dark:text-gray-400'
              }`}
            />
          </button>
          {/* Compare badge */}
          {isCompared && (
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-semibold flex items-center gap-1">
              <GitCompareArrows className="w-3 h-3" />
              Compare
            </div>
          )}
        </div>
        <CardContent className="p-4 flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base mb-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-1">
              {hall.name}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCompareToggle(hall.hallId)
              }}
              className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                isCompared
                  ? 'bg-rose-500 text-white'
                  : 'bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30'
              }`}
            >
              <GitCompareArrows className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="line-clamp-1">{hall.district}</span>
          </div>
          {(hall.averageRating !== undefined && hall.averageRating > 0) && (
            <StarDisplay rating={hall.averageRating} count={hall.reviewCount || 0} />
          )}
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="secondary" className="bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-800">
              <Users className="w-3 h-3 mr-1" />
              {hall.capacity} guests
            </Badge>
            {hall.hasKarnaySurnay && (
              <Badge className="bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-xs">
                <Music className="w-3 h-3 mr-1" />
                Karnay-Surnay
              </Badge>
            )}
          </div>
          <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 mt-2">
            {formatPrice(hall.seatPrice)}/seat
          </p>
        </CardContent>
      </div>
    </Card>
  )
}

export default function HallListPage() {
  const { navigateTo, selectHall, token, compareHallIds, addToCompare, removeFromCompare } = useAppStore()
  const [halls, setHalls] = useState<Hall[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)

  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Favorites
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  // Filters
  const [search, setSearch] = useState('')
  const [district, setDistrict] = useState('')
  const [minCapacity, setMinCapacity] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const loadHalls = useCallback(async () => {
    try {
      setLoading(true)
      const params: Record<string, string | number | undefined> = {
        page: currentPage,
        limit: 9,
        sort: sortBy,
        order,
      }
      if (search) params.search = search
      if (district) params.district = district
      if (minCapacity) params.capacity = minCapacity
      if (maxPrice) params.seatPrice = maxPrice

      const res = await api.getHalls(params)
      setHalls(res.halls || [])
      setTotalPages(res.totalPages || 1)
      setTotal(res.total || 0)
    } catch (error) {
      console.error('Failed to load halls:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, search, district, minCapacity, maxPrice, sortBy, order])

  useEffect(() => {
    loadHalls()
  }, [loadHalls])

  // Load favorites
  useEffect(() => {
    if (token) {
      loadFavorites()
    }
  }, [token])

  const loadFavorites = async () => {
    try {
      const res = await api.getFavorites()
      const favHalls = res.favorites || []
      setFavorites(new Set(favHalls.map((f: { hallId: string }) => f.hallId)))
    } catch {
      // Silently ignore
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    loadHalls()
  }

  const handleHallClick = (hallId: string) => {
    selectHall(hallId)
    navigateTo('hall-detail')
  }

  const handleFavoriteToggle = async (hallId: string) => {
    if (!token) {
      toast.error('Please login to add favorites')
      navigateTo('login')
      return
    }
    try {
      if (favorites.has(hallId)) {
        await api.removeFavorite(hallId)
        setFavorites((prev) => {
          const next = new Set(prev)
          next.delete(hallId)
          return next
        })
        toast.success('Removed from favorites')
      } else {
        await api.addFavorite(hallId)
        setFavorites((prev) => {
          const next = new Set(prev)
          next.add(hallId)
          return next
        })
        toast.success('Added to favorites')
      }
    } catch {
      toast.error('Failed to update favorite')
    }
  }

  const handleCompareToggle = (hallId: string) => {
    if (compareHallIds.includes(hallId)) {
      removeFromCompare(hallId)
    } else if (compareHallIds.length >= 3) {
      toast.error('You can compare up to 3 halls at a time')
    } else {
      addToCompare(hallId)
      toast.success('Added to comparison')
    }
  }

  const clearFilters = () => {
    setSearch('')
    setDistrict('')
    setMinCapacity('')
    setMaxPrice('')
    setSortBy('createdAt')
    setOrder('desc')
    setCurrentPage(1)
  }

  const hasActiveFilters = search || district || minCapacity || maxPrice

  const FilterContent = () => (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium mb-1.5 block text-rose-900 dark:text-rose-200">Search by Name</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400" />
          <Input
            placeholder="Hall name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9 border-rose-200 dark:border-rose-800 focus:border-rose-400 focus:ring-rose-200"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block text-rose-900 dark:text-rose-200">District</label>
        <Select value={district} onValueChange={(v) => { setDistrict(v === 'all' ? '' : v); setCurrentPage(1) }}>
          <SelectTrigger className="border-rose-200 dark:border-rose-800 focus:border-rose-400">
            <SelectValue placeholder="All districts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Districts</SelectItem>
            {DISTRICTS.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block text-rose-900 dark:text-rose-200">Min Capacity</label>
        <Input
          type="number"
          placeholder="Min guests"
          value={minCapacity}
          onChange={(e) => { setMinCapacity(e.target.value); setCurrentPage(1) }}
          min={0}
          className="border-rose-200 dark:border-rose-800 focus:border-rose-400 focus:ring-rose-200"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block text-rose-900 dark:text-rose-200">Max Price per Seat</label>
        <Input
          type="number"
          placeholder="Max price"
          value={maxPrice}
          onChange={(e) => { setMaxPrice(e.target.value); setCurrentPage(1) }}
          min={0}
          className="border-rose-200 dark:border-rose-800 focus:border-rose-400 focus:ring-rose-200"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block text-rose-900 dark:text-rose-200">Sort By</label>
        <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setCurrentPage(1) }}>
          <SelectTrigger className="border-rose-200 dark:border-rose-800 focus:border-rose-400">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Newest</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="seatPrice">Price</SelectItem>
            <SelectItem value="capacity">Capacity</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block text-rose-900 dark:text-rose-200">Order</label>
        <Select value={order} onValueChange={(v) => { setOrder(v); setCurrentPage(1) }}>
          <SelectTrigger className="border-rose-200 dark:border-rose-800 focus:border-rose-400">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" onClick={clearFilters} className="w-full text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20">
          <X className="w-4 h-4 mr-1" />
          Clear All Filters
        </Button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white dark:from-background dark:to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex items-end justify-between"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">
              <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                Wedding Halls
              </span>
            </h1>
            <p className="text-muted-foreground">
              {loading ? 'Loading...' : `${total} halls found`}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1 bg-rose-50 dark:bg-rose-900/20 p-1 rounded-lg border border-rose-100 dark:border-rose-800">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-rose-500 text-white hover:bg-rose-600' : 'hover:bg-rose-100 dark:hover:bg-rose-900/30'}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-rose-500 text-white hover:bg-rose-600' : 'hover:bg-rose-100 dark:hover:bg-rose-900/30'}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        <div className="flex gap-6">
          {/* Desktop Sidebar Filters */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden lg:block w-64 shrink-0"
          >
            <Card className="p-5 sticky top-4 border-rose-100 dark:border-rose-900/30 bg-gradient-to-b from-white to-rose-50/30 dark:from-card dark:to-card shadow-sm">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-rose-900 dark:text-rose-200">
                <SlidersHorizontal className="w-4 h-4 text-rose-500" />
                Filters
              </h3>
              <FilterContent />
            </Card>
          </motion.aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Mobile filter bar */}
            <div className="flex items-center gap-2 mb-4 lg:hidden">
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="border-rose-200 dark:border-rose-800">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filters
                    {hasActiveFilters && (
                      <Badge className="ml-2 bg-rose-500 text-white text-xs px-1.5 py-0">!</Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-rose-500" />
                      Filters
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>

              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search halls..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>

              {/* Mobile view toggle */}
              <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-900/20 p-1 rounded-lg border border-rose-100 dark:border-rose-800">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`h-8 w-8 p-0 ${viewMode === 'grid' ? 'bg-rose-500 text-white hover:bg-rose-600' : 'hover:bg-rose-100 dark:hover:bg-rose-900/30'}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`h-8 w-8 p-0 ${viewMode === 'list' ? 'bg-rose-500 text-white hover:bg-rose-600' : 'hover:bg-rose-100 dark:hover:bg-rose-900/30'}`}
                >
                  <List className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Loading Skeletons */}
            {loading ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="overflow-hidden">
                      <Skeleton className="h-48" />
                      <CardContent className="p-4 space-y-3">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Skeleton key={s} className="w-3 h-3 rounded-sm" />
                          ))}
                        </div>
                        <div className="flex justify-between">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-5 w-24" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="overflow-hidden">
                      <div className="flex">
                        <Skeleton className="w-40 h-32" />
                        <CardContent className="p-4 flex-1 space-y-2">
                          <Skeleton className="h-5 w-1/2" />
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            ) : halls.length === 0 ? (
              <Card className="p-12 text-center border-rose-100 dark:border-rose-900/30">
                <Building2 className="w-16 h-16 mx-auto text-rose-200 dark:text-rose-700 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Halls Found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search criteria
                </p>
                <Button onClick={clearFilters} variant="outline" className="border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400">
                  Clear Filters
                </Button>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {halls.map((hall, index) => (
                  <motion.div
                    key={hall.hallId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <HallCardGrid
                      hall={hall}
                      onHallClick={handleHallClick}
                      onFavoriteToggle={handleFavoriteToggle}
                      favorites={favorites}
                      onCompareToggle={handleCompareToggle}
                      compareHallIds={compareHallIds}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {halls.map((hall, index) => (
                  <motion.div
                    key={hall.hallId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <HallCardList
                      hall={hall}
                      onHallClick={handleHallClick}
                      onFavoriteToggle={handleFavoriteToggle}
                      favorites={favorites}
                      onCompareToggle={handleCompareToggle}
                      compareHallIds={compareHallIds}
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="border-rose-200 dark:border-rose-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page: number
                    if (totalPages <= 5) {
                      page = i + 1
                    } else if (currentPage <= 3) {
                      page = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i
                    } else {
                      page = currentPage - 2 + i
                    }
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={
                          currentPage === page
                            ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500 dark:bg-rose-600 dark:border-rose-600'
                            : 'border-rose-200 dark:border-rose-800'
                        }
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="border-rose-200 dark:border-rose-800"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
