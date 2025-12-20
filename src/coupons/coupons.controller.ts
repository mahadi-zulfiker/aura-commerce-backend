import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { parsePagination } from '../utils/pagination';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { CouponsService } from './coupons.service';

@Controller('coupons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CouponsController {
  constructor(private couponsService: CouponsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const { page: pageNumber, limit: limitNumber } = parsePagination(page, limit, {
      page: 1,
      limit: 20,
      maxLimit: 100,
    });
    return this.couponsService.findAll(pageNumber, limitNumber);
  }

  @Get('code/:code')
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.VENDOR)
  findByCode(@Param('code') code: string) {
    return this.couponsService.findByCode(code);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.couponsService.remove(id);
  }
}
