import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from './entities/category.entity.js';
import { InventoryPurchaseEntity } from './entities/inventory-purchase.entity.js';
import { ListItemEntity } from './entities/list-item.entity.js';
import { ShoppingListEntity } from './entities/shopping-list.entity.js';
import { UserEntity } from './entities/user.entity.js';
import { AuthModule } from './auth/auth.module.js';
import { HealthModule } from './health/health.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { UsersModule } from './users/users.module.js';
import { ListsModule } from './lists/lists.module.js';
import { ItemsModule } from './items/items.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.getOrThrow<string>('DATABASE_URL'),
        ssl: { rejectUnauthorized: false },
        entities: [UserEntity, CategoryEntity, ShoppingListEntity, ListItemEntity, InventoryPurchaseEntity],
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
  ],
})
export class AppModule {}
