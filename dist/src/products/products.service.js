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
        const orderBy = [];
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
    async findBySlug(slug) {
        const product = await this.prisma.product.findUnique({
            where: { slug },
            include: {
                images: { orderBy: { order: "asc" } },
                category: true,
                brand: true,
            },
        });
        if (!product) {
            throw new common_1.NotFoundException("Product not found");
        }
        await this.prisma.product.update({
            where: { id: product.id },
            data: { viewCount: { increment: 1 } },
        });
        return this.mapProduct(product);
    }
    mapProduct(product) {
        const images = [...product.images]
            .sort((a, b) => a.order - b.order)
            .map((image) => image.url);
        const tags = product.metaKeywords
            ? product.metaKeywords
                .split(",")
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
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map