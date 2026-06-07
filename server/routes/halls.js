const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/auth');

// Allowed sort fields whitelist
const ALLOWED_SORT_FIELDS = ['createdAt', 'name', 'capacity', 'seatPrice', 'district'];
const MAX_PAGE_LIMIT = 50;

// GET /halls - Public: List approved halls with filters
router.get('/', async (req, res) => {
  try {
    const { district, capacity, seatPrice, search, sort = 'createdAt', order = 'desc' } = req.query;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(req.query.limit || '10', 10)));

    // Validate sort field to prevent injection
    const sanitizedSort = ALLOWED_SORT_FIELDS.includes(sort) ? sort : 'createdAt';
    const sanitizedOrder = order === 'asc' ? 'asc' : 'desc';

    const conditions = [{ status: 'approved' }];

    if (district) {
      conditions.push({ district });
    }

    if (capacity) {
      conditions.push({ capacity: { gte: parseInt(capacity, 10) } });
    }

    if (seatPrice) {
      conditions.push({ seatPrice: { lte: parseFloat(seatPrice) } });
    }

    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
          { district: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const where = conditions.length > 0 ? { AND: conditions } : {};

    const total = await prisma.weddingHall.count({ where });

    const halls = await prisma.weddingHall.findMany({
      where,
      include: {
        images: true,
        singers: true,
        menus: true,
        cars: true,
      },
      orderBy: {
        [sanitizedSort]: sanitizedOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return res.json({
      halls,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching halls:', error);
    return res.status(500).json({ error: 'To\'yxonalarni yuklashda xatolik' });
  }
});

// GET /halls/autocomplete - Lightweight search suggestions
router.get('/autocomplete', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || String(q).trim().length < 1) {
      return res.json({ suggestions: [] });
    }

    const query = String(q).trim();

    const halls = await prisma.weddingHall.findMany({
      where: {
        status: 'approved',
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { district: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        hallId: true,
        name: true,
        district: true,
        address: true,
        capacity: true,
        seatPrice: true,
        images: { take: 1, select: { imageUrl: true } },
      },
      take: 20,
    });

    // Smart sort: exact name match > starts with > partial name > district match > address match
    const lowerQ = query.toLowerCase();
    const scored = halls.map(hall => {
      const lName = hall.name.toLowerCase();
      const lDistrict = hall.district.toLowerCase();
      const lAddress = hall.address.toLowerCase();
      let score = 0;
      if (lName === lowerQ) score = 100;
      else if (lName.startsWith(lowerQ)) score = 80;
      else if (lName.includes(lowerQ)) score = 60;
      else if (lDistrict.includes(lowerQ)) score = 40;
      else if (lAddress.includes(lowerQ)) score = 20;
      else score = 10;
      return { ...hall, _score: score };
    });

    scored.sort((a, b) => b._score - a._score);

    const suggestions = scored.slice(0, 8).map(({ _score, ...rest }) => rest);

    return res.json({ suggestions });
  } catch (error) {
    console.error('Autocomplete error:', error);
    return res.status(500).json({ error: 'Qidiruv tavsiyalarini yuklashda xatolik' });
  }
});

// GET /halls/my-halls - Owner only: Get owned halls
router.get('/my-halls', auth, async (req, res) => {
  try {
    const { userId, role } = req.user;
    if (role !== 'owner' && role !== 'admin') {
      return res.status(403).json({ error: 'Ruxsat etilmagan amal' });
    }

    const halls = await prisma.weddingHall.findMany({
      where: role === 'admin' ? {} : { ownerId: userId },
      include: {
        images: true,
        singers: true,
        menus: true,
        cars: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ halls });
  } catch (error) {
    console.error('Error fetching my halls:', error);
    return res.status(500).json({ error: 'Mening to\'yxonalarimni yuklashda xatolik' });
  }
});

// GET /halls/:hallId - Get details of a single hall
router.get('/:hallId', async (req, res) => {
  try {
    const { hallId } = req.params;

    const hall = await prisma.weddingHall.findUnique({
      where: { hallId },
      include: {
        images: true,
        singers: true,
        menus: true,
        cars: true,
        owner: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!hall) {
      return res.status(404).json({ error: 'To\'yxona topilmadi' });
    }

    // Pending halls are only visible to admin or the hall's owner
    if (hall.status !== 'approved') {
      let isAuthorized = false;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
          if (decoded.role === 'admin' || (decoded.role === 'owner' && decoded.userId === hall.ownerId)) {
            isAuthorized = true;
          }
        } catch (_) { /* invalid token — treat as unauthenticated */ }
      }
      if (!isAuthorized) {
        return res.status(404).json({ error: 'To\'yxona topilmadi' });
      }
    }

    return res.json({ hall });
  } catch (error) {
    console.error('Error fetching hall:', error);
    return res.status(500).json({ error: 'To\'yxona tafsilotlarini yuklashda xatolik' });
  }
});

// POST /halls - Owner only: Create new hall
router.post('/', auth, async (req, res) => {
  try {
    const { userId, role } = req.user;
    if (role !== 'owner' && role !== 'admin') {
      return res.status(403).json({ error: 'Faqat to\'yxona egalari to\'yxona yarata olishadi' });
    }

    const {
      name,
      district,
      address,
      capacity,
      seatPrice,
      phone,
      hasKarnaySurnay,
      karnaySurnayPrice,
      ownerId: bodyOwnerId,
    } = req.body;

    if (!name || !district || !address || !capacity || !seatPrice || !phone) {
      return res.status(400).json({ error: 'Barcha majburiy maydonlar to\'ldirilishi shart' });
    }

    // Input length validation
    if (typeof name !== 'string' || name.trim().length > 100) {
      return res.status(400).json({ error: 'To\'yxona nomi 100 belgidan oshmasligi kerak' });
    }
    if (typeof address !== 'string' || address.trim().length > 200) {
      return res.status(400).json({ error: 'Manzil 200 belgidan oshmasligi kerak' });
    }
    if (typeof phone !== 'string' || phone.trim().length > 20) {
      return res.status(400).json({ error: 'Telefon raqam yaroqsiz' });
    }
    if (isNaN(parseInt(capacity, 10)) || parseInt(capacity, 10) <= 0 || parseInt(capacity, 10) > 10000) {
      return res.status(400).json({ error: 'Sig\'im 1 dan 10000 gacha bo\'lishi shart' });
    }
    if (isNaN(parseFloat(seatPrice)) || parseFloat(seatPrice) <= 0) {
      return res.status(400).json({ error: 'O\'rindiq narxi musbat bo\'lishi shart' });
    }

    // Admin must specify an ownerId when creating a hall
    if (role === 'admin' && !bodyOwnerId) {
      return res.status(400).json({ error: 'Admin to\'yxona yaratishda ownerId ko\'rsatishi shart' });
    }

    const resolvedOwnerId = role === 'admin' ? bodyOwnerId : userId;

    const hall = await prisma.weddingHall.create({
      data: {
        ownerId: resolvedOwnerId,
        name,
        district,
        address,
        capacity: parseInt(capacity, 10),
        seatPrice: parseFloat(seatPrice),
        phone,
        hasKarnaySurnay: hasKarnaySurnay ?? false,
        karnaySurnayPrice: karnaySurnayPrice ? parseFloat(karnaySurnayPrice) : null,
        // Admin-created halls are auto-approved; owner submissions go to pending
        status: role === 'admin' ? 'approved' : 'pending',
      },
      include: {
        images: true,
        singers: true,
        menus: true,
        cars: true,
      },
    });

    return res.status(201).json({ hall });
  } catch (error) {
    console.error('Error creating hall:', error);
    return res.status(500).json({ error: 'To\'yxona yaratishda xatolik' });
  }
});

// PUT /halls/:hallId - Update hall
router.put('/:hallId', auth, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { hallId } = req.params;

    const hall = await prisma.weddingHall.findUnique({ where: { hallId } });
    if (!hall) {
      return res.status(404).json({ error: 'To\'yxona topilmadi' });
    }

    if (role !== 'admin' && hall.ownerId !== userId) {
      return res.status(403).json({ error: 'Faqat o\'z to\'yxonangizni tahrirlashingiz mumkin' });
    }

    const {
      name,
      district,
      address,
      capacity,
      seatPrice,
      phone,
      hasKarnaySurnay,
      karnaySurnayPrice,
      status,
      ownerId,
    } = req.body;

    // Input validation for update fields
    if (name !== undefined && (typeof name !== 'string' || name.trim().length > 100)) {
      return res.status(400).json({ error: 'To\'yxona nomi 100 belgidan oshmasligi kerak' });
    }
    if (address !== undefined && (typeof address !== 'string' || address.trim().length > 200)) {
      return res.status(400).json({ error: 'Manzil 200 belgidan oshmasligi kerak' });
    }
    if (phone !== undefined && (typeof phone !== 'string' || phone.trim().length > 20)) {
      return res.status(400).json({ error: 'Telefon raqam yaroqsiz' });
    }

    // ─── SECURITY: Only admin can set status and ownerId ──────────────
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (district) updateData.district = district;
    if (address) updateData.address = address.trim();
    if (capacity) updateData.capacity = parseInt(capacity, 10);
    if (seatPrice) updateData.seatPrice = parseFloat(seatPrice);
    if (phone) updateData.phone = phone.trim();
    if (hasKarnaySurnay !== undefined) updateData.hasKarnaySurnay = hasKarnaySurnay;
    if (karnaySurnayPrice !== undefined) updateData.karnaySurnayPrice = karnaySurnayPrice ? parseFloat(karnaySurnayPrice) : null;

    // Only admin can change these sensitive fields
    if (role === 'admin') {
      if (status && ['approved', 'pending', 'rejected'].includes(status)) updateData.status = status;
      if (ownerId) updateData.ownerId = ownerId;
    }

    const updatedHall = await prisma.weddingHall.update({
      where: { hallId },
      data: updateData,
      include: {
        images: true,
        singers: true,
        menus: true,
        cars: true,
      },
    });

    return res.json({ hall: updatedHall });
  } catch (error) {
    console.error('Error updating hall:', error);
    return res.status(500).json({ error: 'To\'yxonani tahrirlashda xatolik yuz berdi' });
  }
});

// DELETE /halls/:hallId - Delete hall
router.delete('/:hallId', auth, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { hallId } = req.params;

    const hall = await prisma.weddingHall.findUnique({ where: { hallId } });
    if (!hall) {
      return res.status(404).json({ error: 'To\'yxona topilmadi' });
    }

    // Only admin can delete halls (assignment requirement)
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Faqat admin to\'yxonani o\'chira oladi' });
    }

    await prisma.weddingHall.delete({ where: { hallId } });

    return res.json({ message: 'To\'yxona muvaffaqiyatli o\'chirildi' });
  } catch (error) {
    console.error('Error deleting hall:', error);
    return res.status(500).json({ error: 'To\'yxonani o\'chirishda xatolik' });
  }
});

