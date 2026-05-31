'use client'

import { motion } from 'framer-motion'
import { HelpCircle, ChevronDown } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card } from '@/components/ui/card'

const FAQ_ITEMS = [
  {
    question: 'To\'yxonani qanday bron qilish mumkin?',
    answer: 'Platformamizda to\'yxonalarni qidirib, o\'zingizga ma\'qulini tanlang. Keyin sanani tanlang, mehmonlar sonini kiriting, qo\'shimcha xizmatlarni (xonanda, menyu, avtoulov) tanlang va 20% oldindan to\'lovni amalga oshiring. Bron tasdiqlanadi!',
  },
  {
    question: 'Oldindan to\'lov qancha?',
    answer: 'Oldindan to\'lov umumiy narxning 20% ini tashkil qiladi. Qolgan 80% to\'y kunidan oldin to\'lanishi kerak. Oldindan to\'lov orqali sizning bronlashingiz kafolatlanadi.',
  },
  {
    question: 'Bronni bekor qilish mumkinmi?',
    answer: 'Ha, siz bronni "Mening Bronlarim" sahifasidan bekor qilishingiz mumkin. Biroq, oldindan to\'lov qaytarilmasligi mumkin. Iltimos, bekor qilishdan oldin to\'yxona egasi bilan bog\'laning.',
  },
  {
    question: 'Qanday qo\'shimcha xizmatlar mavjud?',
    answer: 'Har bir to\'yxona turli xizmatlarni taklif qilishi mumkin: xonandalar (sekin va zamonaviy), turli menyular, hashamatli avtoulovlar (Rolls Royce, Bentley va boshqalar), va an\'anaviy karnay-surnay xizmati.',
  },
  {
    question: 'Email tasdiqlash nima uchun kerak?',
    answer: 'Email tasdiqlash hisobingizni xavfsiz qilish va muhim xabarnomalarni (bron tasdiqlash, eslatmalar) yuborish uchun kerak. Ro\'yxatdan o\'tganingizda, emailga 6 xonali kod yuboriladi.',
  },
  {
    question: 'Karnay-Surnay nima?',
    answer: 'Karnay-Surnay — O\'zbekistonning an\'anaviy puflama cholg\'u asboblari. To\'ylarda maxsus kayfiyat yaratish uchun ishlatiladi. Bu ko\'pchilik to\'yxonalarda qo\'shimcha xizmat sifatida taklif etiladi.',
  },
  {
    question: 'Bir nechta to\'yxonani bron qilish mumkinmi?',
    answer: 'Ha, siz bir nechta to\'yxonalarni turli sanalarda bron qilishingiz mumkin. Har bir bron alohida boshqariladi va "Mening Bronlarim" sahifasida ko\'rinadi.',
  },
  {
    question: 'Sharhlar va baholash qanday ishlaydi?',
    answer: 'To\'ydan so\'ng, siz to\'yxonaga 1-5 yulduz baho va sharh qoldirishingiz mumkin. Har bir mijoz faqat bir marta sharh qoldirishi mumkin. Sharhlar boshqa mijozlarga to\'yxona tanlashda yordam beradi.',
  },
  {
    question: 'To\'yxona ro\'yxatdan o\'tkazish qanday?',
    answer: 'Sahifa egasi sifatida ro\'yxatdan o\'tganingizda, "Mening To\'yxonalarim" sahifasida yangi to\'yxona qo\'shishingiz mumkin. Ma\'lumotlarni to\'ldiring, rasmlar, xonandalar, menyular va avtoulovlarni qo\'shing. Admin tasdiqlagandan so\'ng, to\'yxona saytda ko\'rinadi.',
  },
  {
    question: 'Qanday to\'lov usullari mavjud?',
    answer: 'Biz VISA, Mastercard, UZCARD, HUMO, Payme va Click orqali to\'lovlarni qabul qilamiz. Barcha to\'lovlar xavfsiz va shifrlangan holda amalga oshiriladi.',
  },
]

export default function FaqSection() {
  return (
    <section className="bg-gradient-to-b from-white to-rose-50/50 dark:from-background dark:to-rose-950/10 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <HelpCircle className="w-4 h-4" />
            Ko'p Beriladigan Savollar
          </motion.div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
              Savollaringiz Javoblari
            </span>
          </h2>
          <p className="text-muted-foreground">Platformadan foydalanish bo'yicha eng ko'p beriladigan savollar</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <Card className="border-rose-100 dark:border-rose-900/30 shadow-sm overflow-hidden">
            <Accordion type="single" collapsible className="w-full">
              {FAQ_ITEMS.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className={`border-rose-100 dark:border-rose-900/20 ${
                    index === FAQ_ITEMS.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <AccordionTrigger className="text-left hover:bg-rose-50/50 dark:hover:bg-rose-900/10 px-6 py-4 transition-colors group">
                    <span className="flex items-center gap-3 text-sm sm:text-base font-medium text-rose-900 dark:text-rose-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/30 dark:to-amber-900/30 flex items-center justify-center text-xs font-bold text-rose-600 dark:text-rose-400">
                        {index + 1}
                      </span>
                      {item.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 pt-0">
                    <div className="pl-10 text-sm text-muted-foreground leading-relaxed">
                      {item.answer}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Savolingiz javobini topa olmadingizmi?{' '}
            <span className="text-rose-600 dark:text-rose-400 font-medium cursor-pointer hover:underline">
              Biz bilan bog'laning
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
