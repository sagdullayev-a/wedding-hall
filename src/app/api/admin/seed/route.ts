import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, requireRole } from '@/lib/middleware';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // Check if admin already exists (seed guard)
    const existingAdmin = await db.user.findUnique({
      where: { username: 'admin' },
    });

    if (existingAdmin) {
      // If admin exists, require admin auth for re-seeding
      const auth = await authenticateRequest(request);
      if (auth instanceof NextResponse) return auth;
      const roleCheck = requireRole('admin')(auth);
      if (roleCheck instanceof NextResponse) return roleCheck;

      return NextResponse.json(
        { error: 'Seed data already exists. Admin user found.' },
        { status: 409 }
      );
    }

    // Hash passwords
    const [adminHash, owner1Hash, owner2Hash, cust1Hash] = await Promise.all([
      hashPassword('admin123'),
      hashPassword('owner123'),
      hashPassword('owner123'),
      hashPassword('cust123'),
    ]);

    // Create users
    const [admin, owner1, owner2, customer1] = await Promise.all([
      db.user.create({
        data: {
          username: 'admin',
          email: 'admin@wedding.uz',
          passwordHash: adminHash,
          firstName: 'Admin',
          lastName: 'User',
          phone: '+998901234567',
          role: 'admin',
          isVerified: true,
        },
      }),
      db.user.create({
        data: {
          username: 'owner1',
          email: 'owner1@wedding.uz',
          passwordHash: owner1Hash,
          firstName: 'Aziz',
          lastName: 'Karimov',
          phone: '+998901111111',
          role: 'owner',
          isVerified: true,
        },
      }),
      db.user.create({
        data: {
          username: 'owner2',
          email: 'owner2@wedding.uz',
          passwordHash: owner2Hash,
          firstName: 'Dilshod',
          lastName: 'Rahimov',
          phone: '+998902222222',
          role: 'owner',
          isVerified: true,
        },
      }),
      db.user.create({
        data: {
          username: 'customer1',
          email: 'customer1@wedding.uz',
          passwordHash: cust1Hash,
          firstName: 'Sardor',
          lastName: 'Toshmatov',
          phone: '+998903333333',
          role: 'customer',
          isVerified: true,
        },
      }),
    ]);

    // Create wedding halls
    const hall1 = await db.weddingHall.create({
      data: {
        ownerId: owner1.userId,
        name: "Saroy To'yi",
        district: 'Tashkent',
        address: 'Tashkent, Amir Temur Ave 15',
        capacity: 500,
        seatPrice: 150000,
        phone: '+998901111111',
        hasKarnaySurnay: true,
        karnaySurnayPrice: 5000000,
        status: 'approved',
        images: {
          create: [
            { imageUrl: '/halls/hall1-1.png' },
          ],
        },
        singers: {
          create: [
            { singerName: 'Yulduz Usmonova', price: 10000000, imageUrl: '/singers/singer1.png' },
            { singerName: 'Ozodbek Nazarbekov', price: 8000000, imageUrl: '/singers/singer1.png' },
            { singerName: 'Dildora Niyozova', price: 5000000, imageUrl: '/singers/singer1.png' },
          ],
        },
        menus: {
          create: [
            { menuName: 'O\'zbek To\'y Menyu' },
            { menuName: 'Yevropa Menyu' },
            { menuName: 'Aralash Menyu' },
          ],
        },
        cars: {
          create: [
            { brand: 'Mercedes S-Class', price: 3000000, imageUrl: '/cars/car1.png' },
            { brand: 'BMW 7 Series', price: 2500000, imageUrl: '/cars/car1.png' },
          ],
        },
      },
    });

    const hall2 = await db.weddingHall.create({
      data: {
        ownerId: owner1.userId,
        name: 'Gulnora Zali',
        district: 'Samarkand',
        address: 'Samarkand, Registon St 25',
        capacity: 300,
        seatPrice: 120000,
        phone: '+998901111112',
        hasKarnaySurnay: false,
        status: 'approved',
        images: {
          create: [
            { imageUrl: '/halls/hall2-1.png' },
          ],
        },
        singers: {
          create: [
            { singerName: 'Jasur Umarov', price: 4000000, imageUrl: '/singers/singer1.png' },
            { singerName: 'Mansur Tashmatov', price: 3500000, imageUrl: '/singers/singer1.png' },
          ],
        },
        menus: {
          create: [
            { menuName: 'Samarqand Palov Menyusi' },
            { menuName: 'Ziyofat Menyusi' },
          ],
        },
        cars: {
          create: [
            { brand: 'Toyota Camry', price: 1500000, imageUrl: '/cars/car1.png' },
            { brand: 'Chevrolet Malibu', price: 1200000, imageUrl: '/cars/car1.png' },
          ],
        },
      },
    });

    const hall3 = await db.weddingHall.create({
      data: {
        ownerId: owner2.userId,
        name: "Navro'z Saroyi",
        district: 'Bukhara',
        address: 'Bukhara, Lyabi Hovuz St 10',
        capacity: 400,
        seatPrice: 130000,
        phone: '+998902222221',
        hasKarnaySurnay: false,
        status: 'pending',
        images: {
          create: [
            { imageUrl: '/halls/hall3-1.png' },
          ],
        },
        singers: {
          create: [
            { singerName: 'Bukhara Ensemble', price: 3000000, imageUrl: '/singers/singer1.png' },
            { singerName: 'Shashmaqam Group', price: 4500000, imageUrl: '/singers/singer1.png' },
          ],
        },
        menus: {
          create: [
            { menuName: 'Buxoro To\'y Menyusi' },
            { menuName: 'Sharq Menyusi' },
          ],
        },
        cars: {
          create: [
            { brand: 'Audi A8', price: 2800000, imageUrl: '/cars/car1.png' },
            { brand: 'Lexus LS', price: 3200000, imageUrl: '/cars/car1.png' },
          ],
        },
      },
    });

    const hall4 = await db.weddingHall.create({
      data: {
        ownerId: owner2.userId,
        name: 'Oltin Toj',
        district: 'Tashkent',
        address: 'Tashkent, Bunyodkor Ave 45',
        capacity: 600,
        seatPrice: 200000,
        phone: '+998902222222',
        hasKarnaySurnay: true,
        karnaySurnayPrice: 7000000,
        status: 'approved',
        images: {
          create: [
            { imageUrl: '/halls/hall4-1.png' },
          ],
        },
        singers: {
          create: [
            { singerName: 'Sevinch Ismoilova', price: 6000000, imageUrl: '/singers/singer1.png' },
            { singerName: 'Ulug\'bek Rahmatullayev', price: 7000000, imageUrl: '/singers/singer1.png' },
            { singerName: 'Nilufar Usmonova', price: 5500000, imageUrl: '/singers/singer1.png' },
          ],
        },
        menus: {
          create: [
            { menuName: 'Oltin To\'y Menyusi' },
            { menuName: 'Platinum Menyu' },
            { menuName: 'VIP Ziyofat' },
          ],
        },
        cars: {
          create: [
            { brand: 'Rolls Royce Ghost', price: 8000000, imageUrl: '/cars/car1.png' },
            { brand: 'Bentley Continental', price: 7000000, imageUrl: '/cars/car1.png' },
          ],
        },
      },
    });

    // Create sample bookings
    const booking1 = await db.booking.create({
      data: {
        hallId: hall1.hallId,
        customerId: customer1.userId,
        bookingDate: '2025-08-15',
        guestCount: 400,
        totalPrice: 60000000,
        advancePayment: 15000000,
        bookingStatus: 'upcoming',
      },
    });

    await db.bookingService.createMany({
      data: [
        { bookingId: booking1.bookingId, serviceType: 'singer', serviceId: 'singer-1', servicePrice: 10000000 },
        { bookingId: booking1.bookingId, serviceType: 'menu', serviceId: 'menu-1', servicePrice: 0 },
        { bookingId: booking1.bookingId, serviceType: 'car', serviceId: 'car-1', servicePrice: 3000000 },
        { bookingId: booking1.bookingId, serviceType: 'karnay_surnay', serviceId: 'ks-1', servicePrice: 5000000 },
      ],
    });

    const booking2 = await db.booking.create({
      data: {
        hallId: hall2.hallId,
        customerId: customer1.userId,
        bookingDate: '2025-09-20',
        guestCount: 250,
        totalPrice: 30000000,
        advancePayment: 8000000,
        bookingStatus: 'upcoming',
      },
    });

    await db.bookingService.createMany({
      data: [
        { bookingId: booking2.bookingId, serviceType: 'singer', serviceId: 'singer-4', servicePrice: 4000000 },
        { bookingId: booking2.bookingId, serviceType: 'menu', serviceId: 'menu-4', servicePrice: 0 },
      ],
    });

    const booking3 = await db.booking.create({
      data: {
        hallId: hall4.hallId,
        customerId: customer1.userId,
        bookingDate: '2025-06-01',
        guestCount: 500,
        totalPrice: 100000000,
        advancePayment: 25000000,
        bookingStatus: 'completed',
      },
    });

    await db.bookingService.createMany({
      data: [
        { bookingId: booking3.bookingId, serviceType: 'singer', serviceId: 'singer-8', servicePrice: 6000000 },
        { bookingId: booking3.bookingId, serviceType: 'menu', serviceId: 'menu-7', servicePrice: 0 },
        { bookingId: booking3.bookingId, serviceType: 'car', serviceId: 'car-7', servicePrice: 8000000 },
        { bookingId: booking3.bookingId, serviceType: 'karnay_surnay', serviceId: 'ks-2', servicePrice: 7000000 },
      ],
    });

    const booking4 = await db.booking.create({
      data: {
        hallId: hall1.hallId,
        customerId: customer1.userId,
        bookingDate: '2025-05-10',
        guestCount: 350,
        totalPrice: 52500000,
        advancePayment: 13000000,
        bookingStatus: 'completed',
      },
    });

    await db.bookingService.createMany({
      data: [
        { bookingId: booking4.bookingId, serviceType: 'singer', serviceId: 'singer-2', servicePrice: 8000000 },
        { bookingId: booking4.bookingId, serviceType: 'menu', serviceId: 'menu-2', servicePrice: 0 },
      ],
    });

    const booking5 = await db.booking.create({
      data: {
        hallId: hall3.hallId,
        customerId: customer1.userId,
        bookingDate: '2025-07-05',
        guestCount: 300,
        totalPrice: 39000000,
        advancePayment: 10000000,
        bookingStatus: 'cancelled',
      },
    });

    await db.bookingService.createMany({
      data: [
        { bookingId: booking5.bookingId, serviceType: 'singer', serviceId: 'singer-6', servicePrice: 3000000 },
        { bookingId: booking5.bookingId, serviceType: 'menu', serviceId: 'menu-5', servicePrice: 0 },
        { bookingId: booking5.bookingId, serviceType: 'car', serviceId: 'car-5', servicePrice: 2800000 },
      ],
    });

    return NextResponse.json({
      message: 'Seed data created successfully',
      counts: {
        users: 4,
        halls: 4,
        bookings: 5,
        images: 4,
        singers: 10,
        menus: 10,
        cars: 8,
        bookingServices: 13,
      },
      credentials: {
        admin: { username: 'admin', password: 'admin123' },
        owner1: { username: 'owner1', password: 'owner123' },
        owner2: { username: 'owner2', password: 'owner123' },
        customer1: { username: 'customer1', password: 'cust123' },
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed data' },
      { status: 500 }
    );
  }
}
