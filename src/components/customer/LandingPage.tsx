'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Heart, Users, Building2, Star, MapPin, ArrowRight, Sparkles } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
  singers: { singerId: string }[]
  menus: { menuId: string }[]
  cars: { carId: string }[]
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('uz-UZ').format(price) + " so'm"

export default function LandingPage() {
  const { navigateTo, selectHall } = useAppStore()
  const [featuredHalls, setFeaturedHalls] = useState<Hall[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({ totalHalls: 0, happyCouples: 0, districts: 0 })

  useEffect(() => {
    loadFeaturedHalls()
  }, [])

  const loadFeaturedHalls = async () => {
    try {
      setLoading(true)
      const res = await api.getHalls({ limit: 4, sort: 'createdAt', order: 'desc' })
      setFeaturedHalls(res.halls || [])
      setStats({
        totalHalls: res.total || 0,
        happyCouples: Math.max(res.total * 12, 150),
        districts: 14,
      })
    } catch (error) {
      console.error('Failed to load featured halls:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    selectHall('')
    navigateTo('halls')
  }

  const handleHallClick = (hallId: string) => {
    selectHall(hallId)
    navigateTo('hall-detail')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-amber-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl" />
          <div className="absolute top-20 -left-20 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-pink-200/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4" />
              Uzbekistan&apos;s #1 Wedding Hall Platform
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 bg-clip-text text-transparent">
                Find Your Perfect
              </span>
              <br />
              <span className="bg-gradient-to-r from-amber-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">
                Wedding Hall
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Discover the most beautiful wedding halls across Uzbekistan. From Tashkent to Samarkand,
              find the perfect venue for your special day.
            </p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="max-w-2xl mx-auto"
            >
              <div className="flex gap-2 p-2 bg-white rounded-2xl shadow-lg shadow-rose-200/50 border border-rose-100">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search wedding halls..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 border-0 focus-visible:ring-0 text-base h-11"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-xl px-6 h-11"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured Halls */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">
                <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                  Featured Halls
                </span>
              </h2>
              <p className="text-muted-foreground mt-1">Handpicked venues for your dream wedding</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigateTo('halls')}
              className="border-rose-200 text-rose-600 hover:bg-rose-50 hidden sm:flex"
            >
              Browse All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="h-48 bg-rose-100" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-rose-100 rounded mb-2" />
                    <div className="h-3 bg-rose-50 rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredHalls.length === 0 ? (
            <Card className="p-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No halls available yet. Check back soon!</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredHalls.map((hall, index) => (
                <motion.div
                  key={hall.hallId}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card
                    className="overflow-hidden cursor-pointer group hover:shadow-lg hover:shadow-rose-200/50 transition-all duration-300 border-rose-100"
                    onClick={() => handleHallClick(hall.hallId)}
                  >
                    <div className="relative h-48 overflow-hidden">
                      {hall.images?.[0]?.imageUrl ? (
                        <img
                          src={hall.images[0].imageUrl}
                          alt={hall.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center">
                          <Building2 className="w-12 h-12 text-rose-300" />
                        </div>
                      )}
                      {hall.hasKarnaySurnay && (
                        <Badge className="absolute top-3 right-3 bg-amber-500 text-white text-xs">
                          Karnay-Surnay
                        </Badge>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-base mb-1 group-hover:text-rose-600 transition-colors line-clamp-1">
                        {hall.name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="line-clamp-1">{hall.district}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="w-3.5 h-3.5 text-rose-500" />
                          <span>{hall.capacity} seats</span>
                        </div>
                        <div className="text-sm font-semibold text-rose-600">
                          {formatPrice(hall.seatPrice)}/seat
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Button
              onClick={() => navigateTo('halls')}
              className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white"
            >
              Browse All Halls
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Statistics Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 py-16">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6bTAtMzBWMkgydjJoMzR6TTIgMjJoMzR2LTJIMnYyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center text-white"
          >
            <div>
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <Building2 className="w-10 h-10 mx-auto mb-3 opacity-80" />
              </motion.div>
              <div className="text-3xl sm:text-4xl font-bold mb-1">{stats.totalHalls}+</div>
              <div className="text-white/80 text-sm">Wedding Halls</div>
            </div>
            <div>
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Heart className="w-10 h-10 mx-auto mb-3 opacity-80" />
              </motion.div>
              <div className="text-3xl sm:text-4xl font-bold mb-1">{stats.happyCouples}+</div>
              <div className="text-white/80 text-sm">Happy Couples</div>
            </div>
            <div>
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <MapPin className="w-10 h-10 mx-auto mb-3 opacity-80" />
              </motion.div>
              <div className="text-3xl sm:text-4xl font-bold mb-1">{stats.districts}</div>
              <div className="text-white/80 text-sm">Districts Covered</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
              Why Choose Us
            </span>
          </h2>
          <p className="text-muted-foreground">Everything you need for your perfect wedding day</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Search,
              title: 'Easy Search',
              desc: 'Find the perfect hall with our powerful search and filters',
            },
            {
              icon: Star,
              title: 'Premium Venues',
              desc: 'All halls are verified and approved for quality assurance',
            },
            {
              icon: Heart,
              title: 'Complete Packages',
              desc: 'Singers, menus, cars, and karnay-surnay all in one place',
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 text-center border-rose-100 hover:shadow-md hover:shadow-rose-100/50 transition-all duration-300 h-full">
                <div className="w-14 h-14 bg-gradient-to-br from-rose-100 to-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-rose-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-100/30 to-amber-100/30" />
            <div className="relative p-8 sm:p-12 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                Ready to Find Your Dream Venue?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Browse our collection of beautiful wedding halls and book your perfect date today.
              </p>
              <Button
                onClick={() => navigateTo('halls')}
                size="lg"
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-xl px-8"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Explore Wedding Halls
              </Button>
            </div>
          </Card>
        </motion.div>
      </section>
    </div>
  )
}
