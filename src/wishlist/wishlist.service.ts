import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CartService } from '../cart/cart.service';
import { PrismaService } from '../database/prisma.service';

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    images: true;
    category: true;
    brand: true;
  };
}>;

@Injectable()
export class WishlistService {
  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
  ) {}

  async getWishlist(userId: string) {
    const wishlist = await this.prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: { orderBy: { order: 'asc' } },
            category: true,
            brand: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return wishlist.map((item) => ({
      id: item.id,
      product: this.mapProduct(item.product),
    }));
  }

  async addItem(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existing = await this.prisma.wishlist.findFirst({
      where: { userId, productId },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.wishlist.create({
      data: {
        userId,
        productId,
      },
    });
  }

  async removeItem(userId: string, productId: string) {
    const wishlist = await this.prisma.wishlist.findFirst({
      where: { userId, productId },
    });

    if (!wishlist) {
      throw new NotFoundException('Wishlist item not found');
    }

    return this.prisma.wishlist.delete({
      where: { id: wishlist.id },
    });
  }

  async moveToCart(userId: string, productId: string) {
    await this.cartService.addItem(userId, { productId, quantity: 1 });
    await this.removeItem(userId, productId);
    return { moved: true };
  }

  private mapProduct(product: ProductWithRelations) {
    const images = [...product.images]
      .sort((a, b) => a.order - b.order)
      .map((image) => image.url);

    const tags = product.metaKeywords
      ? product.metaKeywords
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

    const specifications: Record<string, string> = {};
    if (product.sku) {
      specifications.SKU = product.sku;
    }
    if (product.weight !== null && product.weight !== undefined) {
      specifications.Weight = `${product.weight} kg`;
    }
    if (product.dimensions) {
      specifications.Dimensions = product.dimensions;
    }

    const isNew =
      Date.now() - product.createdAt.getTime() < 1000 * 60 * 60 * 24 * 30;

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.salePrice ?? product.basePrice,
      originalPrice: product.salePrice ? product.basePrice : null,
      category: product.category?.name ?? '',
      categorySlug: product.category?.slug ?? '',
      brand: product.brand?.name ?? '',
      brandSlug: product.brand?.slug ?? '',
      images,
      rating: product.rating,
      reviewCount: product.reviewCount,
      inStock: product.stock > 0,
      stockCount: product.stock,
      features: product.shortDescription ? [product.shortDescription] : [],
      specifications,
      tags,
      isNew,
      isFeatured: product.isFeatured,
    };
  }
}
