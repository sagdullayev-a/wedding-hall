import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateOTP } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({ where: { userId } });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.isVerified) {
      return NextResponse.json(
        { error: 'User is already verified' },
        { status: 400 }
      );
    }

    // Generate new OTP
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
    console.log(`[OTP] Resent verification code for ${user.email}: ${otpCode}`);

    return NextResponse.json({
      message: 'New OTP has been sent to your email',
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
