'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, Loader2, Mail, Lock } from 'lucide-react'
import { useTranslation } from '@/lib/translations'
import WeddingHallLogo from '../layout/WeddingHallLogo'

export default function LoginForm() {
  const { setAuth, navigateTo, setOtpUserId } = useAppStore()
  const { t } = useTranslation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      api.setToken(null)
      const data = await api.login({ username, password })

      if (data.otpRequired) {
        setOtpUserId(data.userId)
        navigateTo('verify-otp')
        toast.info(language === 'en' ? 'Verification code sent to your email.' : language === 'ru' ? 'Код подтверждения отправлен на вашу почту.' : 'Tasdiqlash kodi emailingizga yuborildi.')
        return
      }

      // Login successful - user is verified (or admin)
      const user = {
        ...data.user,
        phone: data.user.phone || '',
      }
      setAuth(data.token, user)
      localStorage.setItem('authToken', data.token)
      api.setToken(data.token)

      // Navigate based on role
      const role = data.user.role
      if (role === 'admin') {
        navigateTo('admin-dashboard')
      } else if (role === 'owner') {
        navigateTo('owner-halls')
      } else {
        navigateTo('halls')
      }

      toast.success(`Welcome back! Logged in as ${data.user.firstName} ${data.user.lastName}`)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 relative">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-background dark:via-background dark:to-rose-950/20 overflow-hidden pointer-events-none">
        {/* Decorative blurs */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-rose-200/30 dark:bg-rose-800/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-20 w-56 h-56 bg-amber-200/20 dark:bg-amber-800/10 rounded-full blur-3xl" />
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e11d48' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <Card className="w-full max-w-md border-rose-200 dark:border-rose-900/30 shadow-xl shadow-rose-100/50 dark:shadow-rose-900/20 bg-white dark:bg-card relative">
        <CardHeader className="text-center space-y-2">
          <WeddingHallLogo className="h-14 w-14" size={32} />
          <CardTitle className="text-2xl font-bold tracking-tight text-rose-900 dark:text-foreground">
            {t('login')}
          </CardTitle>
          <CardDescription className="text-rose-600/70 dark:text-muted-foreground">
            Sign in to your Wedding Hall Booking account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 p-3 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-rose-900 dark:text-foreground">{t('username')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300 dark:text-rose-500" />
                <Input
                  id="username"
                  type="text"
                  placeholder={t('username') + '...'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 border-rose-200 dark:border-rose-800/50 focus:border-rose-400 focus:ring-rose-400 dark:focus:border-rose-600 dark:bg-background/50 dark:text-foreground dark:placeholder:text-muted-foreground"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-rose-900 dark:text-foreground">{t('password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300 dark:text-rose-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder={t('password') + '...'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 border-rose-200 dark:border-rose-800/50 focus:border-rose-400 focus:ring-rose-400 dark:focus:border-rose-600 dark:bg-background/50 dark:text-foreground dark:placeholder:text-muted-foreground"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white dark:shadow-lg dark:shadow-rose-900/20"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('loading')}
                </>
              ) : (
                t('login')
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-rose-600/70 dark:text-muted-foreground">
            {t('noAccount')}{' '}
            <button
              onClick={() => navigateTo('register')}
              className="font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 underline underline-offset-4 transition-colors"
            >
              {t('register')}
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
