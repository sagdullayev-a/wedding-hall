import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, requireRole } from '@/lib/middleware';

// GET /api/halls/my-halls - Owner only: Get all halls owned by current user
export async function GET(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = requireRole('owner', 'admin')(authResult);
    if (roleCheck instanceof NextResponse) return roleCheck;

    const halls = await db.weddingHall.findMany({
      where: { ownerId: authResult.userId },
      include: {
        images: true,
        singers: true,
        menus: true,
        cars: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ halls });
  } catch (error) {
    console.error('Error fetching my halls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch your halls' },
      { status: 500 }
    );
  }
}
