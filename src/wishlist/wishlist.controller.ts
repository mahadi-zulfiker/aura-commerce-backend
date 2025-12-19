import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AddWishlistItemDto } from './dto/add-wishlist-item.dto';
import { WishlistService } from './wishlist.service';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private wishlistService: WishlistService) {}

  @Get()
  getWishlist(@Request() req: { user: { id: string } }) {
    return this.wishlistService.getWishlist(req.user.id);
  }

  @Post()
  addItem(
    @Request() req: { user: { id: string } },
    @Body() dto: AddWishlistItemDto,
  ) {
    return this.wishlistService.addItem(req.user.id, dto.productId);
  }

  @Delete(':productId')
  removeItem(
    @Request() req: { user: { id: string } },
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.removeItem(req.user.id, productId);
  }

  @Post(':productId/move-to-cart')
  moveToCart(
    @Request() req: { user: { id: string } },
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.moveToCart(req.user.id, productId);
  }
}
