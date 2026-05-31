import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/middleware';

// GET /api/bookings/[bookingId] - Get booking details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const { userId, role } = authResult;
    const { bookingId } = await params;

    const booking = await db.booking.findUnique({
      where: { bookingId },
      include: {
        hall: {
          select: {
            hallId: true,
            name: true,
            district: true,
            address: true,
            seatPrice: true,
            capacity: true,
            phone: true,
            hasKarnaySurnay: true,
            karnaySurnayPrice: true,
            images: true,
          },
        },
        customer: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        services: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Access control
    if (role === 'customer' && booking.customerId !== userId) {
      return NextResponse.json(
        { error: 'You can only view your own bookings' },
        { status: 403 }
      );
    }

    if (role === 'owner') {
      const hall = await db.weddingHall.findUnique({
        where: { hallId: booking.hallId, ownerId: userId },
      });
      if (!hall) {
        return NextResponse.json(
          { error: 'You can only view bookings for your halls' },
          { status: 403 }
        );
      }
    }

    // Enrich services with details
    const enrichedServices = await Promise.all(
      booking.services.map(async (service) => {
        let details: Record<string, unknown> = {};

        switch (service.serviceType) {
          case 'singer': {
            const singer = await db.singer.findUnique({
              where: { singerId: service.serviceId },
              select: { singerId: true, singerName: true, price: true, imageUrl: true },
            });
            details = singer || {};
            break;
          }
          case 'menu': {
            const menu = await db.menu.findUnique({
              where: { menuId: service.serviceId },
              select: { menuId: true, menuName: true },
            });
            details = menu || {};
            break;
          }
          case 'car': {
            const car = await db.car.findUnique({
              where: { carId: service.serviceId },
              select: { carId: true, brand: true, price: true, imageUrl: true },
            });
            details = car || {};
            break;
          }
          case 'karnay_surnay': {
            details = {
              type: 'Karnay-Surnay',
              price: service.servicePrice,
            };
            break;
          }
        }

        return {
          ...service,
          details,
        };
      })
    );

    return NextResponse.json({
      booking: {
        ...booking,
        services: enrichedServices,
      },
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

// DELETE /api/bookings/[bookingId] - Cancel booking
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const { userId, role } = authResult;
    const { bookingId } = await params;

    const booking = await db.booking.findUnique({
      where: { bookingId },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Access control for cancellation
    if (role === 'customer' && booking.customerId !== userId) {
      return NextResponse.json(
        { error: 'You can only cancel your own bookings' },
        { status: 403 }
      );
    }

    if (role === 'owner') {
      const hall = await db.weddingHall.findUnique({
        where: { hallId: booking.hallId, ownerId: userId },
      });
      if (!hall) {
        return NextResponse.json(
          { error: 'You can only cancel bookings for your halls' },
          { status: 403 }
        );
      }
    }
    // Admin can cancel any booking

    if (booking.bookingStatus === 'cancelled') {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      );
    }

    const updatedBooking = await db.booking.update({
      where: { bookingId },
      data: { bookingStatus: 'cancelled' },
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
        services: true,
      },
    });

    return NextResponse.json({ booking: updatedBooking });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}
