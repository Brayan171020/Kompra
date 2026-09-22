import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from '../entities/category.entity.js';
import { InventoryPurchaseEntity } from '../entities/inventory-purchase.entity.js';
import { ListItemEntity } from '../entities/list-item.entity.js';
import { ShoppingListEntity } from '../entities/shopping-list.entity.js';
import { InventoryController } from './inventory.controller.js';
import { InventoryService } from './inventory.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryPurchaseEntity, CategoryEntity, ShoppingListEntity, ListItemEntity])],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
