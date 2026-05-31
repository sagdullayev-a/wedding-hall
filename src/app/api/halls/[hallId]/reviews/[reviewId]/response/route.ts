import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, requireRole } from '@/lib/middleware';
import type { TokenPayload } from '@/lib/middleware';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ hallId: string; reviewId: string }> }
) {
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

    const { hallId, reviewId } = await params;
    const body = await request.json();
    const { response } = body;

    if (!response || response.trim().length === 0) {
      return NextResponse.json(
        { error: 'Response text is required' },
        { status: 400 }
      );
    }

    // Verify the hall belongs to this owner
    const hall = await db.weddingHall.findUnique({
      where: { hallId },
      select: { ownerId: true },
    });

    if (!hall || hall.ownerId !== decoded.userId) {
      return NextResponse.json(
        { error: 'You do not own this hall' },
        { status: 403 }
      );
    }

    // Verify the review exists and belongs to this hall
    const review = await db.review.findUnique({
      where: { reviewId },
    });

    if (!review || review.hallId !== hallId) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Update the review with owner response
    const updatedReview = await db.review.update({
      where: { reviewId },
      data: {
        ownerResponse: response.trim(),
        respondedAt: new Date(),
      },
    });

    // Notify the reviewer
    await db.notification.create({
      data: {
        userId: review.userId,
        title: 'Owner Responded to Your Review',
        message: `The owner of the hall responded to your review`,
        type: 'info',
      },
    });

    return NextResponse.json({
      success: true,
      review: updatedReview,
    });
  } catch (error) {
    console.error('Review response error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
