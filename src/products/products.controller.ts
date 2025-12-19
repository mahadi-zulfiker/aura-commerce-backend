import { Controller, Get, Param, Query } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { GetProductsQueryDto } from "./dto/get-products-query.dto";

@Controller("products")
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: GetProductsQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(":slug")
  findOne(@Param("slug") slug: string) {
    return this.productsService.findBySlug(slug);
  }
}
