import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CategoryEntity } from './entities/category.entity.js';
import { InventoryPurchaseEntity } from './entities/inventory-purchase.entity.js';
import { ListTemplateEntity } from './entities/list-template.entity.js';
import { ListItemEntity } from './entities/list-item.entity.js';
import { ShoppingListEntity } from './entities/shopping-list.entity.js';
import { UserEntity } from './entities/user.entity.js';
import { UserContactEntity } from './entities/user-contact.entity.js';
import { TemplateItemEntity } from './entities/template-item.entity.js';
import { BuyerInvitationEntity } from './entities/buyer-invitation.entity.js';
import { AuthModule } from './auth/auth.module.js';
import { HealthModule } from './health/health.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { UsersModule } from './users/users.module.js';
import { ListsModule } from './lists/lists.module.js';
import { ItemsModule } from './items/items.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { TemplatesModule } from './templates/templates.module.js';
import { AddListTemplatesAndItemCost1780000000000 } from './migrations/1780000000000-add-list-templates-and-item-cost.js';
import { BuyerEmailInvitations1780000001000 } from './migrations/1780000001000-buyer-email-invitations.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 60 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.getOrThrow<string>('DATABASE_URL'),
        ssl: { rejectUnauthorized: false },
        entities: [UserEntity, UserContactEntity, CategoryEntity, ShoppingListEntity, ListItemEntity, InventoryPurchaseEntity, ListTemplateEntity, TemplateItemEntity, BuyerInvitationEntity],
        migrations: [AddListTemplatesAndItemCost1780000000000, BuyerEmailInvitations1780000001000],
        migrationsRun: true,
        synchronize: config.get('NODE_ENV') === 'development',
        autoLoadEntities: false,
      }),
    }),
    HealthModule,
    CategoriesModule,
    AuthModule,
    UsersModule,
    ListsModule,
    ItemsModule,
    InventoryModule,
    TemplatesModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
