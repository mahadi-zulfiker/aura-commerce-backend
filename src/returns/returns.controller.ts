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
import { ReturnStatus, UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { parsePagination } from '../utils/pagination';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnStatusDto } from './dto/update-return-status.dto';
import { ReturnsService } from './returns.service';

@Controller('returns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  @Roles(UserRole.USER)
  create(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateReturnDto,
  ) {
    return this.returnsService.createReturnRequest(req.user.id, dto);
  }

  @Get()
  @Roles(UserRole.USER, UserRole.VENDOR, UserRole.ADMIN)
  list(
    @Request() req: { user: { id: string; role: UserRole } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const { page: pageNumber, limit: limitNumber } = parsePagination(page, limit, {
      page: 1,
      limit: 10,
      maxLimit: 100,
    });
    return this.returnsService.listReturns(
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
    return this.returnsService.getReturn(req.user.id, req.user.role, id);
  }

  @Patch(':id/status')
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  updateStatus(
    @Request() req: { user: { id: string; role: UserRole } },
    @Param('id') id: string,
    @Body() dto: UpdateReturnStatusDto,
  ) {
    return this.returnsService.updateStatus(
      req.user.id,
      req.user.role,
      id,
      dto.status as ReturnStatus,
    );
  }

  @Post(':id/cancel')
  @Roles(UserRole.USER)
  cancel(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.returnsService.cancelReturn(req.user.id, id);
  }
}
