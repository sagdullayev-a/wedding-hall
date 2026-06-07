const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// ─── SECURITY: All admin routes require authentication + admin role ─────────
// Apply auth + admin check at the router level for all routes EXCEPT /seed
router.use((req, res, next) => {
  // Seed endpoint has its own auth handling below
  if (req.path === '/seed' && req.method === 'POST') {
    return next();
  }
  authenticate(req, res, (err) => {
    if (err) return; // authenticate already sent error response
    authorize('admin')(req, res, next);
  });
});

// GET /admin/dashboard - Get admin dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalHalls,
      approvedHalls,
      pendingHalls,
      totalBookings,
      upcomingBookings,
      completedBookings,
      cancelledBookings,
      totalOwners,
      totalCustomers,
      recentBookings,
      hallsByDistrictRaw,
    ] = await Promise.all([
      prisma.weddingHall.count(),
      prisma.weddingHall.count({ where: { status: 'approved' } }),
      prisma.weddingHall.count({ where: { status: 'pending' } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { bookingStatus: 'upcoming' } }),
      prisma.booking.count({ where: { bookingStatus: 'completed' } }),
      prisma.booking.count({ where: { bookingStatus: 'cancelled' } }),
      prisma.user.count({ where: { role: 'owner' } }),
      prisma.user.count({ where: { role: 'customer' } }),
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          hall: {
            select: {
              hallId: true,
              name: true,
              district: true,
            },
          },
          customer: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      }),
      prisma.weddingHall.groupBy({
        by: ['district'],
        _count: { district: true },
      }),
    ]);

    const revenueResult = await prisma.booking.aggregate({
      _sum: { totalPrice: true },
      where: { bookingStatus: 'completed' },
    });
    const totalRevenue = revenueResult._sum.totalPrice ?? 0;

    const hallsByDistrict = hallsByDistrictRaw.map((item) => ({
      district: item.district,
      count: item._count.district,
    }));

    // In-memory format for monthly bookings
    const allBookingsForDates = await prisma.booking.findMany({
      select: { createdAt: true },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) // last 6 months
        }
      }
    });

    const monthCountMap = {};
    allBookingsForDates.forEach(b => {
      const date = new Date(b.createdAt);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthCountMap[monthStr] = (monthCountMap[monthStr] || 0) + 1;
    });

    const monthlyBookings = Object.entries(monthCountMap)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return res.json({
      totalHalls,
      approvedHalls,
      pendingHalls,
      totalBookings,
      upcomingBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      totalOwners,
      totalCustomers,
      recentBookings,
      hallsByDistrict,
      monthlyBookings,
    });
  } catch (error) {
    console.error('Dashboard error:', error.message);
    return res.status(500).json({ error: 'Statistikalarni yuklashda xatolik yuz berdi' });
  }
});

// GET /admin/halls - Get halls list
router.get('/halls', async (req, res) => {
  try {
    const { status, search, district } = req.query;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10))); // Cap at 50
    const skip = (page - 1) * limit;

    const where = {};

    if (status && ['approved', 'pending'].includes(status)) {
      where.status = status;
    }

    if (district && typeof district === 'string') {
      where.district = district;
    }

    if (search && typeof search === 'string' && search.length <= 100) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { district: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [halls, total] = await Promise.all([
      prisma.weddingHall.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          _count: {
            select: { images: true },
          },
        },
      }),
      prisma.weddingHall.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.json({
      halls,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error('Admin halls error:', error.message);
    return res.status(500).json({ error: 'To\'yxonalarni yuklashda xatolik' });
  }
});

