const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const auth = require('../middleware/auth');

// GET /notifications - Get notifications for current user
router.get('/', auth, async (req, res) => {
  try {
    const { userId } = req.user;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ error: 'Bildirishnomalarni yuklashda xatolik' });
  }
});

// PUT /notifications/read - Mark notifications as read
router.put('/read', auth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { notificationIds, markAll } = req.body;

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    } else if (notificationIds && notificationIds.length > 0) {
      await prisma.notification.updateMany({
        where: {
          notificationId: { in: notificationIds },
          userId,
        },
        data: { isRead: true },
      });
    }

    const updatedNotifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    const unreadCount = updatedNotifications.filter((n) => !n.isRead).length;

    return res.json({
      message: 'Bildirishnomalar o\'qilgan deb belgilandi',
      notifications: updatedNotifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    return res.status(500).json({ error: 'Bildirishnomalarni o\'qilgan deb belgilashda xatolik' });
  }
});

// DELETE /notifications/:notificationId - Delete notification
router.delete('/:notificationId', auth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { notificationId } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { notificationId },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Bildirishnoma topilmadi' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ error: 'Faqat o\'z bildirishnomalaringizni o\'chira olasiz' });
    }

    await prisma.notification.delete({
      where: { notificationId },
    });

    const updatedNotifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    const unreadCount = updatedNotifications.filter((n) => !n.isRead).length;

    return res.json({
      message: 'Bildirishnoma o\'chirildi',
      notifications: updatedNotifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    return res.status(500).json({ error: 'Bildirishnomani o\'chirishda xatolik' });
  }
});

module.exports = router;
