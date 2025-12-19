import { PrismaService } from "../database/prisma.service";
export declare class BrandsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        name: string;
        slug: string;
        logo: string;
    }[]>;
}
