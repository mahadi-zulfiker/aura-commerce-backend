import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { slugify } from '../utils/slugify';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

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

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug?.trim() || slugify(dto.name);

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

  async update(id: string, dto: UpdateCategoryDto) {
    const slug = dto.slug?.trim() ?? (dto.name ? slugify(dto.name) : undefined);

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

  async remove(id: string) {
    return this.prisma.category.delete({
      where: { id },
    });
  }
}
