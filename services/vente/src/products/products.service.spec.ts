import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product, ProductType } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFiltersDto } from './dto/product-filters.dto';

const mockProduct = (): Product => ({
  id: 'uuid-1',
  name: 'Test Film',
  description: 'A horror film',
  price: 19.99,
  stock: 10,
  type: ProductType.FILM,
  metadata: { director: 'John Doe' },
  orderItems: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

type MockRepo<T> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepo = <T>(): MockRepo<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('ProductsService', () => {
  let service: ProductsService;
  let repo: MockRepo<Product>;

  beforeEach(async () => {
    repo = createMockRepo<Product>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: repo },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('findAll', () => {
    it('returns all products when no filters are provided', async () => {
      const products = [mockProduct()];
      repo.find!.mockResolvedValue(products);

      const result = await service.findAll({} as ProductFiltersDto);

      expect(repo.find).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual(products);
    });

    it('applies type filter', async () => {
      const products = [mockProduct()];
      repo.find!.mockResolvedValue(products);

      await service.findAll({ type: ProductType.FILM } as ProductFiltersDto);

      expect(repo.find).toHaveBeenCalledWith({
        where: { type: ProductType.FILM },
      });
    });

    it('applies search filter using ILike on name and description', async () => {
      repo.find!.mockResolvedValue([]);

      await service.findAll({ search: 'horror' } as ProductFiltersDto);

      const call = repo.find!.mock.calls[0][0];
      expect(Array.isArray(call.where)).toBe(true);
      expect(call.where).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('returns a product when found', async () => {
      const product = mockProduct();
      repo.findOne!.mockResolvedValue(product);

      const result = await service.findOne('uuid-1');

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'uuid-1' } });
      expect(result).toEqual(product);
    });

    it('throws NotFoundException when product does not exist', async () => {
      repo.findOne!.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates and saves a new product', async () => {
      const dto: CreateProductDto = {
        name: 'New Film',
        price: 9.99,
        stock: 5,
        type: ProductType.FILM,
      };
      const product = { ...mockProduct(), ...dto };
      repo.create!.mockReturnValue(product);
      repo.save!.mockResolvedValue(product);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(product);
      expect(result).toEqual(product);
    });
  });

  describe('update', () => {
    it('updates and saves an existing product', async () => {
      const product = mockProduct();
      repo.findOne!.mockResolvedValue(product);
      const dto: UpdateProductDto = { price: 14.99 };
      const updated = { ...product, ...dto };
      repo.save!.mockResolvedValue(updated);

      const result = await service.update('uuid-1', dto);

      expect(repo.save).toHaveBeenCalled();
      expect(result.price).toBe(14.99);
    });

    it('throws NotFoundException when product does not exist', async () => {
      repo.findOne!.mockResolvedValue(null);

      await expect(
        service.update('missing-id', { price: 5 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes an existing product', async () => {
      const product = mockProduct();
      repo.findOne!.mockResolvedValue(product);
      repo.remove!.mockResolvedValue(product);

      await service.remove('uuid-1');

      expect(repo.remove).toHaveBeenCalledWith(product);
    });

    it('throws NotFoundException when product does not exist', async () => {
      repo.findOne!.mockResolvedValue(null);

      await expect(service.remove('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
