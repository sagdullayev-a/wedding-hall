import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, requireRole } from '@/lib/middleware';

export async function GET(request: Request) {
  try {
    // Authenticate and require admin role
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const roleCheck = requireRole('admin')(auth);
    if (roleCheck instanceof NextResponse) return roleCheck;

    // Run independent counts in parallel
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
      monthlyBookingsRaw,
    ] = await Promise.all([
      db.weddingHall.count(),
      db.weddingHall.count({ where: { status: 'approved' } }),
      db.weddingHall.count({ where: { status: 'pending' } }),
      db.booking.count(),
      db.booking.count({ where: { bookingStatus: 'upcoming' } }),
      db.booking.count({ where: { bookingStatus: 'completed' } }),
      db.booking.count({ where: { bookingStatus: 'cancelled' } }),
      db.user.count({ where: { role: 'owner' } }),
      db.user.count({ where: { role: 'customer' } }),
      db.booking.findMany({
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
      // Halls grouped by district
      db.weddingHall.groupBy({
        by: ['district'],
        _count: { district: true },
      }),
      // Monthly bookings for last 6 months
      db.$queryRaw<
        { month: string; count: number }[]
      >`SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count FROM bookings WHERE created_at >= datetime('now', '-6 months') GROUP BY strftime('%Y-%m', created_at) ORDER BY month ASC`,
    ]);

    // Total revenue from completed bookings
    const revenueResult = await db.booking.aggregate({
      _sum: { totalPrice: true },
      where: { bookingStatus: 'completed' },
    });
    const totalRevenue = revenueResult._sum.totalPrice ?? 0;

    // Format halls by district
    const hallsByDistrict = hallsByDistrictRaw.map((item) => ({
      district: item.district,
      count: item._count.district,
    }));

    // Format monthly bookings
    const monthlyBookings = monthlyBookingsRaw.map((item) => ({
      month: item.month,
      count: Number(item.count),
    }));

    return NextResponse.json({
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
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
