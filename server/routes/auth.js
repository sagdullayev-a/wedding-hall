const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const auth = require('../middleware/auth');
const otpService = require('../services/otpService');

const JWT_SECRET = process.env.JWT_SECRET;

// Helper: Validate string length
function validateLength(value, min, max, fieldName) {
  if (typeof value !== 'string') return `${fieldName} matn bo'lishi shart`;
  if (value.trim().length < min) return `${fieldName} kamida ${min} ta belgidan iborat bo'lishi kerak`;
  if (value.trim().length > max) return `${fieldName} ${max} ta belgidan oshmasligi kerak`;
  return null;
}

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, username, password, role } = req.body;

    if (!firstName || !lastName || !email || !phone || !username || !password) {
      return res.status(400).json({ error: 'Barcha maydonlar to\'ldirilishi shart' });
    }

    // Input length validation
    const lengthErrors = [
      validateLength(firstName, 1, 50, 'Ism'),
      validateLength(lastName, 1, 50, 'Familiya'),
      validateLength(email, 5, 100, 'Email'),
      validateLength(phone, 5, 20, 'Telefon'),
      validateLength(username, 3, 30, 'Username'),
      validateLength(password, 6, 128, 'Parol'),
    ].filter(Boolean);

    if (lengthErrors.length > 0) {
      return res.status(400).json({ error: lengthErrors[0] });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email manzili noto\'g\'ri formatda' });
    }

    // Username format validation (alphanumeric and underscores only)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ error: 'Username faqat harf, raqam va pastki chiziqdan iborat bo\'lishi kerak' });
    }

    // ─── SECURITY: Block admin role registration ────────────────────────
    // Only 'customer' and 'owner' roles can be self-registered.
    // Admin accounts can only be created by existing admins or via database seeding.
    const userRole = role || 'customer';
    if (!['owner', 'customer'].includes(userRole)) {
      return res.status(400).json({ error: 'Faqat mijoz yoki egasi sifatida ro\'yxatdan o\'tish mumkin' });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existingEmail) {
      return res.status(409).json({ error: 'Ushbu email allaqachon ro\'yxatdan o\'tgan' });
    }

    const existingUsername = await prisma.user.findUnique({ where: { username: username.trim() } });
    if (existingUsername) {
      return res.status(409).json({ error: 'Ushbu foydalanuvchi nomi band' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        username: username.trim(),
        passwordHash,
        role: userRole,
        isVerified: false,
      },
    });

    // Create and send verification OTP
    await otpService.createAndSendOTP(user);

    const { passwordHash: _, ...userData } = user;

    return res.status(201).json({
      success: true,
      user: userData,
      message: 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz. Emailingizni tasdiqlang.',
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    return res.status(500).json({ error: error.message || 'Tizim xatoligi yuz berdi' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Foydalanuvchi nomi va parol kiritilishi shart' });
    }

    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Yaroqsiz kiritish formati' });
    }

    if (username.length > 100 || password.length > 128) {
      return res.status(400).json({ error: 'Kiritish hajmi juda katta' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.trim() },
          { email: username.toLowerCase().trim() },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Foydalanuvchi nomi yoki parol noto\'g\'ri' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Foydalanuvchi nomi yoki parol noto\'g\'ri' });
    }

    // Generate and send OTP for verification code
    await otpService.createAndSendOTP(user);

    return res.json({
      success: true,
      otpRequired: true,
      userId: user.userId,
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ error: error.message || 'Tizim xatoligi' });
  }
});

// POST /auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otpCode } = req.body;

    if (!userId || !otpCode) {
      return res.status(400).json({ error: 'userId va otpCode talab qilinadi' });
    }

    if (typeof userId !== 'string' || typeof otpCode !== 'string') {
      return res.status(400).json({ error: 'Yaroqsiz kiritish formati' });
    }

    if (!/^\d{6}$/.test(otpCode)) {
      return res.status(400).json({ error: 'OTP kodi 6 ta raqamdan iborat bo\'lishi shart' });
    }

    // Verify OTP using service
    await otpService.verifyOTP({ userId, otpCode });

    // Mark user as verified
    const user = await prisma.user.update({
      where: { userId },
      data: { isVerified: true },
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.userId, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      token,
      user: {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        username: user.username,
        role: user.role,
        isVerified: user.isVerified,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error('OTP verification error:', error.message);
    return res.status(400).json({ error: error.message || 'Tizim xatoligi' });
  }
});

