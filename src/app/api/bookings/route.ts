import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, requireRole } from '@/lib/middleware';

// GET /api/bookings - Get bookings based on role
export async function GET(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const { userId, role } = authResult;
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const hallId = searchParams.get('hallId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    // Build where clause based on role
    const where: Record<string, unknown> = {};

    if (role === 'customer') {
      where.customerId = userId;
    } else if (role === 'owner') {
      // Get halls owned by this owner
      const ownedHalls = await db.weddingHall.findMany({
        where: { ownerId: userId },
        select: { hallId: true },
      });
      const hallIds = ownedHalls.map((h) => h.hallId);
      where.hallId = { in: hallIds };
    }
    // Admin sees all - no additional filter

    // Apply optional filters
    if (status) {
      where.bookingStatus = status;
    }
    if (hallId) {
      if (role === 'owner') {
        // Owner can only filter by their own halls
        const ownedHalls = await db.weddingHall.findMany({
          where: { ownerId: userId },
          select: { hallId: true },
        });
        const hallIds = ownedHalls.map((h) => h.hallId);
        if (hallIds.includes(hallId)) {
          where.hallId = hallId;
        }
      } else {
        where.hallId = hallId;
      }
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
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create a booking (Customer only)
export async function POST(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = requireRole('customer')(authResult);
    if (roleCheck instanceof NextResponse) return roleCheck;

    const { userId } = authResult;

    const body = await request.json();
    const {
      hallId,
      bookingDate,
      guestCount,
      services = [],
      firstName,
      lastName,
      phone,
    } = body;

    // Validate required fields
    if (!hallId || !bookingDate || !guestCount) {
      return NextResponse.json(
        { error: 'hallId, bookingDate, and guestCount are required' },
        { status: 400 }
      );
    }

    // Validate bookingDate format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(bookingDate)) {
      return NextResponse.json(
        { error: 'bookingDate must be in YYYY-MM-DD format' },
        { status: 400 }
      );
    }

    // Validate guestCount is a positive integer
    if (!Number.isInteger(guestCount) || guestCount <= 0) {
      return NextResponse.json(
        { error: 'guestCount must be a positive integer' },
        { status: 400 }
      );
    }

    // Validate the hall exists and is approved
    const hall = await db.weddingHall.findUnique({
      where: { hallId },
    });

    if (!hall) {
      return NextResponse.json(
        { error: 'Hall not found' },
        { status: 404 }
      );
    }

    if (hall.status !== 'approved') {
      return NextResponse.json(
        { error: 'Hall is not available for booking' },
        { status: 400 }
      );
    }

    // Validate guest count doesn't exceed capacity
    if (guestCount > hall.capacity) {
      return NextResponse.json(
        { error: `Guest count exceeds hall capacity of ${hall.capacity}` },
        { status: 400 }
      );
    }

    // Check if the date is already booked
    const existingBooking = await db.booking.findFirst({
      where: {
        hallId,
        bookingDate,
        bookingStatus: { not: 'cancelled' },
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: 'This date is already booked for this hall' },
        { status: 409 }
      );
    }

    // Calculate pricing
    const basePrice = hall.seatPrice * guestCount;
    let servicesTotal = 0;
    const bookingServiceData: {
      serviceType: string;
      serviceId: string;
      servicePrice: number;
    }[] = [];

    for (const service of services) {
      const { serviceType, serviceId } = service;

      if (!serviceType || !serviceId) {
        return NextResponse.json(
          { error: 'Each service must have serviceType and serviceId' },
          { status: 400 }
        );
      }

      let servicePrice = 0;

      switch (serviceType) {
        case 'singer': {
          const singer = await db.singer.findUnique({
            where: { singerId: serviceId },
          });
          if (!singer) {
            return NextResponse.json(
              { error: `Singer with id ${serviceId} not found` },
              { status: 404 }
            );
          }
          // Verify singer belongs to this hall
          if (singer.hallId !== hallId) {
            return NextResponse.json(
              { error: `Singer ${serviceId} does not belong to this hall` },
              { status: 400 }
            );
          }
          servicePrice = singer.price;
          break;
        }
        case 'menu': {
          const menu = await db.menu.findUnique({
            where: { menuId: serviceId },
          });
          if (!menu) {
            return NextResponse.json(
              { error: `Menu with id ${serviceId} not found` },
              { status: 404 }
            );
          }
          if (menu.hallId !== hallId) {
            return NextResponse.json(
              { error: `Menu ${serviceId} does not belong to this hall` },
              { status: 400 }
            );
          }
          // Menu doesn't have a price field in the schema; use 0
          servicePrice = 0;
          break;
        }
        case 'car': {
          const car = await db.car.findUnique({
            where: { carId: serviceId },
          });
          if (!car) {
            return NextResponse.json(
              { error: `Car with id ${serviceId} not found` },
              { status: 404 }
            );
          }
          if (car.hallId !== hallId) {
            return NextResponse.json(
              { error: `Car ${serviceId} does not belong to this hall` },
              { status: 400 }
            );
          }
          servicePrice = car.price;
          break;
        }
        case 'karnay_surnay': {
          if (!hall.hasKarnaySurnay) {
            return NextResponse.json(
              { error: 'This hall does not offer Karnay-Surnay service' },
              { status: 400 }
            );
          }
          servicePrice = hall.karnaySurnayPrice || 0;
          break;
        }
        default:
          return NextResponse.json(
            { error: `Unknown service type: ${serviceType}` },
            { status: 400 }
          );
      }

      servicesTotal += servicePrice;
      bookingServiceData.push({
        serviceType,
        serviceId,
        servicePrice,
      });
    }

    const totalPrice = basePrice + servicesTotal;
    const advancePayment = totalPrice * 0.2;

    // Update customer info if provided
    if (firstName || lastName || phone) {
      await db.user.update({
        where: { userId },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(phone && { phone }),
        },
      });
    }

    // Create booking with services in a transaction
    const booking = await db.booking.create({
      data: {
        hallId,
        customerId: userId,
        bookingDate,
        guestCount,
        totalPrice,
        advancePayment,
        bookingStatus: 'upcoming',
        services: {
          create: bookingServiceData.map((s) => ({
            serviceType: s.serviceType,
            serviceId: s.serviceId,
            servicePrice: s.servicePrice,
          })),
        },
      },
      include: {
        hall: {
          select: {
            hallId: true,
            name: true,
            district: true,
            address: true,
            seatPrice: true,
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

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