// PUT /halls/:hallId/approve - Admin only: Approve hall
router.put('/:hallId/approve', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Ruxsat etilmagan amal (Faqat admin uchun)' });
    }

    const { hallId } = req.params;

    const hall = await prisma.weddingHall.findUnique({ where: { hallId } });
    if (!hall) {
      return res.status(404).json({ error: 'To\'yxona topilmadi' });
    }

    const updatedHall = await prisma.weddingHall.update({
      where: { hallId },
      data: { status: 'approved' },
    });

    // Notify owner
    await prisma.notification.create({
      data: {
        userId: hall.ownerId,
        title: 'To\'yxona tasdiqlandi!',
        message: `Sizning "${hall.name}" to\'yxonangiz admin tomonidan tasdiqlandi va endi mijozlarga ko\'rinadi.`,
        type: 'approval',
      },
    });

    return res.json({ hall: updatedHall, message: 'To\'yxona muvaffaqiyatli tasdiqlandi' });
  } catch (error) {
    console.error('Error approving hall:', error);
    return res.status(500).json({ error: 'To\'yxonani tasdiqlashda xatolik' });
  }
});

// GET /halls/:hallId/calendar - Get calendar bookings
router.get('/:hallId/calendar', async (req, res) => {
  try {
    const { hallId } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: 'Oy va yil ko\'rsatilishi shart' });
    }

    const formattedMonth = String(month).padStart(2, '0');
    const prefix = `${year}-${formattedMonth}-`;

    const bookings = await prisma.booking.findMany({
      where: {
        hallId,
        bookingDate: { startsWith: prefix },
        bookingStatus: { not: 'cancelled' },
      },
      select: {
        bookingId: true,
        bookingDate: true,
        bookingStatus: true,
      },
    });

    return res.json({ bookings });
  } catch (error) {
    console.error('Error fetching calendar:', error);
    return res.status(500).json({ error: 'Kalendarni yuklashda xatolik' });
  }
});

