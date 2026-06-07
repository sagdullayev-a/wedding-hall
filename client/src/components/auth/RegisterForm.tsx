'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Heart, Loader2, Mail, Lock, User, Phone, AtSign, Eye, EyeOff, Check, Shield, Building2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from '@/lib/translations'
import WeddingHallLogo from '../layout/WeddingHallLogo'

// Password strength calculator
function getPasswordStrength(password: string, language: string): { score: number; label: string; color: string } {
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const labels = {
    uz: ['Juda zaif', 'Zaif', "O'rtacha", 'Kuchli', 'Juda kuchli'],
    en: ['Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'],
    ru: ['Очень слабый', 'Слабый', 'Средний', 'Сильный', 'Очень сильный']
  } as Record<string, string[]>

  const currentLabels = labels[language] || labels.uz

  if (score <= 1) return { score: 20, label: currentLabels[0], color: 'bg-red-500' }
  if (score === 2) return { score: 40, label: currentLabels[1], color: 'bg-orange-500' }
  if (score === 3) return { score: 60, label: currentLabels[2], color: 'bg-amber-500' }
  if (score === 4) return { score: 80, label: currentLabels[3], color: 'bg-emerald-500' }
  return { score: 100, label: currentLabels[4], color: 'bg-emerald-600' }
}

