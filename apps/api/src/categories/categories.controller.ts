import { Controller, Get, Version } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator.js';
import { CategoryEntity } from '../entities/category.entity.js';
import { CategoriesService } from './categories.service.js';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Version('1')
  @Public()
  @ApiOperation({ summary: 'List the default shopping categories' })
  findAll(): Promise<CategoryEntity[]> { return this.categoriesService.findAll(); }
}
