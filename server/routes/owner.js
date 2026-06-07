const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const auth = require('../middleware/auth');

// GET /owner/revenue - Get owner's revenue dashboard stats
router.get('/revenue', auth, async (req, res) => {
  try {
    const { userId, role } = req.user;

    if (role !== 'owner') {
      return res.status(403).json({ error: 'Ruxsat etilmagan amal (Faqat to\'yxona egalari uchun)' });
    }

    const months = parseInt(req.query.months || '6', 10);

    const halls = await prisma.weddingHall.findMany({
      where: { ownerId: userId },
      select: { hallId: true, name: true, capacity: true, seatPrice: true },
    });

    const hallIds = halls.map(h => h.hallId);

    const bookings = await prisma.booking.findMany({
      where: {
        hallId: { in: hallIds },
        bookingStatus: { in: ['upcoming', 'completed'] },
      },
      select: {
        bookingId: true,
        hallId: true,
        totalPrice: true,
        advancePayment: true,
        bookingStatus: true,
        createdAt: true,
        bookingDate: true,
        hall: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const totalAdvance = bookings.reduce((sum, b) => sum + b.advancePayment, 0);

    const monthlyData = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthBookings = bookings.filter(b => {
        const bDate = new Date(b.createdAt);
        return bDate >= monthStart && bDate <= monthEnd;
      });

      monthlyData.push({
        month: monthStr,
        revenue: monthBookings.reduce((sum, b) => sum + b.totalPrice, 0),
        bookings: monthBookings.length,
      });
    }

    const hallRevenueMap = new Map();
    bookings.forEach(b => {
      const existing = hallRevenueMap.get(b.hallId) || { name: b.hall.name, revenue: 0, bookings: 0 };
      existing.revenue += b.totalPrice;
      existing.bookings += 1;
      hallRevenueMap.set(b.hallId, existing);
    });

    const topHalls = Array.from(hallRevenueMap.entries())
      .map(([hallId, data]) => ({ hallId, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const totalBookings = bookings.length;
    const upcomingBookings = bookings.filter(b => b.bookingStatus === 'upcoming').length;
    const completedBookings = bookings.filter(b => b.bookingStatus === 'completed').length;

    const expenses = totalRevenue * 0.3;

    return res.json({
      totalRevenue,
      totalAdvance,
      totalBookings,
      upcomingBookings,
      completedBookings,
      expenses,
      profit: totalRevenue - expenses,
      monthlyData,
      topHalls,
      totalHalls: halls.length,
      approvedHalls: halls.length,
    });
  } catch (error) {
    console.error('Owner revenue error:', error);
    return res.status(500).json({ error: 'Tizim xatoligi yuz berdi' });
  }
});

module.exports = router;
