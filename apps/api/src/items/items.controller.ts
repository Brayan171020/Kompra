import { Body, Controller, Delete, Param, Patch, Post, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../entities/user.entity.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CreateItemDto } from './dto/create-item.dto.js';
import { UpdateItemStatusDto } from './dto/update-item-status.dto.js';
import { ItemsService } from './items.service.js';
import type { ListActor } from '../lists/lists.service.js';

@ApiTags('items')
@ApiBearerAuth('bearer')
@Controller()
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post('lists/:listId/items')
  @Version('1')
  @Roles(UserRole.CREATOR)
  @ApiOperation({ summary: 'Add an item to an active list' })
  create(@Param('listId') listId: string, @Body() dto: CreateItemDto, @CurrentUser() actor: ListActor) { return this.itemsService.create(listId, dto, actor); }

  @Patch('items/:id/status')
  @Version('1')
  @ApiOperation({ summary: 'Atomically update item progress from supermarket mode' })
  @ApiResponse({ status: 400, description: 'Invalid state or quantity transition' })
  @ApiResponse({ status: 403, description: 'Caller is not a list participant' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateItemStatusDto, @CurrentUser() actor: ListActor) { return this.itemsService.updateStatus(id, dto, actor); }

  @Delete('items/:id')
  @Version('1')
  @Roles(UserRole.CREATOR)
  @ApiOperation({ summary: 'Delete an item from an active list' })
  @ApiResponse({ status: 204, description: 'Item deleted' })
  remove(@Param('id') id: string, @CurrentUser() actor: ListActor): Promise<void> { return this.itemsService.remove(id, actor); }
}
