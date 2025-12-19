declare const sortOptions: readonly ["featured", "newest", "price-low", "price-high", "rating"];
export declare class GetProductsQueryDto {
    page?: number;
    limit?: number;
    category?: string;
    brand?: string;
    search?: string;
    sort?: (typeof sortOptions)[number];
}
export {};
