const crypto = require('crypto');
const prisma = require('../config/db');
const { sendOTPEmail } = require('./emailService');

// Generate 6-digit secure numeric OTP
function generateSecureOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}

async function createAndSendOTP(user) {
  // 1. Check resend cooldown (60 seconds)
  const lastOTP = await prisma.otpVerification.findFirst({
    where: { userId: user.userId },
    orderBy: { createdAt: 'desc' },
  });

  if (lastOTP) {
    const elapsedSeconds = Math.floor((Date.now() - new Date(lastOTP.createdAt).getTime()) / 1000);
    if (elapsedSeconds < 60) {
      const remaining = 60 - elapsedSeconds;
      throw new Error(`Iltimos, keyingi kodni so'rash uchun ${remaining} soniya kutib turing.`);
    }
  }

  // 2. Invalidate all existing unused OTPs for this user
  await prisma.otpVerification.updateMany({
    where: { userId: user.userId, isUsed: false },
    data: { isUsed: true },
  });

  // 3. Create new OTP
  const otpCode = generateSecureOTP();
  const expiryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

  await prisma.otpVerification.create({
    data: {
      userId: user.userId,
      otpCode,
      expiryTime,
      isUsed: false,
      attemptCount: 0,
    },
  });

  // 4. Send the OTP email
  const name = `${user.firstName} ${user.lastName}`;
  await sendOTPEmail({ email: user.email, name, otp: otpCode });
}

async function verifyOTP({ userId, otpCode }) {
  if (!userId || !otpCode) {
    throw new Error('userId va OTP kod talab qilinadi');
  }

  // Find the latest unused and unexpired OTP verification record for this user
  const record = await prisma.otpVerification.findFirst({
    where: {
      userId,
      isUsed: false,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    throw new Error('Tasdiqlash kodi topilmadi yoki allaqachon ishlatilgan');
  }

  // Check if already expired
  if (new Date() > new Date(record.expiryTime)) {
    // Invalidate it
    await prisma.otpVerification.update({
      where: { otpId: record.otpId },
      data: { isUsed: true },
    });
    throw new Error('Tasdiqlash kodining muddati tugagan. Yangi kod so\'rang.');
  }

  // Check if max attempts exceeded
  if (record.attemptCount >= 3) {
    // Invalidate
    await prisma.otpVerification.update({
      where: { otpId: record.otpId },
      data: { isUsed: true },
    });
    throw new Error('Urinishlar soni tugadi (maksimal 3 marta). Iltimos, yangi kod so\'rang.');
  }

  // Increment attempt count
  const updatedRecord = await prisma.otpVerification.update({
    where: { otpId: record.otpId },
    data: {
      attemptCount: {
        increment: 1,
      },
    },
  });

  // Compare the OTP code securely
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(record.otpCode),
    Buffer.from(otpCode)
  );

  if (!isMatch) {
    const remainingAttempts = 3 - updatedRecord.attemptCount;
    if (remainingAttempts <= 0) {
      await prisma.otpVerification.update({
        where: { otpId: record.otpId },
        data: { isUsed: true },
      });
      throw new Error('Urinishlar soni tugadi. Yangi kod so\'rang.');
    }
    throw new Error(`Noto'g'ri kod kiritildi. Qolgan urinishlar: ${remainingAttempts}`);
  }

  // OTP is correct! Mark it as used.
  await prisma.otpVerification.update({
    where: { otpId: record.otpId },
    data: { isUsed: true },
  });

  return true;
}

module.exports = {
  createAndSendOTP,
  verifyOTP,
};
