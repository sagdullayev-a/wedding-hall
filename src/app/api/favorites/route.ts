import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, requireRole } from '@/lib/middleware';

// GET /api/favorites - Customer only: Get all favorited halls for current user
export async function GET(request: Request) {
  try {
    // Authenticate
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    // Require customer role
    const roleCheck = requireRole('customer')(auth);
    if (roleCheck instanceof NextResponse) return roleCheck;

    const userId = auth.userId;

    const favorites = await db.favorite.findMany({
      where: { userId },
      include: {
        hall: {
          include: {
            images: true,
            reviews: {
              select: { rating: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate average rating for each hall
    const formattedFavorites = favorites.map((fav) => {
      const totalReviews = fav.hall.reviews.length;
      const averageRating =
        totalReviews > 0
          ? fav.hall.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
          : 0;

      return {
        favoriteId: fav.favoriteId,
        createdAt: fav.createdAt,
        hall: {
          hallId: fav.hall.hallId,
          name: fav.hall.name,
          district: fav.hall.district,
          address: fav.hall.address,
          capacity: fav.hall.capacity,
          seatPrice: fav.hall.seatPrice,
          phone: fav.hall.phone,
          hasKarnaySurnay: fav.hall.hasKarnaySurnay,
          karnaySurnayPrice: fav.hall.karnaySurnayPrice,
          status: fav.hall.status,
          images: fav.hall.images,
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews,
        },
      };
    });

    return NextResponse.json({ favorites: formattedFavorites });
  } catch (error) {
    console.error('Get favorites error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}
