import { Body, Controller, Get, Param, Post, Query, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { CreateInventoryPurchaseDto } from './dto/create-inventory-purchase.dto.js';
import { InventoryQueryDto } from './dto/inventory-query.dto.js';
import { InventoryService } from './inventory.service.js';
import type { ListActor } from '../lists/lists.service.js';

@ApiTags('inventory')
@ApiBearerAuth('bearer')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Version('1')
  @ApiOperation({ summary: 'Register a manual household purchase' })
  @ApiResponse({ status: 201, description: 'Purchase registered' })
  @ApiResponse({ status: 400, description: 'Invalid purchase data' })
  create(@Body() dto: CreateInventoryPurchaseDto, @CurrentUser() actor: ListActor) { return this.inventoryService.create(dto, actor); }

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'Get a paginated purchase history' })
  findAll(@Query() query: InventoryQueryDto, @CurrentUser() actor: ListActor) { return this.inventoryService.findAll(query, actor); }

  @Get('summary')
  @Version('1')
  @ApiOperation({ summary: 'Get current-month inventory analytics' })
  @ApiResponse({ status: 200, description: 'Monthly counts, category breakdown, and cost totals' })
  getSummary(@CurrentUser() actor: ListActor) { return this.inventoryService.getSummary(actor); }

  @Post('import-from-list/:listId')
  @Version('1')
  @ApiOperation({ summary: 'Import completed items from a finished list idempotently' })
  @ApiResponse({ status: 201, description: 'Import completed' })
  @ApiResponse({ status: 400, description: 'List is not finished' })
  @ApiResponse({ status: 404, description: 'List not found' })
  importFromList(@Param('listId') listId: string, @CurrentUser() actor: ListActor) { return this.inventoryService.importFromList(listId, actor); }
}
