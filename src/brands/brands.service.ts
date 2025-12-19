import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const brands = await this.prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo ?? "",
    }));
  }
}
