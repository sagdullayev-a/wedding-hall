import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, requireRole } from '@/lib/middleware';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    // Authenticate and require admin role
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const roleCheck = requireRole('admin')(auth);
    if (roleCheck instanceof NextResponse) return roleCheck;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const district = searchParams.get('district');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.WeddingHallWhereInput = {};

    if (status && (status === 'approved' || status === 'pending')) {
      where.status = status;
    }

    if (district) {
      where.district = district;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { address: { contains: search } },
        { district: { contains: search } },
      ];
    }

    const [halls, total] = await Promise.all([
      db.weddingHall.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          _count: {
            select: { images: true },
          },
        },
      }),
      db.weddingHall.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      halls,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error('Admin halls error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch halls' },
      { status: 500 }
    );
  }
}
