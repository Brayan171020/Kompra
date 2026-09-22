import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from '../entities/category.entity.js';
import { CategoriesService } from './categories.service.js';

@Module({ imports: [TypeOrmModule.forFeature([CategoryEntity])], providers: [CategoriesService] })
export class CategoriesModule {}
