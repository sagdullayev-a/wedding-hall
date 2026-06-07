'use client'

import { motion } from 'framer-motion'
import { HelpCircle } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card } from '@/components/ui/card'
import { useTranslation } from '@/lib/translations'

export default function FaqSection() {
  const { language } = useTranslation()

  const getFaqItems = () => {
    if (language === 'en') {
      return [
        {
          question: 'How can I book a wedding hall?',
          answer: 'Search for wedding halls on our platform and select the one you like. Then select the date, enter the number of guests, choose additional services (singers, menu, car), and pay a 20% advance. The booking is confirmed instantly!',
        },
        {
          question: 'How much is the prepayment?',
          answer: 'The prepayment is 20% of the total price. The remaining 80% must be paid before the wedding day. The prepayment guarantees your booking.',
        },
        {
          question: 'Is it possible to cancel the booking?',
          answer: 'Yes, you can cancel your booking from the "My Bookings" page. However, the prepayment might be non-refundable. Please contact the hall owner before canceling.',
        },
        {
          question: 'What additional services are available?',
          answer: 'Each hall may offer different services: singers (classic and modern), various menus, luxury cars (Rolls Royce, Bentley, etc.), and traditional karnay-surnay service.',
        },
        {
          question: 'Why do I need email verification?',
          answer: 'Email verification is necessary to secure your account and send important notifications (booking confirmation, reminders). When you register, a 6-digit code is sent to your email.',
        },
        {
          question: 'What is Karnay-Surnay?',
          answer: 'Karnay-Surnay are traditional wind instruments of Uzbekistan. They are used to create a special festive mood at weddings. This is offered as an additional service in most wedding halls.',
        },
        {
          question: 'Can I book multiple halls?',
          answer: 'Yes, you can book multiple wedding halls for different dates. Each booking is managed separately and will be visible on your "My Bookings" page.',
        },
        {
          question: 'How do reviews and ratings work?',
          answer: 'After the wedding, you can leave a review and rate the hall from 1 to 5 stars. Each client can leave only one review per booking. Reviews help other clients choose a hall.',
        },
        {
          question: 'How can I list my own wedding hall?',
          answer: 'When you register as an Owner, you can add a new wedding hall in the "My Halls" section. Fill in the details, add photos, singers, menus, and cars. After admin approval, your hall will be visible on the site.',
        },
        {
          question: 'What payment methods are available?',
          answer: 'We accept payments via VISA, Mastercard, UZCARD, HUMO, Payme, and Click. All transactions are secure and encrypted.',
        },
      ]
    }
    if (language === 'ru') {
      return [
        {
          question: 'Как забронировать свадебный зал?',
          answer: 'Найдите свадебные залы на нашей платформе и выберите тот, который вам нравится. Затем выберите дату, введите количество гостей, выберите дополнительные услуги (певцы, меню, автомобиль) и внесите 20% предоплаты. Бронь подтверждается мгновенно!',
        },
        {
          question: 'Каков размер предоплаты?',
          answer: 'Предоплата составляет 20% от общей стоимости. Остальные 80% должны быть оплачены до дня свадьбы. Предоплата гарантирует ваше бронирование.',
        },
        {
          question: 'Можно ли отменить бронирование?',
          answer: 'Да, вы можете отменить бронирование на странице «Мои бронирования». Однако предоплата может быть невозвратной. Пожалуйста, свяжитесь с владельцем зала перед отменой.',
        },
        {
          question: 'Какие дополнительные услуги доступны?',
          answer: 'Каждый зал может предлагать различные услуги: певцы (эстрада и классика), различные варианты меню, роскошные автомобили (Rolls Royce, Bentley и др.) и традиционные услуги карнай-сурнай.',
        },
        {
          question: 'Зачем нужна верификация электронной почты?',
          answer: 'Верификация почты необходима для защиты вашего аккаунта и отправки важных уведомлений (подтверждение бронирования, напоминания). При регистрации на вашу почту отправляется 6-значный код.',
        },
        {
          question: 'Что такое Карнай-Сурнай?',
          answer: 'Карнай-Сурнай — это традиционные духовые инструменты Узбекистана. Они используются для создания праздничного настроения на свадьбах. Предлагается как дополнительная услуга в большинстве залов.',
        },
        {
          question: 'Могу ли я забронировать несколько залов?',
          answer: 'Да, вы можете забронировать несколько свадебных залов на разные даты. Каждое бронирование управляется отдельно и отображается на странице «Мои бронирования».',
        },
        {
          question: 'Как работают отзывы и оценки?',
          answer: 'После свадьбы вы можете оставить отзыв и оценить зал по шкале от 1 до 5 звезд. Каждый клиент может оставить только один отзыв по каждому бронированию. Отзывы помогают другим клиентам выбрать зал.',
        },
        {
          question: 'Как зарегистрировать свой свадебный зал?',
          answer: 'Зарегистрировавшись как Владелец, вы можете добавить новый зал в разделе «Мои залы». Заполните данные, добавьте фотографии, певцов, меню и автомобили. После одобрения администратором ваш зал появится на сайте.',
        },
        {
          question: 'Какие способы оплаты доступны?',
          answer: 'Мы принимаем оплату через VISA, Mastercard, UZCARD, HUMO, Payme и Click. Все транзакции безопасны и зашифрованы.',
        },
      ]
    }
    return [
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
  }

  const faqItems = getFaqItems()

  const labels = {
    uz: {
      badge: 'Ko\'p Beriladigan Savollar',
      title: 'Savollaringiz Javoblari',
      sub: 'Platformadan foydalanish bo\'yicha eng ko\'p beriladigan savollar',
      footer: 'Savolingiz javobini topa olmadingizmi?',
      contact: 'Biz bilan bog\'laning',
    },
    en: {
      badge: 'Frequently Asked Questions',
      title: 'Answers to Your Questions',
      sub: 'Frequently asked questions about using our booking platform',
      footer: 'Could not find the answer to your question?',
      contact: 'Contact us',
    },
    ru: {
      badge: 'Часто задаваемые вопросы',
      title: 'Ответы на ваши вопросы',
      sub: 'Часто задаваемые вопросы по использованию нашей платформы',
      footer: 'Не нашли ответ на свой вопрос?',
      contact: 'Свяжитесь с нами',
    },
  }

  const currentLabels = labels[language] || labels.uz

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
            className="inline-flex items-center gap-2 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 px-4 py-1.5 rounded-full text-sm font-medium mb-4 animate-pulse"
          >
            <HelpCircle className="w-4 h-4" />
            {currentLabels.badge}
          </motion.div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
              {currentLabels.title}
            </span>
          </h2>
          <p className="text-muted-foreground">{currentLabels.sub}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <Card className="border-rose-100 dark:border-rose-900/30 shadow-sm overflow-hidden bg-white dark:bg-card">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className={`border-rose-100 dark:border-rose-900/20 ${
                    index === faqItems.length - 1 ? 'border-b-0' : ''
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
            {currentLabels.footer}{' '}
            <span className="text-rose-600 dark:text-rose-400 font-medium cursor-pointer hover:underline">
              {currentLabels.contact}
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
