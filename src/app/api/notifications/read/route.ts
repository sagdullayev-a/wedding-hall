import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/middleware';

export async function PUT(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const userId = (auth as { userId: string }).userId;
    const body = await request.json();
    const { notificationIds, markAll } = body as {
      notificationIds?: string[];
      markAll?: boolean;
    };

    if (markAll) {
      await db.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    } else if (notificationIds && notificationIds.length > 0) {
      await db.notification.updateMany({
        where: {
          notificationId: { in: notificationIds },
          userId,
        },
        data: { isRead: true },
      });
    }

    const updatedNotifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    const unreadCount = updatedNotifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      message: 'Notifications marked as read',
      notifications: updatedNotifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
