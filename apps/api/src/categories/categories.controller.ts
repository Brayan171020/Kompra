import { Body, Controller, Get, Post, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator.js';
import { CategoryEntity } from '../entities/category.entity.js';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthSession } from '../auth/auth.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../entities/user.entity.js';

@ApiTags('categories')
@ApiBearerAuth('bearer')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Version('1')
  @Public()
  @ApiOperation({ summary: 'List the default shopping categories' })
  findAll(): Promise<CategoryEntity[]> { return this.categoriesService.findAll(); }

  @Post()
  @Version('1')
  @Roles(UserRole.CREATOR)
  @ApiOperation({ summary: 'Create a custom household category' })
  create(@Body() dto: CreateCategoryDto, @CurrentUser() user: AuthSession['user']): Promise<CategoryEntity> { return this.categoriesService.create(dto, user.id); }
}
