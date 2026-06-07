'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp'
import { ShieldCheck, Loader2, RotateCcw } from 'lucide-react'
import { useTranslation } from '@/lib/translations'

const COUNTDOWN_SECONDS = 600 // 10 minutes

export default function OtpVerification() {
  const { otpUserId, user, navigateTo, setOtpUserId, setAuth } = useAppStore()
  const { t, language } = useTranslation()
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes expiry
  const [resendCooldown, setResendCooldown] = useState(60) // 60 seconds resend cooldown

  // Load userId from query params if not set in store
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const userIdParam = params.get('userId')
      if (userIdParam && !otpUserId) {
        setOtpUserId(userIdParam)
      }
    }
  }, [otpUserId, setOtpUserId])

  // Expiry countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  // Resend cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return

    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [resendCooldown])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!otpUserId) {
      setError(language === 'en' ? 'No user ID found. Please register or login again.' : language === 'ru' ? 'ID пользователя не найден. Пожалуйста, войдите снова.' : 'Foydalanuvchi ID topilmadi. Qaytadan kiring.')
      return
    }

    if (otpCode.length !== 6) {
      setError(language === 'en' ? 'Please enter all 6 digits' : language === 'ru' ? 'Пожалуйста, введите все 6 цифр' : 'Barcha 6 ta raqamni kiriting')
      return
    }

    setLoading(true)

    try {
      const data = await api.verifyOtp({ userId: otpUserId, otpCode })

      toast.success(language === 'en' ? 'Email verified successfully!' : language === 'ru' ? 'Электронная почта успешно подтверждена!' : 'Email muvaffaqiyatli tasdiqlandi!')

      // Clear OTP user ID
      setOtpUserId(null)

      // Log the user in
      const verifiedUser = {
        ...data.user,
        phone: data.user.phone || '',
      }
      setAuth(data.token, verifiedUser)
      localStorage.setItem('authToken', data.token)
      api.setToken(data.token)

      // Navigate based on user role
      if (verifiedUser.role === 'admin') {
        navigateTo('admin-dashboard')
      } else if (verifiedUser.role === 'owner') {
        navigateTo('owner-halls')
      } else {
        navigateTo('halls')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!otpUserId) {
      setError(language === 'en' ? 'No user ID found. Please register or login again.' : language === 'ru' ? 'ID пользователя не найден. Пожалуйста, войдите снова.' : 'Foydalanuvchi ID topilmadi. Qaytadan kiring.')
      return
    }

    setResendLoading(true)
    setError('')

    try {
      await api.resendOtp({ userId: otpUserId })
      setTimeLeft(300)
      setResendCooldown(60)
      setOtpCode('')
      toast.success(language === 'en' ? 'OTP Resent! A new verification code has been sent to your email.' : language === 'ru' ? 'Код отправлен повторно на вашу почту.' : 'Kod qayta yuborildi!')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend OTP'
      setError(errorMessage)
    } finally {
      setResendLoading(false)
    }
  }

  // If no otpUserId, redirect to register
  if (!otpUserId) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 bg-gradient-to-b from-rose-50/50 via-white to-amber-50/50 dark:from-background dark:via-background dark:to-rose-950/10">
        <Card className="w-full max-w-md border-rose-100 dark:border-rose-900/30 shadow-lg dark:shadow-rose-900/10">
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-rose-600 dark:text-rose-400">No pending verification found.</p>
            <Button
              onClick={() => navigateTo('register')}
              className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600 text-white"
            >
              Go to Register
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 relative">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-background dark:via-background dark:to-rose-950/20 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-rose-200/30 dark:bg-rose-800/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-20 w-56 h-56 bg-amber-200/20 dark:bg-amber-800/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md border-rose-200 dark:border-rose-900/30 shadow-xl shadow-rose-100/50 dark:shadow-rose-900/20 bg-white dark:bg-card relative">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-900/30 dark:to-amber-900/30 border border-rose-100 dark:border-rose-800/30">
            <ShieldCheck className="h-7 w-7 text-rose-500 dark:text-rose-400" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-rose-900 dark:text-foreground">
            {t('verify')}
          </CardTitle>
          <CardDescription className="text-rose-600/70 dark:text-muted-foreground text-center">
            {language === 'en' ? 'A 6-digit verification code has been sent to your email.' : language === 'ru' ? 'На вашу электронную почту отправлен 6-значный код подтверждения.' : 'Emailingizga 6 xonali tasdiqlash kodi yuborildi.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 p-3 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={setOtpCode}
                disabled={loading}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="h-12 w-12 text-lg border-rose-200 dark:border-rose-800/50 data-[active=true]:border-rose-400 dark:data-[active=true]:border-rose-600 data-[active=true]:ring-rose-400/30 dark:data-[active=true]:ring-rose-600/30 dark:bg-background/50" />
                  <InputOTPSlot index={1} className="h-12 w-12 text-lg border-rose-200 dark:border-rose-800/50 data-[active=true]:border-rose-400 dark:data-[active=true]:border-rose-600 data-[active=true]:ring-rose-400/30 dark:data-[active=true]:ring-rose-600/30 dark:bg-background/50" />
                  <InputOTPSlot index={2} className="h-12 w-12 text-lg border-rose-200 dark:border-rose-800/50 data-[active=true]:border-rose-400 dark:data-[active=true]:border-rose-600 data-[active=true]:ring-rose-400/30 dark:data-[active=true]:ring-rose-600/30 dark:bg-background/50" />
                </InputOTPGroup>
                <InputOTPSeparator className="text-rose-300 dark:text-rose-600" />
                <InputOTPGroup>
                  <InputOTPSlot index={3} className="h-12 w-12 text-lg border-rose-200 dark:border-rose-800/50 data-[active=true]:border-rose-400 dark:data-[active=true]:border-rose-600 data-[active=true]:ring-rose-400/30 dark:data-[active=true]:ring-rose-600/30 dark:bg-background/50" />
                  <InputOTPSlot index={4} className="h-12 w-12 text-lg border-rose-200 dark:border-rose-800/50 data-[active=true]:border-rose-400 dark:data-[active=true]:border-rose-600 data-[active=true]:ring-rose-400/30 dark:data-[active=true]:ring-rose-600/30 dark:bg-background/50" />
                  <InputOTPSlot index={5} className="h-12 w-12 text-lg border-rose-200 dark:border-rose-800/50 data-[active=true]:border-rose-400 dark:data-[active=true]:border-rose-600 data-[active=true]:ring-rose-400/30 dark:data-[active=true]:ring-rose-600/30 dark:bg-background/50" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="text-center">
              <p className="text-sm text-rose-600/70 dark:text-muted-foreground">
                {timeLeft > 0 ? (
                  <>
                    {language === 'en' ? 'Code expires in ' : language === 'ru' ? 'Код истекает через ' : 'Kod muddati '}
                    <span className="font-semibold text-rose-700 dark:text-rose-400">{formatTime(timeLeft)}</span>
                  </>
                ) : (
                  <span className="text-red-500 dark:text-red-400 font-medium">
                    {language === 'en' ? 'Code has expired' : language === 'ru' ? 'Срок действия кода истек' : 'Kod muddati tugadi'}
                  </span>
                )}
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white dark:shadow-lg dark:shadow-rose-900/20"
              disabled={loading || otpCode.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('loading')}
                </>
              ) : (
                t('verify')
              )}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={handleResend}
                disabled={resendCooldown > 0 || resendLoading}
                className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20"
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('loading')}
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {resendCooldown > 0 ? (
                      language === 'en' ? `Resend Code in ${resendCooldown}s` : language === 'ru' ? `Отправить повторно через ${resendCooldown}с` : `Kodni qayta yuborish (${resendCooldown}s)`
                    ) : (
                      t('resendOtp')
                    )}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
