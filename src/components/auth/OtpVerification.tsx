'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp'
import { ShieldCheck, Loader2, RotateCcw } from 'lucide-react'

const COUNTDOWN_SECONDS = 600 // 10 minutes

export default function OtpVerification() {
  const { otpUserId, user, navigateTo, setOtpUserId } = useAppStore()
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS)

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!otpUserId) {
      setError('No user ID found. Please register or login again.')
      return
    }

    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    setLoading(true)

    try {
      await api.verifyOtp({ userId: otpUserId, otpCode })

      toast.success('Email verified! Your email has been verified successfully.')

      // Clear OTP user ID
      setOtpUserId(null)

      // Navigate based on user role (if logged in) or to login
      if (user) {
        if (user.role === 'owner') {
          navigateTo('owner-halls')
        } else {
          navigateTo('halls')
        }
      } else {
        navigateTo('login')
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
      setError('No user ID found. Please register or login again.')
      return
    }

    setResendLoading(true)
    setError('')

    try {
      await api.resendOtp({ userId: otpUserId })
      setTimeLeft(COUNTDOWN_SECONDS)
      setOtpCode('')
      toast.success('OTP Resent! A new verification code has been sent to your email.')
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
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <Card className="w-full max-w-md border-rose-100 shadow-lg">
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-rose-600">No pending verification found.</p>
            <Button
              onClick={() => navigateTo('register')}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Go to Register
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-rose-100 shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
            <ShieldCheck className="h-7 w-7 text-rose-500" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-rose-900">
            Verify Your Email
          </CardTitle>
          <CardDescription className="text-rose-600/70">
            Enter the 6-digit code sent to your email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
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
                  <InputOTPSlot index={0} className="h-12 w-12 text-lg border-rose-200 data-[active=true]:border-rose-400 data-[active=true]:ring-rose-400/30" />
                  <InputOTPSlot index={1} className="h-12 w-12 text-lg border-rose-200 data-[active=true]:border-rose-400 data-[active=true]:ring-rose-400/30" />
                  <InputOTPSlot index={2} className="h-12 w-12 text-lg border-rose-200 data-[active=true]:border-rose-400 data-[active=true]:ring-rose-400/30" />
                </InputOTPGroup>
                <InputOTPSeparator className="text-rose-300" />
                <InputOTPGroup>
                  <InputOTPSlot index={3} className="h-12 w-12 text-lg border-rose-200 data-[active=true]:border-rose-400 data-[active=true]:ring-rose-400/30" />
                  <InputOTPSlot index={4} className="h-12 w-12 text-lg border-rose-200 data-[active=true]:border-rose-400 data-[active=true]:ring-rose-400/30" />
                  <InputOTPSlot index={5} className="h-12 w-12 text-lg border-rose-200 data-[active=true]:border-rose-400 data-[active=true]:ring-rose-400/30" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="text-center">
              <p className="text-sm text-rose-600/70">
                {timeLeft > 0 ? (
                  <>
                    Code expires in{' '}
                    <span className="font-semibold text-rose-700">{formatTime(timeLeft)}</span>
                  </>
                ) : (
                  <span className="text-red-500 font-medium">Code has expired</span>
                )}
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-700 text-white"
              disabled={loading || otpCode.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={handleResend}
                disabled={timeLeft > 0 || resendLoading}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resending...
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Resend Code
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
