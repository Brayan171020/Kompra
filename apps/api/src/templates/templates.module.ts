import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from '../entities/category.entity.js';
import { ListItemEntity } from '../entities/list-item.entity.js';
import { ListTemplateEntity } from '../entities/list-template.entity.js';
import { ShoppingListEntity } from '../entities/shopping-list.entity.js';
import { TemplateItemEntity } from '../entities/template-item.entity.js';
import { ListsModule } from '../lists/lists.module.js';
import { TemplatesController } from './templates.controller.js';
import { TemplatesService } from './templates.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([ListTemplateEntity, TemplateItemEntity, ListItemEntity, ShoppingListEntity, CategoryEntity]), ListsModule],
  controllers: [TemplatesController],
  providers: [TemplatesService],
})
export class TemplatesModule {}
