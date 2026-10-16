import { Body, Controller, Delete, Param, Patch, Post, Version } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../entities/user.entity.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CreateItemDto } from './dto/create-item.dto.js';
import { UpdateItemStatusDto } from './dto/update-item-status.dto.js';
import { ItemsService } from './items.service.js';
import type { ListActor } from '../lists/lists.service.js';
import { ListItemEntity } from '../entities/list-item.entity.js';
import { ApiErrorResponseDto } from '../common/openapi/response-models.dto.js';

@ApiTags('Elementos de lista')
@ApiBearerAuth('bearer')
@Controller()
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post('lists/:listId/items')
  @Version('1')
  @Roles(UserRole.CREATOR)
  @ApiOperation({ summary: 'Agregar un elemento a una lista', description: 'Solo el creador de la lista puede agregar elementos. La lista debe estar activa.' })
  @ApiParam({ name: 'listId', format: 'uuid', description: 'UUID de la lista activa.' })
  @ApiCreatedResponse({ description: 'Elemento agregado en estado PENDING.', type: ListItemEntity })
  @ApiBadRequestResponse({ description: 'Los datos son inválidos o la lista está finalizada.', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'La sesión falta o no es válida.', type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Solo el creador de la lista puede agregar elementos.', type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ description: 'La lista o la categoría no existe.', type: ApiErrorResponseDto })
  create(@Param('listId') listId: string, @Body() dto: CreateItemDto, @CurrentUser() actor: ListActor) { return this.itemsService.create(listId, dto, actor); }

  @Patch('items/:id/status')
  @Version('1')
  @ApiOperation({ summary: 'Actualizar el estado de un elemento', description: 'Actualiza el estado de compra, cantidad adquirida, nota o costo. Las transiciones y la sincronización del inventario se ejecutan de forma atómica.' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del elemento.' })
  @ApiOkResponse({ description: 'Elemento actualizado.', type: ListItemEntity })
  @ApiBadRequestResponse({ description: 'Estado, cantidad o transición no válida.', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'La sesión falta o no es válida.', type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ description: 'El usuario no participa en la lista asociada.', type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ description: 'El elemento o la lista no existe.', type: ApiErrorResponseDto })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateItemStatusDto, @CurrentUser() actor: ListActor) { return this.itemsService.updateStatus(id, dto, actor); }

  @Delete('items/:id')
  @Version('1')
  @Roles(UserRole.CREATOR)
  @ApiOperation({ summary: 'Eliminar un elemento', description: 'Solo el creador puede eliminar elementos de una lista activa.' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del elemento.' })
  @ApiOkResponse({ description: 'Elemento eliminado correctamente. El cuerpo de respuesta está vacío.' })
  @ApiBadRequestResponse({ description: 'No se pueden eliminar elementos de listas finalizadas.', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'La sesión falta o no es válida.', type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Solo el creador de la lista puede eliminar elementos.', type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ description: 'El elemento o la lista no existe.', type: ApiErrorResponseDto })
  remove(@Param('id') id: string, @CurrentUser() actor: ListActor): Promise<void> { return this.itemsService.remove(id, actor); }
}