// POST /halls/:hallId/images - Add hall image
router.post('/:hallId/images', auth, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { hallId } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Rasm URL manzili majburiy' });
    }

    const imageRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg|bmp)|data:image\/[a-z]+;base64,.*)$/i;
    if (!imageRegex.test(imageUrl)) {
      return res.status(400).json({ error: 'Rasm URL formati noto\'g\'ri (faqat png, jpg, jpeg, gif, webp, svg, bmp yoki base64 rasm manzillari qabul qilinadi)' });
    }

    const hall = await prisma.weddingHall.findUnique({ where: { hallId } });
    if (!hall) {
      return res.status(404).json({ error: 'To\'yxona topilmadi' });
    }

    if (role !== 'admin' && hall.ownerId !== userId) {
      return res.status(403).json({ error: 'Ruxsat etilmagan amal' });
    }

    const image = await prisma.hallImage.create({
      data: {
        hallId,
        imageUrl,
      },
    });

    return res.status(201).json({ image });
  } catch (error) {
    console.error('Add image error:', error);
    return res.status(500).json({ error: 'Rasm qo\'shishda xatolik yuz berdi' });
  }
});

// DELETE /halls/:hallId/images - Delete image
router.delete('/:hallId/images', auth, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { hallId } = req.params;
    const { imageId } = req.body;

    if (!imageId) {
      return res.status(400).json({ error: 'Rasm ID si majburiy' });
    }

    const hall = await prisma.weddingHall.findUnique({ where: { hallId } });
    if (!hall) {
      return res.status(404).json({ error: 'To\'yxona topilmadi' });
    }

    if (role !== 'admin' && hall.ownerId !== userId) {
      return res.status(403).json({ error: 'Ruxsat etilmagan amal' });
    }

    // ─── SECURITY: Verify the image belongs to this hall ────────────────
    const image = await prisma.hallImage.findUnique({ where: { imageId } });
    if (!image || image.hallId !== hallId) {
      return res.status(404).json({ error: 'Rasm topilmadi yoki bu to\'yxonaga tegishli emas' });
    }

    await prisma.hallImage.delete({ where: { imageId } });

    return res.json({ message: 'Rasm muvaffaqiyatli o\'chirildi' });
  } catch (error) {
    console.error('Delete image error:', error);
    return res.status(500).json({ error: 'Rasmni o\'chirishda xatolik yuz berdi' });
  }
});

