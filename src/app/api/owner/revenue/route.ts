import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, requireRole } from '@/lib/middleware';
import type { TokenPayload } from '@/lib/middleware';

export async function GET(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const decoded = authResult as TokenPayload;
    const roleCheck = requireRole('owner')(decoded);
    if (roleCheck instanceof NextResponse) {
      return roleCheck;
    }

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '6');

    // Get owner's halls
    const halls = await db.weddingHall.findMany({
      where: { ownerId: decoded.userId },
      select: { hallId: true, name: true, capacity: true, seatPrice: true },
    });

    const hallIds = halls.map(h => h.hallId);

    // Get bookings for owner's halls
    const bookings = await db.booking.findMany({
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

    // Total revenue
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const totalAdvance = bookings.reduce((sum, b) => sum + b.advancePayment, 0);

    // Monthly breakdown
    const monthlyData: { month: string; revenue: number; bookings: number }[] = [];
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

    // Top halls by revenue
    const hallRevenueMap = new Map<string, { name: string; revenue: number; bookings: number }>();
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

    // Booking statistics
    const totalBookings = bookings.length;
    const upcomingBookings = bookings.filter(b => b.bookingStatus === 'upcoming').length;
    const completedBookings = bookings.filter(b => b.bookingStatus === 'completed').length;

    // Simulated expenses (30% of revenue)
    const expenses = totalRevenue * 0.3;

    return NextResponse.json({
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
      approvedHalls: halls.length, // all owner halls in query are approved
    });
  } catch (error) {
    console.error('Owner revenue error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
