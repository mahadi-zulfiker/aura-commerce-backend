"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../database/prisma.service");
const slugify_1 = require("../utils/slugify");
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 12, 48);
        const skip = (page - 1) * limit;
        const where = {
            status: client_1.ProductStatus.PUBLISHED,
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
                        { name: { equals: query.brand, mode: 'insensitive' } },
                    ],
                },
            };
        }
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
                { shortDescription: { contains: query.search, mode: 'insensitive' } },
                { sku: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        if (query.minRating !== undefined) {
            where.rating = { gte: query.minRating };
        }
        if (query.minPrice !== undefined || query.maxPrice !== undefined) {
            const min = query.minPrice ?? 0;
            const max = query.maxPrice ?? Number.MAX_SAFE_INTEGER;
            where.AND = [
                ...(where.AND
                    ? Array.isArray(where.AND)
                        ? where.AND
                        : [where.AND]
                    : []),
                {
                    OR: [
                        { salePrice: { gte: min, lte: max } },
                        { salePrice: null, basePrice: { gte: min, lte: max } },
                    ],
                },
            ];
        }
        const orderBy = [];
        switch (query.sort) {
            case 'newest':
                orderBy.push({ createdAt: 'desc' });
                break;
            case 'price-low':
                orderBy.push({ basePrice: 'asc' });
                break;
            case 'price-high':
                orderBy.push({ basePrice: 'desc' });
                break;
            case 'rating':
                orderBy.push({ rating: 'desc' });
                break;
            case 'popularity':
                orderBy.push({ soldCount: 'desc' }, { viewCount: 'desc' });
                break;
            default:
                orderBy.push({ isFeatured: 'desc' }, { createdAt: 'desc' });
                break;
        }
        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    images: { orderBy: { order: 'asc' } },
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
    async findBySlug(slug) {
        const product = await this.prisma.product.findUnique({
            where: { slug },
            include: {
                images: { orderBy: { order: 'asc' } },
                category: true,
                brand: true,
                variants: true,
                reviews: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        await this.prisma.product.update({
            where: { id: product.id },
            data: { viewCount: { increment: 1 } },
        });
        return {
            ...this.mapProduct(product),
            variants: product.variants.map((variant) => ({
                id: variant.id,
                name: variant.name,
                sku: variant.sku,
                price: variant.price,
                stock: variant.stock,
                attributes: variant.attributes,
            })),
            reviews: product.reviews.map((review) => ({
                id: review.id,
                productId: review.productId,
                userId: review.userId,
                userName: `${review.user.firstName ?? ''} ${review.user.lastName ?? ''}`.trim(),
                userAvatar: review.user.avatar ?? '',
                rating: review.rating,
                title: review.title ?? '',
                content: review.comment,
                createdAt: review.createdAt,
                helpful: review.helpfulCount,
            })),
        };
    }
    async findMine(userId, page = 1, limit = 12) {
        const shop = await this.prisma.shop.findUnique({
            where: { vendorId: userId },
        });
        if (!shop) {
            throw new common_1.BadRequestException('Vendor shop not found');
        }
        const skip = (page - 1) * limit;
        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
                where: { shopId: shop.id },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    images: { orderBy: { order: 'asc' } },
                    category: true,
                    brand: true,
                },
            }),
            this.prisma.product.count({ where: { shopId: shop.id } }),
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
    async create(userId, dto) {
        const shop = await this.prisma.shop.findUnique({
            where: { vendorId: userId },
        });
        if (!shop) {
            throw new common_1.BadRequestException('Vendor shop not found');
        }
        if (shop.status !== 'APPROVED') {
            throw new common_1.BadRequestException('Shop is not approved');
        }
        const slug = dto.slug?.trim() || (0, slugify_1.slugify)(dto.name);
        const product = await this.prisma.$transaction(async (tx) => {
            const created = await tx.product.create({
                data: {
                    name: dto.name,
                    slug,
                    description: dto.description,
                    shortDescription: dto.shortDescription,
                    basePrice: dto.basePrice,
                    salePrice: dto.salePrice,
                    discountPercent: dto.discountPercent,
                    sku: dto.sku,
                    stock: dto.stock,
                    status: dto.status ?? client_1.ProductStatus.DRAFT,
                    isFeatured: dto.isFeatured ?? false,
                    shopId: shop.id,
                    categoryId: dto.categoryId,
                    brandId: dto.brandId,
                },
            });
            await tx.productImage.createMany({
                data: dto.images.map((url, index) => ({
                    productId: created.id,
                    url,
                    altText: created.name,
                    order: index,
                    isPrimary: index === 0,
                })),
            });
            if (dto.variants?.length) {
                await tx.productVariant.createMany({
                    data: dto.variants.map((variant) => ({
                        productId: created.id,
                        name: variant.name,
                        sku: variant.sku,
                        price: variant.price,
                        stock: variant.stock,
                        attributes: variant.attributes ?? {},
                    })),
                });
            }
            return tx.product.findUnique({
                where: { id: created.id },
                include: {
                    images: { orderBy: { order: 'asc' } },
                    category: true,
                    brand: true,
                },
            });
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found after creation');
        }
        return this.mapProduct(product);
    }
    async update(productId, userId, dto, isAdmin = false) {
        const product = await this.ensureProductAccess(productId, userId, isAdmin);
        const slug = dto.slug?.trim() ?? (dto.name ? (0, slugify_1.slugify)(dto.name) : undefined);
        const updated = await this.prisma.$transaction(async (tx) => {
            const updatedProduct = await tx.product.update({
                where: { id: product.id },
                data: {
                    name: dto.name,
                    slug,
                    description: dto.description,
                    shortDescription: dto.shortDescription,
                    basePrice: dto.basePrice,
                    salePrice: dto.salePrice,
                    discountPercent: dto.discountPercent,
                    sku: dto.sku,
                    stock: dto.stock,
                    status: dto.status,
                    isFeatured: dto.isFeatured,
                    categoryId: dto.categoryId,
                    brandId: dto.brandId,
                },
            });
            if (dto.images) {
                await tx.productImage.deleteMany({ where: { productId: product.id } });
                await tx.productImage.createMany({
                    data: dto.images.map((url, index) => ({
                        productId: product.id,
                        url,
                        altText: updatedProduct.name,
                        order: index,
                        isPrimary: index === 0,
                    })),
                });
            }
            if (dto.variants) {
                await tx.productVariant.deleteMany({
                    where: { productId: product.id },
                });
                if (dto.variants.length) {
                    await tx.productVariant.createMany({
                        data: dto.variants.map((variant) => ({
                            productId: product.id,
                            name: variant.name,
                            sku: variant.sku,
                            price: variant.price,
                            stock: variant.stock,
                            attributes: variant.attributes ?? {},
                        })),
                    });
                }
            }
            return tx.product.findUnique({
                where: { id: product.id },
                include: {
                    images: { orderBy: { order: 'asc' } },
                    category: true,
                    brand: true,
                },
            });
        });
        if (!updated) {
            throw new common_1.NotFoundException('Product not found');
        }
        return this.mapProduct(updated);
    }
    async remove(productId, userId, isAdmin = false) {
        const product = await this.ensureProductAccess(productId, userId, isAdmin);
        await this.prisma.product.delete({
            where: { id: product.id },
        });
        return { deleted: true };
    }
    async ensureProductAccess(productId, userId, isAdmin) {
        if (isAdmin) {
            const product = await this.prisma.product.findUnique({
                where: { id: productId },
            });
            if (!product) {
                throw new common_1.NotFoundException('Product not found');
            }
            return product;
        }
        const shop = await this.prisma.shop.findUnique({
            where: { vendorId: userId },
        });
        if (!shop) {
            throw new common_1.BadRequestException('Vendor shop not found');
        }
        const product = await this.prisma.product.findFirst({
            where: { id: productId, shopId: shop.id },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        return product;
    }
    mapProduct(product) {
        const images = [...product.images]
            .sort((a, b) => a.order - b.order)
            .map((image) => image.url);
        const tags = product.metaKeywords
            ? product.metaKeywords
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
            : [];
        const specifications = {};
        if (product.sku) {
            specifications.SKU = product.sku;
        }
        if (product.weight !== null && product.weight !== undefined) {
            specifications.Weight = `${product.weight} kg`;
        }
        if (product.dimensions) {
            specifications.Dimensions = product.dimensions;
        }
        const isNew = Date.now() - product.createdAt.getTime() < 1000 * 60 * 60 * 24 * 30;
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
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map