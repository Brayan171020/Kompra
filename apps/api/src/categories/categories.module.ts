import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { CategoriesService } from './categories.service';

@Module({ imports: [TypeOrmModule.forFeature([CategoryEntity])], providers: [CategoriesService] })
export class CategoriesModule {}
