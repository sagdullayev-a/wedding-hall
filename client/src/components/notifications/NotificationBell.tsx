'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Bell, BellRing, CalendarDays, CheckCircle2, Info, Settings, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface NotificationItem {
  notificationId: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'booking':
      return <CalendarDays className="w-4 h-4 text-rose-500" />
    case 'approval':
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    case 'system':
      return <Settings className="w-4 h-4 text-amber-500" />
    case 'info':
    default:
      return <Info className="w-4 h-4 text-pink-500" />
  }
}

function getTypeBg(type: string) {
  switch (type) {
    case 'booking':
      return 'bg-rose-50 dark:bg-rose-900/20'
    case 'approval':
      return 'bg-emerald-50 dark:bg-emerald-900/20'
    case 'system':
      return 'bg-amber-50 dark:bg-amber-900/20'
    case 'info':
    default:
      return 'bg-pink-50 dark:bg-pink-900/20'
  }
}

export default function NotificationBell() {
  const { token } = useAppStore()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const res = await api.getNotifications()
      setNotifications(res.notifications || [])
      setUnreadCount(res.unreadCount || 0)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotifications()
    }, 0)
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [fetchNotifications])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const res = await api.markNotificationsRead([notificationId])
      setNotifications(res.notifications || [])
      setUnreadCount(res.unreadCount || 0)
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      const res = await api.markNotificationsRead(undefined, true)
      setNotifications(res.notifications || [])
      setUnreadCount(res.unreadCount || 0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await api.deleteNotification(notificationId)
      setNotifications(res.notifications || [])
      setUnreadCount(res.unreadCount || 0)
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  if (!token) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 hover:bg-rose-50 dark:hover:bg-rose-900/20"
        >
          {unreadCount > 0 ? (
            <BellRing className="h-4 w-4 text-rose-500 animate-pulse" />
          ) : (
            <Bell className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          )}
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white px-1"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-rose-100 dark:border-rose-900/30">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-rose-500" />
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-full font-medium">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 h-7 px-2"
            >
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-96">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="w-8 h-8 bg-rose-100 dark:bg-rose-900/20 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-rose-100 dark:bg-rose-900/20 rounded w-3/4" />
                    <div className="h-2.5 bg-rose-50 dark:bg-rose-900/10 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <AnimatePresence>
              <div>
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.notificationId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`relative flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-rose-50/50 dark:hover:bg-rose-900/10 ${
                      !notification.isRead ? 'bg-rose-50/30 dark:bg-rose-900/5' : ''
                    }`}
                    onClick={() => {
                      if (!notification.isRead) {
                        handleMarkAsRead(notification.notificationId)
                      }
                    }}
                  >
                    {!notification.isRead && (
                      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-rose-500" />
                    )}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getTypeBg(notification.type)}`}>
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!notification.isRead ? 'font-semibold' : 'font-medium'} text-foreground`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {timeAgo(notification.createdAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100 text-muted-foreground hover:text-rose-500 transition-opacity"
                      onClick={(e) => handleDelete(notification.notificationId, e)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator className="bg-rose-100 dark:bg-rose-900/30" />
            <div className="p-2 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-rose-600 dark:text-rose-400 w-full"
                onClick={() => setOpen(false)}
              >
                View All Notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
