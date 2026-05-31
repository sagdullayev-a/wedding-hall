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
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.UserWhereInput = {
      role: 'owner',
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { username: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [owners, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
          username: true,
          phone: true,
          isVerified: true,
          createdAt: true,
          _count: {
            select: { ownedHalls: true },
          },
        },
      }),
      db.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      owners,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error('Admin owners error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch owners' },
      { status: 500 }
    );
  }
}
