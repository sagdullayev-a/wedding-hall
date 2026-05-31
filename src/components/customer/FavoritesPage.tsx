'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Heart, MapPin, Users, Building2, Music, Star, ArrowLeft, Trash2, Loader2
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface FavoriteItem {
  favoriteId: string
  createdAt: string
  hall: {
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
    averageRating?: number
    totalReviews?: number
  }
}

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

export default function FavoritesPage() {
  const { navigateTo, selectHall, token } = useAppStore()
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    loadFavorites()
  }, [token])

  const loadFavorites = async () => {
    try {
      setLoading(true)
      const res = await api.getFavorites()
      setFavorites(res.favorites || [])
    } catch {
      // If not authenticated or endpoint doesn't exist, just show empty
      setFavorites([])
    } finally {
      setLoading(false)
    }
  }

  const handleHallClick = (hallId: string) => {
    selectHall(hallId)
    navigateTo('hall-detail')
  }

  const handleRemoveFavorite = async (hallId: string) => {
    try {
      setRemoving(hallId)
      await api.removeFavorite(hallId)
      setFavorites((prev) => prev.filter((f) => f.hall.hallId !== hallId))
      toast.success('Removed from favorites')
    } catch {
      toast.error('Failed to remove favorite')
    } finally {
      setRemoving(null)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white dark:from-background dark:to-background flex items-center justify-center">
        <Card className="p-12 text-center max-w-md mx-auto">
          <Heart className="w-16 h-16 mx-auto text-rose-200 dark:text-rose-700 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Login Required</h3>
          <p className="text-muted-foreground mb-4">
            Please login to view your favorite halls
          </p>
          <Button onClick={() => navigateTo('login')} className="bg-rose-500 hover:bg-rose-600 text-white">
            Login
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white dark:from-background dark:to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigateTo('halls')}
          className="mb-4 text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Halls
        </Button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">
            <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent flex items-center gap-2">
              <Heart className="w-7 h-7 text-rose-500 fill-rose-500 inline -mt-1" />
              My Favorites
            </span>
          </h1>
          <p className="text-muted-foreground">
            {loading ? 'Loading...' : `${favorites.length} saved hall${favorites.length !== 1 ? 's' : ''}`}
          </p>
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-12 text-center border-rose-100 dark:border-rose-900/30 max-w-md mx-auto">
              <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-10 h-10 text-rose-200 dark:text-rose-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Favorites Yet</h3>
              <p className="text-muted-foreground mb-6">
                Start exploring wedding halls and tap the heart icon to save your favorites here.
              </p>
              <Button
                onClick={() => navigateTo('halls')}
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white"
              >
                Browse Wedding Halls
              </Button>
            </Card>
          </motion.div>
        ) : (
          /* Favorites Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {favorites.map((fav, index) => (
              <motion.div
                key={fav.hall.hallId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                layout
              >
                <Card
                  className="overflow-hidden cursor-pointer group hover:shadow-xl hover:shadow-rose-200/40 dark:hover:shadow-rose-900/20 transition-all duration-300 border-rose-100 dark:border-rose-900/30 hover:scale-[1.02]"
                  onClick={() => handleHallClick(fav.hall.hallId)}
                >
                  <div className="relative h-48 overflow-hidden">
                    {fav.hall.images?.[0]?.imageUrl ? (
                      <img
                        src={fav.hall.images[0].imageUrl}
                        alt={fav.hall.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/30 dark:to-amber-900/30 flex items-center justify-center">
                        <Building2 className="w-14 h-14 text-rose-300 dark:text-rose-600" />
                      </div>
                    )}
                    {fav.hall.hasKarnaySurnay && (
                      <Badge className="absolute top-3 right-14 bg-amber-500 text-white text-xs">
                        <Music className="w-3 h-3 mr-1" />
                        Karnay-Surnay
                      </Badge>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveFavorite(fav.hall.hallId)
                      }}
                      disabled={removing === fav.hall.hallId}
                      className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 dark:bg-card/90 hover:bg-white dark:hover:bg-card flex items-center justify-center shadow-md transition-all hover:scale-110"
                    >
                      {removing === fav.hall.hallId ? (
                        <Loader2 className="w-4 h-4 text-rose-500 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-rose-500 hover:text-rose-700 dark:hover:text-rose-300" />
                      )}
                    </button>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-base mb-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-1">
                      {fav.hall.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="line-clamp-1">{fav.hall.district}</span>
                    </div>
                    {(fav.hall.averageRating !== undefined && fav.hall.averageRating > 0) && (
                      <StarDisplay rating={fav.hall.averageRating} count={fav.hall.totalReviews || 0} />
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <Badge variant="secondary" className="bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-800">
                        <Users className="w-3 h-3 mr-1" />
                        {fav.hall.capacity}
                      </Badge>
                      <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                        {formatPrice(fav.hall.seatPrice)}/seat
                      </span>
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
