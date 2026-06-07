'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Phone, Mail, MapPin, Clock, MessageSquare, User, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/translations'

export default function ContactForm() {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const getContactInfo = () => [
    {
      icon: Phone,
      title: t('contactPhoneTitle'),
      value: '+998 90 123 45 67',
      desc: t('contactPhoneHours'),
      gradient: 'from-rose-500 to-pink-600',
    },
    {
      icon: Mail,
      title: 'Email',
      value: 'info@weddinghall.uz',
      desc: t('contactEmailReply'),
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      icon: MapPin,
      title: t('contactAddressTitle'),
      value: t('contactAddressValue'),
      desc: t('contactAddressStreet'),
      gradient: 'from-[#3d5fa0] to-[#2d4a8a]',
    },
    {
      icon: Clock,
      title: t('contactHoursTitle'),
      value: t('contactHoursValue'),
      desc: t('contactHoursSat'),
      gradient: 'from-purple-500 to-pink-600',
    },
  ]

  const getSubjects = () => [
    t('contactSubject1'),
    t('contactSubject2'),
    t('contactSubject3'),
    t('contactSubject4'),
    t('contactSubject5'),
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error(t('contactRequiredMsg'))
      return
    }
    try {
      setSubmitting(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success(t('contactSuccessMsg'))
      setName('')
      setEmail('')
      setPhone('')
      setSubject('')
      setMessage('')
    } catch {
      toast.error(t('contactErrorMsg'))
    } finally {
      setSubmitting(false)
    }
  }

  const contactInfo = getContactInfo()
  const subjects = getSubjects()

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 px-4 py-1.5 rounded-full text-sm font-medium mb-4"
        >
          <MessageSquare className="w-4 h-4" />
          {t('contactBadge')}
        </motion.div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">
          <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
            {t('contactTitle')}
          </span>
        </h2>
        <p className="text-muted-foreground">{t('contactSub')}</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Contact Info Cards */}
        <div className="lg:col-span-2 space-y-4">
          {contactInfo.map((info, index) => (
            <motion.div
              key={info.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="border-rose-100 dark:border-rose-900/30 hover:shadow-md hover:shadow-rose-100/50 dark:hover:shadow-rose-900/20 transition-all duration-300 overflow-hidden group">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${info.gradient} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                    <info.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{info.title}</p>
                    <p className="text-sm font-semibold text-rose-900 dark:text-rose-100 truncate">{info.value}</p>
                    <p className="text-xs text-muted-foreground">{info.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {/* Map placeholder */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Card className="border-rose-100 dark:border-rose-900/30 overflow-hidden">
              <CardContent className="p-0">
                <div className="h-40 bg-gradient-to-br from-rose-100 via-amber-50 to-rose-50 dark:from-rose-900/20 dark:via-amber-900/10 dark:to-rose-900/20 flex items-center justify-center relative">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-4 left-4 w-32 h-32 border border-rose-400/30 rounded-full" />
                    <div className="absolute bottom-4 right-4 w-24 h-24 border border-amber-400/30 rounded-full" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-rose-300/20 rounded-full" />
                  </div>
                  <div className="text-center relative">
                    <MapPin className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{t('contactAddressValue')}</p>
                    <p className="text-xs text-rose-500/70 dark:text-rose-400/70">{t('contactAddressStreet')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="lg:col-span-3"
        >
          <Card className="border-rose-100 dark:border-rose-900/30 shadow-lg shadow-rose-100/30 dark:shadow-rose-900/10">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name" className="text-sm font-medium text-rose-900 dark:text-rose-100">
                      {t('contactNameLabel')}
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-300 dark:text-rose-600" />
                      <Input
                        id="contact-name"
                        placeholder={t('contactNamePlaceholder')}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-9 border-rose-200 dark:border-rose-800 focus:border-rose-400 dark:focus:border-rose-600 focus:ring-rose-400/30 dark:focus:ring-rose-600/30 dark:bg-card"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email" className="text-sm font-medium text-rose-900 dark:text-rose-100">
                      {t('contactEmailLabel')}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-300 dark:text-rose-600" />
                      <Input
                        id="contact-email"
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9 border-rose-200 dark:border-rose-800 focus:border-rose-400 dark:focus:border-rose-600 focus:ring-rose-400/30 dark:focus:ring-rose-600/30 dark:bg-card"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone" className="text-sm font-medium text-rose-900 dark:text-rose-100">
                      {t('contactPhoneLabel')}
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-300 dark:text-rose-600" />
                      <Input
                        id="contact-phone"
                        type="tel"
                        placeholder="+998 90 123 45 67"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-9 border-rose-200 dark:border-rose-800 focus:border-rose-400 dark:focus:border-rose-600 focus:ring-rose-400/30 dark:focus:ring-rose-600/30 dark:bg-card"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-subject" className="text-sm font-medium text-rose-900 dark:text-rose-100">
                      {t('contactSubjectLabel')}
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-300 dark:text-rose-600" />
                      <select
                        id="contact-subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full h-10 pl-9 pr-4 rounded-md border border-rose-200 dark:border-rose-800 bg-white dark:bg-card text-sm focus:border-rose-400 dark:focus:border-rose-600 focus:ring-rose-400/30 dark:focus:ring-rose-600/30 focus:outline-none appearance-none text-rose-900 dark:text-rose-100"
                      >
                        <option value="">{t('contactSubjectDefault')}</option>
                        {subjects.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-message" className="text-sm font-medium text-rose-900 dark:text-rose-100">
                    {t('contactMessageLabel')}
                  </Label>
                  <textarea
                    id="contact-message"
                    placeholder={t('contactMessagePlaceholder')}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    className="w-full rounded-md border border-rose-200 dark:border-rose-800 bg-white dark:bg-card px-3 py-2 text-sm focus:border-rose-400 dark:focus:border-rose-600 focus:ring-rose-400/30 dark:focus:ring-rose-600/30 focus:outline-none resize-none text-rose-900 dark:text-rose-100 placeholder:text-rose-300 dark:placeholder:text-rose-600"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white h-11 rounded-xl shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t('contactSending')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      {t('contactSendBtn')}
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
