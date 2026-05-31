'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Search, MapPin, Users, Building2, Music, SlidersHorizontal,
  ChevronLeft, ChevronRight, X
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
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
}

const DISTRICTS = [
  'Tashkent', 'Samarkand', 'Bukhara', 'Andijan', 'Namangan',
  'Fergana', 'Khorezm', 'Surkhandarya', 'Kashkadarya', 'Jizzakh',
  'Syrdarya', 'Navoi', 'Tashkent Region', 'Karakalpakstan'
]

const formatPrice = (price: number) =>
  new Intl.NumberFormat('uz-UZ').format(price) + " so'm"

export default function HallListPage() {
  const { navigateTo, selectHall } = useAppStore()
  const [halls, setHalls] = useState<Hall[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)

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

  const handleSearch = () => {
    setCurrentPage(1)
    loadHalls()
  }

  const handleHallClick = (hallId: string) => {
    selectHall(hallId)
    navigateTo('hall-detail')
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
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Search by Name</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Hall name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">District</label>
        <Select value={district} onValueChange={(v) => { setDistrict(v === 'all' ? '' : v); setCurrentPage(1) }}>
          <SelectTrigger>
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
        <label className="text-sm font-medium mb-1.5 block">Min Capacity</label>
        <Input
          type="number"
          placeholder="Min guests"
          value={minCapacity}
          onChange={(e) => { setMinCapacity(e.target.value); setCurrentPage(1) }}
          min={0}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Max Price per Seat</label>
        <Input
          type="number"
          placeholder="Max price"
          value={maxPrice}
          onChange={(e) => { setMaxPrice(e.target.value); setCurrentPage(1) }}
          min={0}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Sort By</label>
        <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setCurrentPage(1) }}>
          <SelectTrigger>
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
        <label className="text-sm font-medium mb-1.5 block">Order</label>
        <Select value={order} onValueChange={(v) => { setOrder(v); setCurrentPage(1) }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" onClick={clearFilters} className="w-full text-rose-600">
          <X className="w-4 h-4 mr-1" />
          Clear All Filters
        </Button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">
            <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
              Wedding Halls
            </span>
          </h1>
          <p className="text-muted-foreground">
            {loading ? 'Loading...' : `${total} halls found`}
          </p>
        </motion.div>

        <div className="flex gap-6">
          {/* Desktop Sidebar Filters */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden lg:block w-64 shrink-0"
          >
            <Card className="p-4 sticky top-4 border-rose-100">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
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
                  <Button variant="outline" className="border-rose-200">
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
            </div>

            {/* Hall Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48" />
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : halls.length === 0 ? (
              <Card className="p-12 text-center border-rose-100">
                <Building2 className="w-16 h-16 mx-auto text-rose-200 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Halls Found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search criteria
                </p>
                <Button onClick={clearFilters} variant="outline" className="border-rose-200 text-rose-600">
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {halls.map((hall, index) => (
                  <motion.div
                    key={hall.hallId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card
                      className="overflow-hidden cursor-pointer group hover:shadow-lg hover:shadow-rose-200/40 transition-all duration-300 border-rose-100"
                      onClick={() => handleHallClick(hall.hallId)}
                    >
                      <div className="relative h-48 overflow-hidden">
                        {hall.images?.[0]?.imageUrl ? (
                          <img
                            src={hall.images[0].imageUrl}
                            alt={hall.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center">
                            <Building2 className="w-14 h-14 text-rose-300" />
                          </div>
                        )}
                        {hall.hasKarnaySurnay && (
                          <Badge className="absolute top-3 right-3 bg-amber-500 text-white text-xs">
                            <Music className="w-3 h-3 mr-1" />
                            Karnay-Surnay
                          </Badge>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-base mb-1 group-hover:text-rose-600 transition-colors line-clamp-1">
                          {hall.name}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="line-clamp-1">{hall.district}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="bg-rose-50 text-rose-700 border-rose-100">
                            <Users className="w-3 h-3 mr-1" />
                            {hall.capacity}
                          </Badge>
                          <span className="text-sm font-semibold text-rose-600">
                            {formatPrice(hall.seatPrice)}/seat
                          </span>
                        </div>
                      </CardContent>
                    </Card>
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
                  className="border-rose-200"
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
                            ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500'
                            : 'border-rose-200'
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
                  className="border-rose-200"
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
