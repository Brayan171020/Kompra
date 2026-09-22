import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from '../entities/category.entity.js';
import { ListItemEntity } from '../entities/list-item.entity.js';
import { ShoppingListEntity } from '../entities/shopping-list.entity.js';
import { ItemsController } from './items.controller.js';
import { ItemsService } from './items.service.js';
import { ListsModule } from '../lists/lists.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([ListItemEntity, CategoryEntity, ShoppingListEntity]), ListsModule],
  controllers: [ItemsController],
  providers: [ItemsService],
})
export class ItemsModule {}
