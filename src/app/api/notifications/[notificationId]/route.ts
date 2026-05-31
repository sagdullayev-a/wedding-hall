import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/middleware';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const userId = (auth as { userId: string }).userId;
    const { notificationId } = await params;

    const notification = await db.notification.findUnique({
      where: { notificationId },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (notification.userId !== userId) {
      return NextResponse.json(
        { error: 'You can only delete your own notifications' },
        { status: 403 }
      );
    }

    await db.notification.delete({
      where: { notificationId },
    });

    const updatedNotifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    const unreadCount = updatedNotifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      message: 'Notification deleted',
      notifications: updatedNotifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
