import { BrandsService } from "./brands.service";
export declare class BrandsController {
    private brandsService;
    constructor(brandsService: BrandsService);
    findAll(): Promise<{
        id: string;
        name: string;
        slug: string;
        logo: string;
    }[]>;
}
