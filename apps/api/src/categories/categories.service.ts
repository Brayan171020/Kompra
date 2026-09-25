import { ConflictException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';

const DEFAULT_CATEGORIES = [
  ['Víveres y alimentos', '#E9C46A', 'wheat'], ['Frutas y verduras', '#2A9D8F', 'carrot'],
  ['Hogar y limpieza', '#457B9D', 'sparkles'], ['Herramientas', '#7C9A5B', 'hammer'],
  ['Ferretería', '#8B6F47', 'wrench'], ['Repuestos', '#C44536', 'settings'], ['Insumos de trabajo', '#6C63A8', 'briefcase'],
] as const;

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(@InjectRepository(CategoryEntity) private readonly repository: Repository<CategoryEntity>) {}

  async onModuleInit(): Promise<void> {
    if (await this.repository.count() === 0) {
      await this.repository.save(DEFAULT_CATEGORIES.map(([name, color, icon]) => this.repository.create({ name, color, icon, creatorId: null })));
    }
  }

  findAll(): Promise<CategoryEntity[]> { return this.repository.find({ order: { name: 'ASC' } }); }

  async create(dto: CreateCategoryDto, creatorId: string): Promise<CategoryEntity> {
    const name = dto.name.trim();
    if (await this.repository.existsBy({ name })) throw new ConflictException('Category already exists');
    return this.repository.save(this.repository.create({ name, color: dto.color ?? '#7C9A5B', icon: dto.icon ?? 'tag', creatorId }));
  }
}
