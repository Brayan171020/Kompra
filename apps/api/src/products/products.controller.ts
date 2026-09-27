import { Body, Controller, Get, Post, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../entities/user.entity.js';
import type { ListActor } from '../lists/lists.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { ProductsService } from './products.service.js';

@ApiTags('products')
@ApiBearerAuth('bearer')
@Controller('products')
@Roles(UserRole.CREATOR)
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'List the current creator product catalog' })
  findMine(@CurrentUser() actor: ListActor) { return this.products.findMine(actor.id); }

  @Post()
  @Version('1')
  @ApiOperation({ summary: 'Save a reusable product to the current creator catalog' })
  create(@Body() dto: CreateProductDto, @CurrentUser() actor: ListActor) { return this.products.create(dto, actor.id); }
}
