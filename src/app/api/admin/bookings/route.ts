import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, requireRole } from '@/lib/middleware';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    // Authenticate and require admin role
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const roleCheck = requireRole('admin')(auth);
    if (roleCheck instanceof NextResponse) return roleCheck;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const hallId = searchParams.get('hallId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.BookingWhereInput = {};

    if (status && ['upcoming', 'completed', 'cancelled'].includes(status)) {
      where.bookingStatus = status;
    }

    if (hallId) {
      where.hallId = hallId;
    }

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          hall: {
            select: {
              hallId: true,
              name: true,
              district: true,
              address: true,
              capacity: true,
              seatPrice: true,
            },
          },
          customer: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          services: {
            include: {
              booking: {
                select: { bookingId: true },
              },
            },
          },
        },
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
    console.error('Admin bookings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
