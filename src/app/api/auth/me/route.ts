import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/middleware';
import type { TokenPayload } from '@/lib/middleware';

export async function GET(request: Request) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const decoded = authResult as TokenPayload;

    // Fetch current user data
    const user = await db.user.findUnique({
      where: { userId: decoded.userId },
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        username: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
