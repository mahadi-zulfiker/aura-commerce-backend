import { CategoriesService } from "./categories.service";
export declare class CategoriesController {
    private categoriesService;
    constructor(categoriesService: CategoriesService);
    findAll(): Promise<{
        id: string;
        name: string;
        slug: string;
        image: string;
        productCount: number;
    }[]>;
}
