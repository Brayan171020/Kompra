import { Body, Controller, Get, Post, Version } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiUnauthorizedResponse, ApiTags } from '@nestjs/swagger';
import { CategoryEntity } from '../entities/category.entity.js';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthSession } from '../auth/auth.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../entities/user.entity.js';
import { ApiErrorResponseDto } from '../common/openapi/response-models.dto.js';

@ApiTags('Categorías')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Version('1')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Listar categorías disponibles', description: 'Requiere sesión. Incluye categorías generales y las categorías propias del usuario.' })
  @ApiOkResponse({ description: 'Categorías disponibles.', type: CategoryEntity, isArray: true })
  findAll(@CurrentUser() user: AuthSession['user']): Promise<CategoryEntity[]> { return this.categoriesService.findAll(user.id); }

  @Post()
  @Version('1')
  @Roles(UserRole.CREATOR)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Crear una categoría personalizada', description: 'Requiere una sesión válida y el rol CREATOR. El nombre debe ser único.' })
  @ApiCreatedResponse({ description: 'Categoría creada.', type: CategoryEntity })
  @ApiBadRequestResponse({ description: 'El nombre, color o icono no cumple las reglas de validación.', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'La sesión falta o no es válida.', type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Solo los usuarios CREATOR pueden crear categorías.', type: ApiErrorResponseDto })
  @ApiConflictResponse({ description: 'Ya existe una categoría con ese nombre.', type: ApiErrorResponseDto })
  create(@Body() dto: CreateCategoryDto, @CurrentUser() user: AuthSession['user']): Promise<CategoryEntity> { return this.categoriesService.create(dto, user.id); }
}
