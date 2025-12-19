import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    images: true;
    category: true;
    brand: true;
  };
}>;

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: string) {
    const cart = await this.ensureCart(userId);
    return this.getCartDetails(cart.id);
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const cart = await this.ensureCart(userId);
    const quantity = dto.quantity ?? 1;

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: {
        images: { orderBy: { order: 'asc' } },
        category: true,
        brand: true,
      },
    });

    if (!product || product.status !== ProductStatus.PUBLISHED) {
      throw new NotFoundException('Product not found');
    }

    let maxStock = product.stock;
    if (dto.variantId) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: dto.variantId },
      });
      if (!variant || variant.productId !== product.id) {
        throw new BadRequestException('Variant not found');
      }
      maxStock = variant.stock;
    }

    if (maxStock <= 0) {
      throw new BadRequestException('Product is out of stock');
    }

    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: product.id,
        variantId: dto.variantId ?? null,
      },
    });

    if (existingItem) {
      const newQuantity = Math.min(existingItem.quantity + quantity, maxStock);
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          variantId: dto.variantId ?? null,
          quantity: Math.min(quantity, maxStock),
        },
      });
    }

    return this.getCartDetails(cart.id);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await this.ensureCart(userId);
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: cartItem.productId },
    });

    if (!product || product.status !== ProductStatus.PUBLISHED) {
      throw new BadRequestException('Product not available');
    }

    let maxStock = product.stock;
    if (cartItem.variantId) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: cartItem.variantId },
      });
      if (!variant) {
        throw new BadRequestException('Variant not available');
      }
      maxStock = variant.stock;
    }

    const quantity = Math.min(dto.quantity, maxStock);
    await this.prisma.cartItem.update({
      where: { id: cartItem.id },
      data: { quantity },
    });

    return this.getCartDetails(cart.id);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.ensureCart(userId);
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { id: cartItem.id },
    });

    return this.getCartDetails(cart.id);
  }

  async clearCart(userId: string) {
    const cart = await this.ensureCart(userId);
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
    return this.getCartDetails(cart.id);
  }

  private async ensureCart(userId: string) {
    const existing = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.cart.create({
      data: { userId },
    });
  }

  private async getCartDetails(cartId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { orderBy: { order: 'asc' } },
                category: true,
                brand: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const items = cart.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      variantId: item.variantId,
      product: this.mapProduct(item.product),
    }));

    return {
      id: cart.id,
      items,
      totalItems: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0,
      ),
    };
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
