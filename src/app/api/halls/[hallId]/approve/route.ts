import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, requireRole } from '@/lib/middleware';

// PUT /api/halls/[hallId]/approve - Admin only: Approve a hall
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ hallId: string }> }
) {
  try {
    const { hallId } = await params;
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = requireRole('admin')(authResult);
    if (roleCheck instanceof NextResponse) return roleCheck;

    // Verify hall exists
    const hall = await db.weddingHall.findUnique({
      where: { hallId },
    });

    if (!hall) {
      return NextResponse.json(
        { error: 'Hall not found' },
        { status: 404 }
      );
    }

    if (hall.status === 'approved') {
      return NextResponse.json(
        { error: 'Hall is already approved' },
        { status: 400 }
      );
    }

    const updatedHall = await db.weddingHall.update({
      where: { hallId },
      data: { status: 'approved' },
      include: {
        images: true,
        singers: true,
        menus: true,
        cars: true,
      },
    });

    return NextResponse.json({ hall: updatedHall });
  } catch (error) {
    console.error('Error approving hall:', error);
    return NextResponse.json(
      { error: 'Failed to approve hall' },
      { status: 500 }
    );
  }
}
