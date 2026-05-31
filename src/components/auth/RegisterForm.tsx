'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Heart, Loader2, Mail, Lock, User, Phone, AtSign } from 'lucide-react'

export default function RegisterForm() {
  const { navigateTo, setOtpUserId } = useAppStore()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'customer' as 'customer' | 'owner',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  const validate = (): string | null => {
    if (!form.firstName.trim()) return 'First name is required'
    if (!form.lastName.trim()) return 'Last name is required'
    if (!form.email.trim()) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Invalid email format'
    if (!form.phone.trim()) return 'Phone number is required'
    if (!form.username.trim()) return 'Username is required'
    if (form.username.length < 3) return 'Username must be at least 3 characters'
    if (!form.password) return 'Password is required'
    if (form.password.length < 6) return 'Password must be at least 6 characters'
    if (form.password !== form.confirmPassword) return 'Passwords do not match'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const data = await api.register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        username: form.username.trim(),
        password: form.password,
        role: form.role,
      })

      setOtpUserId(data.user.userId)
      navigateTo('verify-otp')

      toast({
        title: 'Registration successful!',
        description: 'Please verify your email with the OTP code sent to you.',
      })
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg border-rose-100 shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
            <Heart className="h-7 w-7 text-rose-500" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-rose-900">
            Create Account
          </CardTitle>
          <CardDescription className="text-rose-600/70">
            Join Wedding Hall Booking to find the perfect venue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-rose-900">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300" />
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    value={form.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    className="pl-10 border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-rose-900">Last Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300" />
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last name"
                    value={form.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    className="pl-10 border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-rose-900">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="pl-10 border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-rose-900">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="pl-10 border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-rose-900">Username</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={form.username}
                  onChange={(e) => updateField('username', e.target.value)}
                  className="pl-10 border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                  disabled={loading}
                  required
                  minLength={3}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-rose-900">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    className="pl-10 border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                    disabled={loading}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-rose-900">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repeat password"
                    value={form.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    className="pl-10 border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                    disabled={loading}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-rose-900">I am a</Label>
              <RadioGroup
                value={form.role}
                onValueChange={(value) => updateField('role', value)}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="customer" id="customer" className="border-rose-300 text-rose-600" />
                  <Label htmlFor="customer" className="cursor-pointer text-rose-800 font-normal">
                    Customer - Looking for a venue
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="owner" id="owner" className="border-rose-300 text-rose-600" />
                  <Label htmlFor="owner" className="cursor-pointer text-rose-800 font-normal">
                    Owner - Listing my hall
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-rose-600/70">
            Already have an account?{' '}
            <button
              onClick={() => navigateTo('login')}
              className="font-semibold text-rose-600 hover:text-rose-700 underline underline-offset-4 transition-colors"
            >
              Sign in
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
