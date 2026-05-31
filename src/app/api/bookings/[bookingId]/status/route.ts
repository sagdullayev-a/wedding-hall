import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, requireRole } from '@/lib/middleware';
import type { TokenPayload } from '@/lib/middleware';

const VALID_TRANSITIONS: Record<string, string[]> = {
  upcoming: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const decoded = authResult as TokenPayload;
    const roleCheck = requireRole('admin')(decoded);
    if (roleCheck instanceof NextResponse) {
      return roleCheck;
    }

    const { bookingId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['upcoming', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: upcoming, completed, or cancelled' },
        { status: 400 }
      );
    }

    const booking = await db.booking.findUnique({
      where: { bookingId },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Validate status transition
    const allowedTransitions = VALID_TRANSITIONS[booking.bookingStatus] || [];
    if (!allowedTransitions.includes(status)) {
      return NextResponse.json(
        { error: `Cannot change status from "${booking.bookingStatus}" to "${status}". Allowed transitions: ${allowedTransitions.length > 0 ? allowedTransitions.join(', ') : 'none'}` },
        { status: 400 }
      );
    }

    const updatedBooking = await db.booking.update({
      where: { bookingId },
      data: {
        bookingStatus: status,
      },
    });

    // Create notification for the customer
    await db.notification.create({
      data: {
        userId: booking.customerId,
        title: 'Booking Status Updated',
        message: `Your booking has been changed to "${status}"`,
        type: 'booking',
      },
    });

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
