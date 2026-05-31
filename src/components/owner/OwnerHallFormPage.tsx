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
import {
  ArrowLeft, Save, ImageIcon, Mic, UtensilsCrossed, Car, Plus, Trash2, Loader2
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

const DISTRICTS = [
  'Chilonzor', 'Yakkasaroy', 'Mirzo Ulug\'bek', 'Sergeli', 'Uchtepa',
  'Shayxontohur', 'Yunusobod', 'Bektemir', 'Mirobod', 'Almazor',
  'Olmazor', 'Yangihayot', 'Qoraqamish', 'Samarqand Darvoza',
  'Toshkent viloyati', 'Boshqa'
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

export default function OwnerHallFormPage() {
  const { token, navigateTo, editingHallId } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

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

  const isEditing = !!editingHallId

  useEffect(() => {
    api.setToken(token)
    if (editingHallId) {
      loadHallData()
    }
  }, [token, editingHallId])

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

  const handleSave = async () => {
    if (!name || !district || !address || !capacity || !seatPrice || !phone) {
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
        toast.success('To\'yxona muvaffaqiyatli yangilandi')
      } else {
        await api.createHall(hallData)
        toast.success('To\'yxona muvaffaqiyatli yaratildi')
      }
      navigateTo('owner-halls')
    } catch (error) {
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
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateTo('owner-halls')}
            className="hover:bg-rose-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {isEditing ? 'To\'yxonani Tahrirlash' : 'Yangi To\'yxona'}
            </h1>
            <p className="text-gray-500 text-sm">
              {isEditing ? 'To\'yxona ma\'lumotlarini yangilang' : 'Yangi to\'yxona ma\'lumotlarini kiriting'}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 mb-6 bg-white shadow-sm">
              <TabsTrigger value="basic" className="text-xs sm:text-sm">
                Asosiy
              </TabsTrigger>
              <TabsTrigger value="images" className="text-xs sm:text-sm">
                <ImageIcon className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Rasmlar</span>
              </TabsTrigger>
              <TabsTrigger value="singers" className="text-xs sm:text-sm">
                <Mic className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Xonandalar</span>
              </TabsTrigger>
              <TabsTrigger value="menus" className="text-xs sm:text-sm">
                <UtensilsCrossed className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Menyular</span>
              </TabsTrigger>
              <TabsTrigger value="cars" className="text-xs sm:text-sm">
                <Car className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Mashinalar</span>
              </TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic">
              <Card className="shadow-md border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Asosiy Ma&apos;lumotlar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">To&apos;yxona Nomi *</Label>
                      <Input
                        id="name"
                        placeholder="To'yxona nomini kiriting"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="border-rose-200 focus:border-rose-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="district">Tuman *</Label>
                      <Select value={district} onValueChange={setDistrict}>
                        <SelectTrigger className="border-rose-200 focus:border-rose-400">
                          <SelectValue placeholder="Tumanni tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {DISTRICTS.map(d => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Manzil *</Label>
                    <Input
                      id="address"
                      placeholder="Ko'cha, uy raqami"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="border-rose-200 focus:border-rose-400"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="capacity">Sig&apos;imi (kishi) *</Label>
                      <Input
                        id="capacity"
                        type="number"
                        placeholder="Masalan: 500"
                        value={capacity}
                        onChange={e => setCapacity(e.target.value)}
                        className="border-rose-200 focus:border-rose-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seatPrice">O&apos;rindiq Narxi (so&apos;m) *</Label>
                      <Input
                        id="seatPrice"
                        type="number"
                        placeholder="Masalan: 150000"
                        value={seatPrice}
                        onChange={e => setSeatPrice(e.target.value)}
                        className="border-rose-200 focus:border-rose-400"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon Raqam *</Label>
                    <Input
                      id="phone"
                      placeholder="+998 90 123 45 67"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="border-rose-200 focus:border-rose-400"
                    />
                  </div>

                  <Separator className="my-4" />

                  <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div>
                      <Label className="text-base font-medium">Karnay-Surnay</Label>
                      <p className="text-sm text-gray-500">Karnay-surnay xizmati mavjudligi</p>
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
              <Card className="shadow-md border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-rose-500" />
                    Rasmlar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isEditing && (
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-800 text-sm">
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
                    <div className="text-center py-8 text-gray-400">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Hali rasmlar yo&apos;q</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {images.map(img => (
                        <div key={img.imageId} className="relative group rounded-lg overflow-hidden border border-rose-100">
                          <img src={img.imageUrl} alt="Hall" className="w-full h-32 object-cover" />
                          {isEditing && (
                            <button
                              onClick={() => handleDeleteImage(img.imageId)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Singers Tab */}
            <TabsContent value="singers">
              <Card className="shadow-md border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mic className="w-5 h-5 text-rose-500" />
                    Xonandalar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isEditing && (
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-800 text-sm">
                      Avval to&apos;yxonani saqlang, keyin xonandalar qo&apos;sha olasiz
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
                    <div className="text-center py-8 text-gray-400">
                      <Mic className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Hali xonandalar yo&apos;q</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {singers.map(singer => (
                        <div key={singer.singerId} className="flex items-center justify-between p-3 bg-white rounded-lg border border-rose-100">
                          <div className="flex items-center gap-3">
                            {singer.imageUrl ? (
                              <img src={singer.imageUrl} alt={singer.singerName} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                                <Mic className="w-5 h-5 text-rose-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{singer.singerName}</p>
                              <p className="text-sm text-gray-500">{formatPrice(singer.price)}</p>
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
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Menus Tab */}
            <TabsContent value="menus">
              <Card className="shadow-md border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5 text-rose-500" />
                    Menyular
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isEditing && (
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-800 text-sm">
                      Avval to&apos;yxonani saqlang, keyin menyular qo&apos;sha olasiz
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
                    <div className="text-center py-8 text-gray-400">
                      <UtensilsCrossed className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Hali menyular yo&apos;q</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {menus.map(menu => (
                        <div key={menu.menuId} className="flex items-center justify-between p-3 bg-white rounded-lg border border-rose-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                              <UtensilsCrossed className="w-5 h-5 text-rose-400" />
                            </div>
                            <p className="font-medium text-gray-900">{menu.menuName}</p>
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
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cars Tab */}
            <TabsContent value="cars">
              <Card className="shadow-md border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Car className="w-5 h-5 text-rose-500" />
                    Mashinalar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isEditing && (
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-800 text-sm">
                      Avval to&apos;yxonani saqlang, keyin mashinalar qo&apos;sha olasiz
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
                    <div className="text-center py-8 text-gray-400">
                      <Car className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Hali mashinalar yo&apos;q</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cars.map(car => (
                        <div key={car.carId} className="flex items-center justify-between p-3 bg-white rounded-lg border border-rose-100">
                          <div className="flex items-center gap-3">
                            {car.imageUrl ? (
                              <img src={car.imageUrl} alt={car.brand} className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                                <Car className="w-5 h-5 text-rose-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{car.brand}</p>
                              <p className="text-sm text-gray-500">{formatPrice(car.price)}</p>
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
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
