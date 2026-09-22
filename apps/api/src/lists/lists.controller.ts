import { Body, Controller, Get, Param, Patch, Post, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../entities/user.entity.js';
import { AssignListDto } from './dto/assign-list.dto.js';
import { CreateListDto } from './dto/create-list.dto.js';
import { ListsService } from './lists.service.js';
import type { ListActor } from './lists.service.js';

@ApiTags('lists')
@ApiBearerAuth('bearer')
@Controller('lists')
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post()
  @Version('1')
  @Roles(UserRole.CREATOR)
  @ApiOperation({ summary: 'Create an active shopping list' })
  @ApiResponse({ status: 201, description: 'List created' })
  @ApiResponse({ status: 403, description: 'Only creators can create lists' })
  create(@Body() dto: CreateListDto, @CurrentUser() actor: ListActor) { return this.listsService.create(dto, actor); }

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'List the caller-owned or assigned shopping lists' })
  findMine(@CurrentUser() actor: ListActor) { return this.listsService.findMine(actor); }

  @Get(':id')
  @Version('1')
  @ApiOperation({ summary: 'Get a list with items grouped by category' })
  @ApiResponse({ status: 404, description: 'List not found' })
  findOne(@Param('id') id: string, @CurrentUser() actor: ListActor) { return this.listsService.findOne(id, actor); }

  @Patch(':id/assign')
  @Version('1')
  @Roles(UserRole.CREATOR)
  @ApiOperation({ summary: 'Assign or reassign a BUYER' })
  assign(@Param('id') id: string, @Body() dto: AssignListDto, @CurrentUser() actor: ListActor) { return this.listsService.assign(id, dto, actor); }

  @Patch(':id/finish')
  @Version('1')
  @Roles(UserRole.CREATOR)
  @ApiOperation({ summary: 'Finish a shopping list' })
  finish(@Param('id') id: string, @CurrentUser() actor: ListActor) { return this.listsService.finish(id, actor); }
}
