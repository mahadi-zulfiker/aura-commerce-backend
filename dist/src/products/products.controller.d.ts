import { UserRole } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';
export declare class ProductsController {
    private productsService;
    constructor(productsService: ProductsService);
    findAll(query: GetProductsQueryDto): Promise<{
        data: {
            id: string;
            name: string;
            slug: string;
            description: string;
            price: number;
            originalPrice: number | null;
            category: string;
            categorySlug: string;
            brand: string;
            brandSlug: string;
            images: string[];
            rating: number;
            reviewCount: number;
            inStock: boolean;
            stockCount: number;
            features: string[];
            specifications: Record<string, string>;
            tags: string[];
            isNew: boolean;
            isFeatured: boolean;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findMine(req: {
        user: {
            id: string;
        };
    }, page?: number, limit?: number): Promise<{
        data: {
            id: string;
            name: string;
            slug: string;
            description: string;
            price: number;
            originalPrice: number | null;
            category: string;
            categorySlug: string;
            brand: string;
            brandSlug: string;
            images: string[];
            rating: number;
            reviewCount: number;
            inStock: boolean;
            stockCount: number;
            features: string[];
            specifications: Record<string, string>;
            tags: string[];
            isNew: boolean;
            isFeatured: boolean;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    create(req: {
        user: {
            id: string;
        };
    }, dto: CreateProductDto): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string;
        price: number;
        originalPrice: number | null;
        category: string;
        categorySlug: string;
        brand: string;
        brandSlug: string;
        images: string[];
        rating: number;
        reviewCount: number;
        inStock: boolean;
        stockCount: number;
        features: string[];
        specifications: Record<string, string>;
        tags: string[];
        isNew: boolean;
        isFeatured: boolean;
    }>;
    update(id: string, req: {
        user: {
            id: string;
            role: UserRole;
        };
    }, dto: UpdateProductDto): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string;
        price: number;
        originalPrice: number | null;
        category: string;
        categorySlug: string;
        brand: string;
        brandSlug: string;
        images: string[];
        rating: number;
        reviewCount: number;
        inStock: boolean;
        stockCount: number;
        features: string[];
        specifications: Record<string, string>;
        tags: string[];
        isNew: boolean;
        isFeatured: boolean;
    }>;
    remove(id: string, req: {
        user: {
            id: string;
            role: UserRole;
        };
    }): Promise<{
        deleted: boolean;
    }>;
    findOne(slug: string): Promise<{
        variants: {
            id: string;
            name: string;
            sku: string;
            price: number | null;
            stock: number;
            attributes: import("@prisma/client/runtime/client").JsonValue;
        }[];
        reviews: {
            id: string;
            productId: string;
            userId: string;
            userName: string;
            userAvatar: string;
            rating: number;
            title: string;
            content: string;
            createdAt: Date;
            helpful: number;
        }[];
        id: string;
        name: string;
        slug: string;
        description: string;
        price: number;
        originalPrice: number | null;
        category: string;
        categorySlug: string;
        brand: string;
        brandSlug: string;
        images: string[];
        rating: number;
        reviewCount: number;
        inStock: boolean;
        stockCount: number;
        features: string[];
        specifications: Record<string, string>;
        tags: string[];
        isNew: boolean;
        isFeatured: boolean;
    }>;
}
