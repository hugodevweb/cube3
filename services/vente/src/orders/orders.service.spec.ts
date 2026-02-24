import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { of } from 'rxjs';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product, ProductType } from '../products/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';

const mockProduct = (): Product => ({
  id: 'prod-uuid-1',
  name: 'Horror Film',
  description: null,
  price: 20,
  stock: 5,
  type: ProductType.FILM,
  metadata: {},
  orderItems: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

const mockOrder = (): Order => ({
  id: 'order-uuid-1',
  userId: 'user-sub-1',
  status: OrderStatus.CONFIRMED,
  total: 40,
  items: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('OrdersService', () => {
  let service: OrdersService;

  const mockEntityManager = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  } as unknown as EntityManager;

  const mockDataSource = {
    transaction: jest.fn((cb: (manager: EntityManager) => Promise<Order>) =>
      cb(mockEntityManager),
    ),
  } as unknown as DataSource;

  const mockRabbitClient = {
    emit: jest.fn().mockReturnValue(of(null)),
  };

  const mockOrderRepo = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: getRepositoryToken(OrderItem), useValue: {} },
        { provide: getRepositoryToken(Product), useValue: {} },
        { provide: 'RABBITMQ_CLIENT', useValue: mockRabbitClient },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  describe('createOrder', () => {
    it('creates an order, decrements stock, and emits order.created event', async () => {
      const product = mockProduct();
      const savedOrder = mockOrder();

      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(product);
      (mockEntityManager.create as jest.Mock).mockImplementation(
        (_entity, data) => data,
      );
      (mockEntityManager.save as jest.Mock).mockResolvedValueOnce(product); // stock save
      (mockEntityManager.save as jest.Mock).mockResolvedValueOnce(savedOrder); // order save

      const dto: CreateOrderDto = {
        items: [{ productId: 'prod-uuid-1', quantity: 2 }],
      };

      const result = await service.createOrder(dto, 'user-sub-1');

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(Product, {
        where: { id: 'prod-uuid-1' },
      });
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        Product,
        expect.objectContaining({ stock: 3 }),
      );
      expect(mockRabbitClient.emit).toHaveBeenCalledWith(
        'order.created',
        expect.objectContaining({ userId: 'user-sub-1' }),
      );
      expect(result).toEqual(savedOrder);
    });

    it('throws NotFoundException when a product does not exist', async () => {
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(null);

      const dto: CreateOrderDto = {
        items: [{ productId: 'no-such-product', quantity: 1 }],
      };

      await expect(service.createOrder(dto, 'user-sub-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when stock is insufficient', async () => {
      const product = { ...mockProduct(), stock: 1 };
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(product);

      const dto: CreateOrderDto = {
        items: [{ productId: 'prod-uuid-1', quantity: 5 }],
      };

      await expect(service.createOrder(dto, 'user-sub-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('calculates total correctly for multiple items', async () => {
      const product = mockProduct(); // price = 20
      const savedOrder = { ...mockOrder(), total: 60 };

      (mockEntityManager.findOne as jest.Mock).mockResolvedValue({ ...product });
      (mockEntityManager.create as jest.Mock).mockImplementation(
        (_entity, data) => data,
      );
      (mockEntityManager.save as jest.Mock).mockResolvedValue(savedOrder);

      const dto: CreateOrderDto = {
        items: [{ productId: 'prod-uuid-1', quantity: 3 }],
      };

      await service.createOrder(dto, 'user-sub-1');

      const orderSaveCall = (mockEntityManager.save as jest.Mock).mock.calls.find(
        (call) => call[0] === Order,
      );
      expect(orderSaveCall).toBeDefined();
      expect(orderSaveCall![1]).toMatchObject({ total: 60 });
    });
  });

  describe('findByUser', () => {
    it('returns orders for a given user sorted by creation date descending', async () => {
      const orders = [mockOrder()];
      mockOrderRepo.find.mockResolvedValue(orders);

      const result = await service.findByUser('user-sub-1');

      expect(mockOrderRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-sub-1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(orders);
    });
  });
});
