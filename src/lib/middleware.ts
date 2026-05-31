import { NextResponse } from 'next/server';
import { verifyToken } from './auth';
import { db } from './db';

interface TokenPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Extract and verify Bearer token from Authorization header.
 * Returns the decoded payload or a NextResponse error.
 */
export async function authenticateRequest(
  request: Request
): Promise<TokenPayload | NextResponse> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header missing or invalid' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as TokenPayload;

    // Verify user still exists in database
    const user = await db.user.findUnique({
      where: { userId: decoded.userId },
      select: { userId: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    return decoded;
  } catch {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}

/**
 * Returns a function that checks if the authenticated user has one of the required roles.
 * Usage: const roleCheck = requireRole('admin', 'owner');
 *        const result = roleCheck(decoded);
 *        if (result instanceof NextResponse) return result;
 */
export function requireRole(
  ...roles: string[]
): (
  decoded: TokenPayload
) => true | NextResponse {
  return (decoded: TokenPayload): true | NextResponse => {
    if (!roles.includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    return true;
  };
}

export type { TokenPayload };
