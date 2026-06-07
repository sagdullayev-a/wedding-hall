const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const auth = require('../middleware/auth');

// GET /favorites - Get all favorited halls for current customer
router.get('/', auth, async (req, res) => {
  try {
    const { userId } = req.user;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        hall: {
          include: {
            images: true,
            reviews: {
              select: { rating: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedFavorites = favorites.map((fav) => {
      const totalReviews = fav.hall.reviews.length;
      const averageRating =
        totalReviews > 0
          ? fav.hall.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
          : 0;

      return {
        favoriteId: fav.favoriteId,
        createdAt: fav.createdAt,
        hall: {
          hallId: fav.hall.hallId,
          name: fav.hall.name,
          district: fav.hall.district,
          address: fav.hall.address,
          capacity: fav.hall.capacity,
          seatPrice: fav.hall.seatPrice,
          phone: fav.hall.phone,
          hasKarnaySurnay: fav.hall.hasKarnaySurnay,
          karnaySurnayPrice: fav.hall.karnaySurnayPrice,
          status: fav.hall.status,
          images: fav.hall.images,
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews,
        },
      };
    });

    return res.json({ favorites: formattedFavorites });
  } catch (error) {
    console.error('Get favorites error:', error);
    return res.status(500).json({ error: 'Sevimlilarni yuklashda xatolik yuz berdi' });
  }
});

// GET /favorites/:hallId - Check if hall is favorited
router.get('/:hallId', auth, async (req, res) => {
  try {
    const { hallId } = req.params;
    const { userId } = req.user;

    const hall = await prisma.weddingHall.findUnique({
      where: { hallId },
    });

    if (!hall) {
      return res.status(404).json({ error: 'To\'yxona topilmadi' });
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        hallId_userId: { hallId, userId },
      },
    });

    return res.json({ isFavorited: !!favorite });
  } catch (error) {
    console.error('Check favorite error:', error);
    return res.status(500).json({ error: 'Sevimlilar holatini tekshirishda xatolik' });
  }
});

// POST /favorites/:hallId - Add to favorites
router.post('/:hallId', auth, async (req, res) => {
  try {
    const { hallId } = req.params;
    const { userId } = req.user;

    const hall = await prisma.weddingHall.findUnique({
      where: { hallId },
    });

    if (!hall) {
      return res.status(404).json({ error: 'To\'yxona topilmadi' });
    }

    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        hallId_userId: { hallId, userId },
      },
    });

    if (existingFavorite) {
      return res.status(409).json({ error: 'Bu to\'yxona allaqachon sevimlilaringizda bor' });
    }

    await prisma.favorite.create({
      data: {
        hallId,
        userId,
      },
    });

    return res.status(201).json({ message: 'Sevimlilarga qo\'shildi' });
  } catch (error) {
    console.error('Add favorite error:', error);
    return res.status(500).json({ error: 'Sevimlilarga qo\'shishda xatolik' });
  }
});

// DELETE /favorites/:hallId - Remove from favorites
router.delete('/:hallId', auth, async (req, res) => {
  try {
    const { hallId } = req.params;
    const { userId } = req.user;

    const favorite = await prisma.favorite.findUnique({
      where: {
        hallId_userId: { hallId, userId },
      },
    });

    if (!favorite) {
      return res.status(404).json({ error: 'To\'yxona sevimlilaringizda mavjud emas' });
    }

    await prisma.favorite.delete({
      where: {
        hallId_userId: { hallId, userId },
      },
    });

    return res.json({ message: 'Sevimlilardan o\'chirildi' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    return res.status(500).json({ error: 'Sevimlilardan o\'chirishda xatolik' });
  }
});

module.exports = router;
