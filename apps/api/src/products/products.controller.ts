import { Body, Controller, Get, Post, Version } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiUnauthorizedResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../entities/user.entity.js';
import type { ListActor } from '../lists/lists.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { ProductsService } from './products.service.js';
import { ProductEntity } from '../entities/product.entity.js';
import { ApiErrorResponseDto } from '../common/openapi/response-models.dto.js';

@ApiTags('Productos')
@ApiBearerAuth('bearer')
@Controller('products')
@Roles(UserRole.CREATOR)
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'Consultar el catálogo personal', description: 'Devuelve los productos guardados por el usuario CREATOR autenticado, ordenados por nombre.' })
  @ApiOkResponse({ description: 'Catálogo de productos personal.', type: ProductEntity, isArray: true })
  @ApiUnauthorizedResponse({ description: 'La sesión falta o no es válida.', type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ description: 'El catálogo personal requiere el rol CREATOR.', type: ApiErrorResponseDto })
  findMine(@CurrentUser() actor: ListActor) { return this.products.findMine(actor.id); }

  @Post()
  @Version('1')
  @ApiOperation({ summary: 'Guardar un producto reutilizable', description: 'Añade un producto al catálogo del usuario. No crea un elemento de lista.' })
  @ApiCreatedResponse({ description: 'Producto guardado.', type: ProductEntity })
  @ApiBadRequestResponse({ description: 'Los datos del producto no son válidos.', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'La sesión falta o no es válida.', type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ description: 'El catálogo personal requiere el rol CREATOR.', type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ description: 'La categoría no existe.', type: ApiErrorResponseDto })
  @ApiConflictResponse({ description: 'El producto ya existe en esa categoría.', type: ApiErrorResponseDto })
  create(@Body() dto: CreateProductDto, @CurrentUser() actor: ListActor) { return this.products.create(dto, actor.id); }
}