// POST /halls/:hallId/singers - Add singer
router.post('/:hallId/singers', auth, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { hallId } = req.params;
    const { singerName, price, imageUrl } = req.body;

    if (!singerName || !price) {
      return res.status(400).json({ error: 'Xonanda ismi va narxi kiritilishi shart' });
    }

    if (typeof singerName !== 'string' || singerName.trim().length > 100) {
      return res.status(400).json({ error: 'Xonanda ismi 100 belgidan oshmasligi kerak' });
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      return res.status(400).json({ error: 'Narx musbat son bo\'lishi shart' });
    }

    if (imageUrl) {
      const imageRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg|bmp)|data:image\/[a-z]+;base64,.*)$/i;
      if (!imageRegex.test(imageUrl)) {
        return res.status(400).json({ error: 'Rasm URL formati noto\'g\'ri (faqat png, jpg, jpeg, gif, webp, svg, bmp yoki base64 rasm manzillari qabul qilinadi)' });
      }
    }

    const hall = await prisma.weddingHall.findUnique({ where: { hallId } });
    if (!hall) {
      return res.status(404).json({ error: 'To\'yxona topilmadi' });
    }

    if (role !== 'admin' && hall.ownerId !== userId) {
      return res.status(403).json({ error: 'Ruxsat etilmagan' });
    }

    const singer = await prisma.singer.create({
      data: {
        hallId,
        singerName,
        price: parseFloat(price),
        imageUrl: imageUrl || null,
      },
    });

    return res.status(201).json({ singer });
  } catch (error) {
    console.error('Add singer error:', error);
    return res.status(500).json({ error: 'Xonandani qo\'shishda xatolik' });
  }
});

// DELETE /halls/:hallId/singers - Delete singer
router.delete('/:hallId/singers', auth, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { hallId } = req.params;
    const { singerId } = req.body;

    if (!singerId) {
      return res.status(400).json({ error: 'Xonanda ID si majburiy' });
    }

    const hall = await prisma.weddingHall.findUnique({ where: { hallId } });
    if (!hall) {
      return res.status(404).json({ error: 'To\'yxona topilmadi' });
    }

    if (role !== 'admin' && hall.ownerId !== userId) {
      return res.status(403).json({ error: 'Ruxsat etilmagan' });
    }

    // ─── SECURITY: Verify the singer belongs to this hall ───────────────
    const singer = await prisma.singer.findUnique({ where: { singerId } });
    if (!singer || singer.hallId !== hallId) {
      return res.status(404).json({ error: 'Xonanda topilmadi yoki bu to\'yxonaga tegishli emas' });
    }

    await prisma.singer.delete({ where: { singerId } });

    return res.json({ message: 'Xonanda muvaffaqiyatli o\'chirildi' });
  } catch (error) {
    console.error('Delete singer error:', error);
    return res.status(500).json({ error: 'Xonandani o\'chirishda xatolik yuz berdi' });
  }
});

