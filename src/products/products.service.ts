import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, ProductStatus } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { GetProductsQueryDto } from "./dto/get-products-query.dto";

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    images: true;
    category: true;
    brand: true;
  };
}>;

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: GetProductsQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 12, 48);
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.PUBLISHED,
    };

    if (query.category) {
      where.category = {
        is: {
          slug: query.category,
        },
      };
    }

    if (query.brand) {
      where.brand = {
        is: {
          OR: [
            { slug: query.brand },
            { name: { equals: query.brand, mode: "insensitive" } },
          ],
        },
      };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { shortDescription: { contains: query.search, mode: "insensitive" } },
        { sku: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput[] = [];
    switch (query.sort) {
      case "newest":
        orderBy.push({ createdAt: "desc" });
        break;
      case "price-low":
        orderBy.push({ basePrice: "asc" });
        break;
      case "price-high":
        orderBy.push({ basePrice: "desc" });
        break;
      case "rating":
        orderBy.push({ rating: "desc" });
        break;
      default:
        orderBy.push({ isFeatured: "desc" }, { createdAt: "desc" });
        break;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          images: { orderBy: { order: "asc" } },
          category: true,
          brand: true,
        },
      }),
      this.prisma.product.count({ where }),
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

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { order: "asc" } },
        category: true,
        brand: true,
      },
    });

    if (!product) {
      throw new NotFoundException("Product not found");
    }

    await this.prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    });

    return this.mapProduct(product);
  }

  private mapProduct(product: ProductWithRelations) {
    const images = [...product.images]
      .sort((a, b) => a.order - b.order)
      .map((image) => image.url);

    const tags = product.metaKeywords
      ? product.metaKeywords
          .split(",")
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
      category: product.category?.name ?? "",
      categorySlug: product.category?.slug ?? "",
      brand: product.brand?.name ?? "",
      brandSlug: product.brand?.slug ?? "",
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
