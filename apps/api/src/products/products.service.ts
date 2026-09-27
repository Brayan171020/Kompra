import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity.js';
import { ProductEntity } from '../entities/product.entity.js';
import { CreateProductDto } from './dto/create-product.dto.js';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity) private readonly products: Repository<ProductEntity>,
    @InjectRepository(CategoryEntity) private readonly categories: Repository<CategoryEntity>,
  ) {}

  findMine(creatorId: string): Promise<ProductEntity[]> {
    return this.products.find({ where: { creatorId }, order: { name: 'ASC' } });
  }

  async create(dto: CreateProductDto, creatorId: string): Promise<ProductEntity> {
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('Product name cannot be empty');
    if (!(await this.categories.existsBy({ id: dto.categoryId }))) throw new NotFoundException('Category not found');
    if (await this.products.existsBy({ creatorId, categoryId: dto.categoryId, name: ILike(name) })) {
      throw new ConflictException('This product is already saved in this category');
    }
    return this.products.save(this.products.create({ ...dto, name, creatorId }));
  }
}
