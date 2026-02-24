import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @Inject('RABBITMQ_CLIENT')
    private readonly rabbitClient: ClientProxy,
    private readonly dataSource: DataSource,
  ) {}

  async createOrder(dto: CreateOrderDto, userId: string): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      let total = 0;
      const items: OrderItem[] = [];

      for (const itemDto of dto.items) {
        const product = await manager.findOne(Product, {
          where: { id: itemDto.productId },
        });

        if (!product) {
          throw new NotFoundException(`Product ${itemDto.productId} not found`);
        }

        if (product.stock < itemDto.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product "${product.name}": requested ${itemDto.quantity}, available ${product.stock}`,
          );
        }

        product.stock -= itemDto.quantity;
        await manager.save(Product, product);

        const orderItem = manager.create(OrderItem, {
          product,
          quantity: itemDto.quantity,
          unitPrice: product.price,
        });

        items.push(orderItem);
        total += Number(product.price) * itemDto.quantity;
      }

      const order = manager.create(Order, {
        userId,
        status: OrderStatus.CONFIRMED,
        total,
        items,
      });

      const savedOrder = await manager.save(Order, order);

      this.rabbitClient
        .emit('order.created', {
          orderId: savedOrder.id,
          userId,
          total: savedOrder.total,
          items: savedOrder.items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        })
        .subscribe({
          error: (err: Error) =>
            this.logger.warn(`RabbitMQ emit failed: ${err.message}`),
        });

      return savedOrder;
    });
  }

  findByUser(userId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
