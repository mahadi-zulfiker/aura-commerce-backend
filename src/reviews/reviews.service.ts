import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new BadRequestException('Product not found');
    }

    const review = await this.prisma.review.create({
      data: {
        userId,
        productId: dto.productId,
        rating: dto.rating,
        title: dto.title,
        comment: dto.comment,
        images: dto.images ?? [],
      },
    });

    await this.prisma.product.update({
      where: { id: dto.productId },
      data: {
        reviewCount: { increment: 1 },
        rating: await this.calculateRating(dto.productId),
      },
    });

    return review;
  }

  async findByProduct(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews.map((review) => ({
      id: review.id,
      productId: review.productId,
      userId: review.userId,
      userName:
        `${review.user.firstName ?? ''} ${review.user.lastName ?? ''}`.trim(),
      userAvatar: review.user.avatar ?? '',
      rating: review.rating,
      title: review.title ?? '',
      content: review.comment,
      createdAt: review.createdAt,
      helpful: review.helpfulCount,
    }));
  }

  private async calculateRating(productId: string) {
    const stats = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
    });

    return stats._avg.rating ?? 0;
  }
}
