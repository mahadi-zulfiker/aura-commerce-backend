import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ShopStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { slugify } from '../utils/slugify';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

@Injectable()
export class ShopsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateShopDto) {
    const existing = await this.prisma.shop.findUnique({
      where: { vendorId: userId },
    });

    if (existing) {
      throw new BadRequestException('Shop already exists for this vendor');
    }

    const slug = dto.slug?.trim() || slugify(dto.name);

    return this.prisma.shop.create({
      data: {
        vendorId: userId,
        name: dto.name,
        slug,
        description: dto.description,
        logo: dto.logo,
        banner: dto.banner,
        email: dto.email,
        phone: dto.phone,
        website: dto.website,
        street: dto.street,
        city: dto.city,
        state: dto.state,
        zipCode: dto.zipCode,
        country: dto.country ?? 'Bangladesh',
        businessLicense: dto.businessLicense,
        taxId: dto.taxId,
        status: ShopStatus.PENDING,
      },
    });
  }

  async findAll(page = 1, limit = 12, search?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.ShopWhereInput = {
      status: ShopStatus.APPROVED,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [shops, total] = await Promise.all([
      this.prisma.shop.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              products: true,
              followers: true,
            },
          },
        },
      }),
      this.prisma.shop.count({ where }),
    ]);

    return {
      data: shops,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllAdmin(page = 1, limit = 12, status?: ShopStatus) {
    const skip = (page - 1) * limit;
    const where: Prisma.ShopWhereInput = {};
    if (status) {
      where.status = status;
    }

    const [shops, total] = await Promise.all([
      this.prisma.shop.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              products: true,
              followers: true,
            },
          },
        },
      }),
      this.prisma.shop.count({ where }),
    ]);

    return {
      data: shops,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            products: true,
            followers: true,
          },
        },
      },
    });

    if (!shop || shop.status !== ShopStatus.APPROVED) {
      throw new NotFoundException('Shop not found');
    }

    return shop;
  }

  async getMyShop(userId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { vendorId: userId },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    return shop;
  }

  async updateMyShop(userId: string, dto: UpdateShopDto) {
    const shop = await this.prisma.shop.findUnique({
      where: { vendorId: userId },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const slug = dto.slug?.trim() ?? (dto.name ? slugify(dto.name) : undefined);

    return this.prisma.shop.update({
      where: { id: shop.id },
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        logo: dto.logo,
        banner: dto.banner,
        email: dto.email,
        phone: dto.phone,
        website: dto.website,
        street: dto.street,
        city: dto.city,
        state: dto.state,
        zipCode: dto.zipCode,
        country: dto.country,
        businessLicense: dto.businessLicense,
        taxId: dto.taxId,
      },
    });
  }

  async updateStatus(shopId: string, status: ShopStatus) {
    return this.prisma.shop.update({
      where: { id: shopId },
      data: { status },
    });
  }

  async getShopProducts(slug: string, page = 1, limit = 12) {
    const shop = await this.prisma.shop.findUnique({
      where: { slug },
    });

    if (!shop || shop.status !== ShopStatus.APPROVED) {
      throw new NotFoundException('Shop not found');
    }

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          shopId: shop.id,
          status: 'PUBLISHED',
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { orderBy: { order: 'asc' } },
          category: true,
          brand: true,
        },
      }),
      this.prisma.product.count({
        where: {
          shopId: shop.id,
          status: 'PUBLISHED',
        },
      }),
    ]);

    return {
      data: products.map((product) => this.mapProduct(product)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async follow(shopId: string, userId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop || shop.status !== ShopStatus.APPROVED) {
      throw new NotFoundException('Shop not found');
    }

    return this.prisma.shopFollower.create({
      data: {
        shopId,
        userId,
      },
    });
  }

  async unfollow(shopId: string, userId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop || shop.status !== ShopStatus.APPROVED) {
      throw new NotFoundException('Shop not found');
    }

    return this.prisma.shopFollower.delete({
      where: {
        shopId_userId: {
          shopId,
          userId,
        },
      },
    });
  }

  private mapProduct(
    product: Prisma.ProductGetPayload<{
      include: { images: true; category: true; brand: true };
    }>,
  ) {
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
