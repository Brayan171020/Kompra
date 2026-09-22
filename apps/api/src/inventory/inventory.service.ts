import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity.js';
import { InventoryPurchaseEntity } from '../entities/inventory-purchase.entity.js';
import { ListItemEntity, ListItemStatus } from '../entities/list-item.entity.js';
import { ShoppingListEntity, ShoppingListStatus } from '../entities/shopping-list.entity.js';
import { CreateInventoryPurchaseDto } from './dto/create-inventory-purchase.dto.js';
import { InventoryQueryDto } from './dto/inventory-query.dto.js';
import type { ListActor } from '../lists/lists.service.js';
import { DataSource } from 'typeorm';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryPurchaseEntity) private readonly purchases: Repository<InventoryPurchaseEntity>,
    @InjectRepository(CategoryEntity) private readonly categories: Repository<CategoryEntity>,
    @InjectRepository(ShoppingListEntity) private readonly lists: Repository<ShoppingListEntity>,
    @InjectRepository(ListItemEntity) private readonly items: Repository<ListItemEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateInventoryPurchaseDto, actor: ListActor): Promise<InventoryPurchaseEntity> {
    await this.assertCategory(dto.categoryId);
    return this.purchases.save(this.purchases.create({
      productName: dto.productName.trim(), categoryId: dto.categoryId, quantity: dto.quantity, unit: dto.unit,
      purchaseDate: new Date(dto.purchaseDate), description: dto.description?.trim() || null, cost: dto.cost ?? null,
      sourceListId: null, sourceItemId: null, creatorId: actor.id,
    }));
  }

  async findAll(query: InventoryQueryDto, actor: ListActor): Promise<{ data: InventoryPurchaseEntity[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const builder = this.purchases.createQueryBuilder('purchase').where('purchase.creatorId = :creatorId', { creatorId: actor.id });
    if (query.startDate) builder.andWhere('purchase.purchaseDate >= :startDate', { startDate: new Date(query.startDate) });
    if (query.endDate) builder.andWhere('purchase.purchaseDate <= :endDate', { endDate: new Date(query.endDate) });
    if (query.categoryId) builder.andWhere('purchase.categoryId = :categoryId', { categoryId: query.categoryId });
    if (query.search?.trim()) builder.andWhere('purchase.productName ILIKE :search', { search: `%${query.search.trim()}%` });
    const [data, total] = await builder.orderBy('purchase.purchaseDate', 'DESC').skip((query.page - 1) * query.limit).take(query.limit).getManyAndCount();
    return { data, meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
  }

  async getSummary(actor: ListActor): Promise<{ month: string; totalItems: number; totalQuantity: number; totalCost: number; byCategory: Array<{ categoryId: string; categoryName: string; color: string; count: number; percentage: number }> }> {
    const now = new Date(); const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)); const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const purchases = await this.purchases.find({ where: { creatorId: actor.id, purchaseDate: Between(start, end) } });
    const grouped = new Map<string, { count: number; quantity: number }>();
    for (const purchase of purchases) { const current = grouped.get(purchase.categoryId) ?? { count: 0, quantity: 0 }; current.count += 1; current.quantity += Number(purchase.quantity); grouped.set(purchase.categoryId, current); }
    const categoryIds = [...grouped.keys()]; const categoryRows = categoryIds.length ? await this.categories.findBy({ id: In(categoryIds) }) : []; const categoryMap = new Map(categoryRows.map((category) => [category.id, category]));
    const byCategory = [...grouped.entries()].map(([categoryId, value]) => ({ categoryId, categoryName: categoryMap.get(categoryId)?.name ?? 'Sin categoría', color: categoryMap.get(categoryId)?.color ?? '#9aa59d', count: value.count, percentage: purchases.length ? Math.round((value.count / purchases.length) * 100) : 0 })).sort((a, b) => b.count - a.count);
    return { month: start.toISOString().slice(0, 7), totalItems: purchases.length, totalQuantity: purchases.reduce((sum, purchase) => sum + Number(purchase.quantity), 0), totalCost: purchases.reduce((sum, purchase) => sum + Number(purchase.cost ?? 0), 0), byCategory };
  }

  async importFromList(listId: string, actor: ListActor): Promise<{ imported: number; skipped: number; purchases: InventoryPurchaseEntity[] }> {
    return this.dataSource.transaction(async (manager) => {
      const list = await manager.getRepository(ShoppingListEntity).findOne({ where: { id: listId } });
      if (!list) throw new NotFoundException('Shopping list not found');
      if (list.creatorId !== actor.id && list.assignedToId !== actor.id) throw new ForbiddenException('You cannot import this list');
      if (list.status !== ShoppingListStatus.FINISHED) throw new BadRequestException('Only finished lists can be imported');
      const completedItems = await manager.getRepository(ListItemEntity).find({ where: { listId, status: In([ListItemStatus.COMPLETED, ListItemStatus.PARTIALLY_COMPLETED]) } });
      const purchaseRepository = manager.getRepository(InventoryPurchaseEntity); const purchases: InventoryPurchaseEntity[] = []; let skipped = 0;
      for (const item of completedItems) {
        const existing = await purchaseRepository.findOne({ where: { sourceItemId: item.id } });
        if (existing) { skipped += 1; continue; }
        const purchase = purchaseRepository.create({ productName: item.name, categoryId: item.categoryId, quantity: Number(item.purchasedQuantity), unit: item.quantityType === 'WEIGHT' ? 'kg' : 'und', purchaseDate: list.finishedAt ?? list.createdAt, description: item.note, cost: null, sourceListId: list.id, sourceItemId: item.id, creatorId: actor.id });
        purchases.push(await purchaseRepository.save(purchase));
      }
      return { imported: purchases.length, skipped, purchases };
    });
  }

  private async assertCategory(categoryId: string): Promise<void> { if (!(await this.categories.existsBy({ id: categoryId }))) throw new NotFoundException('Category not found'); }
}
