import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, In, Repository } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity.js';
import { ListItemEntity, ListItemStatus } from '../entities/list-item.entity.js';
import { ListTemplateEntity } from '../entities/list-template.entity.js';
import { ProductEntity } from '../entities/product.entity.js';
import { ShoppingListEntity, ShoppingListStatus } from '../entities/shopping-list.entity.js';
import { TemplateItemEntity } from '../entities/template-item.entity.js';
import { UserRole } from '../entities/user.entity.js';
import type { ListActor } from '../lists/lists.service.js';
import { ListsService } from '../lists/lists.service.js';
import { CreateTemplateDto } from './dto/create-template.dto.js';
import { UpdateTemplateDto } from './dto/update-template.dto.js';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(ListTemplateEntity) private readonly templates: Repository<ListTemplateEntity>,
    @InjectRepository(TemplateItemEntity) private readonly templateItems: Repository<TemplateItemEntity>,
    @InjectRepository(ListItemEntity) private readonly listItems: Repository<ListItemEntity>,
    @InjectRepository(ShoppingListEntity) private readonly lists: Repository<ShoppingListEntity>,
    @InjectRepository(CategoryEntity) private readonly categories: Repository<CategoryEntity>,
    private readonly dataSource: DataSource,
    private readonly listsService: ListsService,
  ) {}

  async create(dto: CreateTemplateDto, actor: ListActor): Promise<ListTemplateEntity> {
    this.assertCreator(actor);
    await this.assertCategories(dto.items ?? []);
    return this.dataSource.transaction(async (manager) => {
      const templateRepository = manager.getRepository(ListTemplateEntity);
      const template = await templateRepository.save(templateRepository.create({ title: dto.title.trim(), creatorId: actor.id }));
      if (dto.items?.length) await manager.getRepository(TemplateItemEntity).save(dto.items.map((item) => manager.getRepository(TemplateItemEntity).create({ ...item, templateId: template.id, note: item.note ?? null })));
      await this.saveProducts(dto.items ?? [], actor.id, manager.getRepository(ProductEntity));
      return templateRepository.findOneOrFail({ where: { id: template.id }, relations: { items: true } });
    });
  }

  async createFromList(listId: string, actor: ListActor): Promise<ListTemplateEntity> {
    this.assertCreator(actor);
    const list = await this.listsService.getAuthorizedList(listId, actor, true);
    if (list.status !== ShoppingListStatus.ACTIVE) throw new BadRequestException('Only active lists can be saved as templates');
    const items = await this.listItems.find({ where: { listId }, order: { createdAt: 'ASC' } });
    await this.assertCategories(items);
    return this.create({ title: list.title, items: items.map(({ categoryId, name, quantityType, targetQuantity, note }) => ({ categoryId, name, quantityType, targetQuantity: Number(targetQuantity), note: note ?? undefined })) }, actor);
  }

  async findAll(actor: ListActor): Promise<ListTemplateEntity[]> {
    this.assertCreator(actor);
    return this.templates.find({ where: { creatorId: actor.id }, relations: { items: true }, order: { updatedAt: 'DESC' } });
  }

  async findOne(id: string, actor: ListActor): Promise<ListTemplateEntity> {
    this.assertCreator(actor);
    const template = await this.templates.findOne({ where: { id }, relations: { items: true } });
    if (!template) throw new NotFoundException('Template not found');
    if (template.creatorId !== actor.id) throw new ForbiddenException('You cannot access this template');
    return template;
  }

  async update(id: string, dto: UpdateTemplateDto, actor: ListActor): Promise<ListTemplateEntity> {
    this.assertCreator(actor);
    if (dto.items) await this.assertCategories(dto.items);
    return this.dataSource.transaction(async (manager) => {
      const templateRepository = manager.getRepository(ListTemplateEntity);
      const template = await templateRepository.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!template) throw new NotFoundException('Template not found');
      if (template.creatorId !== actor.id) throw new ForbiddenException('You cannot update this template');
      if (dto.title !== undefined) template.title = dto.title.trim();
      await templateRepository.save(template);
      if (dto.items) {
        const itemRepository = manager.getRepository(TemplateItemEntity);
        await itemRepository.delete({ templateId: id });
        if (dto.items.length) await itemRepository.save(dto.items.map((item) => itemRepository.create({ ...item, templateId: id, note: item.note ?? null })));
        await this.saveProducts(dto.items, actor.id, manager.getRepository(ProductEntity));
      }
      return templateRepository.findOneOrFail({ where: { id }, relations: { items: true } });
    });
  }

  async remove(id: string, actor: ListActor): Promise<void> {
    this.assertCreator(actor);
    const template = await this.templates.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');
    if (template.creatorId !== actor.id) throw new ForbiddenException('You cannot delete this template');
    await this.templates.delete(id);
  }

  async instantiate(id: string, actor: ListActor): Promise<ShoppingListEntity> {
    this.assertCreator(actor);
    return this.dataSource.transaction(async (manager) => {
      const template = await manager.getRepository(ListTemplateEntity).findOne({ where: { id }, lock: { mode: 'pessimistic_read' } });
      if (!template) throw new NotFoundException('Template not found');
      if (template.creatorId !== actor.id) throw new ForbiddenException('You cannot use this template');
      const templateItems = await manager.getRepository(TemplateItemEntity).find({ where: { templateId: id } });
      const listRepository = manager.getRepository(ShoppingListEntity);
      const list = await listRepository.save(listRepository.create({ title: template.title, creatorId: actor.id, assignedToId: null, status: ShoppingListStatus.ACTIVE }));
      if (templateItems.length) {
        const itemRepository = manager.getRepository(ListItemEntity);
        await itemRepository.save(templateItems.map((item) => itemRepository.create({ listId: list.id, categoryId: item.categoryId, name: item.name, quantityType: item.quantityType, targetQuantity: item.targetQuantity, purchasedQuantity: 0, status: ListItemStatus.PENDING, note: item.note, cost: null })));
      }
      return list;
    });
  }

  private assertCreator(actor: ListActor): void {
    if (actor.role !== UserRole.CREATOR) throw new ForbiddenException('Only creators can manage list templates');
  }

  private async assertCategories(items: Array<{ categoryId: string; quantityType?: string; targetQuantity?: number | string }>): Promise<void> {
    for (const item of items) {
      if (item.quantityType === 'UNIT' && item.targetQuantity !== undefined && !Number.isInteger(Number(item.targetQuantity))) {
        throw new BadRequestException('Unit quantities must be whole numbers');
      }
    }
    const ids = [...new Set(items.map((item) => item.categoryId))];
    if (!ids.length) return;
    const found = await this.categories.find({ where: { id: In(ids) }, select: { id: true } });
    if (found.length !== ids.length) throw new NotFoundException('One or more categories were not found');
  }

  private async saveProducts(items: Array<{ categoryId: string; name: string; quantityType: string }>, creatorId: string, products: Repository<ProductEntity>): Promise<void> {
    for (const item of items) {
      const name = item.name.trim();
      if (await products.existsBy({ creatorId, categoryId: item.categoryId, name: ILike(name) })) continue;
      await products.save(products.create({ creatorId, categoryId: item.categoryId, name, quantityType: item.quantityType as ProductEntity['quantityType'] }));
    }
  }
}
