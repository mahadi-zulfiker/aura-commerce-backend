import { ProductsService } from "./products.service";
import { GetProductsQueryDto } from "./dto/get-products-query.dto";
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
    findOne(slug: string): Promise<{
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