// POST /auth/resend-otp
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId talab qilinadi' });
    }

    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    // Generate and send OTP using service
    await otpService.createAndSendOTP(user);

    return res.json({ success: true, message: 'Yangi OTP kodi emailingizga yuborildi' });
  } catch (error) {
    console.error('Resend OTP error:', error.message);
    return res.status(400).json({ error: error.message || 'Tizim xatoligi' });
  }
});

// GET /auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { userId: req.user.userId },
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
        avatarUrl: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Get current user error:', error.message);
    return res.status(500).json({ error: 'Tizim xatoligi' });
  }
});

// PUT /auth/change-password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Joriy parol va yangi parol kiritilishi shart' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6 || newPassword.length > 128) {
      return res.status(400).json({ error: 'Yangi parol 6 dan 128 belgigacha bo\'lishi kerak' });
    }

    const user = await prisma.user.findUnique({
      where: { userId: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Joriy parol noto\'g\'ri' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { userId: req.user.userId },
      data: { passwordHash: hashedNewPassword },
    });

    return res.json({ success: true, message: 'Parol muvaffaqiyatli o\'zgartirildi' });
  } catch (error) {
    console.error('Change password error:', error.message);
    return res.status(500).json({ error: 'Tizim xatoligi' });
  }
});

// PUT /auth/update-profile
router.put('/update-profile', auth, async (req, res) => {
  try {
    const userRole = req.user.role;

    // ─── SECURITY: Nobody can change their own role ─────────────────────
    if (req.body.role !== undefined) {
      return res.status(400).json({ error: 'Rolni o\'zgartirish taqiqlanadi' });
    }

    // ─── SECURITY: Block password hash injection ────────────────────────
    if (req.body.passwordHash !== undefined || req.body.password_hash !== undefined || req.body.password !== undefined) {
      return res.status(400).json({ error: 'Parolni bu yo\'l bilan o\'zgartirish mumkin emas' });
    }

    // ─── SECURITY: Block isVerified manipulation ────────────────────────
    if (req.body.isVerified !== undefined || req.body.is_verified !== undefined) {
      return res.status(400).json({ error: 'Tasdiqlash holatini o\'zgartirish taqiqlanadi' });
    }

    if (userRole === 'customer') {
      // Customer is only allowed to update firstName, lastName, avatarUrl
      const allowedFields = ['firstName', 'lastName', 'avatarUrl', 'first_name', 'last_name', 'avatar', 'profile_image'];
      const sentFields = Object.keys(req.body);

      const hasDisallowed = sentFields.some(field => !allowedFields.includes(field));
      if (hasDisallowed) {
        return res.status(400).json({
          error: 'Mijoz profili uchun faqat ism, familiya va rasmni o\'zgartirish mumkin'
        });
      }
    }

    const { firstName, lastName, email, phone, username, avatarUrl, first_name, last_name, avatar, profile_image } = req.body;

    const finalFirstName = firstName !== undefined ? firstName : first_name;
    const finalLastName = lastName !== undefined ? lastName : last_name;
    const finalAvatarUrl = avatarUrl !== undefined ? avatarUrl : (avatar !== undefined ? avatar : (profile_image !== undefined ? profile_image : undefined));

    // Validate names length
    if (finalFirstName !== undefined && (typeof finalFirstName !== 'string' || finalFirstName.trim().length > 50)) {
      return res.status(400).json({ error: 'Ism 50 ta belgidan oshmasligi kerak' });
    }
    if (finalLastName !== undefined && (typeof finalLastName !== 'string' || finalLastName.trim().length > 50)) {
      return res.status(400).json({ error: 'Familiya 50 ta belgidan oshmasligi kerak' });
    }

    if (finalAvatarUrl) {
      const matches = finalAvatarUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9\-.+]+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ error: 'Rasm formati yaroqsiz' });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];

      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(mimeType)) {
        return res.status(400).json({ error: 'Faqat JPG, JPEG, PNG va WEBP formatidagi rasmlar qabul qilinadi' });
      }

      const sizeInBytes = (base64Data.length * 3) / 4;
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (sizeInBytes > maxSize) {
        return res.status(400).json({ error: 'Rasm hajmi 2MB dan oshmasligi kerak' });
      }
    }

    if (userRole !== 'customer') {
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: 'Email manzili noto\'g\'ri formatda' });
        }
        const existingEmail = await prisma.user.findFirst({
          where: { email: email.toLowerCase().trim(), NOT: { userId: req.user.userId } }
        });
        if (existingEmail) {
          return res.status(409).json({ error: 'Ushbu email allaqachon ro\'yxatdan o\'tgan' });
        }
      }

      if (username) {
        if (typeof username !== 'string' || username.length > 30 || !/^[a-zA-Z0-9_]+$/.test(username)) {
          return res.status(400).json({ error: 'Username yaroqsiz formatta' });
        }
        const existingUsername = await prisma.user.findFirst({
          where: { username: username.trim(), NOT: { userId: req.user.userId } }
        });
        if (existingUsername) {
          return res.status(409).json({ error: 'Ushbu foydalanuvchi nomi band' });
        }
      }
    }

    const updateData = {};
    if (finalFirstName !== undefined) updateData.firstName = finalFirstName.trim();
    if (finalLastName !== undefined) updateData.lastName = finalLastName.trim();
    if (finalAvatarUrl !== undefined) updateData.avatarUrl = finalAvatarUrl;

    if (userRole !== 'customer') {
      if (email) updateData.email = email.toLowerCase().trim();
      if (phone) updateData.phone = phone.trim();
      if (username) updateData.username = username.trim();
    }

    const updatedUser = await prisma.user.update({
      where: { userId: req.user.userId },
      data: updateData,
    });

    const { passwordHash: _, ...userData } = updatedUser;

    return res.json({
      message: 'Profil muvaffaqiyatli yangilandi',
      user: userData
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    return res.status(500).json({ error: 'Tizim xatoligi' });
  }
});

