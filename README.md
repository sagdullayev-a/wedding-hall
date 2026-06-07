# Loyihani ishga tushirish bo'yicha yo'riqnoma (README)

Ushbu loyiha Next.js (frontend) va Express.js (backend) qismlaridan iborat. Loyihani birinchi marta ishga tushirish uchun quyidagi qadamlarni bajaring.

---

## 1. Kutubxonalarni (Dependencies) o'rnatish

Loyiha hajmini kichraytirish uchun arxivlashdan oldin `node_modules` va `.next` papkalari o'chirib tashlangan. Ularni qayta tiklash uchun quyidagi buyruqlarni bajaring:

### A. Loyihaning asosiy (Root) papkasida:
Terminal orqali loyihaning asosiy papkasida turib quyidagini bajaring:
```bash
npm install
```
*(yoki `bun install` agar `bun` ishlatayotgan bo'lsangiz)*

### B. Client (Frontend) papkasida:
`client` papkasining ichiga kirib kutubxonalarni o'rnating:
```bash
cd client
npm install
```

### C. Server (Backend) papkasida:
`server` papkasining ichiga kirib kutubxonalarni o'rnating:
```bash
cd ../server
npm install
```

---

## 2. Muhit o'zgaruvchilari (.env fayllari)

Loyiha ishlashi uchun `.env` muhit o'zgaruvchilari kerak bo'ladi. Agar arxiv ichida ushbu fayllar bo'lmasa, ularni quyidagicha yarating:

### A. Client uchun `.env` fayli (`client/.env`)
`client` papkasi ichida `.env` nomli fayl ochib, quyidagi qatorlarni joylang:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
PORT=3000
EMAIL_USER=azizhons.agdullayevv@gmail.com
EMAIL_PASS=dguqtxpbilfvnjnk
```

### B. Server uchun `.env` fayli (`server/.env`)
`server` papkasi ichida `.env` nomli fayl ochib, quyidagi qatorlarni joylang:
```env
DATABASE_URL="postgresql://toyxona_user:8Jg9BpGcUmIh4rf0UgGjSXtn7PnlWSUv@dpg-d8e6q38js32c73876r00-a.frankfurt-postgres.render.com:5432/toyxona_8h1p?sslmode=require"
PORT=5000
JWT_SECRET="wedding_hall_booking_secret_key_12345"
EMAIL_USER=azizhons.agdullayevv@gmail.com
EMAIL_PASS=dguqtxpbilfvnjnk
```

---

## 3. Prisma Client-ni generatsiya qilish

Backend bazaga so'rov yuborishi uchun Prisma client-ni generatsiya qilish lozim. `server` papkasi ichida turib quyidagi buyruqni ishga tushiring:
```bash
npx prisma generate
```

---

## 4. Loyihani ishga tushirish

Barcha o'rnatish ishlari yakunlangach, loyihani bir vaqtda ishga tushirish uchun quyidagi usullardan foydalanishingiz mumkin:

### Windows tizimida (Avtomatik):
Loyihaning asosiy (root) papkasida joylashgan **`run-all.bat`** faylini ikki marta bosib ishga tushiring. Ushbu fayl backend va frontend loyihalarni avtomatik tarzda alohida terminal oynalarida ishga tushiradi.

### Qo'lda (Manual) ishga tushirish:
Agar boshqa operatsion tizimda bo'lsangiz yoki alohida boshqarmoqchi bo'lsangiz:

1. **Backend Serverni boshlash:**
   ```bash
   cd server
   npm run dev
   ```
   *Server `http://localhost:5000` manzilida ishga tushadi.*

2. **Frontend Clientni boshlash:**
   ```bash
   cd client
   npm run dev
   ```
   *Frontend `http://localhost:3000` manzilida ishga tushadi.*
