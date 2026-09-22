import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from '../entities/category.entity.js';
import { ListItemEntity } from '../entities/list-item.entity.js';
import { ShoppingListEntity } from '../entities/shopping-list.entity.js';
import { UserEntity } from '../entities/user.entity.js';
import { ListsController } from './lists.controller.js';
import { ListsService } from './lists.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([ShoppingListEntity, ListItemEntity, UserEntity, CategoryEntity])],
  controllers: [ListsController],
  providers: [ListsService],
  exports: [ListsService],
})
export class ListsModule {}
