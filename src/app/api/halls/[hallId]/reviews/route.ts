import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, requireRole } from '@/lib/middleware';

// GET /api/halls/[hallId]/reviews - Public: Get reviews for a hall
export async function GET(
  request: Request,
  { params }: { params: Promise<{ hallId: string }> }
) {
  try {
    const { hallId } = await params;

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

    const reviews = await db.review.findMany({
      where: { hallId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    return NextResponse.json({
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/halls/[hallId]/reviews - Customer only: Create a review
export async function POST(
  request: Request,
  { params }: { params: Promise<{ hallId: string }> }
) {
  try {
    const { hallId } = await params;

    // Authenticate
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    // Require customer role
    const roleCheck = requireRole('customer')(auth);
    if (roleCheck instanceof NextResponse) return roleCheck;

    const userId = auth.userId;

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

    // Parse body
    const body = await request.json();
    const { rating, comment } = body;

    // Validate rating
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if user already reviewed this hall
    const existingReview = await db.review.findUnique({
      where: {
        hallId_userId: { hallId, userId },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this hall' },
        { status: 409 }
      );
    }

    // Create review
    const review = await db.review.create({
      data: {
        hallId,
        userId,
        rating,
        comment: comment || null,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