// POST /auth/create-owner (Admin only)
router.post('/create-owner', auth, async (req, res) => {
  try {
    // ─── SECURITY: Strict admin-only check ──────────────────────────────
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Ruxsat etilmagan amal (Faqat admin uchun)' });
    }

    const { firstName, lastName, email, phone, username, password } = req.body;

    if (!firstName || !lastName || !email || !phone || !username || !password) {
      return res.status(400).json({ error: 'Barcha maydonlar to\'ldirilishi shart' });
    }

    // Input length validation
    const lengthErrors = [
      validateLength(firstName, 1, 50, 'Ism'),
      validateLength(lastName, 1, 50, 'Familiya'),
      validateLength(email, 5, 100, 'Email'),
      validateLength(phone, 5, 20, 'Telefon'),
      validateLength(username, 3, 30, 'Username'),
      validateLength(password, 6, 128, 'Parol'),
    ].filter(Boolean);

    if (lengthErrors.length > 0) {
      return res.status(400).json({ error: lengthErrors[0] });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email formati yaroqsiz' });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existingEmail) {
      return res.status(409).json({ error: 'Ushbu email ro\'yxatdan o\'tgan' });
    }

    const existingUsername = await prisma.user.findUnique({ where: { username: username.trim() } });
    if (existingUsername) {
      return res.status(409).json({ error: 'Ushbu foydalanuvchi nomi band' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const owner = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        username: username.trim(),
        passwordHash,
        role: 'owner',
        isVerified: false,
      },
    });

    // Create and send verification OTP
    await otpService.createAndSendOTP(owner);

    const { passwordHash: _, ...ownerData } = owner;

    return res.status(201).json({
      owner: ownerData,
      message: 'To\'yxona egasi hisobi muvaffaqiyatli yaratildi',
    });
  } catch (error) {
    console.error('Create owner error:', error.message);
    return res.status(500).json({ error: 'Tizim xatoligi' });
  }
});

module.exports = router;
