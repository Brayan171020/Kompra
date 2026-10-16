import { ApiProperty } from '@nestjs/swagger';
import { CategoryEntity } from '../../entities/category.entity.js';
import { InventoryPurchaseEntity } from '../../entities/inventory-purchase.entity.js';
import { ListItemEntity } from '../../entities/list-item.entity.js';
import { ListTemplateEntity } from '../../entities/list-template.entity.js';
import { ShoppingListEntity } from '../../entities/shopping-list.entity.js';
import { UserRole } from '../../entities/user.entity.js';

export class ApiErrorResponseDto {
  @ApiProperty({ example: '2026-09-28T12:00:00.000Z', format: 'date-time' })
  timestamp: string;

  @ApiProperty({ example: 400 })
  status: number;

  @ApiProperty({ example: '/api/v1/lists' })
  path: string;

  @ApiProperty({ oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] })
  message: string | string[];
}

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ example: 'connected', enum: ['connected', 'disconnected'] })
  database: string;

  @ApiProperty({ example: '2026-09-28T12:00:00.000Z', format: 'date-time' })
  timestamp: string;
}

export class InventoryPageMetaDto {
  @ApiProperty({ example: 1, minimum: 1 })
  page: number;

  @ApiProperty({ example: 20, minimum: 1, maximum: 100 })
  limit: number;

  @ApiProperty({ example: 56, minimum: 0 })
  total: number;

  @ApiProperty({ example: 3, minimum: 0 })
  totalPages: number;
}

export class InventoryHistoryResponseDto {
  @ApiProperty({ type: [InventoryPurchaseEntity] })
  data: InventoryPurchaseEntity[];

  @ApiProperty({ type: InventoryPageMetaDto })
  meta: InventoryPageMetaDto;
}

export class InventoryCategoryCountDto {
  @ApiProperty({ format: 'uuid' })
  categoryId: string;

  @ApiProperty({ example: 'Alimentos' })
  categoryName: string;

  @ApiProperty({ example: '#7C9A5B' })
  color: string;

  @ApiProperty({ example: 8, minimum: 0 })
  count: number;

  @ApiProperty({ example: 40, minimum: 0, maximum: 100 })
  percentage: number;
}

export class InventoryVolumeDto {
  @ApiProperty({ example: 'kg' })
  unit: string;

  @ApiProperty({ example: 5.5, minimum: 0 })
  quantity: number;
}

export class InventoryCategoryCostDto {
  @ApiProperty({ format: 'uuid' })
  categoryId: string;

  @ApiProperty({ example: 'Alimentos' })
  categoryName: string;

  @ApiProperty({ example: '#7C9A5B' })
  color: string;

  @ApiProperty({ example: 84.5, minimum: 0 })
  amount: number;

  @ApiProperty({ example: 35, minimum: 0, maximum: 100 })
  percentage: number;
}

export class InventoryTopProductDto {
  @ApiProperty({ example: 'Leche entera' })
  productName: string;

  @ApiProperty({ format: 'uuid' })
  categoryId: string;

  @ApiProperty({ example: 'Lácteos' })
  categoryName: string;

  @ApiProperty({ example: 24.5, minimum: 0 })
  amount: number;

  @ApiProperty({ example: 4, minimum: 0 })
  quantity: number;

  @ApiProperty({ example: 2, minimum: 0 })
  acquisitions: number;
}

export class InventorySummaryResponseDto {
  @ApiProperty({ example: '2026-09', description: 'Mes UTC consultado en formato YYYY-MM' })
  month: string;

  @ApiProperty({ example: 18, minimum: 0 })
  totalItems: number;

  @ApiProperty({ example: 42.75, minimum: 0 })
  totalQuantity: number;

  @ApiProperty({ example: 210.4, minimum: 0 })
  totalCost: number;

  @ApiProperty({ type: [InventoryCategoryCountDto] })
  byCategory: InventoryCategoryCountDto[];

