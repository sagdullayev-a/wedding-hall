const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const auth = require('../middleware/auth');

// GET /bookings - Get bookings based on role
router.get('/', auth, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const status = req.query.status;
    const hallId = req.query.hallId;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const skip = (page - 1) * limit;

    const where = {};

    if (role === 'customer') {
      where.customerId = userId;
    } else if (role === 'owner') {
      const ownedHalls = await prisma.weddingHall.findMany({
        where: { ownerId: userId },
        select: { hallId: true },
      });
      const hallIds = ownedHalls.map((h) => h.hallId);
      where.hallId = { in: hallIds };
    }

    if (status) {
      where.bookingStatus = status;
    }
    if (hallId) {
      if (role === 'owner') {
        const ownedHalls = await prisma.weddingHall.findMany({
          where: { ownerId: userId },
          select: { hallId: true },
        });
        const hallIds = ownedHalls.map((h) => h.hallId);
        if (hallIds.includes(hallId)) {
          where.hallId = hallId;
        }
      } else {
        where.hallId = hallId;
      }
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          hall: {
            select: {
              hallId: true,
              name: true,
              district: true,
              address: true,
              seatPrice: true,
              images: true,
            },
          },
          customer: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
          services: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
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
    console.error('Error fetching bookings:', error);
    return res.status(500).json({ error: 'Bron bandlarni yuklashda xatolik' });
  }
});

// GET /bookings/my-bookings
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const status = req.query.status;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const skip = (page - 1) * limit;

    const where = {};

    if (role === 'customer') {
      where.customerId = userId;
    } else if (role === 'owner') {
      const ownedHalls = await prisma.weddingHall.findMany({
        where: { ownerId: userId },
        select: { hallId: true },
      });
      const hallIds = ownedHalls.map((h) => h.hallId);
      where.hallId = { in: hallIds };
    }

    if (status) {
      where.bookingStatus = status;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          hall: {
            select: {
              hallId: true,
              name: true,
              district: true,
              address: true,
              seatPrice: true,
              images: true,
            },
          },
          customer: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
          services: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
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
    console.error('Error in my-bookings:', error);
    return res.status(500).json({ error: 'Mening bronlarimni olishda xatolik' });
  }
});

// GET /bookings/:bookingId - Get booking details
router.get('/:bookingId', auth, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { bookingId } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { bookingId },
      include: {
        hall: {
          select: {
            hallId: true,
            name: true,
            district: true,
            address: true,
            seatPrice: true,
            capacity: true,
            phone: true,
            hasKarnaySurnay: true,
            karnaySurnayPrice: true,
            images: true,
          },
        },
        customer: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        services: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Bron band topilmadi' });
    }

    if (role === 'customer' && booking.customerId !== userId) {
      return res.status(403).json({ error: 'Faqat o\'zingizning bronlaringizni ko\'rishingiz mumkin' });
    }

    if (role === 'owner') {
      const hall = await prisma.weddingHall.findUnique({
        where: { hallId: booking.hallId, ownerId: userId },
      });
      if (!hall) {
        return res.status(403).json({ error: 'Faqat o\'z to\'yxonangiz bronlarini ko\'rishingiz mumkin' });
      }
    }

    const enrichedServices = await Promise.all(
      booking.services.map(async (service) => {
        let details = {};

        switch (service.serviceType) {
          case 'singer': {
            const singer = await prisma.singer.findUnique({
              where: { singerId: service.serviceId },
              select: { singerId: true, singerName: true, price: true, imageUrl: true },
            });
            details = singer || {};
            break;
          }
          case 'menu': {
            const menu = await prisma.menu.findUnique({
              where: { menuId: service.serviceId },
              select: { menuId: true, menuName: true },
            });
            details = menu || {};
            break;
          }
          case 'car': {
            const car = await prisma.car.findUnique({
              where: { carId: service.serviceId },
              select: { carId: true, brand: true, price: true, imageUrl: true },
            });
            details = car || {};
            break;
          }
          case 'karnay_surnay': {
            details = {
              type: 'Karnay-Surnay',
              price: service.servicePrice,
            };
            break;
          }
        }

        return {
          ...service,
          details,
        };
      })
    );

    return res.json({
      booking: {
        ...booking,
        services: enrichedServices,
      },
    });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    return res.status(500).json({ error: 'Bron tafsilotlarini yuklashda xatolik yuz berdi' });
  }
});

