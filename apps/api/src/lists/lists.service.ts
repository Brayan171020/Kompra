import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole } from '../entities/user.entity.js';
import { CategoryEntity } from '../entities/category.entity.js';
import { ListItemEntity, ListItemStatus } from '../entities/list-item.entity.js';
import { ShoppingListEntity, ShoppingListStatus } from '../entities/shopping-list.entity.js';
import { AssignListDto } from './dto/assign-list.dto.js';
import { CreateListDto } from './dto/create-list.dto.js';

export interface ListActor { id: string; role?: string | null }

@Injectable()
export class ListsService {
  constructor(
    @InjectRepository(ShoppingListEntity) private readonly lists: Repository<ShoppingListEntity>,
    @InjectRepository(ListItemEntity) private readonly items: Repository<ListItemEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(CategoryEntity) private readonly categories: Repository<CategoryEntity>,
  ) {}

  async create(dto: CreateListDto, actor: ListActor): Promise<ShoppingListEntity> {
    if (dto.assignedToId) await this.assertBuyer(dto.assignedToId);
    return this.lists.save(this.lists.create({ title: dto.title, creatorId: actor.id, assignedToId: dto.assignedToId ?? null, status: ShoppingListStatus.ACTIVE }));
  }

  async findMine(actor: ListActor): Promise<Array<ShoppingListEntity & { totalItems: number; completedItems: number }>> {
    const where = actor.role === UserRole.CREATOR ? { creatorId: actor.id } : { assignedToId: actor.id };
    const lists = await this.lists.find({ where, order: { createdAt: 'DESC' } });
    if (!lists.length) return [];
    const counts = await this.items.createQueryBuilder('item')
      .select('item.listId', 'listId')
      .addSelect('COUNT(item.id)', 'totalItems')
      .addSelect('COUNT(*) FILTER (WHERE item.status = :completed)', 'completedItems')
      .where('item.listId IN (:...listIds)', { listIds: lists.map((list) => list.id), completed: ListItemStatus.COMPLETED })
      .groupBy('item.listId')
      .getRawMany<{ listId: string; totalItems: string; completedItems: string }>();
    const countByList = new Map(counts.map((count) => [count.listId, count]));
    return lists.map((list) => Object.assign(list, { totalItems: Number(countByList.get(list.id)?.totalItems ?? 0), completedItems: Number(countByList.get(list.id)?.completedItems ?? 0) }));
  }

  async findOne(id: string, actor: ListActor): Promise<{ list: ShoppingListEntity; itemsByCategory: Record<string, { category: CategoryEntity | null; items: ListItemEntity[] }> }> {
    const list = await this.getAuthorizedList(id, actor);
    const items = await this.items.find({ where: { listId: id }, order: { createdAt: 'ASC' } });
    const categoryIds = [...new Set(items.map((item) => item.categoryId))];
    const categories = categoryIds.length ? await this.categories.findByIds(categoryIds) : [];
    const categoryMap = new Map(categories.map((category) => [category.id, category]));
    const itemsByCategory: Record<string, { category: CategoryEntity | null; items: ListItemEntity[] }> = {};
    for (const item of items) {
      const group = itemsByCategory[item.categoryId] ?? { category: categoryMap.get(item.categoryId) ?? null, items: [] };
      group.items.push(item); itemsByCategory[item.categoryId] = group;
    }
    return { list, itemsByCategory };
  }

  async assign(id: string, dto: AssignListDto, actor: ListActor): Promise<ShoppingListEntity> {
    const list = await this.getAuthorizedList(id, actor, true);
    await this.assertBuyer(dto.assignedToId);
    list.assignedToId = dto.assignedToId;
    return this.lists.save(list);
  }

  async finish(id: string, actor: ListActor): Promise<ShoppingListEntity> {
    const list = await this.getAuthorizedList(id, actor, true);
    if (list.status === ShoppingListStatus.FINISHED) return list;
    list.status = ShoppingListStatus.FINISHED; list.finishedAt = new Date();
    return this.lists.save(list);
  }

  async getAuthorizedList(id: string, actor: ListActor, creatorOnly = false): Promise<ShoppingListEntity> {
    const list = await this.lists.findOne({ where: { id } });
    if (!list) throw new NotFoundException('Shopping list not found');
    const isCreator = list.creatorId === actor.id;
    const isAssignedBuyer = list.assignedToId === actor.id;
    if (!isCreator && (!isAssignedBuyer || creatorOnly)) throw new ForbiddenException('You cannot access this list');
    return list;
  }

  private async assertBuyer(userId: string): Promise<void> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Assigned buyer not found');
    if (user.role !== UserRole.BUYER) throw new BadRequestException('Only BUYER users can be assigned');
  }

}
