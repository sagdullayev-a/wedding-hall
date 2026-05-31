import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, requireRole } from '@/lib/middleware';

// POST /api/halls/[hallId]/menus - Owner only: Add menu
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
        { error: 'You can only add menus to your own halls' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { menuName } = body;

    if (!menuName) {
      return NextResponse.json(
        { error: 'menuName is required' },
        { status: 400 }
      );
    }

    const menu = await db.menu.create({
      data: {
        hallId,
        menuName,
      },
    });

    return NextResponse.json({ menu }, { status: 201 });
  } catch (error) {
    console.error('Error adding menu:', error);
    return NextResponse.json(
      { error: 'Failed to add menu' },
      { status: 500 }
    );
  }
}

// DELETE /api/halls/[hallId]/menus - Owner only: Remove menu
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
        { error: 'You can only remove menus from your own halls' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { menuId } = body;

    if (!menuId) {
      return NextResponse.json(
        { error: 'menuId is required' },
        { status: 400 }
      );
    }

    // Verify the menu belongs to this hall
    const menu = await db.menu.findUnique({
      where: { menuId },
    });

    if (!menu || menu.hallId !== hallId) {
      return NextResponse.json(
        { error: 'Menu not found' },
        { status: 404 }
      );
    }

    await db.menu.delete({
      where: { menuId },
    });

    return NextResponse.json({ message: 'Menu removed successfully' });
  } catch (error) {
    console.error('Error removing menu:', error);
    return NextResponse.json(
      { error: 'Failed to remove menu' },
      { status: 500 }
    );
  }
}
