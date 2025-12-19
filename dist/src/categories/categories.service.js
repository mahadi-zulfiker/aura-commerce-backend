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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const slugify_1 = require("../utils/slugify");
let CategoriesService = class CategoriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        const categories = await this.prisma.category.findMany({
            where: { isActive: true },
            orderBy: [{ order: 'asc' }, { name: 'asc' }],
            include: {
                _count: { select: { products: true } },
            },
        });
        return categories.map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            image: category.image ?? '',
            productCount: category._count.products,
        }));
    }
    async findAllAdmin() {
        return this.prisma.category.findMany({
            orderBy: [{ order: 'asc' }, { name: 'asc' }],
        });
    }
    async findBySlug(slug) {
        const category = await this.prisma.category.findUnique({
            where: { slug },
        });
        if (!category) {
            throw new common_1.NotFoundException('Category not found');
        }
        return category;
    }
    async create(dto) {
        const slug = dto.slug?.trim() || (0, slugify_1.slugify)(dto.name);
        return this.prisma.category.create({
            data: {
                name: dto.name,
                slug,
                description: dto.description,
                image: dto.image,
                icon: dto.icon,
                parentId: dto.parentId,
                isActive: dto.isActive ?? true,
                order: dto.order ?? 0,
            },
        });
    }
    async update(id, dto) {
        const slug = dto.slug?.trim() ?? (dto.name ? (0, slugify_1.slugify)(dto.name) : undefined);
        return this.prisma.category.update({
            where: { id },
            data: {
                name: dto.name,
                slug,
                description: dto.description,
                image: dto.image,
                icon: dto.icon,
                parentId: dto.parentId,
                isActive: dto.isActive,
                order: dto.order,
            },
        });
    }
    async remove(id) {
        return this.prisma.category.delete({
            where: { id },
        });
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map