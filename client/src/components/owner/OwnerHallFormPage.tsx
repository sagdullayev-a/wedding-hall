'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent
} from '@/components/ui/dialog'
import {
  ArrowLeft, Save, ImageIcon, Mic, UtensilsCrossed, Car, Plus, Trash2, Loader2,
  Eye, CheckCircle2, AlertCircle, MapPin, Users, DollarSign, Building2, GripVertical, CloudUpload
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

const DISTRICTS = [
  'Uchtepa', 'Bektemir', 'Chilonzor', 'Yashnobod', 'Mirobod',
  'Mirzo Ulug\'bek', 'Sergeli', 'Shayxontohur', 'Olmazor',
  'Yakkasaroy', 'Yunusobod', 'Yangihayot'
]

interface HallImage { imageId: string; imageUrl: string }
interface Singer { singerId: string; singerName: string; price: number; imageUrl?: string }
interface Menu { menuId: string; menuName: string }
interface CarItem { carId: string; brand: string; price: number; imageUrl?: string }

interface HallData {
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

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('uz-UZ').format(price) + " so'm"
}

const TAB_KEYS = ['basic', 'images', 'singers', 'menus', 'cars'] as const
type TabKey = typeof TAB_KEYS[number]

const TAB_ICONS: Record<TabKey, React.ElementType> = {
  basic: Building2,
  images: ImageIcon,
  singers: Mic,
  menus: UtensilsCrossed,
  cars: Car,
}

const TAB_LABELS: Record<TabKey, string> = {
  basic: 'Asosiy',
  images: 'Rasmlar',
  singers: 'Xonandalar',
  menus: 'Menyular',
  cars: 'Mashinalar',
}

export default function OwnerHallFormPage() {
  const { token, navigateTo, editingHallId } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('basic')
  const [showPreview, setShowPreview] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Basic info
  const [name, setName] = useState('')
  const [district, setDistrict] = useState('')
  const [address, setAddress] = useState('')
  const [capacity, setCapacity] = useState('')
  const [seatPrice, setSeatPrice] = useState('')
  const [phone, setPhone] = useState('')
  const [hasKarnaySurnay, setHasKarnaySurnay] = useState(false)
  const [karnaySurnayPrice, setKarnaySurnayPrice] = useState('')

  // Sub-resources
  const [images, setImages] = useState<HallImage[]>([])
  const [singers, setSingers] = useState<Singer[]>([])
  const [menus, setMenus] = useState<Menu[]>([])
  const [cars, setCars] = useState<CarItem[]>([])

  // Add forms
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newSingerName, setNewSingerName] = useState('')
  const [newSingerPrice, setNewSingerPrice] = useState('')
  const [newSingerImageUrl, setNewSingerImageUrl] = useState('')
  const [newMenuName, setNewMenuName] = useState('')
  const [newCarBrand, setNewCarBrand] = useState('')
  const [newCarPrice, setNewCarPrice] = useState('')
  const [newCarImageUrl, setNewCarImageUrl] = useState('')

  // Loading states for sub-resources
  const [addingImage, setAddingImage] = useState(false)
  const [addingSinger, setAddingSinger] = useState(false)
  const [addingMenu, setAddingMenu] = useState(false)
  const [addingCar, setAddingCar] = useState(false)

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!editingHallId

  // Calculate form progress
  const formProgress = (() => {
    let filled = 0
    let total = 6 // required fields
    if (name) filled++
    if (district) filled++
    if (address) filled++
    if (capacity) filled++
    if (seatPrice) filled++
    if (phone) filled++
    return Math.round((filled / total) * 100)
  })()

  const loadHallData = async () => {
    try {
      setLoading(true)
      const data = await api.getHall(editingHallId!)
      const hall = data.hall
      setName(hall.name)
      setDistrict(hall.district)
      setAddress(hall.address)
      setCapacity(String(hall.capacity))
      setSeatPrice(String(hall.seatPrice))
      setPhone(hall.phone)
      setHasKarnaySurnay(hall.hasKarnaySurnay)
      setKarnaySurnayPrice(hall.karnaySurnayPrice ? String(hall.karnaySurnayPrice) : '')
      setImages(hall.images || [])
      setSingers(hall.singers || [])
      setMenus(hall.menus || [])
      setCars(hall.cars || [])
    } catch {
      toast.error('To\'yxona ma\'lumotlarini yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    api.setToken(token)
    if (editingHallId) {
      const timer = setTimeout(() => {
        loadHallData()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [token, editingHallId])


  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'To\'yxona nomi kiritilishi shart'
    if (!district) newErrors.district = 'Tuman tanlanishi shart'
    if (!address.trim()) newErrors.address = 'Manzil kiritilishi shart'
    if (!capacity || parseInt(capacity) <= 0) newErrors.capacity = 'Sig\'im musbat son bo\'lishi shart'
    if (!seatPrice || parseFloat(seatPrice) <= 0) newErrors.seatPrice = 'Narx musbat son bo\'lishi shart'
    if (!phone.trim()) newErrors.phone = 'Telefon raqam kiritilishi shart'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Barcha majburiy maydonlarni to\'ldiring')
      return
    }

    try {
      setSaving(true)
      const hallData = {
        name,
        district,
        address,
        capacity: parseInt(capacity),
        seatPrice: parseFloat(seatPrice),
        phone,
        hasKarnaySurnay,
        karnaySurnayPrice: hasKarnaySurnay ? parseFloat(karnaySurnayPrice) : null,
      }

      if (isEditing) {
        await api.updateHall(editingHallId!, hallData)
        setLastSaved(new Date())
        toast.success('To\'yxona muvaffaqiyatli yangilandi')
      } else {
        await api.createHall(hallData)
        toast.success('To\'yxona muvaffaqiyatli yaratildi')
      }
      navigateTo('owner-halls')
    } catch {
      toast.error(isEditing ? 'Yangilashda xatolik' : 'Yaratishda xatolik')
    } finally {
      setSaving(false)
    }
  }

  // Sub-resource handlers
  const handleAddImage = async () => {
    if (!newImageUrl || !editingHallId) {
      if (!editingHallId) {
        toast.error('Avval to\'yxonani saqlang')
        return
      }
      return
    }
    try {
      setAddingImage(true)
      const data = await api.addHallImage(editingHallId, newImageUrl)
      setImages(prev => [...prev, data.image])
      setNewImageUrl('')
      toast.success('Rasm qo\'shildi')
    } catch {
      toast.error('Rasm qo\'shishda xatolik')
    } finally {
      setAddingImage(false)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!editingHallId) return
    try {
      await api.deleteHallImage(editingHallId, imageId)
      setImages(prev => prev.filter(img => img.imageId !== imageId))
      toast.success('Rasm o\'chirildi')
    } catch {
      toast.error('Rasm o\'chirishda xatolik')
    }
  }

  const handleAddSinger = async () => {
    if (!newSingerName || !newSingerPrice || !editingHallId) {
      if (!editingHallId) {
        toast.error('Avval to\'yxonani saqlang')
        return
      }
      return
    }
    try {
      setAddingSinger(true)
      const data = await api.addSinger(editingHallId, {
        singerName: newSingerName,
        price: parseFloat(newSingerPrice),
        imageUrl: newSingerImageUrl || undefined,
      })
      setSingers(prev => [...prev, data.singer])
      setNewSingerName('')
      setNewSingerPrice('')
      setNewSingerImageUrl('')
      toast.success('Xonanda qo\'shildi')
    } catch {
      toast.error('Xonanda qo\'shishda xatolik')
    } finally {
      setAddingSinger(false)
    }
  }

  const handleDeleteSinger = async (singerId: string) => {
    if (!editingHallId) return
    try {
      await api.deleteSinger(editingHallId, singerId)
      setSingers(prev => prev.filter(s => s.singerId !== singerId))
      toast.success('Xonanda o\'chirildi')
    } catch {
      toast.error('Xonanda o\'chirishda xatolik')
    }
  }

  const handleAddMenu = async () => {
    if (!newMenuName || !editingHallId) {
      if (!editingHallId) {
        toast.error('Avval to\'yxonani saqlang')
        return
      }
      return
    }
    try {
      setAddingMenu(true)
      const data = await api.addMenu(editingHallId, newMenuName)
      setMenus(prev => [...prev, data.menu])
      setNewMenuName('')
      toast.success('Menyu qo\'shildi')
    } catch {
      toast.error('Menyu qo\'shishda xatolik')
    } finally {
      setAddingMenu(false)
    }
  }

  const handleDeleteMenu = async (menuId: string) => {
    if (!editingHallId) return
    try {
      await api.deleteMenu(editingHallId, menuId)
      setMenus(prev => prev.filter(m => m.menuId !== menuId))
      toast.success('Menyu o\'chirildi')
    } catch {
      toast.error('Menyu o\'chirishda xatolik')
    }
  }

  const handleAddCar = async () => {
    if (!newCarBrand || !newCarPrice || !editingHallId) {
      if (!editingHallId) {
        toast.error('Avval to\'yxonani saqlang')
        return
      }
      return
    }
    try {
      setAddingCar(true)
      const data = await api.addCar(editingHallId, {
        brand: newCarBrand,
        price: parseFloat(newCarPrice),
        imageUrl: newCarImageUrl || undefined,
      })
      setCars(prev => [...prev, data.car])
      setNewCarBrand('')
      setNewCarPrice('')
      setNewCarImageUrl('')
      toast.success('Mashina qo\'shildi')
    } catch {
      toast.error('Mashina qo\'shishda xatolik')
    } finally {
      setAddingCar(false)
    }
  }

  const handleDeleteCar = async (carId: string) => {
    if (!editingHallId) return
    try {
      await api.deleteCar(editingHallId, carId)
      setCars(prev => prev.filter(c => c.carId !== carId))
      toast.success('Mashina o\'chirildi')
    } catch {
      toast.error('Mashina o\'chirishda xatolik')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-background dark:via-background dark:to-background p-4 md:p-6">
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  const currentTabIndex = TAB_KEYS.indexOf(activeTab)

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-background dark:via-background dark:to-background p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateTo('owner-halls')}
              className="hover:bg-rose-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-foreground">
                {isEditing ? 'To\'yxonani Tahrirlash' : 'Yangi To\'yxona'}
              </h1>
              <p className="text-gray-500 dark:text-muted-foreground text-sm">
                {isEditing ? 'To\'yxona ma\'lumotlarini yangilang' : 'Yangi to\'yxona ma\'lumotlarini kiriting'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Auto-save indicator */}
            {lastSaved && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200"
              >
                <CheckCircle2 className="w-3 h-3" />
                Saqlangan {lastSaved.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
              </motion.div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10"
            >
              <Eye className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Ko&apos;rish</span>
            </Button>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-5"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500 dark:text-muted-foreground">Shakl bajarilishi</span>
            <span className="text-xs font-semibold text-rose-600">{formProgress}%</span>
          </div>
          <Progress value={formProgress} className="h-2 bg-rose-100 [&>[data-slot=indicator]]:bg-gradient-to-r [&>[data-slot=indicator]]:from-rose-500 [&>[data-slot=indicator]]:to-pink-500" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={showPreview ? 'lg:col-span-2' : 'lg:col-span-3'}
          >
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
              {/* Tab Navigation with Progress */}
              <div className="mb-6">
                <div className="flex items-center gap-1 overflow-x-auto pb-2">
                  {TAB_KEYS.map((key, index) => {
                    const Icon = TAB_ICONS[key]
                    const isActive = activeTab === key
                    const isCompleted = key === 'basic' ? formProgress === 100 :
                      key === 'images' ? images.length > 0 :
                      key === 'singers' ? singers.length > 0 :
                      key === 'menus' ? menus.length > 0 :
                      cars.length > 0

                    return (
                      <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-200/50'
                            : isCompleted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-white dark:bg-card text-gray-500 dark:text-muted-foreground border border-gray-200 dark:border-gray-700 hover:border-rose-300 hover:text-rose-600'
                        }`}
                      >
                        {isCompleted && !isActive ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Icon className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden sm:inline">{TAB_LABELS[key]}</span>
                        <span className="sm:hidden">{index + 1}</span>
                      </button>
                    )
                  })}
                </div>
                {/* Step connector */}
                <div className="flex items-center gap-0 mt-2 px-1">
                  {TAB_KEYS.map((key, index) => (
                    <div key={key} className="flex-1 flex items-center">
                      <div className={`h-1 flex-1 rounded-full transition-colors ${
                        index <= currentTabIndex ? 'bg-gradient-to-r from-rose-400 to-pink-400' : 'bg-gray-200'
                      }`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Basic Info Tab */}
              <TabsContent value="basic">
                <Card className="shadow-md border-0 dark:border dark:border-rose-900/20 bg-white dark:bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-rose-500" />
                      Asosiy Ma&apos;lumotlar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-1">
                          To&apos;yxona Nomi <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          placeholder="To'yxona nomini kiriting"
                          value={name}
                          onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })) }}
                          className={`border-rose-200 focus:border-rose-400 ${errors.name ? 'border-red-400 focus:border-red-500' : ''}`}
                        />
                        {errors.name && (
                          <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.name}
                          </motion.p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="district" className="flex items-center gap-1">
                          Tuman <span className="text-red-500">*</span>
                        </Label>
                        <Select value={district} onValueChange={(v) => { setDistrict(v); setErrors(prev => ({ ...prev, district: '' })) }}>
                          <SelectTrigger className={`border-rose-200 focus:border-rose-400 ${errors.district ? 'border-red-400' : ''}`}>
                            <SelectValue placeholder="Tumanni tanlang" />
                          </SelectTrigger>
                          <SelectContent>
                            {DISTRICTS.map(d => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.district && (
                          <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.district}
                          </motion.p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="flex items-center gap-1">
                        Manzil <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="address"
                        placeholder="Ko'cha, uy raqami"
                        value={address}
                        onChange={e => { setAddress(e.target.value); setErrors(prev => ({ ...prev, address: '' })) }}
                        className={`border-rose-200 focus:border-rose-400 ${errors.address ? 'border-red-400 focus:border-red-500' : ''}`}
                      />
                      {errors.address && (
                        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.address}
                        </motion.p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="capacity" className="flex items-center gap-1">
                          Sig&apos;imi (kishi) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="capacity"
                          type="number"
                          placeholder="Masalan: 500"
                          value={capacity}
                          onChange={e => { setCapacity(e.target.value); setErrors(prev => ({ ...prev, capacity: '' })) }}
                          className={`border-rose-200 focus:border-rose-400 ${errors.capacity ? 'border-red-400 focus:border-red-500' : ''}`}
                        />
                        {errors.capacity && (
                          <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.capacity}
                          </motion.p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="seatPrice" className="flex items-center gap-1">
                          O&apos;rindiq Narxi (so&apos;m) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="seatPrice"
                          type="number"
                          placeholder="Masalan: 150000"
                          value={seatPrice}
                          onChange={e => { setSeatPrice(e.target.value); setErrors(prev => ({ ...prev, seatPrice: '' })) }}
                          className={`border-rose-200 focus:border-rose-400 ${errors.seatPrice ? 'border-red-400 focus:border-red-500' : ''}`}
                        />
                        {errors.seatPrice && (
                          <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.seatPrice}
                          </motion.p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-1">
                        Telefon Raqam <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="phone"
                        placeholder="+998 90 123 45 67"
                        value={phone}
                        onChange={e => { setPhone(e.target.value); setErrors(prev => ({ ...prev, phone: '' })) }}
                        className={`border-rose-200 focus:border-rose-400 ${errors.phone ? 'border-red-400 focus:border-red-500' : ''}`}
                      />
                      {errors.phone && (
                        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.phone}
                        </motion.p>
                      )}
                    </div>

                    <Separator className="my-4" />

                    <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div>
                        <Label className="text-base font-medium">Karnay-Surnay</Label>
                        <p className="text-sm text-gray-500 dark:text-muted-foreground">Karnay-surnay xizmati mavjudligi</p>
                      </div>
                      <Switch
                        checked={hasKarnaySurnay}
                        onCheckedChange={setHasKarnaySurnay}
                      />
                    </div>

                    {hasKarnaySurnay && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="karnaySurnayPrice">Karnay-Surnay Narxi (so&apos;m)</Label>
                        <Input
                          id="karnaySurnayPrice"
                          type="number"
                          placeholder="Masalan: 2000000"
                          value={karnaySurnayPrice}
                          onChange={e => setKarnaySurnayPrice(e.target.value)}
                          className="border-amber-200 focus:border-amber-400"
                        />
                      </motion.div>
                    )}

                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg shadow-rose-200 min-w-[160px]"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        {isEditing ? 'Yangilash' : 'Saqlash'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Images Tab */}
              <TabsContent value="images">
                <Card className="shadow-md border-0 dark:border dark:border-rose-900/20 bg-white dark:bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-rose-500" />
                      Rasmlar
                      {images.length > 0 && (
                        <Badge className="bg-rose-100 text-rose-700 ml-2">{images.length}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!isEditing && (
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-800 text-sm flex items-center gap-2">
                        <CloudUpload className="w-4 h-4" />
                        Avval to&apos;yxonani saqlang, keyin rasmlar qo&apos;sha olasiz
                      </div>
                    )}
                    {isEditing && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Rasm URL manzili"
                          value={newImageUrl}
                          onChange={e => setNewImageUrl(e.target.value)}
                          className="border-rose-200 focus:border-rose-400"
                        />
                        <Button
                          onClick={handleAddImage}
                          disabled={addingImage || !newImageUrl}
                          className="bg-rose-500 hover:bg-rose-600 text-white shrink-0"
                        >
                          {addingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        </Button>
                      </div>
                    )}
                    {images.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <div className="bg-rose-50 dark:bg-rose-900/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <ImageIcon className="w-10 h-10 text-rose-300" />
                        </div>
                        <p className="font-medium text-gray-500 dark:text-muted-foreground">Hali rasmlar yo&apos;q</p>
                        <p className="text-sm mt-1">To&apos;yxona rasmlarini qo&apos;shing</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
                          <GripVertical className="w-3 h-3" />
                          <span>Suralarni tartibini o&apos;zgartirish uchun sudrab tashlang</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {images.map((img, idx) => (
                            <motion.div
                              key={img.imageId}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="relative group rounded-xl overflow-hidden border border-rose-100 dark:border-rose-900/20 shadow-sm"
                            >
                              <img
                                src={img.imageUrl}
                                alt="Hall"
                                className="w-full h-32 object-cover cursor-pointer"
                                onClick={() => setPreviewImage(img.imageUrl)}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs text-white font-medium">{idx + 1}-rasm</span>
                                {isEditing && (
                                  <button
                                    onClick={() => handleDeleteImage(img.imageId)}
                                    className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Singers Tab */}
              <TabsContent value="singers">
                <Card className="shadow-md border-0 dark:border dark:border-rose-900/20 bg-white dark:bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Mic className="w-5 h-5 text-rose-500" />
                      Xonandalar
                      {singers.length > 0 && (
                        <Badge className="bg-rose-100 text-rose-700 ml-2">{singers.length}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!isEditing && (
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-800 text-sm flex items-center gap-2">
                        <CloudUpload className="w-4 h-4" />
                        Avval to&apos;yxonani saqlang
                      </div>
                    )}
                    {isEditing && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Input
                          placeholder="Xonanda ismi"
                          value={newSingerName}
                          onChange={e => setNewSingerName(e.target.value)}
                          className="border-rose-200 focus:border-rose-400"
                        />
                        <Input
                          placeholder="Narx (so'm)"
                          type="number"
                          value={newSingerPrice}
                          onChange={e => setNewSingerPrice(e.target.value)}
                          className="border-rose-200 focus:border-rose-400"
                        />
                        <div className="flex gap-2">
                          <Input
                            placeholder="Rasm URL (ixtiyoriy)"
                            value={newSingerImageUrl}
                            onChange={e => setNewSingerImageUrl(e.target.value)}
                            className="border-rose-200 focus:border-rose-400"
                          />
                          <Button
                            onClick={handleAddSinger}
                            disabled={addingSinger || !newSingerName || !newSingerPrice}
                            className="bg-rose-500 hover:bg-rose-600 text-white shrink-0"
                          >
                            {addingSinger ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    )}
                    {singers.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <div className="bg-rose-50 dark:bg-rose-900/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Mic className="w-10 h-10 text-rose-300" />
                        </div>
                        <p className="font-medium text-gray-500 dark:text-muted-foreground">Hali xonandalar yo&apos;q</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {singers.map(singer => (
                          <motion.div
                            key={singer.singerId}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between p-3 bg-gradient-to-r from-white to-rose-50/30 dark:from-card dark:to-rose-900/10 rounded-lg border border-rose-100 dark:border-rose-900/20 hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-center gap-3">
                              {singer.imageUrl ? (
                                <img src={singer.imageUrl} alt={singer.singerName} className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-100 dark:ring-rose-900/20" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center">
                                  <Mic className="w-5 h-5 text-rose-400" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-900 dark:text-foreground">{singer.singerName}</p>
                                <p className="text-sm text-rose-600 font-medium">{formatPrice(singer.price)}</p>
                              </div>
                            </div>
                            {isEditing && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteSinger(singer.singerId)}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Menus Tab */}
              <TabsContent value="menus">
                <Card className="shadow-md border-0 dark:border dark:border-rose-900/20 bg-white dark:bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UtensilsCrossed className="w-5 h-5 text-rose-500" />
                      Menyular
                      {menus.length > 0 && (
                        <Badge className="bg-rose-100 text-rose-700 ml-2">{menus.length}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!isEditing && (
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-800 text-sm flex items-center gap-2">
                        <CloudUpload className="w-4 h-4" />
                        Avval to&apos;yxonani saqlang
                      </div>
                    )}
                    {isEditing && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Menyu nomi"
                          value={newMenuName}
                          onChange={e => setNewMenuName(e.target.value)}
                          className="border-rose-200 focus:border-rose-400"
                        />
                        <Button
                          onClick={handleAddMenu}
                          disabled={addingMenu || !newMenuName}
                          className="bg-rose-500 hover:bg-rose-600 text-white shrink-0"
                        >
                          {addingMenu ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        </Button>
                      </div>
                    )}
                    {menus.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <div className="bg-rose-50 dark:bg-rose-900/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <UtensilsCrossed className="w-10 h-10 text-rose-300" />
                        </div>
                        <p className="font-medium text-gray-500 dark:text-muted-foreground">Hali menyular yo&apos;q</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {menus.map(menu => (
                          <motion.div
                            key={menu.menuId}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center justify-between p-3 bg-gradient-to-r from-white to-rose-50/30 dark:from-card dark:to-rose-900/10 rounded-lg border border-rose-100 dark:border-rose-900/20 hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                                <UtensilsCrossed className="w-5 h-5 text-rose-400" />
                              </div>
                              <p className="font-medium text-gray-900 dark:text-foreground">{menu.menuName}</p>
                            </div>
                            {isEditing && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteMenu(menu.menuId)}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Cars Tab */}
              <TabsContent value="cars">
                <Card className="shadow-md border-0 dark:border dark:border-rose-900/20 bg-white dark:bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Car className="w-5 h-5 text-rose-500" />
                      Mashinalar
                      {cars.length > 0 && (
                        <Badge className="bg-rose-100 text-rose-700 ml-2">{cars.length}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!isEditing && (
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-800 text-sm flex items-center gap-2">
                        <CloudUpload className="w-4 h-4" />
                        Avval to&apos;yxonani saqlang
                      </div>
                    )}
                    {isEditing && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Input
                          placeholder="Mashina markasi"
                          value={newCarBrand}
                          onChange={e => setNewCarBrand(e.target.value)}
                          className="border-rose-200 focus:border-rose-400"
                        />
                        <Input
                          placeholder="Narx (so'm)"
                          type="number"
                          value={newCarPrice}
                          onChange={e => setNewCarPrice(e.target.value)}
                          className="border-rose-200 focus:border-rose-400"
                        />
                        <div className="flex gap-2">
                          <Input
                            placeholder="Rasm URL (ixtiyoriy)"
                            value={newCarImageUrl}
                            onChange={e => setNewCarImageUrl(e.target.value)}
                            className="border-rose-200 focus:border-rose-400"
                        />
                          <Button
                            onClick={handleAddCar}
                            disabled={addingCar || !newCarBrand || !newCarPrice}
                            className="bg-rose-500 hover:bg-rose-600 text-white shrink-0"
                          >
                            {addingCar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    )}
                    {cars.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <div className="bg-rose-50 dark:bg-rose-900/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Car className="w-10 h-10 text-rose-300" />
                        </div>
                        <p className="font-medium text-gray-500 dark:text-muted-foreground">Hali mashinalar yo&apos;q</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cars.map(car => (
                          <motion.div
                            key={car.carId}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between p-3 bg-gradient-to-r from-white to-rose-50/30 dark:from-card dark:to-rose-900/10 rounded-lg border border-rose-100 dark:border-rose-900/20 hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-center gap-3">
                              {car.imageUrl ? (
                                <img src={car.imageUrl} alt={car.brand} className="w-10 h-10 rounded-lg object-cover ring-2 ring-rose-100 dark:ring-rose-900/20" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                                  <Car className="w-5 h-5 text-rose-400" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-900 dark:text-foreground">{car.brand}</p>
                                <p className="text-sm text-rose-600 font-medium">{formatPrice(car.price)}</p>
                              </div>
                            </div>
                            {isEditing && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteCar(car.carId)}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Live Preview Panel */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="lg:col-span-1"
              >
                <Card className="shadow-md border-0 dark:border dark:border-rose-900/20 bg-white dark:bg-card sticky top-6">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-500 dark:text-muted-foreground flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-rose-500" />
                      Jonli Ko&apos;rish
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Card className="overflow-hidden border border-rose-100 dark:border-rose-900/20 shadow-sm">
                      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-rose-100 to-pink-100">
                        {images.length > 0 ? (
                          <img src={images[0].imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="w-12 h-12 text-rose-300" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3">
                          <h3 className="font-bold text-white text-sm truncate">
                            {name || 'To\'yxona nomi'}
                          </h3>
                        </div>
                      </div>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-muted-foreground">
                          <MapPin className="w-3 h-3 text-rose-400" />
                          <span className="truncate">{district || 'Tuman'}, {address || 'Manzil'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-muted-foreground">
                          <Users className="w-3 h-3 text-rose-400" />
                          <span>{capacity || '0'} kishi</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-muted-foreground">
                          <DollarSign className="w-3 h-3 text-rose-400" />
                          <span className="font-semibold">{seatPrice ? formatPrice(parseFloat(seatPrice)) : '0 so\'m'} / o&apos;rindiq</span>
                        </div>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {images.length > 0 && <Badge variant="outline" className="text-[10px] bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/20 text-rose-600">{images.length} rasm</Badge>}
                          {singers.length > 0 && <Badge variant="outline" className="text-[10px] bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/20 text-rose-600">{singers.length} xonanda</Badge>}
                          {menus.length > 0 && <Badge variant="outline" className="text-[10px] bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/20 text-rose-600">{menus.length} menyu</Badge>}
                          {cars.length > 0 && <Badge variant="outline" className="text-[10px] bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/20 text-rose-600">{cars.length} mashina</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="sm:max-w-2xl p-1">
          {previewImage && (
            <img src={previewImage} alt="Preview" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
