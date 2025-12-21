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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { parsePagination } from '../utils/pagination';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    findAll(
        @Request() req: { user: { id: string } },
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const { page: pageNumber, limit: limitNumber } = parsePagination(page, limit, {
            page: 1,
            limit: 20,
        });
        return this.notificationsService.findAll(
            req.user.id,
            pageNumber,
            limitNumber,
        );
    }

    @Patch(':id/read')
    markAsRead(
        @Request() req: { user: { id: string } },
        @Param('id') id: string,
    ) {
        return this.notificationsService.markAsRead(req.user.id, id);
    }

    @Patch('read-all')
    markAllAsRead(@Request() req: { user: { id: string } }) {
        return this.notificationsService.markAllAsRead(req.user.id);
    }

    // Internal use or Admin testing
    @Post()
    createInternal(
        @Request() req: { user: { id: string } },
        @Body() dto: CreateNotificationDto
    ) {
        // In production, you might restrict this to ADMIN or internal services
        return this.notificationsService.create(req.user.id, dto);
    }
}
