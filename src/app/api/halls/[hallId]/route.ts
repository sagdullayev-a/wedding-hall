import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, requireRole } from '@/lib/middleware';

// GET /api/halls/[hallId] - Public: Get hall details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ hallId: string }> }
) {
  try {
    const { hallId } = await params;

    const hall = await db.weddingHall.findUnique({
      where: { hallId },
      include: {
        images: true,
        singers: true,
        menus: true,
        cars: true,
        owner: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    if (!hall) {
      return NextResponse.json(
        { error: 'Hall not found' },
        { status: 404 }
      );
    }

    // Check if user is owner or admin for non-approved halls
    if (hall.status !== 'approved') {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const authResult = await authenticateRequest(request);
          if (!(authResult instanceof NextResponse)) {
            const isOwner = authResult.userId === hall.ownerId;
            const isAdmin = authResult.role === 'admin';
            if (isOwner || isAdmin) {
              return NextResponse.json({ hall });
            }
          }
        } catch {
          // Not authenticated, fall through to 404
        }
      }
      return NextResponse.json(
        { error: 'Hall not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ hall });
  } catch (error) {
    console.error('Error fetching hall:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hall' },
      { status: 500 }
    );
  }
}

// PUT /api/halls/[hallId] - Owner/Admin: Update hall
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ hallId: string }> }
) {
  try {
    const { hallId } = await params;
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    // Find the hall
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

    // Check ownership or admin
    const isOwner = authResult.userId === hall.ownerId;
    const isAdmin = authResult.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'You can only update your own halls' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      district,
      address,
      capacity,
      seatPrice,
      phone,
      hasKarnaySurnay,
      karnaySurnayPrice,
      status,
    } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (district !== undefined) updateData.district = district;
    if (address !== undefined) updateData.address = address;
    if (capacity !== undefined) updateData.capacity = parseInt(String(capacity), 10);
    if (seatPrice !== undefined) updateData.seatPrice = parseFloat(String(seatPrice));
    if (phone !== undefined) updateData.phone = phone;
    if (hasKarnaySurnay !== undefined) updateData.hasKarnaySurnay = hasKarnaySurnay;
    if (karnaySurnayPrice !== undefined) updateData.karnaySurnayPrice = karnaySurnayPrice ? parseFloat(String(karnaySurnayPrice)) : null;
    // Only admin can change status
    if (status !== undefined && isAdmin) updateData.status = status;

    const updatedHall = await db.weddingHall.update({
      where: { hallId },
      data: updateData,
      include: {
        images: true,
        singers: true,
        menus: true,
        cars: true,
      },
    });

    return NextResponse.json({ hall: updatedHall });
  } catch (error) {
    console.error('Error updating hall:', error);
    return NextResponse.json(
      { error: 'Failed to update hall' },
      { status: 500 }
    );
  }
}

// DELETE /api/halls/[hallId] - Owner/Admin: Delete hall
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ hallId: string }> }
) {
  try {
    const { hallId } = await params;
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    // Find the hall
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

    // Check ownership or admin
    const isOwner = authResult.userId === hall.ownerId;
    const isAdmin = authResult.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'You can only delete your own halls' },
        { status: 403 }
      );
    }

    await db.weddingHall.delete({
      where: { hallId },
    });

    return NextResponse.json({ message: 'Hall deleted successfully' });
  } catch (error) {
    console.error('Error deleting hall:', error);
    return NextResponse.json(
      { error: 'Failed to delete hall' },
      { status: 500 }
    );
  }
}
