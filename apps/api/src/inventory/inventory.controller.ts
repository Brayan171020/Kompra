import { Body, Controller, Get, Param, Post, Query, Version } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { CreateInventoryPurchaseDto } from './dto/create-inventory-purchase.dto.js';
import { InventoryQueryDto } from './dto/inventory-query.dto.js';
import { InventoryService } from './inventory.service.js';
import type { ListActor } from '../lists/lists.service.js';
import { ApiErrorResponseDto, InventoryHistoryResponseDto, InventoryImportResponseDto, InventorySummaryResponseDto } from '../common/openapi/response-models.dto.js';
import { InventoryPurchaseEntity } from '../entities/inventory-purchase.entity.js';

@ApiTags('Inventario')
@ApiBearerAuth('bearer')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Version('1')
  @ApiOperation({ summary: 'Registrar una compra manual', description: 'Crea un registro privado en el inventario del usuario autenticado.' })
  @ApiCreatedResponse({ description: 'Compra registrada.', type: InventoryPurchaseEntity })
  @ApiBadRequestResponse({ description: 'Los datos de la compra no son válidos.', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'La sesión falta o no es válida.', type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ description: 'La categoría indicada no existe.', type: ApiErrorResponseDto })
  create(@Body() dto: CreateInventoryPurchaseDto, @CurrentUser() actor: ListActor) { return this.inventoryService.create(dto, actor); }

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'Consultar el historial de compras', description: 'Devuelve registros del usuario autenticado, ordenados de más recientes a más antiguos.' })
  @ApiOkResponse({ description: 'Página del historial y metadatos de paginación.', type: InventoryHistoryResponseDto })
  @ApiBadRequestResponse({ description: 'Los filtros o parámetros de paginación no son válidos.', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'La sesión falta o no es válida.', type: ApiErrorResponseDto })
  @ApiQuery({ name: 'startDate', required: false, type: String, format: 'date-time', description: 'Fecha inicial inclusiva en formato ISO 8601.' })
  @ApiQuery({ name: 'endDate', required: false, type: String, format: 'date-time', description: 'Fecha final inclusiva en formato ISO 8601.' })
  @ApiQuery({ name: 'categoryId', required: false, type: String, format: 'uuid', description: 'Filtrar por UUID de categoría.' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Buscar por nombre del producto, sin distinguir mayúsculas.' })
  @ApiQuery({ name: 'page', required: false, type: Number, minimum: 1, example: 1, description: 'Página solicitada. Por defecto: 1.' })
  @ApiQuery({ name: 'limit', required: false, type: Number, minimum: 1, maximum: 100, example: 20, description: 'Registros por página (máximo 100). Por defecto: 20.' })
  findAll(@Query() query: InventoryQueryDto, @CurrentUser() actor: ListActor) { return this.inventoryService.findAll(query, actor); }

  @Get('summary')
  @Version('1')
  @ApiOperation({ summary: 'Consultar el resumen mensual del inventario', description: 'Calcula cantidades, costos, volumen por unidad, distribución por categoría y productos de mayor costo para el mes UTC actual.' })
  @ApiOkResponse({ description: 'Resumen agregado del mes UTC actual.', type: InventorySummaryResponseDto })
  @ApiUnauthorizedResponse({ description: 'La sesión falta o no es válida.', type: ApiErrorResponseDto })
  getSummary(@CurrentUser() actor: ListActor) { return this.inventoryService.getSummary(actor); }

  @Post('import-from-list/:listId')
  @Version('1')
  @ApiOperation({ summary: 'Importar compras desde una lista finalizada', description: 'Importa elementos completados o parcialmente completados. La operación es idempotente por elemento y propietario del inventario.' })
  @ApiParam({ name: 'listId', format: 'uuid', description: 'UUID de la lista finalizada.' })
  @ApiCreatedResponse({ description: 'Resultado de importación y compras creadas.', type: InventoryImportResponseDto })
  @ApiBadRequestResponse({ description: 'La lista todavía no está finalizada.', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'La sesión falta o no es válida.', type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ description: 'El usuario no participa en la lista.', type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ description: 'La lista no existe.', type: ApiErrorResponseDto })
  @ApiResponse({ status: 429, description: 'Se alcanzó el límite de solicitudes.' })
  importFromList(@Param('listId') listId: string, @CurrentUser() actor: ListActor) { return this.inventoryService.importFromList(listId, actor); }
}
