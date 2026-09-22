import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from './entities/category.entity';
import { InventoryPurchaseEntity } from './entities/inventory-purchase.entity';
import { ListItemEntity } from './entities/list-item.entity';
import { ShoppingListEntity } from './entities/shopping-list.entity';
import { UserEntity } from './entities/user.entity';
import { HealthModule } from './health/health.module';
import { CategoriesModule } from './categories/categories.module';

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
  ],
})
export class AppModule {}
