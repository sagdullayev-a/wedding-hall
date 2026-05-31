import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, requireRole } from '@/lib/middleware';

// POST /api/halls/[hallId]/images - Owner only: Add image
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
        { error: 'You can only add images to your own halls' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl is required' },
        { status: 400 }
      );
    }

    const image = await db.hallImage.create({
      data: {
        hallId,
        imageUrl,
      },
    });

    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    console.error('Error adding image:', error);
    return NextResponse.json(
      { error: 'Failed to add image' },
      { status: 500 }
    );
  }
}

// DELETE /api/halls/[hallId]/images - Owner only: Remove image
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
        { error: 'You can only remove images from your own halls' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { imageId } = body;

    if (!imageId) {
      return NextResponse.json(
        { error: 'imageId is required' },
        { status: 400 }
      );
    }

    // Verify the image belongs to this hall
    const image = await db.hallImage.findUnique({
      where: { imageId },
    });

    if (!image || image.hallId !== hallId) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    await db.hallImage.delete({
      where: { imageId },
    });

    return NextResponse.json({ message: 'Image removed successfully' });
  } catch (error) {
    console.error('Error removing image:', error);
    return NextResponse.json(
      { error: 'Failed to remove image' },
      { status: 500 }
    );
  }
}
