import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/halls/[hallId]/calendar - Get calendar data for a hall
export async function GET(
  request: Request,
  { params }: { params: Promise<{ hallId: string }> }
) {
  try {
    const { hallId } = await params;
    const { searchParams } = new URL(request.url);

    const month = parseInt(searchParams.get('month') || '', 10);
    const year = parseInt(searchParams.get('year') || '', 10);

    // Validate month and year
    if (!month || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'month query parameter is required and must be 1-12' },
        { status: 400 }
      );
    }

    if (!year || year < 1900 || year > 2100) {
      return NextResponse.json(
        { error: 'year query parameter is required and must be a valid year' },
        { status: 400 }
      );
    }

    // Check hall exists
    const hall = await db.weddingHall.findUnique({
      where: { hallId },
    });

    if (!hall) {
      return NextResponse.json(
        { error: 'Hall not found' },
        { status: 404 }
      );
    }

    // Calculate date range for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // Get all bookings for this hall in the given month
    const bookings = await db.booking.findMany({
      where: {
        hallId,
        bookingDate: {
          gte: startDate,
          lte: endDate,
        },
        bookingStatus: { not: 'cancelled' },
      },
      select: {
        bookingDate: true,
        bookingStatus: true,
      },
    });

    // Build calendar data
    const calendarData: { date: string; status: string }[] = [];

    // Add booked dates
    for (const booking of bookings) {
      calendarData.push({
        date: booking.bookingDate,
        status: 'booked',
      });
    }

    // Add past dates (dates before today)
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let day = 1; day <= lastDay; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      // Only add as "past" if it's before today AND not already booked
      if (dateStr < todayStr) {
        const isBooked = calendarData.some((item) => item.date === dateStr);
        if (!isBooked) {
          calendarData.push({
            date: dateStr,
            status: 'past',
          });
        }
      }
    }

    // Sort by date
    calendarData.sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(calendarData);
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    );
  }
}
