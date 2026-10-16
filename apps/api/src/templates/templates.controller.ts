import { Body, Controller, Delete, Get, Param, Patch, Post, Version } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../entities/user.entity.js';
import type { ListActor } from '../lists/lists.service.js';
import { CreateTemplateDto } from './dto/create-template.dto.js';
import { UpdateTemplateDto } from './dto/update-template.dto.js';
import { TemplatesService } from './templates.service.js';
import { ApiErrorResponseDto, TemplateDetailResponseDto } from '../common/openapi/response-models.dto.js';
import { ShoppingListEntity } from '../entities/shopping-list.entity.js';

@ApiTags('Plantillas')
@ApiBearerAuth('bearer')
@Controller('templates')
@Roles(UserRole.CREATOR)
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Post()
  @Version('1')
  @ApiOperation({ summary: 'Crear una plantilla', description: 'Crea una plantilla reutilizable a partir de los productos y cantidades indicados.' })
  @ApiCreatedResponse({ description: 'Plantilla creada.', type: TemplateDetailResponseDto })
  @ApiBadRequestResponse({ description: 'Los datos de la plantilla o de sus elementos no son válidos.', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'La sesión falta o no es válida.', type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ description: 'La gestión de plantillas requiere el rol CREATOR.', type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Una de las categorías indicadas no existe.', type: ApiErrorResponseDto })
  @ApiConflictResponse({ description: 'Ya existe una plantilla con ese nombre.', type: ApiErrorResponseDto })
  create(@Body() dto: CreateTemplateDto, @CurrentUser() actor: ListActor) { return this.templates.create(dto, actor); }

  @Post('from-list/:listId')
  @Version('1')
  @ApiOperation({ summary: 'Crear una plantilla desde una lista', description: 'Copia los elementos de una lista propia o compartida a una plantilla nueva.' })
  @ApiParam({ name: 'listId', format: 'uuid', description: 'UUID de la lista de origen.' })
  @ApiCreatedResponse({ description: 'Plantilla creada desde la lista.', type: TemplateDetailResponseDto })
  @ApiBadRequestResponse({ description: 'La lista no se puede convertir en plantilla.', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'La sesión falta o no es válida.', type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ description: 'No tienes acceso a la lista o al rol CREATOR.', type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ description: 'La lista no existe.', type: ApiErrorResponseDto })
  createFromList(@Param('listId') listId: string, @CurrentUser() actor: ListActor) { return this.templates.createFromList(listId, actor); }

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'Listar mis plantillas', description: 'Devuelve las plantillas del usuario autenticado con sus elementos.' })
  @ApiOkResponse({ description: 'Plantillas del usuario.', type: TemplateDetailResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'La sesión falta o no es válida.', type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ description: 'La gestión de plantillas requiere el rol CREATOR.', type: ApiErrorResponseDto })
  findAll(@CurrentUser() actor: ListActor) { return this.templates.findAll(actor); }

  @Patch(':id')
  @Version('1')
  @ApiOperation({ summary: 'Actualizar una plantilla', description: 'Actualiza el nombre, la descripción y los elementos de la plantilla.' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID de la plantilla.' })
  @ApiOkResponse({ description: 'Plantilla actualizada.', type: TemplateDetailResponseDto })
  @ApiBadRequestResponse({ description: 'Los datos de actualización no son válidos.', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'La sesión falta o no es válida.', type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ description: 'La plantilla pertenece a otro usuario o falta el rol CREATOR.', type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ description: 'La plantilla o una categoría indicada no existe.', type: ApiErrorResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateTemplateDto, @CurrentUser() actor: ListActor) { return this.templates.update(id, dto, actor); }

  @Delete(':id')
  @Version('1')
  @ApiOperation({ summary: 'Eliminar una plantilla' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID de la plantilla.' })
  @ApiOkResponse({ description: 'Plantilla eliminada correctamente.' })
  @ApiUnauthorizedResponse({ description: 'La sesión falta o no es válida.', type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ description: 'La plantilla pertenece a otro usuario o falta el rol CREATOR.', type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ description: 'La plantilla no existe.', type: ApiErrorResponseDto })
  remove(@Param('id') id: string, @CurrentUser() actor: ListActor) { return this.templates.remove(id, actor); }

  @Post(':id/instantiate')
  @Version('1')
  @ApiOperation({ summary: 'Crear una lista desde una plantilla', description: 'Crea una nueva lista activa e inicializa sus elementos a partir de la plantilla.' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID de la plantilla.' })
  @ApiCreatedResponse({ description: 'Lista creada a partir de la plantilla.', type: ShoppingListEntity })
  @ApiBadRequestResponse({ description: 'La plantilla no se puede instanciar.', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'La sesión falta o no es válida.', type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ description: 'La plantilla pertenece a otro usuario o falta el rol CREATOR.', type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ description: 'La plantilla no existe.', type: ApiErrorResponseDto })
  instantiate(@Param('id') id: string, @CurrentUser() actor: ListActor) { return this.templates.instantiate(id, actor); }
}
