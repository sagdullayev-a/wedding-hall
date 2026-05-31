import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { authenticateRequest, requireRole } from '@/lib/middleware';
import type { TokenPayload } from '@/lib/middleware';

export async function POST(request: Request) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const decoded = authResult as TokenPayload;

    // Check admin role
    const roleCheck = requireRole('admin')(decoded);
    if (roleCheck instanceof NextResponse) {
      return roleCheck;
    }

    const body = await request.json();
    const { firstName, lastName, email, phone, username, password } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !username || !password) {
      return NextResponse.json(
        { error: 'All fields are required: firstName, lastName, email, phone, username, password' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await db.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Check if username already exists
    const existingUsername = await db.user.findUnique({ where: { username } });
    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create owner with isVerified = true
    const owner = await db.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        username,
        passwordHash,
        role: 'owner',
        isVerified: true,
      },
    });

    // Return owner data without password
    const { passwordHash: _, ...ownerData } = owner;

    return NextResponse.json(
      {
        owner: ownerData,
        message: 'Owner account created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create owner error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