  @ApiProperty({ example: 210.4, minimum: 0 })
  monthlyTotalCost: number;

  @ApiProperty({ example: 18, minimum: 0 })
  monthlyTotalItems: number;

  @ApiProperty({ type: [InventoryVolumeDto] })
  volumeBreakdown: InventoryVolumeDto[];

  @ApiProperty({ type: [InventoryCategoryCostDto] })
  costByCategory: InventoryCategoryCostDto[];

  @ApiProperty({ type: [InventoryTopProductDto] })
  topExpensiveProducts: InventoryTopProductDto[];

  @ApiProperty({ example: 11.68, minimum: 0 })
  averageTicketCost: number;
}

export class InventoryImportResponseDto {
  @ApiProperty({ example: 4, minimum: 0 })
  imported: number;

  @ApiProperty({ example: 1, minimum: 0 })
  skipped: number;

  @ApiProperty({ type: [InventoryPurchaseEntity] })
  purchases: InventoryPurchaseEntity[];
}

export class ShoppingListWithCountsResponseDto extends ShoppingListEntity {
  @ApiProperty({ example: 7, minimum: 0 })
  totalItems: number;

  @ApiProperty({ example: 3, minimum: 0 })
  completedItems: number;
}

export class ListCategoryItemsResponseDto {
  @ApiProperty({ type: CategoryEntity, nullable: true })
  category: CategoryEntity | null;

  @ApiProperty({ type: [ListItemEntity] })
  items: ListItemEntity[];
}

export class ShoppingListDetailResponseDto {
  @ApiProperty({ type: ShoppingListEntity })
  list: ShoppingListEntity;

  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'object',
      properties: {
        category: { oneOf: [{ $ref: '#/components/schemas/CategoryEntity' }, { type: 'null' }] },
        items: { type: 'array', items: { $ref: '#/components/schemas/ListItemEntity' } },
      },
      required: ['category', 'items'],
    },
    example: { 'category-uuid': { category: { id: 'category-uuid', name: 'Alimentos' }, items: [] } },
  })
  itemsByCategory: Record<string, ListCategoryItemsResponseDto>;
}

export class UserProfileResponseDto {
  @ApiProperty({ example: 'user-uuid' })
  id: string;

  @ApiProperty({ example: 'Brayan Gamboa' })
  name: string;

  @ApiProperty({ example: 'brayan@example.com', format: 'email' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CREATOR })
  role: UserRole;

  @ApiProperty({ example: '2026-09-28T12:00:00.000Z', format: 'date-time' })
  createdAt: Date;
}

export class SessionSummaryResponseDto {
  @ApiProperty({ example: 'user-uuid' })
  userId: string;
}

export class CurrentUserResponseDto {
  @ApiProperty({ type: UserProfileResponseDto })
  user: UserProfileResponseDto;

  @ApiProperty({ type: SessionSummaryResponseDto })
  session: SessionSummaryResponseDto;
}

export class ContactSummaryDto {
  @ApiProperty({ example: 'user-uuid' })
  id: string;

  @ApiProperty({ example: 'Brayan Gamboa' })
  name: string;

  @ApiProperty({ example: 'brayan@example.com', format: 'email' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CREATOR })
  role: UserRole;
}

export class ContactsNetworkResponseDto {
  @ApiProperty({ example: 'KMP-78E96065C2D847A18B9F632D' })
  shareCode: string;

  @ApiProperty({ type: [ContactSummaryDto] })
  contacts: ContactSummaryDto[];

  @ApiProperty({ enum: UserRole, example: UserRole.CREATOR })
  role: UserRole;
}

export class BuyerInvitationResponseDto {
  @ApiProperty({ example: 'buyer@example.com', format: 'email' })
  email: string;

  @ApiProperty({ example: '2026-10-05T12:00:00.000Z', format: 'date-time' })
  expiresAt: Date;
}

export class TemplateDetailResponseDto extends ListTemplateEntity {
}
