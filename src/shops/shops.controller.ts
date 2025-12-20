import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ShopStatus, UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { parsePagination } from '../utils/pagination';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopStatusDto } from './dto/update-shop-status.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { ShopsService } from './shops.service';

@Controller('shops')
export class ShopsController {
  constructor(private shopsService: ShopsService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const { page: pageNumber, limit: limitNumber } = parsePagination(page, limit, {
      page: 1,
      limit: 12,
      maxLimit: 100,
    });
    return this.shopsService.findAll(pageNumber, limitNumber, search);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ShopStatus,
  ) {
    const { page: pageNumber, limit: limitNumber } = parsePagination(page, limit, {
      page: 1,
      limit: 12,
      maxLimit: 100,
    });
    return this.shopsService.findAllAdmin(pageNumber, limitNumber, status);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.shopsService.findBySlug(slug);
  }

  @Get(':slug/products')
  getShopProducts(
    @Param('slug') slug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const { page: pageNumber, limit: limitNumber } = parsePagination(page, limit, {
      page: 1,
      limit: 12,
      maxLimit: 100,
    });
    return this.shopsService.getShopProducts(slug, pageNumber, limitNumber);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateShopDto) {
    return this.shopsService.create(req.user.id, dto);
  }

  @Get('me/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  getMyShop(@Request() req: { user: { id: string } }) {
    return this.shopsService.getMyShop(req.user.id);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  updateMyShop(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateShopDto,
  ) {
    return this.shopsService.updateMyShop(req.user.id, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateShopStatusDto) {
    return this.shopsService.updateStatus(id, dto.status);
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  follow(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.shopsService.follow(id, req.user.id);
  }

  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard)
  unfollow(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.shopsService.unfollow(id, req.user.id);
  }
}
