import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity.js';

const DEFAULT_CATEGORIES = [
  ['Carnes', '#E76F51', 'beef'], ['Charcutería', '#C44536', 'ham'], ['Víveres/Sólidos', '#E9C46A', 'wheat'],
  ['Frutas y Verduras', '#2A9D8F', 'carrot'], ['Limpieza', '#457B9D', 'sparkles'],
] as const;

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(@InjectRepository(CategoryEntity) private readonly repository: Repository<CategoryEntity>) {}

  async onModuleInit(): Promise<void> {
    if (await this.repository.count() === 0) {
      await this.repository.save(DEFAULT_CATEGORIES.map(([name, color, icon]) => this.repository.create({ name, color, icon })));
    }
  }

  findAll(): Promise<CategoryEntity[]> { return this.repository.find({ order: { name: 'ASC' } }); }
}
