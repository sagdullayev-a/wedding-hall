import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, requireRole } from '@/lib/middleware';

// POST /api/halls/[hallId]/cars - Owner only: Add car
export async function POST(
  request: Request,
  { params }: { params: Promise<{ hallId: string }> }
) {
  try {
    const { hallId } = await params;
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = requireRole('owner', 'admin')(authResult);
    if (roleCheck instanceof NextResponse) return roleCheck;

    // Verify hall exists and ownership
    const hall = await db.weddingHall.findUnique({
      where: { hallId },
      select: { hallId: true, ownerId: true },
    });

    if (!hall) {
      return NextResponse.json(
        { error: 'Hall not found' },
        { status: 404 }
      );
    }

    if (authResult.role !== 'admin' && hall.ownerId !== authResult.userId) {
      return NextResponse.json(
        { error: 'You can only add cars to your own halls' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { brand, price, imageUrl } = body;

    if (!brand || price === undefined) {
      return NextResponse.json(
        { error: 'brand and price are required' },
        { status: 400 }
      );
    }

    const car = await db.car.create({
      data: {
        hallId,
        brand,
        price: parseFloat(String(price)),
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json({ car }, { status: 201 });
  } catch (error) {
    console.error('Error adding car:', error);
    return NextResponse.json(
      { error: 'Failed to add car' },
      { status: 500 }
    );
  }
}

// DELETE /api/halls/[hallId]/cars - Owner only: Remove car
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ hallId: string }> }
) {
  try {
    const { hallId } = await params;
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = requireRole('owner', 'admin')(authResult);
    if (roleCheck instanceof NextResponse) return roleCheck;

    // Verify hall ownership
    const hall = await db.weddingHall.findUnique({
      where: { hallId },
      select: { hallId: true, ownerId: true },
    });

    if (!hall) {
      return NextResponse.json(
        { error: 'Hall not found' },
        { status: 404 }
      );
    }

    if (authResult.role !== 'admin' && hall.ownerId !== authResult.userId) {
      return NextResponse.json(
        { error: 'You can only remove cars from your own halls' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { carId } = body;

    if (!carId) {
      return NextResponse.json(
        { error: 'carId is required' },
        { status: 400 }
      );
    }

    // Verify the car belongs to this hall
    const car = await db.car.findUnique({
      where: { carId },
    });

    if (!car || car.hallId !== hallId) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      );
    }

    await db.car.delete({
      where: { carId },
    });

    return NextResponse.json({ message: 'Car removed successfully' });
  } catch (error) {
    console.error('Error removing car:', error);
    return NextResponse.json(
      { error: 'Failed to remove car' },
      { status: 500 }
    );
  }
}
