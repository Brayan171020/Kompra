import { Body, Controller, Get, Param, Patch, Post, Version } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../entities/user.entity.js';
import { AssignListDto } from './dto/assign-list.dto.js';
import { CreateListDto } from './dto/create-list.dto.js';
import { ListsService } from './lists.service.js';
import type { ListActor } from './lists.service.js';
import { ShoppingListEntity } from '../entities/shopping-list.entity.js';
import { ApiErrorResponseDto, ShoppingListDetailResponseDto, ShoppingListWithCountsResponseDto } from '../common/openapi/response-models.dto.js';

@ApiTags('Listas')
@ApiBearerAuth('bearer')
@Controller('lists')
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post()
  @Version('1')
  @Roles(UserRole.CREATOR)
  @ApiOperation({ summary: 'Crear una lista de compras', description: 'Disponible para el rol CREATOR. Se puede asignar a un contacto durante la creación.' })
  @ApiCreatedResponse({ description: 'Lista creada en estado ACTIVE.', type: ShoppingListEntity })
  @ApiBadRequestResponse({ description: 'El título o el usuario asignado no cumple las reglas de validación.', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'La sesión falta o no es válida.', type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Solo los usuarios CREATOR pueden crear listas.', type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ description: 'El usuario asignado no existe.', type: ApiErrorResponseDto })
  create(@Body() dto: CreateListDto, @CurrentUser() actor: ListActor) { return this.listsService.create(dto, actor); }

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'Listar las listas del usuario', description: 'CREATOR recibe sus listas propias y las asignadas; BUYER recibe las listas que tiene asignadas. Cada lista incluye los conteos totalItems y completedItems.' })
  @ApiOkResponse({ description: 'Listas visibles para el usuario autenticado.', type: ShoppingListWithCountsResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'La sesión falta o no es válida.', type: ApiErrorResponseDto })
  findMine(@CurrentUser() actor: ListActor) { return this.listsService.findMine(actor); }

  @Get(':id')
  @Version('1')
  @ApiOperation({ summary: 'Consultar el detalle de una lista', description: 'Devuelve la lista y sus elementos agrupados por categoría. Solo pueden acceder el creador y el comprador asignado.' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID de la lista.' })
  @ApiOkResponse({ description: 'Detalle de la lista agrupado por categoría.', type: ShoppingListDetailResponseDto })
  @ApiUnauthorizedResponse({ description: 'La sesión falta o no es válida.', type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ description: 'El usuario no participa en la lista.', type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ description: 'La lista no existe.', type: ApiErrorResponseDto })
  findOne(@Param('id') id: string, @CurrentUser() actor: ListActor) { return this.listsService.findOne(id, actor); }

  @Patch(':id/assign')
  @Version('1')
  @Roles(UserRole.CREATOR)
  @ApiOperation({ summary: 'Asignar una lista a un contacto', description: 'Solo el creador propietario puede asignar o reasignar la lista. copyToAssigneeInventory controla si las compras pasan al inventario del contacto.' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID de la lista.' })
  @ApiOkResponse({ description: 'Lista actualizada.', type: ShoppingListEntity })
  @ApiBadRequestResponse({ description: 'La lista o el contacto no cumple las reglas de asignación.', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'La sesión falta o no es válida.', type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Solo el creador propietario de la lista puede asignarla.', type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ description: 'La lista o el contacto no existe.', type: ApiErrorResponseDto })
  assign(@Param('id') id: string, @Body() dto: AssignListDto, @CurrentUser() actor: ListActor) { return this.listsService.assign(id, dto, actor); }

  @Patch(':id/finish')
  @Version('1')
  @Roles(UserRole.CREATOR)
  @ApiOperation({ summary: 'Finalizar una lista', description: 'Solo el creador propietario puede finalizarla. La operación es idempotente.' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID de la lista.' })
  @ApiOkResponse({ description: 'Lista en estado FINISHED.', type: ShoppingListEntity })
  @ApiUnauthorizedResponse({ description: 'La sesión falta o no es válida.', type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Solo el creador propietario de la lista puede finalizarla.', type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ description: 'La lista no existe.', type: ApiErrorResponseDto })
  finish(@Param('id') id: string, @CurrentUser() actor: ListActor) { return this.listsService.finish(id, actor); }
}