// POST /bookings - Create a booking
router.post('/', auth, async (req, res) => {
  try {
    const { userId, role } = req.user;
    if (role !== 'customer') {
      return res.status(403).json({ error: 'Faqat mijozlar bron qila olishadi' });
    }

    const {
      hallId,
      bookingDate,
      guestCount,
      services = [],
      firstName,
      lastName,
      phone,
    } = req.body;

    if (!hallId || !bookingDate || !guestCount) {
      return res.status(400).json({ error: 'hallId, bookingDate va guestCount kiritilishi shart' });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(bookingDate)) {
      return res.status(400).json({ error: 'Sana formati YYYY-MM-DD bo\'lishi shart' });
    }

    if (guestCount <= 0 || guestCount > 10000) {
      return res.status(400).json({ error: 'Mehmonlar soni 1 dan 10000 gacha bo\'lishi shart' });
    }

    const hall = await prisma.weddingHall.findUnique({
      where: { hallId },
    });

    if (!hall) {
      return res.status(404).json({ error: 'To\'yxona topilmadi' });
    }

    if (hall.status !== 'approved') {
      return res.status(400).json({ error: 'To\'yxona hali tasdiqlanmagan' });
    }

    if (guestCount > hall.capacity) {
      return res.status(400).json({ error: `Mehmonlar soni to'yxona sig'imidan (${hall.capacity}) oshib ketdi` });
    }

    const existingBooking = await prisma.booking.findFirst({
      where: {
        hallId,
        bookingDate,
        bookingStatus: { not: 'cancelled' },
      },
    });

    if (existingBooking) {
      return res.status(409).json({ error: 'Ushbu sana uchun to\'yxona allaqachon bron qilingan' });
    }

    const basePrice = hall.seatPrice * guestCount;
    let servicesTotal = 0;
    const bookingServiceData = [];

    for (const service of services) {
      const { serviceType, serviceId } = service;

      if (!serviceType || !serviceId) {
        return res.status(400).json({ error: 'Har bir qo\'shimcha xizmat turi va ID si bo\'lishi shart' });
      }

      let servicePrice = 0;

      switch (serviceType) {
        case 'singer': {
          const singer = await prisma.singer.findUnique({ where: { singerId: serviceId } });
          if (!singer || singer.hallId !== hallId) {
            return res.status(400).json({ error: 'Noto\'g\'ri xonanda tanlandi' });
          }
          servicePrice = singer.price;
          break;
        }
        case 'menu': {
          const menu = await prisma.menu.findUnique({ where: { menuId: serviceId } });
          if (!menu || menu.hallId !== hallId) {
            return res.status(400).json({ error: 'Noto\'g\'ri menyu tanlandi' });
          }
          servicePrice = 0;
          break;
        }
        case 'car': {
          const car = await prisma.car.findUnique({ where: { carId: serviceId } });
          if (!car || car.hallId !== hallId) {
            return res.status(400).json({ error: 'Noto\'g\'ri mashina tanlandi' });
          }
          servicePrice = car.price;
          break;
        }
        case 'karnay_surnay': {
          if (!hall.hasKarnaySurnay) {
            return res.status(400).json({ error: 'Ushbu to\'yxonada karnay-surnay xizmati mavjud emas' });
          }
          servicePrice = hall.karnaySurnayPrice || 0;
          break;
        }
        default:
          return res.status(400).json({ error: 'Noma\'lum xizmat turi' });
      }

      servicesTotal += servicePrice;
      bookingServiceData.push({
        serviceType,
        serviceId,
        servicePrice,
      });
    }

    const totalPrice = basePrice + servicesTotal;
    const advancePayment = totalPrice * 0.2;

    if (firstName || lastName || phone) {
      await prisma.user.update({
        where: { userId },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(phone && { phone }),
        },
      });
    }

    const booking = await prisma.booking.create({
      data: {
        hallId,
        customerId: userId,
        bookingDate,
        guestCount,
        totalPrice,
        advancePayment,
        bookingStatus: 'upcoming',
        services: {
          create: bookingServiceData,
        },
      },
      include: {
        hall: {
          select: {
            hallId: true,
            name: true,
            district: true,
            address: true,
            seatPrice: true,
          },
        },
        customer: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        services: true,
      },
    });

    return res.status(201).json({ booking });
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({ error: 'Bron qilishda xatolik yuz berdi' });
  }
});

// DELETE /bookings/:bookingId - Cancel booking
router.delete('/:bookingId', auth, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { bookingId } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { bookingId },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Bron topilmadi' });
    }

    if (role === 'customer' && booking.customerId !== userId) {
      return res.status(403).json({ error: 'Faqat o\'zingizning broningizni bekor qila olasiz' });
    }

    if (role === 'owner') {
      const hall = await prisma.weddingHall.findUnique({
        where: { hallId: booking.hallId, ownerId: userId },
      });
      if (!hall) {
        return res.status(403).json({ error: 'Faqat o\'z to\'yxonangizga tegishli bronni bekor qila olasiz' });
      }
    }

    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({ error: 'Ushbu bron allaqachon bekor qilingan' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { bookingId },
      data: { bookingStatus: 'cancelled' },
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
        services: true,
      },
    });

    return res.json({ booking: updatedBooking });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return res.status(500).json({ error: 'Bronni bekor qilishda xatolik yuz berdi' });
  }
});

// PUT /bookings/:bookingId/status - Update booking status
router.put('/:bookingId/status', auth, async (req, res) => {
  try {
    const { role, userId } = req.user;
    const { bookingId } = req.params;
    const { status } = req.body;

    if (!status || !['upcoming', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Noto\'g\'ri status tanlandi' });
    }

    const booking = await prisma.booking.findUnique({
      where: { bookingId },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Bron topilmadi' });
    }

    if (role === 'owner') {
      const hall = await prisma.weddingHall.findUnique({
        where: { hallId: booking.hallId, ownerId: userId },
      });
      if (!hall) {
        return res.status(403).json({ error: 'Faqat o\'z to\'yxonangiz bronlari statusini o\'zgartira olasiz' });
      }
    } else if (role !== 'admin') {
      return res.status(403).json({ error: 'Ruxsat etilmagan amal' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { bookingId },
      data: { bookingStatus: status },
      include: {
        hall: true,
        customer: true,
        services: true,
      },
    });

    return res.json({ booking: updatedBooking });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Statusni o\'zgartirishda xatolik' });
  }
});

module.exports = router;
