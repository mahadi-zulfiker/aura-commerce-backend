declare const sortOptions: readonly ["featured", "newest", "price-low", "price-high", "rating", "popularity"];
export declare class GetProductsQueryDto {
    page?: number;
    limit?: number;
    category?: string;
    brand?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    sort?: (typeof sortOptions)[number];
}
export {};
