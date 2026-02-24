import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFiltersDto } from './dto/product-filters.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  findAll(filters: ProductFiltersDto): Promise<Product[]> {
    const where: FindOptionsWhere<Product> = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
      where.price = Between(filters.minPrice, filters.maxPrice) as never;
    } else if (filters.minPrice !== undefined) {
      where.price = MoreThanOrEqual(filters.minPrice) as never;
    } else if (filters.maxPrice !== undefined) {
      where.price = LessThanOrEqual(filters.maxPrice) as never;
    }

    if (filters.search) {
      return this.productRepo.find({
        where: [
          { ...where, name: ILike(`%${filters.search}%`) },
          { ...where, description: ILike(`%${filters.search}%`) },
        ],
      });
    }

    return this.productRepo.find({ where });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const product = this.productRepo.create(dto);
    return this.productRepo.save(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, dto);
    return this.productRepo.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepo.remove(product);
  }
}
