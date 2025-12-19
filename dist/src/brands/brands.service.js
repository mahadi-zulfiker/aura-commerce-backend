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
exports.BrandsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const slugify_1 = require("../utils/slugify");
let BrandsService = class BrandsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        const brands = await this.prisma.brand.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
        return brands.map((brand) => ({
            id: brand.id,
            name: brand.name,
            slug: brand.slug,
            logo: brand.logo ?? '',
        }));
    }
    async findAllAdmin() {
        return this.prisma.brand.findMany({
            orderBy: { name: 'asc' },
        });
    }
    async findBySlug(slug) {
        const brand = await this.prisma.brand.findUnique({
            where: { slug },
        });
        if (!brand) {
            throw new common_1.NotFoundException('Brand not found');
        }
        return brand;
    }
    async create(dto) {
        const slug = dto.slug?.trim() || (0, slugify_1.slugify)(dto.name);
        return this.prisma.brand.create({
            data: {
                name: dto.name,
                slug,
                logo: dto.logo,
                description: dto.description,
                website: dto.website,
                isActive: true,
            },
        });
    }
    async update(id, dto) {
        const slug = dto.slug?.trim() ?? (dto.name ? (0, slugify_1.slugify)(dto.name) : undefined);
        return this.prisma.brand.update({
            where: { id },
            data: {
                name: dto.name,
                slug,
                logo: dto.logo,
                description: dto.description,
                website: dto.website,
                isActive: dto.isActive,
            },
        });
    }
    async remove(id) {
        return this.prisma.brand.delete({
            where: { id },
        });
    }
};
exports.BrandsService = BrandsService;
exports.BrandsService = BrandsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BrandsService);
//# sourceMappingURL=brands.service.js.map