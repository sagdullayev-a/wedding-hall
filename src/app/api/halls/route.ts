import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, requireRole } from '@/lib/middleware';

// GET /api/halls - Public: List approved halls with filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const district = searchParams.get('district');
    const capacity = searchParams.get('capacity');
    const seatPrice = searchParams.get('seatPrice');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Build where conditions
    const conditions: Record<string, unknown>[] = [
      { status: 'approved' },
    ];

    if (district) {
      conditions.push({ district });
    }

    if (capacity) {
      conditions.push({ capacity: { gte: parseInt(capacity, 10) } });
    }

    if (seatPrice) {
      conditions.push({ seatPrice: { lte: parseFloat(seatPrice) } });
    }

    if (search) {
      conditions.push({
        name: { contains: search },
      });
    }

    const where = conditions.length > 0 ? { AND: conditions } : {};

    const total = await db.weddingHall.count({ where });

    const halls = await db.weddingHall.findMany({
      where,
      include: {
        images: true,
        singers: true,
        menus: true,
        cars: true,
      },
      orderBy: {
        [sort]: order === 'asc' ? 'asc' : 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      halls,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching halls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch halls' },
      { status: 500 }
    );
  }
}

// POST /api/halls - Owner only: Create a new hall
export async function POST(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = requireRole('owner', 'admin')(authResult);
    if (roleCheck instanceof NextResponse) return roleCheck;

    const body = await request.json();
    const {
      name,
      district,
      address,
      capacity,
      seatPrice,
      phone,
      hasKarnaySurnay,
      karnaySurnayPrice,
    } = body;

    // Validate required fields
    if (!name || !district || !address || !capacity || !seatPrice || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: name, district, address, capacity, seatPrice, phone' },
        { status: 400 }
      );
    }

    const hall = await db.weddingHall.create({
      data: {
        ownerId: authResult.userId,
        name,
        district,
        address,
        capacity: parseInt(String(capacity), 10),
        seatPrice: parseFloat(String(seatPrice)),
        phone,
        hasKarnaySurnay: hasKarnaySurnay ?? false,
        karnaySurnayPrice: karnaySurnayPrice ? parseFloat(String(karnaySurnayPrice)) : null,
        status: 'pending',
      },
      include: {
        images: true,
        singers: true,
        menus: true,
        cars: true,
      },
    });

    return NextResponse.json({ hall }, { status: 201 });
  } catch (error) {
    console.error('Error creating hall:', error);
    return NextResponse.json(
      { error: 'Failed to create hall' },
      { status: 500 }
    );
  }
}
