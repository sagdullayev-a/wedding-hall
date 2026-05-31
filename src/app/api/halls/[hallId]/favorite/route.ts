import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, requireRole } from '@/lib/middleware';

// GET /api/halls/[hallId]/favorite - Authenticated: Check if current user has favorited this hall
export async function GET(
  request: Request,
  { params }: { params: Promise<{ hallId: string }> }
) {
  try {
    const { hallId } = await params;

    // Authenticate
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

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

    const favorite = await db.favorite.findUnique({
      where: {
        hallId_userId: { hallId, userId },
      },
    });

    return NextResponse.json({ isFavorited: !!favorite });
  } catch (error) {
    console.error('Check favorite error:', error);
    return NextResponse.json(
      { error: 'Failed to check favorite status' },
      { status: 500 }
    );
  }
}

// POST /api/halls/[hallId]/favorite - Customer only: Add to favorites
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

    // Check if already favorited
    const existingFavorite = await db.favorite.findUnique({
      where: {
        hallId_userId: { hallId, userId },
      },
    });

    if (existingFavorite) {
      return NextResponse.json(
        { error: 'Hall is already in your favorites' },
        { status: 409 }
      );
    }

    // Create favorite
    await db.favorite.create({
      data: {
        hallId,
        userId,
      },
    });

    return NextResponse.json({ message: 'Added to favorites' }, { status: 201 });
  } catch (error) {
    console.error('Add favorite error:', error);
    return NextResponse.json(
      { error: 'Failed to add to favorites' },
      { status: 500 }
    );
  }
}

// DELETE /api/halls/[hallId]/favorite - Customer only: Remove from favorites
export async function DELETE(
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

    // Find the favorite
    const favorite = await db.favorite.findUnique({
      where: {
        hallId_userId: { hallId, userId },
      },
    });

    if (!favorite) {
      return NextResponse.json(
        { error: 'Hall is not in your favorites' },
        { status: 404 }
      );
    }

    // Delete favorite
    await db.favorite.delete({
      where: {
        hallId_userId: { hallId, userId },
      },
    });

    return NextResponse.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    return NextResponse.json(
      { error: 'Failed to remove from favorites' },
      { status: 500 }
    );
  }
}