// POST /halls/:hallId/menus - Add menu
router.post('/:hallId/menus', auth, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { hallId } = req.params;
    const { menuName } = req.body;

    if (!menuName) {
      return res.status(400).json({ error: 'Menyu nomi kiritilishi shart' });
    }

    if (typeof menuName !== 'string' || menuName.trim().length > 100) {
      return res.status(400).json({ error: 'Menyu nomi 100 belgidan oshmasligi kerak' });
    }

    const hall = await prisma.weddingHall.findUnique({ where: { hallId } });
    if (!hall) {
      return res.status(404).json({ error: 'To\'yxona topilmadi' });
    }

    if (role !== 'admin' && hall.ownerId !== userId) {
      return res.status(403).json({ error: 'Ruxsat etilmagan' });
    }

    const menu = await prisma.menu.create({
      data: {
        hallId,
        menuName,
      },
    });

    return res.status(201).json({ menu });
  } catch (error) {
    console.error('Add menu error:', error);
    return res.status(500).json({ error: 'Menyuni qo\'shishda xatolik' });
  }
});

// DELETE /halls/:hallId/menus - Delete menu
router.delete('/:hallId/menus', auth, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { hallId } = req.params;
    const { menuId } = req.body;

    if (!menuId) {
      return res.status(400).json({ error: 'Menyu ID si majburiy' });
    }

    const hall = await prisma.weddingHall.findUnique({ where: { hallId } });
    if (!hall) {
      return res.status(404).json({ error: 'To\'yxona topilmadi' });
    }

    if (role !== 'admin' && hall.ownerId !== userId) {
      return res.status(403).json({ error: 'Ruxsat etilmagan' });
    }

    // ─── SECURITY: Verify the menu belongs to this hall ─────────────────
    const menu = await prisma.menu.findUnique({ where: { menuId } });
    if (!menu || menu.hallId !== hallId) {
      return res.status(404).json({ error: 'Menyu topilmadi yoki bu to\'yxonaga tegishli emas' });
    }

    await prisma.menu.delete({ where: { menuId } });

    return res.json({ message: 'Menyu muvaffaqiyatli o\'chirildi' });
  } catch (error) {
    console.error('Delete menu error:', error);
    return res.status(500).json({ error: 'Menyuni o\'chirishda xatolik yuz berdi' });
  }
});

// POST /halls/:hallId/cars - Add car
router.post('/:hallId/cars', auth, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { hallId } = req.params;
    const { brand, price, imageUrl } = req.body;

    if (!brand || !price) {
      return res.status(400).json({ error: 'Mashina brendi va narxi kiritilishi shart' });
    }

    if (typeof brand !== 'string' || brand.trim().length > 100) {
      return res.status(400).json({ error: 'Mashina brendi 100 belgidan oshmasligi kerak' });
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      return res.status(400).json({ error: 'Narx musbat son bo\'lishi shart' });
    }

    if (imageUrl) {
      const imageRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg|bmp)|data:image\/[a-z]+;base64,.*)$/i;
      if (!imageRegex.test(imageUrl)) {
        return res.status(400).json({ error: 'Rasm URL formati noto\'g\'ri (faqat png, jpg, jpeg, gif, webp, svg, bmp yoki base64 rasm manzillari qabul qilinadi)' });
      }
    }

    const hall = await prisma.weddingHall.findUnique({ where: { hallId } });
    if (!hall) {
      return res.status(404).json({ error: 'To\'yxona topilmadi' });
    }

    if (role !== 'admin' && hall.ownerId !== userId) {
      return res.status(403).json({ error: 'Ruxsat etilmagan' });
    }

    const car = await prisma.car.create({
      data: {
        hallId,
        brand,
        price: parseFloat(price),
        imageUrl: imageUrl || null,
      },
    });

    return res.status(201).json({ car });
  } catch (error) {
    console.error('Add car error:', error);
    return res.status(500).json({ error: 'Mashinani qo\'shishda xatolik' });
  }
});

