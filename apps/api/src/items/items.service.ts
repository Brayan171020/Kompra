import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity.js';
import { InventoryPurchaseEntity } from '../entities/inventory-purchase.entity.js';
import { ListItemEntity, ListItemStatus } from '../entities/list-item.entity.js';
import { ShoppingListEntity, ShoppingListStatus } from '../entities/shopping-list.entity.js';
import { CreateItemDto } from './dto/create-item.dto.js';
import { UpdateItemStatusDto } from './dto/update-item-status.dto.js';
import { ListActor, ListsService } from '../lists/lists.service.js';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(ListItemEntity) private readonly items: Repository<ListItemEntity>,
    @InjectRepository(CategoryEntity) private readonly categories: Repository<CategoryEntity>,
    @InjectRepository(ShoppingListEntity) private readonly lists: Repository<ShoppingListEntity>,
    private readonly dataSource: DataSource,
    private readonly listsService: ListsService,
  ) {}

  async create(listId: string, dto: CreateItemDto, actor: ListActor): Promise<ListItemEntity> {
    const list = await this.listsService.getAuthorizedList(listId, actor, true);
    this.assertActive(list);
    if (!(await this.categories.existsBy({ id: dto.categoryId }))) throw new NotFoundException('Category not found');
    return this.items.save(this.items.create({ ...dto, listId, purchasedQuantity: 0, status: ListItemStatus.PENDING, note: dto.note ?? null }));
  }

  async updateStatus(id: string, dto: UpdateItemStatusDto, actor: ListActor): Promise<ListItemEntity> {
    return this.dataSource.transaction(async (manager) => {
      const itemRepository = manager.getRepository(ListItemEntity);
      const purchaseRepository = manager.getRepository(InventoryPurchaseEntity);
      const listRepository = manager.getRepository(ShoppingListEntity);
      const item = await itemRepository.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!item) throw new NotFoundException('List item not found');
      const list = await listRepository.findOne({ where: { id: item.listId }, lock: { mode: 'pessimistic_read' } });
      if (!list) throw new NotFoundException('Shopping list not found');
      if (list.creatorId !== actor.id && list.assignedToId !== actor.id) throw new ForbiddenException('You cannot update this item');
      if (!dto.status && dto.cost === undefined) throw new BadRequestException('Provide an item status or a cost update');
      const costOnlyUpdate = dto.status === undefined && dto.cost !== undefined;
      if (costOnlyUpdate) {
        if (item.status === ListItemStatus.PENDING) throw new BadRequestException('Only acquired items can have their cost updated');
        if (list.status === ShoppingListStatus.ACTIVE) this.assertActive(list);
      } else {
        this.assertActive(list);
      }
      const nextStatus = dto.status ?? item.status;
      if (dto.status === ListItemStatus.PARTIALLY_COMPLETED) {
        const nextQuantity = dto.purchasedQuantity ?? Number(item.purchasedQuantity);
        const nextNote = dto.note ?? item.note;
        if (nextQuantity <= 0 || nextQuantity >= Number(item.targetQuantity)) throw new BadRequestException('Partial quantity must be below the target quantity');
        if (!nextNote?.trim()) throw new BadRequestException('A note is required for partial completion');
      }
      const purchasedQuantity = dto.status === ListItemStatus.COMPLETED ? Number(item.targetQuantity) : dto.status === ListItemStatus.PENDING ? 0 : dto.purchasedQuantity;
      item.status = nextStatus;
      if (purchasedQuantity !== undefined) item.purchasedQuantity = purchasedQuantity;
      if (dto.note !== undefined) item.note = dto.note;
      if (dto.status === ListItemStatus.PENDING) item.cost = null;
      else if (dto.cost !== undefined) item.cost = dto.cost;
      const saved = await itemRepository.save(item);

      if (nextStatus === ListItemStatus.PENDING) {
        await purchaseRepository.delete({ sourceItemId: item.id });
      } else {
        const owners = [...new Set([list.creatorId, list.assignedToId].filter((id): id is string => Boolean(id)))];
        for (const ownerId of owners) {
          let purchase = await purchaseRepository.findOne({ where: { sourceItemId: item.id, creatorId: ownerId } });
          if (!purchase) purchase = purchaseRepository.create({ sourceItemId: item.id, sourceListId: list.id, creatorId: ownerId });
          purchase.productName = item.name;
          purchase.categoryId = item.categoryId;
          purchase.quantity = Number(item.purchasedQuantity);
          purchase.unit = item.quantityType === 'WEIGHT' ? 'kg' : 'und';
          purchase.purchaseDate = purchase.purchaseDate ?? new Date();
          purchase.description = item.note;
          purchase.cost = item.cost;
          await purchaseRepository.save(purchase);
        }
      }
      return saved;
    });
  }

  async remove(id: string, actor: ListActor): Promise<void> {
    const item = await this.items.findOne({ where: { id } });
    if (!item) throw new NotFoundException('List item not found');
    const list = await this.listsService.getAuthorizedList(item.listId, actor, true);
    this.assertActive(list);
    await this.items.delete(id);
  }

  private assertActive(list: ShoppingListEntity): void { if (list.status !== ShoppingListStatus.ACTIVE) throw new BadRequestException('Finished lists cannot be modified'); }
}
