import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, generateOTP } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, username, password, role } = body;

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

    // Validate role
    const validRoles = ['admin', 'owner', 'customer'];
    const userRole = role || 'customer';
    if (!validRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin, owner, or customer' },
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

    // Create user
    const user = await db.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        username,
        passwordHash,
        role: userRole,
        isVerified: false,
      },
    });

    // Generate OTP
    const otpCode = generateOTP();
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    await db.otpVerification.create({
      data: {
        userId: user.userId,
        otpCode,
        expiryTime,
      },
    });

    // For demo: log OTP to console
    console.log(`[OTP] Verification code for ${email}: ${otpCode}`);

    // Return user data without password
    const { passwordHash: _, ...userData } = user;

    return NextResponse.json(
      {
        user: userData,
        message: 'Registration successful. Please verify your email.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
