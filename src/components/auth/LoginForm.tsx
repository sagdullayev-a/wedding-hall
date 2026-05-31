'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, Loader2, Mail, Lock } from 'lucide-react'

export default function LoginForm() {
  const { setAuth, navigateTo, setOtpUserId } = useAppStore()
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

      // Login successful - user is verified (or admin)
      const user = {
        ...data.user,
        phone: data.user.phone || '',
      }
      setAuth(data.token, user)

      // Navigate based on role
      const role = data.user.role
      if (role === 'admin') {
        navigateTo('admin-dashboard')
      } else if (role === 'owner') {
        navigateTo('owner-halls')
      } else {
        navigateTo('halls')
      }

      toast({
        title: 'Welcome back!',
        description: `Logged in as ${data.user.firstName} ${data.user.lastName}`,
      })
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'

      // Check if it's an unverified user response (status 403)
      if (errorMessage.includes('not verified') || errorMessage.includes('verify your email')) {
        // The API returns userId in the error response for unverified users
        // We need to extract it - let's try to get it from a typed error
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          })
          const errorData = await response.json()
          if (errorData.userId) {
            setOtpUserId(errorData.userId)
            navigateTo('verify-otp')
            toast({
              title: 'Email not verified',
              description: 'Please verify your email to continue',
              variant: 'destructive',
            })
            return
          }
        } catch {
          // Fall through to regular error handling
        }
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-rose-100 shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
            <Heart className="h-7 w-7 text-rose-500" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-rose-900">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-rose-600/70">
            Sign in to your Wedding Hall Booking account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-rose-900">
                Username or Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username or email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-rose-900">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-rose-600/70">
            Don&apos;t have an account?{' '}
            <button
              onClick={() => navigateTo('register')}
              className="font-semibold text-rose-600 hover:text-rose-700 underline underline-offset-4 transition-colors"
            >
              Register here
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
