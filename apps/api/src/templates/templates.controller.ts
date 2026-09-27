import { Body, Controller, Delete, Get, Param, Patch, Post, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../entities/user.entity.js';
import type { ListActor } from '../lists/lists.service.js';
import { CreateTemplateDto } from './dto/create-template.dto.js';
import { UpdateTemplateDto } from './dto/update-template.dto.js';
import { TemplatesService } from './templates.service.js';

@ApiTags('templates')
@ApiBearerAuth('bearer')
@Controller('templates')
@Roles(UserRole.CREATOR)
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Post()
  @Version('1')
  @ApiOperation({ summary: 'Create a list template' })
  create(@Body() dto: CreateTemplateDto, @CurrentUser() actor: ListActor) { return this.templates.create(dto, actor); }

  @Post('from-list/:listId')
  @Version('1')
  @ApiOperation({ summary: 'Save an active shopping list as a template' })
  createFromList(@Param('listId') listId: string, @CurrentUser() actor: ListActor) { return this.templates.createFromList(listId, actor); }

  @Get()
  @Version('1')
  findAll(@CurrentUser() actor: ListActor) { return this.templates.findAll(actor); }

  @Get(':id')
  @Version('1')
  findOne(@Param('id') id: string, @CurrentUser() actor: ListActor) { return this.templates.findOne(id, actor); }

  @Patch(':id')
  @Version('1')
  update(@Param('id') id: string, @Body() dto: UpdateTemplateDto, @CurrentUser() actor: ListActor) { return this.templates.update(id, dto, actor); }

  @Delete(':id')
  @Version('1')
  remove(@Param('id') id: string, @CurrentUser() actor: ListActor) { return this.templates.remove(id, actor); }

  @Post(':id/instantiate')
  @Version('1')
  @ApiOperation({ summary: 'Create an active list from a template' })
  instantiate(@Param('id') id: string, @CurrentUser() actor: ListActor) { return this.templates.instantiate(id, actor); }
}
