import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, requireRole } from '@/lib/middleware';

// POST /api/halls/[hallId]/singers - Owner only: Add singer
export async function POST(
  request: Request,
  { params }: { params: Promise<{ hallId: string }> }
) {
  try {
    const { hallId } = await params;
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = requireRole('owner', 'admin')(authResult);
    if (roleCheck instanceof NextResponse) return roleCheck;

    // Verify hall exists and ownership
    const hall = await db.weddingHall.findUnique({
      where: { hallId },
      select: { hallId: true, ownerId: true },
    });

    if (!hall) {
      return NextResponse.json(
        { error: 'Hall not found' },
        { status: 404 }
      );
    }

    if (authResult.role !== 'admin' && hall.ownerId !== authResult.userId) {
      return NextResponse.json(
        { error: 'You can only add singers to your own halls' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { singerName, price, imageUrl } = body;

    if (!singerName || price === undefined) {
      return NextResponse.json(
        { error: 'singerName and price are required' },
        { status: 400 }
      );
    }

    const singer = await db.singer.create({
      data: {
        hallId,
        singerName,
        price: parseFloat(String(price)),
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json({ singer }, { status: 201 });
  } catch (error) {
    console.error('Error adding singer:', error);
    return NextResponse.json(
      { error: 'Failed to add singer' },
      { status: 500 }
    );
  }
}

// DELETE /api/halls/[hallId]/singers - Owner only: Remove singer
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ hallId: string }> }
) {
  try {
    const { hallId } = await params;
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = requireRole('owner', 'admin')(authResult);
    if (roleCheck instanceof NextResponse) return roleCheck;

    // Verify hall ownership
    const hall = await db.weddingHall.findUnique({
      where: { hallId },
      select: { hallId: true, ownerId: true },
    });

    if (!hall) {
      return NextResponse.json(
        { error: 'Hall not found' },
        { status: 404 }
      );
    }

    if (authResult.role !== 'admin' && hall.ownerId !== authResult.userId) {
      return NextResponse.json(
        { error: 'You can only remove singers from your own halls' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { singerId } = body;

    if (!singerId) {
      return NextResponse.json(
        { error: 'singerId is required' },
        { status: 400 }
      );
    }

    // Verify the singer belongs to this hall
    const singer = await db.singer.findUnique({
      where: { singerId },
    });

    if (!singer || singer.hallId !== hallId) {
      return NextResponse.json(
        { error: 'Singer not found' },
        { status: 404 }
      );
    }

    await db.singer.delete({
      where: { singerId },
    });

    return NextResponse.json({ message: 'Singer removed successfully' });
  } catch (error) {
    console.error('Error removing singer:', error);
    return NextResponse.json(
      { error: 'Failed to remove singer' },
      { status: 500 }
    );
  }
}