export default function RegisterForm() {
  const { navigateTo, setOtpUserId } = useAppStore()
  const { t, language } = useTranslation()
  const [currentStep, setCurrentStep] = useState(1)
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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const steps = [
    { id: 1, label: t('firstName') + ' & ' + t('lastName'), icon: User },
    { id: 2, label: t('password'), icon: Lock },
    { id: 3, label: t('role'), icon: Shield },
  ]

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  const passwordStrength = getPasswordStrength(form.password, language)
  const passwordsMatch = form.confirmPassword.length > 0 && form.password === form.confirmPassword
  const passwordsMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword

  const validateStep = (step: number): string | null => {
    switch (step) {
      case 1:
        if (!form.firstName.trim()) {
          return language === 'en' ? 'First name is required' : language === 'ru' ? 'Имя обязательно' : 'Ism kiritilishi shart'
        }
        if (!form.lastName.trim()) {
          return language === 'en' ? 'Last name is required' : language === 'ru' ? 'Фамилия обязательна' : 'Familiya kiritilishi shart'
        }
        if (!form.email.trim()) {
          return language === 'en' ? 'Email is required' : language === 'ru' ? 'Email обязателен' : 'Email kiritilishi shart'
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
          return language === 'en' ? 'Invalid email format' : language === 'ru' ? 'Неверный формат email' : 'Email formati noto\'g\'ri'
        }
        if (!form.phone.trim()) {
          return language === 'en' ? 'Phone number is required' : language === 'ru' ? 'Телефон обязателен' : 'Telefon raqam kiritilishi shart'
        }
        return null
      case 2:
        if (!form.username.trim()) {
          return language === 'en' ? 'Username is required' : language === 'ru' ? 'Имя пользователя обязательно' : 'Username kiritilishi shart'
        }
        if (form.username.length < 3) {
          return language === 'en' ? 'Username must be at least 3 characters' : language === 'ru' ? 'Имя пользователя должно быть не менее 3 символов' : 'Username kamida 3 ta belgidan iborat bo\'lishi kerak'
        }
        if (!form.password) {
          return language === 'en' ? 'Password is required' : language === 'ru' ? 'Пароль обязателен' : 'Parol kiritilishi shart'
        }
        if (form.password.length < 6) {
          return language === 'en' ? 'Password must be at least 6 characters' : language === 'ru' ? 'Пароль должен быть не менее 6 символов' : 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'
        }
        if (form.password !== form.confirmPassword) {
          return language === 'en' ? 'Passwords do not match' : language === 'ru' ? 'Пароли не совпадают' : 'Parollar mos kelmayapti'
        }
        return null
      case 3:
        return null
      default:
        return null
    }
  }

  const handleNext = () => {
    const validationError = validateStep(currentStep)
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    setCurrentStep(s => Math.min(3, s + 1))
  }

  const handleBack = () => {
    setCurrentStep(s => Math.max(1, s - 1))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // If the user submits on an earlier step (e.g. pressing Enter in an input field),
    // transition to the next step instead of submitting the registration.
    if (currentStep < 3) {
      handleNext()
      return
    }

    setError('')

    const validationError = validateStep(1) || validateStep(2)
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

      toast.success('Registration successful! Please verify your email with the OTP code sent to you.')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getStepProgress = () => {
    return (currentStep / 3) * 100
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 relative">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-background dark:via-background dark:to-rose-950/20 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-rose-200/30 dark:bg-rose-800/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-20 w-56 h-56 bg-amber-200/20 dark:bg-amber-800/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e11d48' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <Card className="w-full max-w-lg border-rose-200 dark:border-rose-900/30 shadow-xl shadow-rose-100/50 dark:shadow-rose-900/20 bg-white dark:bg-card relative">
        <CardHeader className="text-center space-y-2">
          <WeddingHallLogo className="h-14 w-14" size={32} />
          <CardTitle className="text-2xl font-bold tracking-tight text-rose-900 dark:text-foreground">
            {t('createAccount')}
          </CardTitle>
          <CardDescription className="text-rose-600/70 dark:text-muted-foreground">
            Join Wedding Hall Booking to find the perfect venue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              {steps.map((step, index) => {
                const stepNum = index + 1
                const isActive = stepNum === currentStep
                const isCompleted = stepNum < currentStep
                return (
                  <div key={step.id} className="flex items-center gap-2 flex-1">
                    <div className="flex items-center gap-2 flex-1">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                        ${isActive ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-200 dark:shadow-rose-900/30' : ''}
                        ${isCompleted ? 'bg-emerald-500 text-white' : ''}
                        ${!isActive && !isCompleted ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500' : ''}
                      `}>
                        {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
                      </div>
                      <span className={`text-xs font-medium hidden sm:block ${isActive ? 'text-rose-600 dark:text-rose-400' : isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-2 rounded ${isCompleted ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
                    )}
                  </div>
                )
              })}
            </div>
            <Progress value={getStepProgress()} className="h-1 bg-rose-100 dark:bg-rose-900/30" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 p-3 text-sm text-red-700 dark:text-red-400"
              >
                {error}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {/* Step 1: Personal Info */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-rose-900 dark:text-foreground">{t('firstName')}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300 dark:text-rose-500" />
                        <Input
                          id="firstName"
                          type="text"
                          placeholder={t('firstName')}
                          value={form.firstName}
                          onChange={(e) => updateField('firstName', e.target.value)}
                          className="pl-10 border-rose-200 dark:border-rose-800/50 focus:border-rose-400 focus:ring-rose-400 dark:focus:border-rose-600 dark:bg-background/50 dark:text-foreground dark:placeholder:text-muted-foreground"
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-rose-900 dark:text-foreground">{t('lastName')}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300 dark:text-rose-500" />
                        <Input
                          id="lastName"
                          type="text"
                          placeholder={t('lastName')}
                          value={form.lastName}
                          onChange={(e) => updateField('lastName', e.target.value)}
                          className="pl-10 border-rose-200 dark:border-rose-800/50 focus:border-rose-400 focus:ring-rose-400 dark:focus:border-rose-600 dark:bg-background/50 dark:text-foreground dark:placeholder:text-muted-foreground"
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-rose-900 dark:text-foreground">{t('email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300 dark:text-rose-500" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={form.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        className="pl-10 border-rose-200 dark:border-rose-800/50 focus:border-rose-400 focus:ring-rose-400 dark:focus:border-rose-600 dark:bg-background/50 dark:text-foreground dark:placeholder:text-muted-foreground"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-rose-900 dark:text-foreground">{t('phone')}</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300 dark:text-rose-500" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+998 90 123 45 67"
                        value={form.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        className="pl-10 border-rose-200 dark:border-rose-800/50 focus:border-rose-400 focus:ring-rose-400 dark:focus:border-rose-600 dark:bg-background/50 dark:text-foreground dark:placeholder:text-muted-foreground"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Account Info */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-rose-900 dark:text-foreground">{t('username')}</Label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300 dark:text-rose-500" />
                      <Input
                        id="username"
                        type="text"
                        placeholder={t('username') + '...'}
                        value={form.username}
                        onChange={(e) => updateField('username', e.target.value)}
                        className="pl-10 border-rose-200 dark:border-rose-800/50 focus:border-rose-400 focus:ring-rose-400 dark:focus:border-rose-600 dark:bg-background/50 dark:text-foreground dark:placeholder:text-muted-foreground"
                        disabled={loading}
                        required
                        minLength={3}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-rose-900 dark:text-foreground">{t('password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300 dark:text-rose-500" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('password') + '...'}
                        value={form.password}
                        onChange={(e) => updateField('password', e.target.value)}
                        className="pl-10 pr-10 border-rose-200 dark:border-rose-800/50 focus:border-rose-400 focus:ring-rose-400 dark:focus:border-rose-600 dark:bg-background/50 dark:text-foreground dark:placeholder:text-muted-foreground"
                        disabled={loading}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-300 dark:text-rose-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Password Strength Indicator */}
                    {form.password.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${passwordStrength.score}%` }}
                              transition={{ duration: 0.3 }}
                              className={`h-full ${passwordStrength.color} rounded-full`}
                            />
                          </div>
                          <span className={`text-xs font-medium ${
                            passwordStrength.score <= 40 ? 'text-red-500' :
                            passwordStrength.score <= 60 ? 'text-amber-500' :
                            'text-emerald-500'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-rose-900 dark:text-foreground">{t('confirmPassword')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300 dark:text-rose-500" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder={t('confirmPassword') + '...'}
                        value={form.confirmPassword}
                        onChange={(e) => updateField('confirmPassword', e.target.value)}
                        className={`pl-10 pr-10 focus:ring-rose-400 dark:focus:border-rose-600 dark:bg-background/50 dark:text-foreground dark:placeholder:text-muted-foreground ${
                          passwordsMismatch ? 'border-red-300 dark:border-red-800 focus:border-red-400' :
                          passwordsMatch ? 'border-emerald-300 dark:border-emerald-800 focus:border-emerald-400' :
                          'border-rose-200 dark:border-rose-800/50 focus:border-rose-400'
                        }`}
                        disabled={loading}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-300 dark:text-rose-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Role Selection */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-3">
                    <Label className="text-rose-900 dark:text-foreground text-base font-semibold">{t('role')}</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => updateField('role', 'customer')}
                        className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                          form.role === 'customer'
                            ? 'border-rose-400 bg-rose-50 dark:border-rose-600 dark:bg-rose-900/20 shadow-md shadow-rose-100 dark:shadow-rose-900/10'
                            : 'border-rose-100 dark:border-rose-800/30 hover:border-rose-200 dark:hover:border-rose-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            form.role === 'customer'
                              ? 'bg-gradient-to-br from-rose-400 to-pink-500 text-white'
                              : 'bg-rose-100 dark:bg-rose-900/30 text-rose-400 dark:text-rose-500'
                          }`}>
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm dark:text-foreground">Customer</p>
                            <p className="text-xs text-muted-foreground">{t('roleCustomer')}</p>
                          </div>
                        </div>
                        {form.role === 'customer' && (
                          <div className="absolute top-2 right-2">
                            <Check className="w-4 h-4 text-rose-500" />
                          </div>
                        )}
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => updateField('role', 'owner')}
                        className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                          form.role === 'owner'
                            ? 'border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-900/20 shadow-md shadow-amber-100 dark:shadow-amber-900/10'
                            : 'border-rose-100 dark:border-rose-800/30 hover:border-amber-200 dark:hover:border-amber-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            form.role === 'owner'
                              ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white'
                              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-400 dark:text-amber-500'
                          }`}>
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm dark:text-foreground">Owner</p>
                            <p className="text-xs text-muted-foreground">{t('roleOwner')}</p>
                          </div>
                        </div>
                        {form.role === 'owner' && (
                          <div className="absolute top-2 right-2">
                            <Check className="w-4 h-4 text-amber-500" />
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3 pt-2">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400"
                  disabled={loading}
                >
                  {language === 'en' ? 'Back' : language === 'ru' ? 'Назад' : 'Orqaga'}
                </Button>
              )}

              {currentStep < 3 ? (
                <Button
                  key="next-button"
                  type="button"
                  onClick={handleNext}
                  className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white dark:shadow-lg dark:shadow-rose-900/20"
                  disabled={loading}
                >
                  {language === 'en' ? 'Next' : language === 'ru' ? 'Далее' : 'Keyingi'}
                </Button>
              ) : (
                <Button
                  key="submit-button"
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white dark:shadow-lg dark:shadow-rose-900/20"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('loading')}
                    </>
                  ) : (
                    t('createAccount')
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-rose-600/70 dark:text-muted-foreground">
            {t('hasAccount')}{' '}
            <button
              onClick={() => navigateTo('login')}
              className="font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 underline underline-offset-4 transition-colors"
            >
              {t('login')}
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