// GET /admin/owners - Get owners list
router.get('/owners', async (req, res) => {
  try {
    const { search } = req.query;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const skip = (page - 1) * limit;

    const where = {
      role: 'owner',
    };

    if (search && typeof search === 'string' && search.length <= 100) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [owners, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
          username: true,
          phone: true,
          isVerified: true,
          createdAt: true,
          _count: {
            select: { ownedHalls: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.json({
      owners,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error('Admin owners error:', error.message);
    return res.status(500).json({ error: 'Egalar ro\'yxatini yuklashda xatolik' });
  }
});

// GET /admin/bookings - Get bookings list
router.get('/bookings', async (req, res) => {
  try {
    const { status, hallId } = req.query;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const skip = (page - 1) * limit;

    const where = {};

    if (status && ['upcoming', 'completed', 'cancelled'].includes(status)) {
      where.bookingStatus = status;
    }

    if (hallId && typeof hallId === 'string') {
      where.hallId = hallId;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          hall: {
            select: {
              hallId: true,
              name: true,
              district: true,
              address: true,
              capacity: true,
              seatPrice: true,
            },
          },
          customer: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          services: true,
        },
      }),
      prisma.booking.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.json({
      bookings,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error('Admin bookings error:', error.message);
    return res.status(500).json({ error: 'Bron ro\'yxatini yuklashda xatolik' });
  }
});

// POST /admin/seed - Seed database
// ─── SECURITY: Protect with admin auth, or allow only when database is empty ─
router.post('/seed', async (req, res) => {
  try {
    // Check if data already exists — this is the only condition that allows unauthenticated seeding
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'admin' },
    });

    if (existingAdmin) {
      return res.status(409).json({ error: 'Ma\'lumotlar allaqachon mavjud' });
    }

    // If there are any users at all, require admin authentication
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      // Database has users but no admin — require authentication
      return res.status(403).json({ error: 'Ma\'lumotlar bazasi bo\'sh emas. Seeding taqiqlangan.' });
    }

    const adminHash = await bcrypt.hash('admin123', 12);
    const owner1Hash = await bcrypt.hash('owner123', 12);
    const owner2Hash = await bcrypt.hash('owner123', 12);
    const cust1Hash = await bcrypt.hash('cust123', 12);
    const cust2Hash = await bcrypt.hash('cust123', 12);
    const cust3Hash = await bcrypt.hash('cust123', 12);

    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@wedding.uz',
        passwordHash: adminHash,
        firstName: 'Admin',
        lastName: 'User',
        phone: '+998901234567',
        role: 'admin',
        isVerified: true,
      },
    });

    const owner1 = await prisma.user.create({
      data: {
        username: 'owner1',
        email: 'owner1@wedding.uz',
        passwordHash: owner1Hash,
        firstName: 'Aziz',
        lastName: 'Karimov',
        phone: '+998901111111',
        role: 'owner',
        isVerified: true,
      },
    });

    const owner2 = await prisma.user.create({
      data: {
        username: 'owner2',
        email: 'owner2@wedding.uz',
        passwordHash: owner2Hash,
        firstName: 'Dilshod',
        lastName: 'Rahimov',
        phone: '+998902222222',
        role: 'owner',
        isVerified: true,
      },
    });

    const customer1 = await prisma.user.create({
      data: {
        username: 'customer1',
        email: 'customer1@wedding.uz',
        passwordHash: cust1Hash,
        firstName: 'Sardor',
        lastName: 'Toshmatov',
        phone: '+998903333333',
        role: 'customer',
        isVerified: true,
      },
    });

    const customer2 = await prisma.user.create({
      data: {
        username: 'customer2',
        email: 'customer2@wedding.uz',
        passwordHash: cust2Hash,
        firstName: 'Jasur',
        lastName: 'Aliyev',
        phone: '+998904444444',
        role: 'customer',
        isVerified: true,
      },
    });

    const customer3 = await prisma.user.create({
      data: {
        username: 'customer3',
        email: 'customer3@wedding.uz',
        passwordHash: cust3Hash,
        firstName: 'Kamola',
        lastName: 'Saidova',
        phone: '+998905555555',
        role: 'customer',
        isVerified: true,
      },
    });

    const hall1 = await prisma.weddingHall.create({
      data: {
        ownerId: owner1.userId,
        name: "Saroy To'yi",
        district: 'Chilonzor',
        address: 'Tashkent, Chilonzor tumani, Amir Temur Ave 15',
        capacity: 500,
        seatPrice: 150000,
        phone: '+998901111111',
        hasKarnaySurnay: true,
        karnaySurnayPrice: 5000000,
        status: 'approved',
        images: { create: [{ imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80' }] },
        singers: {
          create: [
            { singerName: 'Yulduz Usmonova', price: 10000000, imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80' },
            { singerName: 'Ozodbek Nazarbekov', price: 8000000, imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80' },
          ],
        },
        menus: { create: [{ menuName: 'Milliy Menyu' }, { menuName: 'Yevropa Menyusi' }] },
        cars: { create: [{ brand: 'Mercedes S-Class', price: 3000000 }] },
      },
    });

    const hall2 = await prisma.weddingHall.create({
      data: {
        ownerId: owner1.userId,
        name: 'Gulnora Zali',
        district: 'Yunusobod',
        address: 'Tashkent, Yunusobod tumani, Registon St 25',
        capacity: 300,
        seatPrice: 120000,
        phone: '+998901111112',
        hasKarnaySurnay: false,
        status: 'approved',
        images: { create: [{ imageUrl: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=800&q=80' }] },
        singers: {
          create: [{ singerName: 'Jasur Umarov', price: 4000000 }],
        },
        menus: { create: [{ menuName: 'Samarqand Palov Menyusi' }] },
        cars: { create: [{ brand: 'Toyota Camry', price: 1500000 }] },
      },
    });

    const hall3 = await prisma.weddingHall.create({
      data: {
        ownerId: owner2.userId,
        name: "Navro'z Saroyi",
        district: 'Mirobod',
        address: 'Tashkent, Mirobod tumani, Lyabi Hovuz St 10',
        capacity: 400,
        seatPrice: 130000,
        phone: '+998902222221',
        hasKarnaySurnay: false,
        status: 'pending',
        images: { create: [{ imageUrl: 'https://images.unsplash.com/photo-1507504038482-7621c8751503?auto=format&fit=crop&w=800&q=80' }] },
        singers: {
          create: [{ singerName: 'Shashmaqam Guruhi', price: 4500000 }],
        },
        menus: { create: [{ menuName: 'Buxoro To\'y Menyusi' }] },
        cars: { create: [{ brand: 'Audi A8', price: 2800000 }] },
      },
    });

    const hall4 = await prisma.weddingHall.create({
      data: {
        ownerId: owner2.userId,
        name: 'Oltin Toj',
        district: 'Shayxontohur',
        address: 'Tashkent, Shayxontohur tumani, Bunyodkor Ave 45',
        capacity: 600,
        seatPrice: 200000,
        phone: '+998902222222',
        hasKarnaySurnay: true,
        karnaySurnayPrice: 7000000,
        status: 'approved',
        images: { create: [{ imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80' }] },
        singers: {
          create: [{ singerName: 'Ulug\'bek Rahmatullayev', price: 7000000 }],
        },
        menus: { create: [{ menuName: 'Platinum Menyu' }] },
        cars: { create: [{ brand: 'Rolls Royce Ghost', price: 8000000 }] },
      },
    });

    const booking1 = await prisma.booking.create({
      data: {
        hallId: hall1.hallId,
        customerId: customer1.userId,
        bookingDate: '2025-08-15',
        guestCount: 400,
        totalPrice: 60000000,
        advancePayment: 12000000,
        bookingStatus: 'upcoming',
      },
    });

    const booking2 = await prisma.booking.create({
      data: {
        hallId: hall2.hallId,
        customerId: customer2.userId,
        bookingDate: '2025-09-20',
        guestCount: 250,
        totalPrice: 30000000,
        advancePayment: 6000000,
        bookingStatus: 'upcoming',
      },
    });

    const booking3 = await prisma.booking.create({
      data: {
        hallId: hall4.hallId,
        customerId: customer3.userId,
        bookingDate: '2025-06-01',
        guestCount: 500,
        totalPrice: 100000000,
        advancePayment: 20000000,
        bookingStatus: 'completed',
      },
    });

    await prisma.review.createMany({
      data: [
        { hallId: hall1.hallId, userId: customer1.userId, rating: 5, comment: 'Ajoyib zal! Hamma narsa super!' },
        { hallId: hall2.hallId, userId: customer2.userId, rating: 4, comment: 'Juda shinam va shinam xizmat.' },
        { hallId: hall4.hallId, userId: customer3.userId, rating: 5, comment: 'Haqiqiy oltin toj, shohona ziyofat!' },
      ],
    });

    await prisma.notification.createMany({
      data: [
        { userId: customer1.userId, title: 'Bron tasdiqlandi', message: 'Tabriklaymiz, Saroy To\'yi uchun broningiz tasdiqlandi!', type: 'booking' },
        { userId: owner1.userId, title: 'Yangi bron', message: 'Sizda yangi bron kelib tushdi.', type: 'booking' },
      ],
    });

    return res.status(201).json({
      message: 'Baza muvaffaqiyatli to\'ldirildi!',
    });
  } catch (error) {
    console.error('Seed error:', error.message);
    return res.status(500).json({ error: 'Tizimni to\'ldirishda xatolik yuz berdi' });
  }
});

module.exports = router;
