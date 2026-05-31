import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, requireRole } from '@/lib/middleware';

// GET /api/bookings/my-bookings - Get customer's own bookings
export async function GET(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = requireRole('customer')(authResult);
    if (roleCheck instanceof NextResponse) return roleCheck;

    const { userId } = authResult;
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      customerId: userId,
    };

    if (status) {
      where.bookingStatus = status;
    }

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
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
          services: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.booking.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      bookings,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching my bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
