import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.USER, UserRole.VENDOR, UserRole.ADMIN)
  create(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(req.user.id, dto);
  }

  @Get()
  @Roles(UserRole.USER, UserRole.VENDOR, UserRole.ADMIN)
  list(
    @Request() req: { user: { id: string; role: UserRole } },
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const pageNumber = page ? +page : 1;
    const limitNumber = limit ? +limit : 10;
    return this.ordersService.listOrders(
      req.user.id,
      req.user.role,
      pageNumber,
      limitNumber,
    );
  }

  @Get(':id')
  @Roles(UserRole.USER, UserRole.VENDOR, UserRole.ADMIN)
  get(
    @Request() req: { user: { id: string; role: UserRole } },
    @Param('id') id: string,
  ) {
    return this.ordersService.getOrder(req.user.id, req.user.role, id);
  }

  @Patch(':id/status')
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  updateStatus(
    @Request() req: { user: { id: string; role: UserRole } },
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(
      req.user.id,
      req.user.role,
      id,
      dto.status,
    );
  }
}