// DELETE /halls/:hallId/cars - Delete car
router.delete('/:hallId/cars', auth, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { hallId } = req.params;
    const { carId } = req.body;

    if (!carId) {
      return res.status(400).json({ error: 'Mashina ID si majburiy' });
    }

    const hall = await prisma.weddingHall.findUnique({ where: { hallId } });
    if (!hall) {
      return res.status(404).json({ error: 'To\'yxona topilmadi' });
    }

    if (role !== 'admin' && hall.ownerId !== userId) {
      return res.status(403).json({ error: 'Ruxsat etilmagan' });
    }

    // ─── SECURITY: Verify the car belongs to this hall ──────────────────
    const car = await prisma.car.findUnique({ where: { carId } });
    if (!car || car.hallId !== hallId) {
      return res.status(404).json({ error: 'Mashina topilmadi yoki bu to\'yxonaga tegishli emas' });
    }

    await prisma.car.delete({ where: { carId } });

    return res.json({ message: 'Mashina muvaffaqiyatli o\'chirildi' });
  } catch (error) {
    console.error('Delete car error:', error);
    return res.status(500).json({ error: 'Mashinani o\'chirishda xatolik yuz berdi' });
  }
});

// GET /halls/:hallId/reviews - Get reviews
router.get('/:hallId/reviews', async (req, res) => {
  try {
    const { hallId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { hallId },
      include: {
        user: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({ error: 'Sharhlarni yuklashda xatolik' });
  }
});

// POST /halls/:hallId/reviews - Create review
router.post('/:hallId/reviews', auth, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { hallId } = req.params;
    const { rating, comment } = req.body;

    if (role !== 'customer') {
      return res.status(403).json({ error: 'Faqat mijozlar sharh qoldira olishadi' });
    }

    if (!rating || isNaN(parseInt(rating, 10)) || parseInt(rating, 10) < 1 || parseInt(rating, 10) > 5) {
      return res.status(400).json({ error: 'Baholash balli 1 dan 5 gacha bo\'lishi shart' });
    }

    // Validate comment length
    if (comment !== undefined && (typeof comment !== 'string' || comment.length > 1000)) {
      return res.status(400).json({ error: 'Sharh 1000 belgidan oshmasligi kerak' });
    }

    const existingReview = await prisma.review.findUnique({
      where: {
        hallId_userId: { hallId, userId },
      },
    });

    if (existingReview) {
      return res.status(409).json({ error: 'Siz ushbu to\'yxona uchun allaqachon sharh qoldirgansiz' });
    }

    const review = await prisma.review.create({
      data: {
        hallId,
        userId,
        rating: parseInt(rating, 10),
        comment,
      },
      include: {
        user: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return res.status(201).json({ review });
  } catch (error) {
    console.error('Create review error:', error);
    return res.status(500).json({ error: 'Sharh qoldirishda xatolik yuz berdi' });
  }
});

// POST /halls/:hallId/reviews/:reviewId/response - Owner response to review
router.post('/:hallId/reviews/:reviewId/response', auth, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { hallId, reviewId } = req.params;
    const { response } = req.body;

    if (role !== 'owner' && role !== 'admin') {
      return res.status(403).json({ error: 'Ruxsat etilmagan' });
    }

    if (!response) {
      return res.status(400).json({ error: 'Javob matni kiritilishi shart' });
    }

    if (typeof response !== 'string' || response.length > 1000) {
      return res.status(400).json({ error: 'Javob matni 1000 belgidan oshmasligi kerak' });
    }

    const hall = await prisma.weddingHall.findUnique({ where: { hallId } });
    if (!hall) {
      return res.status(404).json({ error: 'To\'yxona topilmadi' });
    }

    if (role !== 'admin' && hall.ownerId !== userId) {
      return res.status(403).json({ error: 'Faqat o\'z to\'yxonangiz sharhlariga javob bera olasiz' });
    }

    // ─── SECURITY: Verify review belongs to this hall ────────────────
    const review = await prisma.review.findUnique({ where: { reviewId } });
    if (!review || review.hallId !== hallId) {
      return res.status(404).json({ error: 'Sharh topilmadi yoki bu to\'yxonaga tegishli emas' });
    }

    const updatedReview = await prisma.review.update({
      where: { reviewId },
      data: {
        ownerResponse: response,
        respondedAt: new Date(),
      },
    });

    return res.json({ review: updatedReview });
  } catch (error) {
    console.error('Review response error:', error);
    return res.status(500).json({ error: 'Sharhga javob yozishda xatolik yuz berdi' });
  }
});

module.exports = router;
