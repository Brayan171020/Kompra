import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity.js';
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
      const listRepository = manager.getRepository(ShoppingListEntity);
      const item = await itemRepository.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!item) throw new NotFoundException('List item not found');
      const list = await listRepository.findOne({ where: { id: item.listId }, lock: { mode: 'pessimistic_read' } });
      if (!list) throw new NotFoundException('Shopping list not found');
      if (list.creatorId !== actor.id && list.assignedToId !== actor.id) throw new ForbiddenException('You cannot update this item');
      this.assertActive(list);

      if (dto.status === ListItemStatus.PARTIALLY_COMPLETED) {
        if (dto.purchasedQuantity === undefined || dto.purchasedQuantity >= Number(item.targetQuantity)) throw new BadRequestException('Partial quantity must be below the target quantity');
        if (!dto.note?.trim()) throw new BadRequestException('A note is required for partial completion');
      }
      const purchasedQuantity = dto.status === ListItemStatus.COMPLETED ? Number(item.targetQuantity) : dto.status === ListItemStatus.PENDING ? 0 : dto.purchasedQuantity;
      item.status = dto.status; item.purchasedQuantity = purchasedQuantity ?? item.purchasedQuantity; if (dto.note !== undefined) item.note = dto.note;
      return itemRepository.save(item);
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
