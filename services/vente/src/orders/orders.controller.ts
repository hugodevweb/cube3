import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Order } from './entities/order.entity';

interface JwtUser {
  sub: string;
  [key: string]: unknown;
}

@ApiTags('orders')
@ApiCookieAuth('access_token')
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Place a new order' })
  @ApiResponse({ status: 201, description: 'Order created.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  createOrder(
    @Body() dto: CreateOrderDto,
    @Req() req: Request,
  ): Promise<Order> {
    const user = req.user as JwtUser;
    return this.ordersService.createOrder(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List orders for the current user' })
  @ApiResponse({ status: 200, description: 'Array of orders.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  findMyOrders(@Req() req: Request): Promise<Order[]> {
    const user = req.user as JwtUser;
    return this.ordersService.findByUser(user.sub);
  }
}
