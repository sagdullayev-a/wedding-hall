import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, otpCode } = body;

    // Validate required fields
    if (!userId || !otpCode) {
      return NextResponse.json(
        { error: 'userId and otpCode are required' },
        { status: 400 }
      );
    }

    // Find valid OTP (not used, not expired)
    const otpRecord = await db.otpVerification.findFirst({
      where: {
        userId,
        otpCode,
        isUsed: false,
        expiryTime: {
          gt: new Date(),
        },
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP code' },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await db.otpVerification.update({
      where: { otpId: otpRecord.otpId },
      data: { isUsed: true },
    });

    // Set user as verified
    await db.user.update({
      where: { userId },
      data: { isVerified: true },
    });

    return NextResponse.json({
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
