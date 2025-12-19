import { PrismaService } from "../database/prisma.service";
export declare class CategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        name: string;
        slug: string;
        image: string;
        productCount: number;
    }[]>;
}
