'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  User, Mail, Phone, AtSign, Calendar, Heart, Building2,
  Settings, Shield, Bell, ChevronRight, Clock, CheckCircle2,
  X, Sparkles, Edit, Key, Bookmark, BarChart3
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface Notification {
  id: number
  title: string
  message: string
  time: string
  read: boolean
}

export default function ProfilePage() {
  const { user, token, navigateTo, logout } = useAppStore()
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0, cancelled: 0 })
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, title: 'Booking Confirmed', message: 'Your booking for Oltin Toj has been confirmed', time: '2 hours ago', read: false },
    { id: 2, title: 'Upcoming Wedding', message: 'Your wedding at Saroy Navro\'z is in 5 days', time: '1 day ago', read: false },
    { id: 3, title: 'Review Reminder', message: 'Share your experience at Guliston Saroyi', time: '3 days ago', read: true },
  ])

  // Fetch booking stats
  useEffect(() => {
    if (token && user?.role === 'customer') {
      loadStats()
    } else {
      setLoading(false)
    }
  }, [token, user?.role])

  const loadStats = async () => {
    try {
      const [upcoming, completed, cancelled] = await Promise.all([
        api.getMyBookings({ status: 'upcoming', limit: 1 }),
        api.getMyBookings({ status: 'completed', limit: 1 }),
        api.getMyBookings({ status: 'cancelled', limit: 1 }),
      ])
      setStats({
        upcoming: upcoming.total || 0,
        completed: completed.total || 0,
        cancelled: cancelled.total || 0,
        total: (upcoming.total || 0) + (completed.total || 0) + (cancelled.total || 0),
      })
    } catch {
      // Silently handle
    } finally {
      setLoading(false)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  // If not logged in, redirect
  if (!user || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white dark:from-rose-950/20 dark:to-background flex items-center justify-center">
        <Card className="p-12 text-center max-w-md mx-auto border-rose-100 dark:border-rose-900/30">
          <User className="w-16 h-16 mx-auto text-rose-200 dark:text-rose-700 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Login Required</h3>
          <p className="text-muted-foreground mb-4">Please login to view your profile</p>
          <Button onClick={() => navigateTo('login')} className="bg-rose-500 hover:bg-rose-600 text-white">Login</Button>
        </Card>
      </div>
    )
  }

  const userInitials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
  const roleColors = {
    admin: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    owner: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
    customer: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white dark:from-rose-950/20 dark:to-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="border-rose-100 dark:border-rose-900/30 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-rose-400 via-pink-500 to-amber-400 relative">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
            </div>
            <CardContent className="p-6 -mt-12 relative">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-800 shadow-xl">
                  <AvatarFallback className="bg-gradient-to-br from-rose-400 to-amber-400 text-white text-2xl font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold">{user.firstName} {user.lastName}</h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge className={roleColors[user.role as keyof typeof roleColors]}>
                      <Shield className="w-3 h-3 mr-1" />
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">@{user.username}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Notification Bell */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="relative border-rose-200 dark:border-rose-800">
                        <Bell className="h-4 w-4" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center">{unreadCount}</span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                      <DropdownMenuLabel className="flex items-center justify-between">
                        <span>Notifications</span>
                        <div className="flex items-center gap-2">
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllRead}
                              className="text-xs text-rose-500 hover:text-rose-600 transition-colors"
                            >
                              Mark all read
                            </button>
                          )}
                          <Badge variant="secondary" className="text-xs">{unreadCount} new</Badge>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {notifications.map(notif => (
                        <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                          <div className="flex items-center gap-2 w-full">
                            <span className="font-medium text-sm">{notif.title}</span>
                            {!notif.read && <div className="w-2 h-2 rounded-full bg-rose-500 ml-auto shrink-0" />}
                          </div>
                          <span className="text-xs text-muted-foreground">{notif.message}</span>
                          <span className="text-xs text-muted-foreground/60">{notif.time}</span>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-center justify-center text-rose-500 text-sm cursor-pointer">
                        View all notifications
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button variant="outline" className="border-rose-200 dark:border-rose-800" onClick={() => navigateTo(user.role === 'admin' ? 'admin-dashboard' : user.role === 'owner' ? 'owner-halls' : 'halls')}>
                    <Settings className="w-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-rose-100 dark:border-rose-900/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5 text-rose-500" />
                      Personal Information
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20" onClick={() => toast.info('Profile editing coming soon!')}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoItem icon={User} label="First Name" value={user.firstName} />
                    <InfoItem icon={User} label="Last Name" value={user.lastName} />
                    <InfoItem icon={Mail} label="Email" value={user.email} />
                    <InfoItem icon={Phone} label="Phone" value={user.phone} />
                    <InfoItem icon={AtSign} label="Username" value={user.username} />
                    <InfoItem icon={Shield} label="Role" value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Booking Statistics */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border-rose-100 dark:border-rose-900/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-rose-500" />
                    Booking Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-900/10 animate-pulse">
                          <div className="h-5 w-5 mx-auto mb-2 bg-rose-200/50 dark:bg-rose-800/30 rounded" />
                          <div className="h-8 w-8 mx-auto mb-1 bg-rose-200/50 dark:bg-rose-800/30 rounded" />
                          <div className="h-3 w-12 mx-auto bg-rose-200/50 dark:bg-rose-800/30 rounded" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <StatCard icon={Calendar} label="Total" value={stats.total} color="text-rose-600 bg-rose-50 dark:bg-rose-900/20" />
                      <StatCard icon={Clock} label="Upcoming" value={stats.upcoming} color="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" />
                      <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} color="text-gray-600 bg-gray-50 dark:bg-gray-800/50" />
                      <StatCard icon={X} label="Cancelled" value={stats.cancelled} color="text-red-600 bg-red-50 dark:bg-red-900/20" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Account Settings */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-rose-100 dark:border-rose-900/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5 text-rose-500" />
                    Account Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <button
                    onClick={() => toast.info('Profile editing coming soon!')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-left group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                      <Edit className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Edit Profile</p>
                      <p className="text-xs text-muted-foreground">Update your personal information</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-rose-400 transition-colors" />
                  </button>
                  <button
                    onClick={() => toast.info('Password change coming soon!')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-left group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Key className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Change Password</p>
                      <p className="text-xs text-muted-foreground">Update your account password</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-rose-400 transition-colors" />
                  </button>
                  <button
                    onClick={() => {
                      logout()
                      toast.success('Logged out successfully')
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">Log Out</p>
                      <p className="text-xs text-muted-foreground">Sign out of your account</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-red-400 transition-colors" />
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="border-rose-100 dark:border-rose-900/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-rose-500" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {user.role === 'customer' && (
                    <>
                      <ActionButton icon={Calendar} label="My Bookings" onClick={() => navigateTo('my-bookings')} />
                      <ActionButton icon={Heart} label="My Favorites" onClick={() => navigateTo('favorites')} />
                      <ActionButton icon={Building2} label="Browse Halls" onClick={() => navigateTo('halls')} />
                    </>
                  )}
                  {user.role === 'owner' && (
                    <>
                      <ActionButton icon={Building2} label="My Halls" onClick={() => navigateTo('owner-halls')} />
                      <ActionButton icon={Calendar} label="My Bookings" onClick={() => navigateTo('owner-bookings')} />
                    </>
                  )}
                  {user.role === 'admin' && (
                    <>
                      <ActionButton icon={BarChart3} label="Dashboard" onClick={() => navigateTo('admin-dashboard')} />
                      <ActionButton icon={Building2} label="Manage Halls" onClick={() => navigateTo('admin-halls')} />
                      <ActionButton icon={Settings} label="Manage Owners" onClick={() => navigateTo('admin-owners')} />
                    </>
                  )}
                  <Separator className="my-2" />
                  <ActionButton icon={Key} label="Change Password" onClick={() => toast.info('Password change coming soon!')} />
                  <ActionButton icon={Bookmark} label="Download Data" onClick={() => toast.info('Data export coming soon!')} />
                </CardContent>
              </Card>
            </motion.div>

            {/* Account Status */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card className="border-rose-100 dark:border-rose-900/30 bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-950/30 dark:to-amber-950/20">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Account Verified</p>
                      <p className="text-xs text-muted-foreground">Your account is in good standing</p>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Member since: Account active</p>
                    <p>Last login: Today</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Notification Summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <Card className="border-rose-100 dark:border-rose-900/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bell className="w-5 h-5 text-rose-500" />
                      Recent Notifications
                    </CardTitle>
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="text-xs bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                        {unreadCount} unread
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-xl border transition-colors ${
                        notif.read
                          ? 'bg-muted/30 border-transparent'
                          : 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!notif.read && <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{notif.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                          <p className="text-xs text-muted-foreground/60 mt-1">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100/50 dark:border-rose-900/20">
      <Icon className="w-4 h-4 text-rose-400 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className={`p-4 rounded-xl ${color} text-center`}>
      <Icon className="w-5 h-5 mx-auto mb-1" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-70">{label}</p>
    </div>
  )
}

function ActionButton({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-left group"
    >
      <Icon className="w-4 h-4 text-rose-500 group-hover:text-rose-600" />
      <span className="text-sm font-medium flex-1">{label}</span>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-rose-400 transition-colors" />
    </button>
  )
}
