import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('summary')
    getSummary() {
        return this.analyticsService.getDashboardSummary();
    }

    @Get('sales')
    getSalesChart(@Query('days') days?: string) {
        return this.analyticsService.getSalesChart(days ? parseInt(days) : 7);
    }

    @Get('top-products')
    getTopProducts() {
        return this.analyticsService.getTopProducts();
    }
}
